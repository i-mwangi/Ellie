import type { AgentDescriptor, Registry, Session } from './types'
import { agents } from './fixtures/data'

export function createFixtureRegistry(): Registry {
  // Cloned per process so "hire" mutations do not leak back into the fixture module.
  const store: AgentDescriptor[] = agents.map((a) => ({ ...a, hiredFor: [...a.hiredFor] }))

  return {
    async list() {
      return store.map((a) => ({ ...a }))
    },

    async get(_session: Session, agentId: string) {
      const found = store.find((a) => a.id === agentId)
      return found ? { ...found } : null
    },

    async hire(_session: Session, agentId: string, category: string) {
      const found = store.find((a) => a.id === agentId)
      if (!found) throw new Error(`No agent ${agentId} in registry`)
      if (found.status === 'deprecated') {
        throw new Error(`Agent ${agentId} is deprecated and cannot be hired`)
      }
      if (!found.hiredFor.includes(category)) found.hiredFor.push(category)
      found.status = 'hired'
      return { ...found }
    },
  }
}

export function createLiveRegistry(): Registry {
  // Wire to Agent Registry once project access is confirmed. See plan section 9.
  throw new Error('Live Agent Registry not configured — set ELLIE_PLATFORM_MODE=fixture')
}
