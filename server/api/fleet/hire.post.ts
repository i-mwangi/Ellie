import { usePlatform } from '../../platform'
import { requireRole } from '../../utils/session'
import { canManageFleet } from '../../utils/roles'

/**
 * Hires a registry agent onto a category. Discovery is only useful if the
 * organisation can then act on it, so this is the other half of the registry.
 */
export default defineEventHandler(async (event) => {
  const session = requireRole(event, (s) => canManageFleet(s.role))
  const body = await readBody<{ agentId?: string; category?: string }>(event)
  const { registry, observability } = usePlatform()

  if (!body?.agentId || !body?.category) {
    throw createError({ statusCode: 400, statusMessage: 'agentId and category are required' })
  }

  const agent = await registry.hire(session, body.agentId, body.category)

  await observability.log(session, {
    actor: session.userId,
    action: 'agent.hire',
    target: `${agent.name} v${agent.version} → ${body.category}`,
    reason: 'Agent engaged for this category from the registry.',
  })

  return { agent }
})
