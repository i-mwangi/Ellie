import type { Role, Session } from '../platform/types'
import { isRole } from '../utils/roles'

/**
 * Development session resolution. Real SSO is out of scope (plan section 8),
 * but the shape is deliberate: role and tenant are resolved server-side on every
 * request and attached to the event. Route handlers read the session from here
 * and never from client-supplied fields.
 */

const DEMO_USERS: Record<Role, { userId: string; displayName: string }> = {
  requester: { userId: 'm.haddad@acme', displayName: 'Maya Haddad · Plant Engineering' },
  procurement: { userId: 'j.okafor@acme', displayName: 'Jide Okafor · Procurement' },
  approver: { userId: 's.lindqvist@acme', displayName: 'Sofia Lindqvist · Finance' },
  admin: { userId: 'r.freeman@acme', displayName: 'Ric Freeman · Platform Admin' },
}

const DEFAULT_ROLE: Role = 'procurement'
const TENANT = 'acme-appliances'

export default defineEventHandler((event) => {
  const cookie = getCookie(event, 'ellie_role')
  const role: Role = isRole(cookie) ? cookie : DEFAULT_ROLE

  const session: Session = {
    ...DEMO_USERS[role],
    role,
    tenantId: TENANT,
  }

  event.context.session = session
})
