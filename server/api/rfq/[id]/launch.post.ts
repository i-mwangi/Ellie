import { usePlatform } from '../../../platform'
import { requireSession } from '../../../utils/session'

/**
 * Starts a sourcing cycle. The launch goes through the Gateway, so a requester
 * attempting it is refused by the role-separation policy rather than by the UI
 * hiding the button.
 */
export default defineEventHandler(async (event) => {
  const session = requireSession(event)
  const rfqId = getRouterParam(event, 'id')
  const { gateway, runtime } = usePlatform()

  if (!rfqId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing RFQ id' })
  }

  // Policy first. Throws 403 with the policy name if this caller may not source.
  await gateway.invoke(session, {
    agentId: 'sourcing-orchestrator',
    operation: 'rfq.issue',
    payload: { rfqId },
  })

  const agentSession = await runtime.start(session, 'sourcing-orchestrator', rfqId)

  return { session: agentSession }
})
