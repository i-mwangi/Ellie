import { usePlatform } from '../../../platform'
import { requireRole } from '../../../utils/session'
import { canSeeMarketData } from '../../../utils/roles'
import { DETECTORS, findings } from '../../../platform/fixtures/savings'

/**
 * Executive summary for one finding.
 *
 * `csv` opens directly in Excel. `html` is a print-ready page — the browser's
 * own print-to-PDF produces the document, rather than this service shipping a
 * PDF writer for one report.
 */
export default defineEventHandler(async (event) => {
  const session = requireRole(event, (s) => canSeeMarketData(s.role))
  const id = getRouterParam(event, 'id')
  const format = String(getQuery(event).format ?? 'csv').toLowerCase()
  const { observability } = usePlatform()

  const finding = findings.find((f) => f.id === id)
  if (!finding) {
    throw createError({ statusCode: 404, statusMessage: 'No such finding' })
  }

  await observability.log(session, {
    actor: session.userId,
    action: 'savings.export',
    target: `${finding.id} · ${format}`,
  })

  const eur = (n: number) => `EUR ${n.toLocaleString('en-GB')}`

  if (format === 'html') {
    const rows = finding.evidence
      .map((r) => `<tr><td>${r.label}</td><td>${r.detail}</td><td class="n">${r.value}</td></tr>`)
      .join('')

    setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    return `<!doctype html><meta charset="utf-8"><title>${finding.title}</title>
<style>
body{font:13px/1.5 system-ui,sans-serif;color:#16181d;max-width:720px;margin:40px auto;padding:0 20px}
h1{font-size:19px;margin:0 0 4px}h2{font-size:13px;margin:26px 0 8px}
.meta{color:#767d89;font-size:12px}
table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}
th,td{text-align:left;padding:7px 9px;border-bottom:1px solid #e8eaed}
th{color:#767d89;font-weight:500}.n{text-align:right}
.v{font-size:24px;font-weight:600;margin:14px 0}
.tag{display:inline-block;font-size:11px;padding:2px 8px;border-radius:5px;background:#ebf3fc;color:#0f6cbd}
@media print{body{margin:0}}
</style>
<h1>${finding.title}</h1>
<p class="meta">${DETECTORS[finding.detector].label} · confidence ${finding.confidence}${
      finding.noSupplierSwitch ? ' · <span class="tag">no supplier change required</span>' : ''
    }</p>
<p class="v">${eur(finding.annualValue)}<span class="meta"> annual value at stake</span></p>
<p>${finding.summary}</p>
<h2>Evidence</h2>
<table><tr><th>Item</th><th>Detail</th><th class="n">Value</th></tr>${rows}</table>
<h2>Recommendation</h2><p>${finding.recommendation}</p>
<p class="meta" style="margin-top:30px">Ellie · generated ${new Date().toISOString().slice(0, 10)} · suppliers: ${finding.suppliers.join(', ')}</p>`
  }

  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv = [
    ['Finding', finding.title],
    ['Detector', DETECTORS[finding.detector].label],
    ['Annual value (EUR)', String(finding.annualValue)],
    ['Needs supplier change', finding.noSupplierSwitch ? 'No' : 'Yes'],
    ['Confidence', finding.confidence],
    ['Suppliers', finding.suppliers.join('; ')],
    [],
    ['Item', 'Detail', 'Value'],
    ...finding.evidence.map((r) => [r.label, r.detail, r.value]),
    [],
    ['Recommendation', finding.recommendation],
  ]
    .map((row) => row.map((cell) => esc(String(cell))).join(','))
    .join('\r\n')

  setResponseHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${finding.id}-summary.csv"`,
  })
  return csv
})
