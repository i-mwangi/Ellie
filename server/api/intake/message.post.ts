import { usePlatform } from '../../platform'
import { requireSession } from '../../utils/session'
import { categories, CONTRADICTIONS, GENERIC_QUESTIONS } from '../../platform/fixtures/intake'
import type { CategoryQuestion } from '../../platform/fixtures/intake'

/**
 * One intake turn. Conversation state arrives from the client and the server
 * decides what to ask next, so the same endpoint serves chat and forwarded email.
 *
 * Two things happen here that are not cosmetic: the requester's text is screened
 * before it is used, and Memory Bank is consulted so a question already answered
 * in a previous cycle is never asked again.
 */

interface Body {
  text: string
  answers?: Record<string, string>
  categoryId?: string
}

export default defineEventHandler(async (event) => {
  const session = requireSession(event)
  const body = await readBody<Body>(event)
  const { armor, memory, observability } = usePlatform()

  if (typeof body?.text !== 'string' || !body.text.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Empty message' })
  }

  const screened = await armor.screen(session, {
    text: body.text,
    source: 'Intake — requester message',
    agentId: 'ellie-intake',
  })

  if (screened.blocked) {
    return {
      blocked: true,
      reply: 'That message was withheld by content screening and has not been used.',
      guardrail: screened.events,
      quickReplies: [],
      rfq: null,
    }
  }

  const answers = { ...(body.answers ?? {}) }
  const category =
    categories.find((c) => c.id === body.categoryId) ??
    categories.find((c) => c.match.some((m) => new RegExp(`\\b${m}`, 'i').test(body.text)))

  const questions: CategoryQuestion[] = category?.questions ?? GENERIC_QUESTIONS

  // Anything Memory Bank already knows is answered without asking.
  const facts = await memory.recall(session, { category: category?.id })
  const remembered: Array<{ field: string; value: string; provenance: string }> = []

  for (const q of questions) {
    if (!q.satisfiedByMemory || answers[q.id]) continue
    const fact = facts.find((f) => f.subject === q.satisfiedByMemory)
    if (!fact) continue
    answers[q.id] = fact.fact
    remembered.push({ field: q.field, value: fact.fact, provenance: fact.provenance })
  }

  const next = questions.find((q) => !answers[q.id])
  const missingRequired = questions.filter((q) => q.required && !answers[q.id])
  const flags = CONTRADICTIONS.filter((c) => c.when(answers)).map((c) => ({
    id: c.id,
    message: c.message,
  }))

  const status = missingRequired.length
    ? flags.length
      ? 'FLAGGED — MISSING'
      : 'BUILDING'
    : flags.length
      ? 'FLAGGED — REVIEW'
      : 'READY TO SEND'

  const fields = questions
    .filter((q) => answers[q.id] || q.required)
    .map((q) => ({
      id: q.id,
      label: q.field,
      value: answers[q.id] ?? 'Awaiting answer…',
      answered: Boolean(answers[q.id]),
      fromMemory: remembered.some((r) => r.field === q.field),
    }))

  await observability.log(session, {
    actor: session.userId,
    action: 'intake.turn',
    target: category ? `${category.label} · ${next?.id ?? 'complete'}` : 'uncategorised request',
  })

  return {
    blocked: false,
    category: category ? { id: category.id, label: category.label } : null,
    reply: next
      ? next.ask
      : 'Got it — that is everything a supplier needs. Routing this to procurement.',
    because: next?.because ?? null,
    quickReplies: next?.quickReplies ?? [],
    awaiting: next?.id ?? null,
    remembered,
    flags,
    guardrail: screened.events,
    rfq: {
      title: category?.label ?? 'New request',
      status,
      fields,
      complete: missingRequired.length === 0,
    },
  }
})
