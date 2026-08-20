import { usePlatform } from '../../../platform'
import { requireSession } from '../../../utils/session'
import { canSeeMarketData } from '../../../utils/roles'

/**
 * Reasoning-chain trace for one RFQ. Restricted steps are redacted inside the
 * observability adapter, before the response is assembled — a requester can
 * audit that the agent behaved without learning who was approached or at what
 * price.
 */
export default defineEventHandler(async (event) => {
  const session = requireSession(event)
  const rfqId = getRouterParam(event, 'id')
  const { runtime, observability } = usePlatform()

  const sessions = await runtime.list(session)
  const agentSession = sessions.find((s) => s.rfqId === rfqId)

  if (!agentSession) {
    throw createError({ statusCode: 404, statusMessage: `No session for ${rfqId}` })
  }

  const trace = await observability.trace(session, agentSession.id)

  if (!trace) {
    throw createError({ statusCode: 404, statusMessage: 'No trace recorded' })
  }

  if (String(getQuery(event).format ?? '').toLowerCase() === 'csv') {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = [
      ['Timestamp', 'Kind', 'Step', 'Rationale', 'Identity', 'Duration (ms)'],
      ...trace.steps.map((step) => [
        step.at,
        step.kind,
        step.label,
        step.rationale ?? '',
        step.identity ?? '',
        step.durationMs ?? '',
      ]),
    ]

    setResponseHeaders(event, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${agentSession.id}-trace.csv"`,
    })
    return rows.map((row) => row.map(esc).join(',')).join('\r\n')
  }

  return {
    session: agentSession,
    trace,
    redacted: !canSeeMarketData(session.role),
  }
})
