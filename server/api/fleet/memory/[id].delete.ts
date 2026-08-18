import { usePlatform } from '../../../platform'
import { requireRole } from '../../../utils/session'
import { canManageFleet } from '../../../utils/roles'

/**
 * Operator "forget". Persistent agent memory is only trustworthy if a human can
 * see it and remove it, so every deletion writes an audit entry naming the actor.
 */
export default defineEventHandler(async (event) => {
  const session = requireRole(event, (s) => canManageFleet(s.role))
  const factId = getRouterParam(event, 'id')
  const { memory, observability } = usePlatform()

  if (!factId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing fact id' })
  }

  const before = await memory.recall(session)
  const fact = before.find((f) => f.id === factId)

  if (!fact) {
    throw createError({ statusCode: 404, statusMessage: 'No such memory in this namespace' })
  }

  await memory.forget(session, factId)

  await observability.log(session, {
    actor: session.userId,
    action: 'memory.forget',
    target: `${fact.category} · ${fact.subject}`,
    reason: 'Operator removed a remembered fact from the tenant namespace.',
  })

  return { ok: true, forgot: fact.id }
})
