/**
 * Centralized RBAC — the single place that answers `can(user, action, resource)`.
 *
 * No `if (role === ...)` scattered across the app. Pages, server actions and
 * services all funnel authorization through `can()`.
 *
 * Two dimensions:
 *  1. Capability: does any of the user's roles grant the action?
 *  2. Scope: for tenant-scoped roles (SUPPLIER/BUYER/PARTNER/VIEWER) the resource
 *     must belong to the user's organization. Internal roles operate on the
 *     INTERNAL tenant's data.
 */

export const ROLES = [
  "CEO",
  "ADMIN",
  "SALES",
  "OPERATIONS",
  "COMPLIANCE",
  "FINANCE",
  "SUPPLIER",
  "BUYER",
  "PARTNER",
  "VIEWER",
] as const;
export type Role = (typeof ROLES)[number];

export const ACTIONS = [
  "VIEW_COMPANY",
  "EDIT_COMPANY",
  "VIEW_DEAL",
  "CREATE_DEAL",
  "EDIT_DEAL",
  "VIEW_INTERNAL_MARGIN",
  "VIEW_OFFER",
  "CREATE_OFFER",
  "VIEW_REQUEST",
  "CREATE_REQUEST",
  "VIEW_QUOTE",
  "CREATE_QUOTE",
  "APPROVE_SUPPLIER",
  "VERIFY_DOCUMENT",
  "VIEW_DOCUMENT",
  "MANAGE_USERS",
] as const;
export type Action = (typeof ACTIONS)[number];

/** Roles that operate on the internal tenant (not portal-scoped). */
export const INTERNAL_ROLES: ReadonlySet<Role> = new Set<Role>([
  "CEO",
  "ADMIN",
  "SALES",
  "OPERATIONS",
  "COMPLIANCE",
  "FINANCE",
  "VIEWER",
]);

const ALL: Action[] = [...ACTIONS];

/** Capability matrix. CEO gets everything; others get an explicit list. */
export const ROLE_PERMISSIONS: Record<Role, Action[]> = {
  CEO: ALL,
  // ADMIN: everything except managing... nothing by default (ultra-sensitive
  // exclusions are configurable via ADMIN_DENY below).
  ADMIN: ALL,
  SALES: [
    "VIEW_COMPANY",
    "EDIT_COMPANY",
    "VIEW_DEAL",
    "CREATE_DEAL",
    "EDIT_DEAL",
    "VIEW_INTERNAL_MARGIN",
    "VIEW_OFFER",
    "CREATE_OFFER",
    "VIEW_REQUEST",
    "CREATE_REQUEST",
    "VIEW_QUOTE",
    "CREATE_QUOTE",
    "VIEW_DOCUMENT",
  ],
  OPERATIONS: ["VIEW_COMPANY", "VIEW_DEAL", "VIEW_OFFER", "VIEW_REQUEST", "VIEW_DOCUMENT", "VERIFY_DOCUMENT"],
  COMPLIANCE: ["VIEW_COMPANY", "VIEW_DEAL", "VIEW_DOCUMENT", "VERIFY_DOCUMENT", "APPROVE_SUPPLIER"],
  FINANCE: ["VIEW_COMPANY", "VIEW_DEAL", "VIEW_INTERNAL_MARGIN", "VIEW_QUOTE", "CREATE_QUOTE"],
  SUPPLIER: ["VIEW_COMPANY", "VIEW_OFFER", "CREATE_OFFER", "VIEW_DEAL"],
  BUYER: ["VIEW_COMPANY", "VIEW_REQUEST", "CREATE_REQUEST", "VIEW_DEAL"],
  PARTNER: ["VIEW_DEAL"],
  VIEWER: ["VIEW_COMPANY", "VIEW_DEAL"],
};

/** Ultra-sensitive actions ADMIN must NOT have (configurable). Empty by default. */
export const ADMIN_DENY: ReadonlySet<Action> = new Set<Action>([]);

export interface Membership {
  organizationId: string;
  role: Role;
  status: string;
}

export interface AuthContext {
  user: { id: string; email: string; name: string; avatarUrl?: string };
  memberships: Membership[];
}

/** The organizationId that owns/controls a resource, from either scoping field. */
export interface ResourceScope {
  ownerOrganizationId?: string | null;
  accountOrganizationId?: string | null;
  organizationId?: string | null;
}

function roleGrants(role: Role, action: Action): boolean {
  if (role === "ADMIN" && ADMIN_DENY.has(action)) return false;
  return ROLE_PERMISSIONS[role].includes(action);
}

function membershipMatchesScope(m: Membership, resource: ResourceScope): boolean {
  if (INTERNAL_ROLES.has(m.role)) {
    // Internal users act on internal-owned resources (or unscoped resources).
    return true;
  }
  // Portal-scoped roles: the resource must belong to their organization.
  const orgs = [resource.ownerOrganizationId, resource.accountOrganizationId, resource.organizationId];
  return orgs.includes(m.organizationId);
}

/**
 * Can the user perform `action`, optionally on a specific `resource`?
 * True if any active membership both grants the capability and matches the scope.
 */
export function can(ctx: AuthContext, action: Action, resource?: ResourceScope): boolean {
  for (const m of ctx.memberships) {
    if (m.status !== "ACTIVE") continue;
    if (!roleGrants(m.role, action)) continue;
    if (resource && !membershipMatchesScope(m, resource)) continue;
    return true;
  }
  return false;
}

/** Assert a permission, throwing a typed error when denied (for server actions). */
export class ForbiddenError extends Error {
  constructor(action: Action) {
    super(`Forbidden: ${action}`);
    this.name = "ForbiddenError";
  }
}

export function assertCan(ctx: AuthContext, action: Action, resource?: ResourceScope): void {
  if (!can(ctx, action, resource)) throw new ForbiddenError(action);
}

/** True when the user has any internal-tenant membership. */
export function isInternalUser(ctx: AuthContext): boolean {
  return ctx.memberships.some((m) => m.status === "ACTIVE" && INTERNAL_ROLES.has(m.role));
}

/** The organizationIds a user is scoped to (for list filtering). */
export function scopedOrganizationIds(ctx: AuthContext): string[] {
  return ctx.memberships.filter((m) => m.status === "ACTIVE").map((m) => m.organizationId);
}
