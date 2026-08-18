import type { AuditEntry, Observability, Session, Trace } from './types'
import { auditEntries, trace } from './fixtures/data'
import { canSeeMarketData } from '../utils/roles'

export function createFixtureObservability(): Observability {
  const audit: AuditEntry[] = auditEntries.map((e) => ({ ...e }))
  let seq = audit.length

  return {
    async trace(session: Session, sessionId: string): Promise<Trace | null> {
      if (trace.sessionId !== sessionId) return null

      // Role filtering happens server-side. A requester may audit that the agent
      // behaved, without seeing which suppliers were approached or at what price.
      const steps = trace.steps.map((step) => {
        if (step.restricted && !canSeeMarketData(session.role)) {
          return {
            ...step,
            label: 'Restricted step — supplier or pricing detail',
            rationale: 'Visible to procurement and above.',
            data: undefined,
          }
        }
        return { ...step }
      })

      return { ...trace, steps }
    },

    async audit() {
      return audit.map((e) => ({ ...e }))
    },

    async log(_session: Session, entry) {
      audit.unshift({
        ...entry,
        id: `aud-${String(++seq).padStart(2, '0')}`,
        at: new Date().toISOString(),
      })
    },
  }
}

export function createLiveObservability(): Observability {
  throw new Error('Live Agent Observability not configured — set ELLIE_PLATFORM_MODE=fixture')
}
