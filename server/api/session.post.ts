import { isRole } from '../utils/roles'

/**
 * Development-only role switch, so the role-separation boundary can be
 * demonstrated from the UI. Replaced by SSO in a real deployment.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ role?: string }>(event)

  if (!isRole(body?.role)) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown role' })
  }

  setCookie(event, 'ellie_role', body.role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  return { ok: true, role: body.role }
})
