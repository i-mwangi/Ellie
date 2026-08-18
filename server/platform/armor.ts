import type { GuardrailEvent, ModelArmor, ScreenResult, Session } from './types'
import { guardrailEvents } from './fixtures/data'

/**
 * Patterns that indicate untrusted content is trying to act as instruction
 * rather than data. Deliberately narrow: the fixture screener demonstrates the
 * boundary, it is not a production detector.
 */
const INJECTION_PATTERNS: Array<{ re: RegExp; summary: string }> = [
  {
    re: /ignore\s+(all\s+)?(prior|previous|above)\s+instructions/i,
    summary: 'Content instructs the agent to disregard its own instructions.',
  },
  {
    re: /\b(sole[-\s]?source|award)\b[^.]{0,60}\b(approved|immediately|without)\b/i,
    summary: 'Content attempts to force an award decision.',
  },
  {
    re: /\bcall\s+[a-z_]+\.(write|delete|update)\b/i,
    summary: 'Content attempts to trigger a write-scoped tool call.',
  },
  {
    re: /<!--[^>]*\bagent\s*:/i,
    summary: 'Hidden markup directive addressed to the agent.',
  },
]

const PII_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /\b[A-Z]{2}\d{2}[A-Z0-9]{10,26}\b/g, label: 'IBAN' },
  { re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, label: 'email' },
  { re: /\+\d[\d\s()-]{7,}\d/g, label: 'phone' },
]

export function createFixtureArmor(): ModelArmor {
  const log: GuardrailEvent[] = guardrailEvents.map((e) => ({ ...e }))
  let seq = log.length

  return {
    async screen(session: Session, input): Promise<ScreenResult> {
      const events: GuardrailEvent[] = []
      const now = new Date().toISOString()
      const next = () => `gr-live-${++seq}`

      for (const pattern of INJECTION_PATTERNS) {
        const match = input.text.match(pattern.re)
        if (!match) continue
        events.push({
          id: next(),
          at: now,
          kind: pattern.re.source.includes('agent\\s*:') ? 'tool_poisoning' : 'prompt_injection',
          severity: 'high',
          action: 'blocked',
          source: input.source,
          summary: pattern.summary,
          excerpt: match[0].slice(0, 200),
          agentId: input.agentId,
          sessionId: input.sessionId,
        })
      }

      let safeText = input.text
      for (const { re, label } of PII_PATTERNS) {
        if (!re.test(safeText)) continue
        re.lastIndex = 0
        safeText = safeText.replace(re, `[redacted: ${label}]`)
        events.push({
          id: next(),
          at: now,
          kind: 'pii',
          severity: 'medium',
          action: 'redacted',
          source: input.source,
          summary: `${label} removed before the content reached model context.`,
          excerpt: `[redacted: ${label}]`,
          agentId: input.agentId,
          sessionId: input.sessionId,
        })
      }

      const blocked = events.some((e) => e.action === 'blocked')
      log.unshift(...events)

      return {
        // Blocked content is dropped entirely rather than passed through sanitized:
        // a partially-neutralized injection is still an injection.
        safeText: blocked ? '' : safeText,
        events,
        blocked,
      }
    },

    async events(session: Session) {
      return log.map((e) => ({ ...e }))
    },

    async record(_session: Session, event: GuardrailEvent) {
      log.unshift({ ...event })
    },
  }
}

export function createLiveArmor(): ModelArmor {
  throw new Error('Live Model Armor not configured — set ELLIE_PLATFORM_MODE=fixture')
}
