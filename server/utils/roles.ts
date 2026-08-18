import type { Role } from '../platform/types'

export const ROLES: Role[] = ['requester', 'procurement', 'approver', 'admin']

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as string[]).includes(value)
}

/** Supplier identities and pricing. The core Ellie boundary. */
export function canSeeMarketData(role: Role): boolean {
  return role !== 'requester'
}

/** The Model Armor and Gateway policy feed. */
export function canSeeSecurityEvents(role: Role): boolean {
  return role === 'procurement' || role === 'admin'
}

/** Hiring agents out of the registry and editing what the fleet remembers. */
export function canManageFleet(role: Role): boolean {
  return role === 'admin' || role === 'procurement'
}

export function canApprove(role: Role): boolean {
  return role === 'approver' || role === 'admin'
}
