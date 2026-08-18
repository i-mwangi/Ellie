/**
 * Shared types for the Gemini Enterprise Agent Platform adapter layer.
 *
 * Every platform component is reached through one of these interfaces so the UI
 * is identical whether it is backed by GCP or by fixtures. See
 * docs/IMPLEMENTATION-PLAN.md section 1.
 */

export type Role = 'requester' | 'procurement' | 'approver' | 'admin'

export interface Session {
  userId: string
  displayName: string
  role: Role
  /** Tenant namespace. Every platform call is scoped to it. */
  tenantId: string
}

/* -------------------------------------------------------------- Registry -- */

export interface AgentDescriptor {
  id: string
  name: string
  version: string
  owner: string
  summary: string
  /** Tools the agent declares. Anything not listed is refused by the Gateway. */
  tools: string[]
  /** Identity scopes the agent runs under. */
  scopes: string[]
  /** Human-readable data-handling policy shown on the registry card. */
  dataHandling: string
  status: 'available' | 'hired' | 'deprecated'
  /** Categories this agent has been hired onto, per tenant. */
  hiredFor: string[]
}

export interface Registry {
  list(session: Session): Promise<AgentDescriptor[]>
  get(session: Session, agentId: string): Promise<AgentDescriptor | null>
  hire(session: Session, agentId: string, category: string): Promise<AgentDescriptor>
}

/* --------------------------------------------------------------- Gateway -- */

export type PolicyDecision =
  | { allowed: true }
  | { allowed: false; policy: string; reason: string }

export interface InvocationRequest {
  agentId: string
  operation: string
  payload: Record<string, unknown>
  /** Set when one agent calls another; used to enforce sub-agent rules. */
  callerAgentId?: string
}

export interface Gateway {
  /**
   * Every agent invocation goes through here. Routing and policy are the same
   * call on purpose: there is no path to an agent that skips policy.
   */
  invoke<T = unknown>(session: Session, req: InvocationRequest): Promise<T>
  /** Policy evaluation without invoking, for pre-flight UI checks. */
  check(session: Session, req: InvocationRequest): Promise<PolicyDecision>
}

/* --------------------------------------------------------------- Runtime -- */

export type SessionState = 'running' | 'waiting' | 'completed' | 'failed'

export interface AgentSession {
  id: string
  agentId: string
  rfqId: string
  state: SessionState
  startedAt: string
  updatedAt: string
  /** Concurrent supplier conversations under this one session. */
  branches: number
}

export interface RuntimeEvent {
  at: string
  kind: 'progress' | 'tool_call' | 'guardrail' | 'memory' | 'done'
  message: string
  data?: Record<string, unknown>
}

export interface Runtime {
  start(session: Session, agentId: string, rfqId: string): Promise<AgentSession>
  get(session: Session, sessionId: string): Promise<AgentSession | null>
  list(session: Session): Promise<AgentSession[]>
  /** Async event stream for a long-running session. */
  events(session: Session, sessionId: string): AsyncIterable<RuntimeEvent>
}

/* ----------------------------------------------------------- Memory Bank -- */

export interface MemoryFact {
  id: string
  /** Tenant-scoped namespace. Cross-tenant reads are impossible by construction. */
  namespace: string
  category: string
  subject: string
  fact: string
  /** Where this came from, so an operator can judge whether to keep it. */
  provenance: string
  learnedAt: string
  confidence: 'low' | 'medium' | 'high'
}

export interface MemoryBank {
  recall(session: Session, opts?: { category?: string }): Promise<MemoryFact[]>
  remember(session: Session, fact: Omit<MemoryFact, 'id' | 'namespace'>): Promise<MemoryFact>
  forget(session: Session, factId: string): Promise<void>
}

/* -------------------------------------------------------------- Identity -- */

export interface ScopedCredential {
  agentId: string
  scopes: string[]
  tenantId: string
  expiresAt: string
}

export interface Identity {
  /** Mints a short-lived credential limited to the agent's declared scopes. */
  mint(session: Session, agentId: string, scopes: string[]): Promise<ScopedCredential>
  /** True when the agent may use this scope at all. */
  permits(agentId: string, scope: string): boolean
}

/* ----------------------------------------------------------- Model Armor -- */

export type GuardrailKind =
  | 'prompt_injection'
  | 'tool_poisoning'
  | 'pii'
  | 'policy_violation'

export interface GuardrailEvent {
  id: string
  at: string
  kind: GuardrailKind
  severity: 'low' | 'medium' | 'high'
  action: 'blocked' | 'redacted' | 'flagged'
  /** Where the untrusted content arrived from. */
  source: string
  summary: string
  /** The offending span, quoted. Never re-injected into a prompt. */
  excerpt: string
  agentId?: string
  sessionId?: string
}

export interface ScreenResult {
  /** Text safe to hand to a model, with any PII already redacted. */
  safeText: string
  events: GuardrailEvent[]
  blocked: boolean
}

export interface ModelArmor {
  /** Screens untrusted external content before it reaches any model context. */
  screen(
    session: Session,
    input: { text: string; source: string; agentId?: string; sessionId?: string }
  ): Promise<ScreenResult>
  events(session: Session): Promise<GuardrailEvent[]>
  record(session: Session, event: GuardrailEvent): Promise<void>
}

/* --------------------------------------------------------- Observability -- */

export interface TraceStep {
  id: string
  at: string
  kind: 'reasoning' | 'tool_call' | 'sub_agent' | 'memory_read' | 'guardrail' | 'decision'
  /** What the agent was doing. */
  label: string
  /** Why it did it — the part that makes the trace auditable. */
  rationale?: string
  /** Identity the step ran under, when it touched a system of record. */
  identity?: string
  durationMs?: number
  /** Fields only procurement and above may see (supplier names, prices). */
  restricted?: boolean
  data?: Record<string, unknown>
}

export interface Trace {
  sessionId: string
  agentId: string
  rfqId: string
  steps: TraceStep[]
}

export interface AuditEntry {
  id: string
  at: string
  actor: string
  action: string
  target: string
  reason?: string
}

export interface Observability {
  trace(session: Session, sessionId: string): Promise<Trace | null>
  audit(session: Session): Promise<AuditEntry[]>
  log(session: Session, entry: Omit<AuditEntry, 'id' | 'at'>): Promise<void>
}

/* ---------------------------------------------------------------- Bundle -- */

export interface Platform {
  registry: Registry
  gateway: Gateway
  runtime: Runtime
  memory: MemoryBank
  identity: Identity
  armor: ModelArmor
  observability: Observability
  mode: 'fixture' | 'live'
}
