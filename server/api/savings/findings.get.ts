import { usePlatform } from '../../platform'
import { requireSession } from '../../utils/session'
import { canSeeMarketData } from '../../utils/roles'
import { DETECTORS, findings, SPEND_BASELINE, totals } from '../../platform/fixtures/savings'

export default defineEventHandler(async (event) => {
  const session = requireSession(event)
  const { observability } = usePlatform()
  const marketData = canSeeMarketData(session.role)

  await observability.log(session, {
    actor: session.userId,
    action: 'savings.view',
    target: 'detector findings',
  })

  return {
    baseline: SPEND_BASELINE,
    detectors: DETECTORS,
    totals: totals(),
    redacted: !marketData,
    findings: findings.map((f) => ({
      ...f,
      // Supplier identity is market data even inside an analytics view.
      suppliers: marketData ? f.suppliers : [],
      evidence: marketData ? f.evidence : [],
    })),
  }
})
