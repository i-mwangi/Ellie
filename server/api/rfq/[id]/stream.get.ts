import { usePlatform } from '../../../platform'
import { requireSession } from '../../../utils/session'

/**
 * SSE bridge onto a long-running Runtime session. The session outlives any
 * request, so the browser subscribes to progress rather than waiting on a call.
 */
export default defineEventHandler(async (event) => {
  const session = requireSession(event)
  const rfqId = getRouterParam(event, 'id')
  const { runtime } = usePlatform()

  const sessions = await runtime.list(session)
  const agentSession = sessions.find((s) => s.rfqId === rfqId)

  if (!agentSession) {
    throw createError({ statusCode: 404, statusMessage: `No session for ${rfqId}` })
  }

  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  const res = event.node.res
  let closed = false
  event.node.req.on('close', () => {
    closed = true
  })

  for await (const runtimeEvent of runtime.events(session, agentSession.id)) {
    if (closed) break
    res.write(`data: ${JSON.stringify(runtimeEvent)}\n\n`)
  }

  if (!closed) res.end()
})
