import type {
  Gateway,
  Identity,
  InvocationRequest,
  ModelArmor,
  Observability,
  PolicyDecision,
  Registry,
  Session,
} from './types'

/**
 * Routing and policy are the same call on purpose: there is no path to an agent
 * that skips policy evaluation. Compliance checks that would otherwise live as
 * application `if` statements are enforced here, on the invocation path, where
 * they are auditable and cannot be bypassed by a crafted request.
 */

interface PolicyContext {
  session: Session
  req: InvocationRequest
  registry: Registry
  identity: Identity
}

interface Policy {
  name: string
  evaluate(ctx: PolicyContext): Promise<PolicyDecision>
}

const allowed: PolicyDecision = { allowed: true }

const registeredAgentOnly: Policy = {
  name: 'registered-agent-only',
  async evaluate({ req, registry, session }) {
    const agent = await registry.get(session, req.agentId)
    if (!agent) {
      return {
        allowed: false,
        policy: 'registered-agent-only',
        reason: `Agent ${req.agentId} is not published in the Agent Registry.`,
      }
    }
    if (agent.status === 'deprecated') {
      return {
        allowed: false,
        policy: 'registered-agent-only',
        reason: `Agent ${req.agentId} is deprecated.`,
      }
    }
    return allowed
  },
}

const declaredToolsOnly: Policy = {
  name: 'declared-tools-only',
  async evaluate({ req, registry, session }) {
    const agent = await registry.get(session, req.agentId)
    if (agent && !agent.tools.includes(req.operation)) {
      return {
        allowed: false,
        policy: 'declared-tools-only',
        reason: `Operation "${req.operation}" is not in the declared tool set for ${req.agentId}.`,
      }
    }
    return allowed
  },
}

/**
 * Ellie's structural role separation: requesters submit needs and never reach
 * the market. This is the boundary the product sells, so it is enforced as
 * platform policy rather than by hiding fields in the UI.
 */
const roleSeparation: Policy = {
  name: 'role-separation',
  async evaluate({ session, req }) {
    const marketFacing = ['supplier.contact', 'rfq.issue', 'quote.compare']
    if (session.role === 'requester' && marketFacing.includes(req.operation)) {
      return {
        allowed: false,
        policy: 'role-separation',
        reason:
          'Requesters cannot reach the market. Procurement controls every message to and from suppliers.',
      }
    }
    return allowed
  },
}

const unvettedSupplier: Policy = {
  name: 'unvetted-supplier',
  async evaluate({ req }) {
    if (req.operation !== 'supplier.contact') return allowed
    const vetting = req.payload.vetting
    if (vetting !== 'complete') {
      return {
        allowed: false,
        policy: 'unvetted-supplier',
        reason: 'Supplier has no completed vetting record. Contact refused pending vetting.',
      }
    }
    return allowed
  },
}

const budgetBreach: Policy = {
  name: 'budget-breach',
  async evaluate({ req }) {
    const projected = Number(req.payload.projectedValue ?? 0)
    const budget = Number(req.payload.categoryBudget ?? 0)
    if (budget > 0 && projected > budget) {
      const over = (((projected - budget) / budget) * 100).toFixed(1)
      return {
        allowed: false,
        policy: 'budget-breach',
        reason: `Projected award exceeds the category budget by ${over}%. Requires approval before proceeding.`,
      }
    }
    return allowed
  },
}

const subAgentRouting: Policy = {
  name: 'sub-agent-routing',
  async evaluate({ req, registry, session }) {
    if (!req.callerAgentId) return allowed
    const caller = await registry.get(session, req.callerAgentId)
    if (!caller) {
      return {
        allowed: false,
        policy: 'sub-agent-routing',
        reason: `Calling agent ${req.callerAgentId} is not registered.`,
      }
    }
    return allowed
  },
}

const POLICIES: Policy[] = [
  registeredAgentOnly,
  declaredToolsOnly,
  roleSeparation,
  subAgentRouting,
  unvettedSupplier,
  budgetBreach,
]

export interface GatewayDeps {
  registry: Registry
  identity: Identity
  armor: ModelArmor
  observability: Observability
  /** Handles an invocation once policy has passed. */
  dispatch: (session: Session, req: InvocationRequest) => Promise<unknown>
}

export function createGateway(deps: GatewayDeps): Gateway {
  async function evaluate(session: Session, req: InvocationRequest): Promise<PolicyDecision> {
    for (const policy of POLICIES) {
      const decision = await policy.evaluate({
        session,
        req,
        registry: deps.registry,
        identity: deps.identity,
      })
      if (!decision.allowed) return decision
    }
    return allowed
  }

  return {
    check: evaluate,

    async invoke<T>(session: Session, req: InvocationRequest): Promise<T> {
      const decision = await evaluate(session, req)

      if (!decision.allowed) {
        // A refusal is a security event: it belongs in the guardrail feed next to
        // Model Armor findings, and in the audit log.
        await deps.armor.record(session, {
          id: `gr-policy-${Date.now()}`,
          at: new Date().toISOString(),
          kind: 'policy_violation',
          severity: 'high',
          action: 'blocked',
          source: `Gateway policy — ${decision.policy}`,
          summary: decision.reason,
          excerpt: `${req.operation} → ${JSON.stringify(req.payload).slice(0, 160)}`,
          agentId: req.agentId,
        })
        await deps.observability.log(session, {
          actor: 'agent-gateway',
          action: 'invocation.refuse',
          target: `${req.operation} → ${req.agentId}`,
          reason: decision.reason,
        })
        throw Object.assign(new Error(decision.reason), {
          statusCode: 403,
          policy: decision.policy,
        })
      }

      await deps.observability.log(session, {
        actor: session.userId,
        action: 'invocation.allow',
        target: `${req.operation} → ${req.agentId}`,
      })

      return (await deps.dispatch(session, req)) as T
    },
  }
}
