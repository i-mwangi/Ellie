import { usePlatform } from '../../platform'
import { requireRole } from '../../utils/session'
import { canManageFleet } from '../../utils/roles'

/**
 * Teach the fleet a fact directly. The counterpart to forgetting: an operator
 * who can remove a memory should be able to add one, and both are audited.
 */
export default defineEventHandler(async (event) => {
  const session = requireRole(event, (s) => canManageFleet(s.role))
  const body = await readBody<{
    category?: string
    subject?: string
    fact?: string
  }>(event)
  const { memory, observability } = usePlatform()

  if (!body?.category?.trim() || !body?.subject?.trim() || !body?.fact?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'category, subject, and fact are all required',
    })
  }

  const created = await memory.remember(session, {
    category: body.category.trim(),
    subject: body.subject.trim(),
    fact: body.fact.trim(),
    provenance: `Entered manually by ${session.userId}.`,
    learnedAt: new Date().toISOString(),
    confidence: 'high',
  })

  await observability.log(session, {
    actor: session.userId,
    action: 'memory.remember',
    target: `${created.category} · ${created.subject}`,
    reason: 'Operator added a fact to the tenant namespace.',
  })

  return { fact: created }
})
