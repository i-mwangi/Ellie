import { approvals, bandFor } from '../platform/fixtures/governance'
import type { ApprovalRequest } from '../platform/fixtures/governance'

/** Process-local store so decisions persist across requests during a session. */
const store: ApprovalRequest[] = approvals.map((a) => ({
  ...a,
  steps: a.steps.map((s) => ({ ...s })),
}))

export function listApprovals(): ApprovalRequest[] {
  return store.map((a) => ({ ...a, steps: a.steps.map((s) => ({ ...s })) }))
}

export function getApproval(id: string): ApprovalRequest | undefined {
  return store.find((a) => a.id === id)
}

/** The step currently waiting on a decision, if any. */
export function currentStep(request: ApprovalRequest) {
  return request.steps.find((s) => s.state === 'pending')
}

export function routingFor(request: ApprovalRequest) {
  const band = bandFor(request.category, request.amount)
  return {
    band: band.id,
    upTo: band.upTo === Infinity ? null : band.upTo,
    approvers: band.approvers,
  }
}

/** Sequential PO numbering, assigned only once every step has approved. */
let poSeq = 4417

export function draftPoNumber(): string {
  return `PO-2026-${++poSeq}`
}
