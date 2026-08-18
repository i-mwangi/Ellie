import type { InvocationRequest, Platform, Session } from './types'
import { createFixtureRegistry, createLiveRegistry } from './registry'
import { createFixtureRuntime, createLiveRuntime } from './runtime'
import { createFixtureMemory, createLiveMemory } from './memory'
import { createFixtureIdentity, createLiveIdentity } from './identity'
import { createFixtureArmor, createLiveArmor } from './armor'
import { createFixtureObservability, createLiveObservability } from './observability'
import { createGateway } from './gateway'

let cached: Platform | null = null

/**
 * Binds the platform interfaces to either fixtures or live GCP components.
 * Components can be flipped independently once project access is confirmed —
 * the UI never changes. See docs/IMPLEMENTATION-PLAN.md sections 1 and 9.
 */
export function usePlatform(): Platform {
  if (cached) return cached

  const mode =
    (process.env.ELLIE_PLATFORM_MODE as 'fixture' | 'live' | undefined) ?? 'fixture'
  const live = mode === 'live'

  const registry = live ? createLiveRegistry() : createFixtureRegistry()
  const runtime = live ? createLiveRuntime() : createFixtureRuntime()
  const memory = live ? createLiveMemory() : createFixtureMemory()
  const identity = live ? createLiveIdentity() : createFixtureIdentity()
  const armor = live ? createLiveArmor() : createFixtureArmor()
  const observability = live ? createLiveObservability() : createFixtureObservability()

  const gateway = createGateway({
    registry,
    identity,
    armor,
    observability,
    async dispatch(session: Session, req: InvocationRequest) {
      // Step 1 stops at the policy boundary: agents themselves land in step 2+.
      // Everything above this line — registry lookup, policy, audit — is real.
      return { ok: true, agentId: req.agentId, operation: req.operation, tenant: session.tenantId }
    },
  })

  cached = { registry, gateway, runtime, memory, identity, armor, observability, mode }
  return cached
}

export * from './types'
