import { usePlatform } from '../../platform'
import { requireSession } from '../../utils/session'

/**
 * An attached spec sheet, drawing, or old invoice.
 *
 * The file is untrusted: a PDF can carry an instruction addressed to the agent
 * just as an email can, and an old invoice routinely carries PII. Both are
 * handled before any content is read into the request.
 */
export default defineEventHandler(async (event) => {
  const session = requireSession(event)
  const body = await readBody<{ filename?: string; text?: string }>(event)
  const { armor, observability } = usePlatform()

  if (!body?.filename || typeof body.text !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'filename and text are required' })
  }

  const screened = await armor.screen(session, {
    text: body.text,
    source: `Attachment — ${body.filename}`,
    agentId: 'ellie-intake',
  })

  await observability.log(session, {
    actor: session.userId,
    action: screened.blocked ? 'attachment.block' : 'attachment.accept',
    target: body.filename,
    reason: screened.blocked ? screened.events[0]?.summary : undefined,
  })

  if (screened.blocked) {
    return {
      accepted: false,
      filename: body.filename,
      reason: 'Content screening blocked this attachment. Nothing from it was read.',
      guardrail: screened.events,
    }
  }

  // Pull the few fields a spec sheet usually settles.
  const text = screened.safeText
  const extracted: Record<string, string> = {}
  const dims = text.match(/(\d+\s*[×x]\s*\d+\s*[×x]\s*\d+\s*(?:cm|mm)?)/i)?.[1]
  const qty = text.match(/([\d.,]+)\s*(?:units|pcs|pairs)/i)?.[1]
  const cert = text.match(/\b(FSC|ISO\s?\d{4,5}|EN\s?ISO\s?\d{4,5}|S[13]P?)\b/i)?.[1]
  if (dims) extracted.dimensions = dims
  if (qty) extracted.quantity = `${qty} units`
  if (cert) extracted.certification = cert

  return {
    accepted: true,
    filename: body.filename,
    redactions: screened.events.filter((e) => e.action === 'redacted').length,
    extracted,
    guardrail: screened.events,
  }
})
