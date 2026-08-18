import { requireSession } from '../../utils/session'
import { canSeeMarketData } from '../../utils/roles'
import { currentStep, listApprovals, routingFor } from '../../utils/approvals'
import { authorityMatrix } from '../../platform/fixtures/governance'

export default defineEventHandler((event) => {
  const session = requireSession(event)
  const marketData = canSeeMarketData(session.role)

  const requests = listApprovals().map((request) => ({
    ...request,
    // Supplier identity is market data. An approver sees it; a requester does not.
    supplier: marketData ? request.supplier : 'withheld',
    amount: marketData ? request.amount : null,
    routing: routingFor(request),
    waitingOn: currentStep(request)?.approvers ?? [],
  }))

  return {
    requests,
    matrix: authorityMatrix.map((b) => ({
      ...b,
      upTo: b.upTo === Infinity ? null : b.upTo,
    })),
    canApprove: session.role === 'approver' || session.role === 'admin',
  }
})
