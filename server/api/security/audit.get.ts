import { usePlatform } from '../../platform'
import { requireRole } from '../../utils/session'
import { canSeeSecurityEvents } from '../../utils/roles'

/** Audit log as CSV, for the compliance reviewer who lives in Excel. */
export default defineEventHandler(async (event) => {
  const session = requireRole(event, (s) => canSeeSecurityEvents(s.role))
  const { observability, armor } = usePlatform()

  const [audit, events] = await Promise.all([
    observability.audit(session),
    armor.events(session),
  ])

  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`
  const rows = [
    ['Timestamp', 'Source', 'Actor', 'Action', 'Target', 'Reason'],
    ...audit.map((a) => ['audit', a.at, a.actor, a.action, a.target, a.reason ?? '']).map((r) => [
      r[1],
      r[0],
      r[2],
      r[3],
      r[4],
      r[5],
    ]),
    ...events.map((e) => [
      e.at,
      'guardrail',
      e.agentId ?? 'system',
      `${e.kind}.${e.action}`,
      e.source,
      e.summary,
    ]),
  ]

  setResponseHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="ellie-audit-${new Date()
      .toISOString()
      .slice(0, 10)}.csv"`,
  })

  return rows.map((row) => row.map((cell) => esc(String(cell))).join(',')).join('\r\n')
})
