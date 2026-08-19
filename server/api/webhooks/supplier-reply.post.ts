import { createHmac, timingSafeEqual } from 'node:crypto'
import { usePlatform } from '../../platform'
import type { Session } from '../../platform/types'

/**
 * Inbound supplier mail. This is the most exposed surface in the product:
 * content arrives from outside the organisation and lands on a path that can
 * move money.
 *
 * Three rules, in order:
 *   1. Verify the signature before reading anything into memory.
 *   2. Screen the body through Model Armor. A blocked body is dropped whole.
 *   3. Never auto-action. Commercial figures are extracted for a human to see;
 *      instructions inside the body are never executed.
 */

const WEBHOOK_SECRET = process.env.ELLIE_WEBHOOK_SECRET ?? 'dev-secret'

function verify(rawBody: string, signature: string | undefined): boolean {
  if (!signature) return false
  const expected = createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Pulls the numbers a buyer needs, ignoring everything phrased as an instruction. */
function extractCommercials(text: string) {
  const price = text.match(/(?:eur|€)\s*([\d.,]+)\s*(?:\/|per\s+)?unit/i)?.[1]
  const terms = text.match(/net\s*(\d{2,3})/i)?.[1]
  const lead = text.match(/(\d+)\s*(?:week|wk)/i)?.[1]
  return {
    unitPrice: price ? Number(price.replace(',', '.')) : null,
    paymentDays: terms ? Number(terms) : null,
    leadTimeWeeks: lead ? Number(lead) : null,
  }
}

export default defineEventHandler(async (event) => {
  const raw = await readRawBody(event, 'utf8')
  if (!raw) {
    throw createError({ statusCode: 400, statusMessage: 'Empty payload' })
  }

  const signature = getHeader(event, 'x-ellie-signature')
  if (!verify(raw, signature)) {
    throw createError({ statusCode: 401, statusMessage: 'Bad or missing signature' })
  }

  const payload = JSON.parse(raw) as {
    rfqId?: string
    supplier?: string
    from?: string
    body?: string
  }

  if (!payload.body) {
    throw createError({ statusCode: 400, statusMessage: 'No message body' })
  }

  const { armor, observability } = usePlatform()

  // Webhooks carry no user session; act as the orchestrator's own tenant identity.
  const session: Session = {
    userId: 'sourcing-orchestrator',
    displayName: 'Sourcing Orchestrator',
    role: 'procurement',
    tenantId: 'acme-appliances',
  }

  const screened = await armor.screen(session, {
    text: payload.body,
    source: `Supplier email — ${payload.from ?? payload.supplier ?? 'unknown sender'}`,
    agentId: 'sourcing-orchestrator',
  })

  await observability.log(session, {
    actor: 'webhook:supplier-reply',
    action: screened.blocked ? 'inbound.block' : 'inbound.accept',
    target: `${payload.supplier ?? 'unknown'} → ${payload.rfqId ?? 'unassigned'}`,
    reason: screened.blocked ? screened.events[0]?.summary : undefined,
  })

  if (screened.blocked) {
    return {
      accepted: false,
      reason: 'Content screening blocked this message. It was not used and not actioned.',
      guardrail: screened.events,
    }
  }

  return {
    accepted: false,
    // Deliberate: extraction is not action. A human awards business, not a webhook.
    queuedForReview: true,
    commercials: extractCommercials(screened.safeText),
    redactions: screened.events.filter((e) => e.action === 'redacted').length,
    guardrail: screened.events,
  }
})
