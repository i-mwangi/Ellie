import { usePlatform } from '../../platform'
import { requireSession } from '../../utils/session'
import { canSeeMarketData } from '../../utils/roles'

export default defineEventHandler(async (event) => {
  const session = requireSession(event)
  const { runtime } = usePlatform()
  const sessions = await runtime.list(session)

  return {
    canSeeMarketData: canSeeMarketData(session.role),
    sessions,
  }
})
