import type { AgentSession, Runtime, RuntimeEvent, Session } from './types'
import { sessions } from './fixtures/data'

/**
 * Agent Runtime holds sessions that outlive any request — a sourcing cycle runs
 * for weeks. The API is therefore start/get/list plus an event stream, never a
 * blocking call.
 */
export function createFixtureRuntime(): Runtime {
  const store: AgentSession[] = sessions.map((s) => ({ ...s }))
  let seq = store.length

  return {
    async start(_session: Session, agentId: string, rfqId: string) {
      const now = new Date().toISOString()
      const created: AgentSession = {
        id: `sess-${(++seq).toString(16).padStart(6, '0')}`,
        agentId,
        rfqId,
        state: 'running',
        startedAt: now,
        updatedAt: now,
        branches: 0,
      }
      store.push(created)
      return { ...created }
    },

    async get(_session: Session, sessionId: string) {
      const found = store.find((s) => s.id === sessionId)
      return found ? { ...found } : null
    },

    async list() {
      return store.map((s) => ({ ...s }))
    },

    async *events(_session: Session, sessionId: string): AsyncIterable<RuntimeEvent> {
      const found = store.find((s) => s.id === sessionId)
      if (!found) return

      // Replays a compressed version of a two-week cycle so the UI stream can be
      // exercised without waiting for real supplier turnaround.
      const script: Array<Omit<RuntimeEvent, 'at'>> = [
        { kind: 'memory', message: 'Recalled 4 category facts from Memory Bank' },
        { kind: 'progress', message: 'Supplier Discovery invoked via Gateway' },
        { kind: 'progress', message: '47 candidates found, 9 producers behind distributors' },
        { kind: 'tool_call', message: 'erp.read — 24 months of corrugated spend' },
        { kind: 'progress', message: 'Shortlist: 31 suppliers cleared vetting and capability' },
        { kind: 'guardrail', message: 'Gateway refused contact with 1 unvetted supplier' },
        { kind: 'progress', message: 'RFQ issued — 31 concurrent supplier conversations' },
        { kind: 'guardrail', message: 'Model Armor blocked an injection in an inbound quote' },
        { kind: 'memory', message: 'Week-1 incumbent position recalled for week-2 round' },
        { kind: 'progress', message: '22 of 31 quotes returned' },
        { kind: 'done', message: 'Comparison assembled on true cost' },
      ]

      for (const step of script) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        yield { ...step, at: new Date().toISOString() }
      }
    },
  }
}

export function createLiveRuntime(): Runtime {
  throw new Error('Live Agent Runtime not configured — set ELLIE_PLATFORM_MODE=fixture')
}
