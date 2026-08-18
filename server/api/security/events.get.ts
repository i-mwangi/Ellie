import { usePlatform } from '../../platform'
import { requireRole } from '../../utils/session'
import { canSeeSecurityEvents } from '../../utils/roles'

export default defineEventHandler(async (event) => {
  const session = requireRole(event, (s) => canSeeSecurityEvents(s.role))
  const { armor, observability } = usePlatform()

  return {
    events: await armor.events(session),
    audit: await observability.audit(session),
  }
})
