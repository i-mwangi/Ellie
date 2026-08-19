import { usePlatform } from '../../platform'
import type { Session } from '../../platform/types'
import { categories } from '../../platform/fixtures/intake'

/**
 * A forwarded email becomes a request. Same screening path as chat — the fact
 * that a request arrived by mail does not make its content more trustworthy.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    from?: string
    subject?: string
    body?: string
    attachments?: string[]
  }>(event)

  if (!body?.body?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'No message body' })
  }

  const { armor, observability } = usePlatform()

  const session: Session = {
    userId: body.from ?? 'unknown@acme',
    displayName: body.from ?? 'Email requester',
    role: 'requester',
    tenantId: 'acme-appliances',
  }

  const text = [body.subject, body.body].filter(Boolean).join('\n\n')

  const screened = await armor.screen(session, {
    text,
    source: `Forwarded email — ${body.from ?? 'unknown sender'}`,
    agentId: 'ellie-intake',
  })

  if (screened.blocked) {
    await observability.log(session, {
      actor: 'webhook:intake-email',
      action: 'inbound.block',
      target: body.subject ?? 'forwarded email',
      reason: screened.events[0]?.summary,
    })
    return { accepted: false, guardrail: screened.events }
  }

  const category = categories.find((c) =>
    c.match.some((m) => new RegExp(`\\b${m}`, 'i').test(screened.safeText))
  )

  await observability.log(session, {
    actor: 'webhook:intake-email',
    action: 'intake.open',
    target: category ? `${category.label} · from email` : 'uncategorised · from email',
  })

  return {
    accepted: true,
    category: category ? { id: category.id, label: category.label } : null,
    // The first question is the same one chat would ask.
    firstQuestion: (category?.questions ?? [])[0]?.ask ?? null,
    quickReplies: (category?.questions ?? [])[0]?.quickReplies ?? [],
    attachments: body.attachments?.length ?? 0,
    redactions: screened.events.filter((e) => e.action === 'redacted').length,
    text: screened.safeText,
  }
})
