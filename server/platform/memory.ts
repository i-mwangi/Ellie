import type { MemoryBank, MemoryFact, Session } from './types'
import { memory } from './fixtures/data'

/**
 * Memory Bank is namespaced by tenant. Every read filters on the caller's
 * tenant, so cross-tenant recall is impossible rather than merely discouraged.
 */
export function createFixtureMemory(): MemoryBank {
  const store: MemoryFact[] = memory.map((m) => ({ ...m }))
  let seq = store.length

  return {
    async recall(session: Session, opts) {
      return store
        .filter((m) => m.namespace === session.tenantId)
        .filter((m) => !opts?.category || m.category === opts.category)
        .map((m) => ({ ...m }))
    },

    async remember(session: Session, fact) {
      const created: MemoryFact = {
        ...fact,
        id: `mem-${String(++seq).padStart(2, '0')}`,
        namespace: session.tenantId,
      }
      store.push(created)
      return { ...created }
    },

    async forget(session: Session, factId: string) {
      const index = store.findIndex(
        (m) => m.id === factId && m.namespace === session.tenantId
      )
      if (index === -1) throw new Error(`No memory ${factId} in this namespace`)
      store.splice(index, 1)
    },
  }
}

export function createLiveMemory(): MemoryBank {
  throw new Error('Live Memory Bank not configured — set ELLIE_PLATFORM_MODE=fixture')
}
