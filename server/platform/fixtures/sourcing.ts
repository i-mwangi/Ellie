/**
 * Quotes for the corrugated packaging cycle.
 *
 * Figures follow the published case study: 30+ suppliers engaged, a two-week
 * cycle, and a best offer landing 29% under the incumbent baseline.
 */

export interface Quote {
  id: string
  supplier: string
  /** Whether this supplier already holds the business. */
  incumbent: boolean
  /** Price per unit in EUR, as quoted. */
  unitPrice: number
  /** Payment terms offered, in days. */
  paymentDays: number
  leadTimeWeeks: number
  certifications: string[]
  /** Producers reached behind a distributor — the discovery win. */
  viaDiscovery: boolean
}

/** Standard terms for this tenant. Offers are re-based to this before comparison. */
export const STANDARD_PAYMENT_DAYS = 60

/** Monthly cost of capital used to price a payment-term difference. */
export const MONTHLY_COST_OF_CAPITAL = 0.009

export const BASELINE_UNIT_PRICE = 0.68
export const ANNUAL_UNITS = 620_000

export const quotes: Quote[] = [
  {
    id: 'q-01',
    supplier: 'Northline Packaging',
    incumbent: true,
    unitPrice: 0.66,
    paymentDays: 60,
    leadTimeWeeks: 3,
    certifications: ['FSC'],
    viaDiscovery: false,
  },
  {
    id: 'q-02',
    supplier: 'Westgate Board',
    incumbent: false,
    unitPrice: 0.54,
    paymentDays: 30,
    leadTimeWeeks: 3,
    certifications: ['FSC', 'ISO 9001'],
    viaDiscovery: false,
  },
  {
    id: 'q-03',
    supplier: 'Marmara Oluklu',
    incumbent: false,
    unitPrice: 0.48,
    paymentDays: 60,
    leadTimeWeeks: 4,
    certifications: ['FSC', 'ISO 9001'],
    viaDiscovery: true,
  },
  {
    id: 'q-04',
    supplier: 'Ege Karton',
    incumbent: false,
    unitPrice: 0.51,
    paymentDays: 45,
    leadTimeWeeks: 2,
    certifications: ['FSC'],
    viaDiscovery: true,
  },
  {
    id: 'q-05',
    supplier: 'Danube Corrugated',
    incumbent: false,
    unitPrice: 0.5,
    paymentDays: 90,
    leadTimeWeeks: 5,
    certifications: [],
    viaDiscovery: false,
  },
  {
    id: 'q-06',
    supplier: 'Anadolu Ambalaj',
    incumbent: false,
    unitPrice: 0.57,
    paymentDays: 30,
    leadTimeWeeks: 3,
    certifications: ['FSC'],
    viaDiscovery: true,
  },
]

/**
 * True cost re-bases a quote onto standard payment terms, so an offer that looks
 * cheap on paper but demands payment 30 days earlier compares honestly. Without
 * this, quotes with different terms are simply not comparable.
 */
export function trueCost(quote: Quote): number {
  const monthsEarlier = (STANDARD_PAYMENT_DAYS - quote.paymentDays) / 30
  return quote.unitPrice * (1 + MONTHLY_COST_OF_CAPITAL * monthsEarlier)
}

export interface Scored extends Quote {
  trueUnitCost: number
  /** Saving against the incumbent baseline, as a percentage. */
  savingPct: number
  annualSaving: number
  /** Set when a quote cannot be awarded as it stands. */
  disqualified: string | null
}

export function scoreQuotes(required: string[] = ['FSC']): Scored[] {
  return quotes
    .map((q) => {
      const trueUnitCost = trueCost(q)
      const missing = required.filter((c) => !q.certifications.includes(c))
      return {
        ...q,
        trueUnitCost,
        savingPct: ((BASELINE_UNIT_PRICE - trueUnitCost) / BASELINE_UNIT_PRICE) * 100,
        annualSaving: (BASELINE_UNIT_PRICE - trueUnitCost) * ANNUAL_UNITS,
        disqualified: missing.length ? `Missing ${missing.join(', ')}` : null,
      }
    })
    .sort((a, b) => {
      if (Boolean(a.disqualified) !== Boolean(b.disqualified)) return a.disqualified ? 1 : -1
      return a.trueUnitCost - b.trueUnitCost
    })
}

/** Suppliers approached versus those that came back inside the window. */
export const ENGAGEMENT = { approached: 31, responded: 22, window: '2 weeks' }
