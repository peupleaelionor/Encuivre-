import { describe, it, expect } from "vitest";
import { can, assertCan, ForbiddenError, type AuthContext } from "@/lib/auth/rbac";

const ctx = (role: string, organizationId = "org-x"): AuthContext => ({
  user: { id: "u", email: "u@x", name: "U" },
  memberships: [{ organizationId, role: role as never, status: "ACTIVE" }],
});

describe("RBAC can()", () => {
  it("CEO can do everything", () => {
    const c = ctx("CEO");
    expect(can(c, "VIEW_INTERNAL_MARGIN")).toBe(true);
    expect(can(c, "MANAGE_USERS")).toBe(true);
    expect(can(c, "CREATE_DEAL")).toBe(true);
  });

  it("BUYER cannot view internal margin", () => {
    expect(can(ctx("BUYER"), "VIEW_INTERNAL_MARGIN")).toBe(false);
  });

  it("SUPPLIER can create offers but not requests", () => {
    const c = ctx("SUPPLIER");
    expect(can(c, "CREATE_OFFER")).toBe(true);
    expect(can(c, "CREATE_REQUEST")).toBe(false);
  });

  it("FINANCE sees margin, SALES sees margin, OPERATIONS does not", () => {
    expect(can(ctx("FINANCE"), "VIEW_INTERNAL_MARGIN")).toBe(true);
    expect(can(ctx("SALES"), "VIEW_INTERNAL_MARGIN")).toBe(true);
    expect(can(ctx("OPERATIONS"), "VIEW_INTERNAL_MARGIN")).toBe(false);
  });

  it("COMPLIANCE can verify documents and approve suppliers", () => {
    const c = ctx("COMPLIANCE");
    expect(can(c, "VERIFY_DOCUMENT")).toBe(true);
    expect(can(c, "APPROVE_SUPPLIER")).toBe(true);
    expect(can(c, "CREATE_DEAL")).toBe(false);
  });

  it("VIEWER is read-only", () => {
    const c = ctx("VIEWER");
    expect(can(c, "VIEW_COMPANY")).toBe(true);
    expect(can(c, "EDIT_COMPANY")).toBe(false);
    expect(can(c, "CREATE_DEAL")).toBe(false);
  });

  it("scope: portal role only reaches its own organization's resources", () => {
    const supplier = ctx("SUPPLIER", "org-metalsud");
    expect(can(supplier, "VIEW_COMPANY", { accountOrganizationId: "org-metalsud" })).toBe(true);
    expect(can(supplier, "VIEW_COMPANY", { accountOrganizationId: "org-other" })).toBe(false);
    // Internal-owned resource (no account org) is out of a portal user's scope.
    expect(can(supplier, "VIEW_COMPANY", { ownerOrganizationId: "org-encuivre" })).toBe(false);
  });

  it("internal role reaches internal-owned resources regardless of scope field", () => {
    const sales = ctx("SALES", "org-encuivre");
    expect(can(sales, "VIEW_COMPANY", { ownerOrganizationId: "org-encuivre" })).toBe(true);
  });

  it("inactive membership grants nothing", () => {
    const c: AuthContext = {
      user: { id: "u", email: "u@x", name: "U" },
      memberships: [{ organizationId: "o", role: "CEO", status: "SUSPENDED" }],
    };
    expect(can(c, "VIEW_DEAL")).toBe(false);
  });

  it("assertCan throws ForbiddenError when denied", () => {
    expect(() => assertCan(ctx("BUYER"), "VIEW_INTERNAL_MARGIN")).toThrow(ForbiddenError);
  });
});
