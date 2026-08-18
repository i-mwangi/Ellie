import { usePlatform } from '../../platform'
import { requireRole } from '../../utils/session'
import { canManageFleet } from '../../utils/roles'

export default defineEventHandler(async (event) => {
  const session = requireRole(event, (s) => canManageFleet(s.role))
  const { memory } = usePlatform()
  const category = getQuery(event).category

  return {
    namespace: session.tenantId,
    facts: await memory.recall(session, {
      category: typeof category === 'string' ? category : undefined,
    }),
  }
})
