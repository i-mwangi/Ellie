import { usePlatform } from '../../../platform'
import { requireRole } from '../../../utils/session'
import { canApprove } from '../../../utils/roles'
import { currentStep, draftPoNumber, getApproval } from '../../../utils/approvals'

/**
 * Records one approval decision.
 *
 * Two rules are enforced rather than encouraged: a rejection always needs a
 * reason, and so does any approval on a request carrying an exception. The PO is
 * drafted only once the final step clears.
 */
export default defineEventHandler(async (event) => {
  const session = requireRole(event, (s) => canApprove(s.role))
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ decision?: 'approve' | 'reject'; reason?: string }>(event)
  const { observability } = usePlatform()

  const request = id ? getApproval(id) : undefined
  if (!request) {
    throw createError({ statusCode: 404, statusMessage: 'No such approval' })
  }

  const step = currentStep(request)
  if (!step) {
    throw createError({ statusCode: 409, statusMessage: 'Nothing left to decide' })
  }

  const decision = body?.decision
  if (decision !== 'approve' && decision !== 'reject') {
    throw createError({ statusCode: 400, statusMessage: 'Decision must be approve or reject' })
  }

  const reason = body?.reason?.trim() ?? ''
  const justificationRequired = decision === 'reject' || Boolean(request.exception)

  if (justificationRequired && !reason) {
    throw createError({
      statusCode: 422,
      statusMessage: request.exception
        ? 'This request carries an exception. A written justification is required.'
        : 'A rejection requires a reason.',
    })
  }

  step.state = decision === 'approve' ? 'approved' : 'rejected'
  step.decidedBy = session.userId
  step.decidedAt = new Date().toISOString()
  step.reason = reason || undefined

  if (decision === 'reject') {
    request.state = 'rejected'
  } else if (!currentStep(request)) {
    request.state = 'approved'
    request.poNumber = draftPoNumber()
  }

  await observability.log(session, {
    actor: session.userId,
    action: decision === 'approve' ? 'approval.approve' : 'approval.reject',
    target: `${request.id} · ${request.title}`,
    reason: reason || undefined,
  })

  if (request.poNumber) {
    await observability.log(session, {
      actor: 'governance-agent',
      action: 'po.draft',
      target: `${request.poNumber} → ${request.supplier}`,
      reason: 'Final approval cleared; purchase order drafted for ERP sync.',
    })
  }

  return { request, poNumber: request.poNumber ?? null }
})
