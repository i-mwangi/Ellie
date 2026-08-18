import type { Role, Session } from '~~/server/platform/types'

interface SessionResponse {
  session: Session
  platformMode: 'fixture' | 'live'
  can: {
    marketData: boolean
    securityEvents: boolean
    manageFleet: boolean
  }
}

export function useSession() {
  const state = useState<SessionResponse | null>('ellie-session', () => null)

  async function load() {
    state.value = await $fetch<SessionResponse>('/api/session')
  }

  async function setRole(role: Role) {
    await $fetch('/api/session', { method: 'POST', body: { role } })
    await load()
    await refreshNuxtData()
  }

  return { state, load, setRole }
}
