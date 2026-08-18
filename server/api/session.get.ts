import { usePlatform } from '../platform'
import { requireSession } from '../utils/session'
import { canManageFleet, canSeeMarketData, canSeeSecurityEvents } from '../utils/roles'

export default defineEventHandler((event) => {
  const session = requireSession(event)
  const { mode } = usePlatform()

  return {
    session,
    platformMode: mode,
    can: {
      marketData: canSeeMarketData(session.role),
      securityEvents: canSeeSecurityEvents(session.role),
      manageFleet: canManageFleet(session.role),
    },
  }
})
