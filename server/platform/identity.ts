import type { Identity, ScopedCredential, Session } from './types'
import { agents } from './fixtures/data'

const CREDENTIAL_TTL_MS = 15 * 60 * 1000

/**
 * Zero-trust access. An agent may only ever mint a credential for scopes it
 * declared in the registry, and every credential is tenant-bound and expiring.
 */
export function createFixtureIdentity(): Identity {
  const declared = new Map(agents.map((a) => [a.id, new Set(a.scopes)]))

  return {
    permits(agentId: string, scope: string) {
      return declared.get(agentId)?.has(scope) ?? false
    },

    async mint(session: Session, agentId: string, scopes: string[]): Promise<ScopedCredential> {
      const allowed = declared.get(agentId)
      if (!allowed) throw new Error(`Unknown agent ${agentId}`)

      const undeclared = scopes.filter((s) => !allowed.has(s))
      if (undeclared.length) {
        throw new Error(
          `Agent ${agentId} requested undeclared scopes: ${undeclared.join(', ')}`
        )
      }

      return {
        agentId,
        scopes: [...scopes],
        tenantId: session.tenantId,
        expiresAt: new Date(Date.now() + CREDENTIAL_TTL_MS).toISOString(),
      }
    },
  }
}

export function createLiveIdentity(): Identity {
  throw new Error('Live Agent Identity not configured — set ELLIE_PLATFORM_MODE=fixture')
}
