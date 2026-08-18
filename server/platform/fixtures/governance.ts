/**
 * Authority matrix and the approval queue.
 *
 * Routing is derived from amount and category rather than hard-coded per
 * request, so the matrix is the thing a compliance team can actually review.
 */

export interface AuthorityBand {
  id: string
  category: string
  /** Upper bound in EUR. Infinity for the top band. */
  upTo: number
  /** Roles that must approve, in order. Parallel approvers share an index. */
  approvers: string[][]
}

export const authorityMatrix: AuthorityBand[] = [
  {
    id: 'band-1',
    category: 'packaging',
    upTo: 50_000,
    approvers: [['Procurement lead']],
  },
  {
    id: 'band-2',
    category: 'packaging',
    upTo: 250_000,
    approvers: [['Procurement lead'], ['Finance controller']],
  },
  {
    id: 'band-3',
    category: 'packaging',
    upTo: Infinity,
    approvers: [['Procurement lead'], ['Finance controller', 'Plant director'], ['CFO']],
  },
]

export function bandFor(category: string, amount: number): AuthorityBand {
  const bands = authorityMatrix.filter((b) => b.category === category)
  return bands.find((b) => amount <= b.upTo) ?? bands[bands.length - 1]!
}

export type ApprovalState = 'pending' | 'approved' | 'rejected'

export interface ApprovalStep {
  index: number
  approvers: string[]
  state: ApprovalState
  decidedBy?: string
  decidedAt?: string
  reason?: string
  /** Set when the approver was covering for someone out of office. */
  delegatedFrom?: string
}

export interface ApprovalRequest {
  id: string
  rfqId: string
  title: string
  category: string
  amount: number
  supplier: string
  /** Non-standard decisions must carry a written justification. */
  exception: string | null
  state: ApprovalState
  steps: ApprovalStep[]
  poNumber?: string
}

export const approvals: ApprovalRequest[] = [
  {
    id: 'apr-01',
    rfqId: 'rfq-2411-corrugated',
    title: 'Corrugated packaging — annual award',
    category: 'packaging',
    amount: 297_600,
    supplier: 'Marmara Oluklu',
    exception: null,
    state: 'pending',
    steps: [
      {
        index: 0,
        approvers: ['Procurement lead'],
        state: 'approved',
        decidedBy: 'j.okafor@acme',
        decidedAt: '2026-08-15T09:20:00Z',
        reason: 'Best true cost of the compliant offers; FSC verified.',
      },
      {
        index: 1,
        approvers: ['Finance controller', 'Plant director'],
        state: 'pending',
      },
      { index: 2, approvers: ['CFO'], state: 'pending' },
    ],
  },
  {
    id: 'apr-02',
    rfqId: 'rfq-2408-pallets',
    title: 'Pallet replenishment — Q3 top-up',
    category: 'packaging',
    amount: 41_200,
    supplier: 'Ege Karton',
    exception: 'Single-source award — incumbent tooling already paid for.',
    state: 'pending',
    steps: [{ index: 0, approvers: ['Procurement lead'], state: 'pending' }],
  },
]
