import { usePlatform } from '../../../platform'
import { requireSession } from '../../../utils/session'
import { canSeeMarketData } from '../../../utils/roles'
import {
  ANNUAL_UNITS,
  BASELINE_UNIT_PRICE,
  ENGAGEMENT,
  scoreQuotes,
  STANDARD_PAYMENT_DAYS,
} from '../../../platform/fixtures/sourcing'

/**
 * The comparison. Requesters get the shape of the result — how many suppliers
 * responded, whether it is ready — but never a supplier name or a price. That
 * boundary is applied here, server-side, not in the table component.
 */
export default defineEventHandler(async (event) => {
  const session = requireSession(event)
  const { observability } = usePlatform()

  const scored = scoreQuotes(['FSC'])
  const best = scored.find((q) => !q.disqualified) ?? null

  await observability.log(session, {
    actor: session.userId,
    action: 'quotes.view',
    target: getRouterParam(event, 'id') ?? 'unknown rfq',
  })

  if (!canSeeMarketData(session.role)) {
    return {
      redacted: true,
      engagement: ENGAGEMENT,
      quotes: [],
      summary: null,
    }
  }

  return {
    redacted: false,
    engagement: ENGAGEMENT,
    baseline: { unitPrice: BASELINE_UNIT_PRICE, annualUnits: ANNUAL_UNITS },
    standardPaymentDays: STANDARD_PAYMENT_DAYS,
    quotes: scored,
    summary: best
      ? {
          supplier: best.supplier,
          savingPct: best.savingPct,
          annualSaving: best.annualSaving,
          viaDiscovery: best.viaDiscovery,
        }
      : null,
  }
})
