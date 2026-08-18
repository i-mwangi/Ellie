import type { H3Event } from 'h3'
import type { Session } from '../platform/types'

export function requireSession(event: H3Event): Session {
  const session = event.context.session as Session | undefined
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'No session' })
  }
  return session
}

export function requireRole(event: H3Event, permitted: (session: Session) => boolean): Session {
  const session = requireSession(event)
  if (!permitted(session)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Your role does not permit this view.',
    })
  }
  return session
}
