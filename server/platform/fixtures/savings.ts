/**
 * Spend baseline and detector findings.
 *
 * The point of the savings engine is that most of what it finds needs no
 * supplier change at all — harmonising a price across sites, or enforcing terms
 * that were already agreed. Those are marked `noSupplierSwitch`.
 */

export type DetectorId =
  | 'price-harmonisation'
  | 'payment-terms'
  | 'price-drift'
  | 'off-contract'
  | 'consolidation'

export const DETECTORS: Record<DetectorId, { label: string; explains: string }> = {
  'price-harmonisation': {
    label: 'Price harmonisation',
    explains: 'The same item bought at different prices across sites.',
  },
  'payment-terms': {
    label: 'Payment-term compliance',
    explains: 'Invoices paid on terms shorter than the contract requires.',
  },
  'price-drift': {
    label: 'Incumbent price drift',
    explains: 'A supplier raising prices in steps too small to trigger review.',
  },
  'off-contract': {
    label: 'Off-contract spend',
    explains: 'Buying outside an agreement that already exists.',
  },
  consolidation: {
    label: 'Consolidation',
    explains: 'Fragmented volume that would price better as one commitment.',
  },
}

export interface EvidenceRow {
  label: string
  detail: string
  value: string
}

export interface Finding {
  id: string
  detector: DetectorId
  title: string
  summary: string
  /** Annualised value at stake, in EUR. */
  annualValue: number
  /** True when the saving needs no supplier change — the quick wins. */
  noSupplierSwitch: boolean
  confidence: 'low' | 'medium' | 'high'
  /** Suppliers named in the evidence. Market data: withheld from requesters. */
  suppliers: string[]
  evidence: EvidenceRow[]
  recommendation: string
}

export const SPEND_BASELINE = {
  /** Rows ingested from the AP export. */
  rows: 48_216,
  suppliersRaw: 1_284,
  /** After normalising names and merging duplicates. */
  suppliersNormalised: 971,
  annualSpend: 14_820_000,
  categories: 22,
  period: '24 months to Jul 2026',
}

export const findings: Finding[] = [
  {
    id: 'f-01',
    detector: 'price-harmonisation',
    title: 'Same carton, three prices across four plants',
    summary:
      'Izmir pays 22% more than Bursa for an identical double-wall BC carton, from the same supplier.',
    annualValue: 96_400,
    noSupplierSwitch: true,
    confidence: 'high',
    suppliers: ['Northline Packaging'],
    evidence: [
      { label: 'Bursa', detail: '218,000 units · NET60', value: '€0.58' },
      { label: 'Izmir', detail: '164,000 units · NET60', value: '€0.71' },
      { label: 'Manisa', detail: '141,000 units · NET60', value: '€0.63' },
      { label: 'Eskişehir', detail: '97,000 units · NET60', value: '€0.66' },
    ],
    recommendation:
      'Level all four plants to the Bursa price. Same supplier, same specification, no re-tendering required.',
  },
  {
    id: 'f-02',
    detector: 'payment-terms',
    title: 'NET30 paid on contracts written NET60',
    summary:
      '412 invoices across 17 suppliers settled a full month earlier than the agreed terms.',
    annualValue: 61_800,
    noSupplierSwitch: true,
    confidence: 'high',
    suppliers: ['17 suppliers'],
    evidence: [
      { label: 'Invoices affected', detail: 'Rolling 12 months', value: '412' },
      { label: 'Average days early', detail: 'Against contracted terms', value: '28.4' },
      { label: 'Working capital released', detail: 'At 0.9% monthly', value: '€61,800' },
    ],
    recommendation:
      'Correct the payment-run configuration to honour contracted terms. No commercial conversation needed.',
  },
  {
    id: 'f-03',
    detector: 'price-drift',
    title: 'Incumbent lifted price six times in 24 months',
    summary:
      'Each increase sat under the 5% review threshold; compounded they total 19.4% with no board movement to justify it.',
    annualValue: 78_200,
    noSupplierSwitch: false,
    confidence: 'high',
    suppliers: ['Northline Packaging'],
    evidence: [
      { label: 'Aug 2024', detail: 'Baseline', value: '€0.553' },
      { label: 'Feb 2025', detail: '+4.1%', value: '€0.576' },
      { label: 'Aug 2025', detail: '+3.8%', value: '€0.598' },
      { label: 'Jan 2026', detail: '+4.4%', value: '€0.624' },
      { label: 'Jul 2026', detail: '+3.1% (cumulative 19.4%)', value: '€0.660' },
    ],
    recommendation:
      'Open the category to competitive quotes. Containerboard indices fell over the same window.',
  },
  {
    id: 'f-04',
    detector: 'off-contract',
    title: 'Maintenance consumables bought outside the framework',
    summary:
      '€214k went to spot suppliers while a negotiated framework covering the same items sat unused.',
    annualValue: 44_900,
    noSupplierSwitch: true,
    confidence: 'medium',
    suppliers: ['9 spot suppliers'],
    evidence: [
      { label: 'Off-contract spend', detail: '312 purchase orders', value: '€214,000' },
      { label: 'Framework price delta', detail: 'Weighted average', value: '21%' },
      { label: 'Recoverable', detail: 'If routed to the framework', value: '€44,900' },
    ],
    recommendation:
      'Route these lines through the existing framework. The agreement is already signed.',
  },
  {
    id: 'f-05',
    detector: 'consolidation',
    title: 'Stretch film split across five suppliers',
    summary:
      'No single volume is large enough for a price break, though the combined total clears the top tier twice over.',
    annualValue: 37_500,
    noSupplierSwitch: false,
    confidence: 'medium',
    suppliers: ['5 suppliers'],
    evidence: [
      { label: 'Combined volume', detail: 'Annualised', value: '284 tonnes' },
      { label: 'Largest single share', detail: 'Below first price break', value: '31%' },
      { label: 'Top-tier threshold', detail: 'Cleared 2.1× combined', value: '135 tonnes' },
    ],
    recommendation:
      'Consolidate into one or two awards to reach the volume tier, keeping a second source for continuity.',
  },
]

export function totals() {
  const quickWins = findings.filter((f) => f.noSupplierSwitch)
  return {
    total: findings.reduce((sum, f) => sum + f.annualValue, 0),
    quickWinValue: quickWins.reduce((sum, f) => sum + f.annualValue, 0),
    quickWinCount: quickWins.length,
    count: findings.length,
  }
}
