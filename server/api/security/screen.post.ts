import { usePlatform } from '../../platform'
import { requireRole } from '../../utils/session'
import { canSeeSecurityEvents } from '../../utils/roles'

/**
 * Live Model Armor screening, so the guardrail boundary can be demonstrated on
 * arbitrary text rather than only on pre-baked fixture events. Paste a supplier
 * email, see what reaches model context.
 */
export default defineEventHandler(async (event) => {
  const session = requireRole(event, (s) => canSeeSecurityEvents(s.role))
  const body = await readBody<{ text?: string; source?: string }>(event)
  const { armor } = usePlatform()

  if (typeof body?.text !== 'string' || !body.text.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Nothing to screen' })
  }

  const result = await armor.screen(session, {
    text: body.text,
    source: body.source?.trim() || 'Manual paste — security console',
    agentId: 'sourcing-orchestrator',
  })

  return result
})
