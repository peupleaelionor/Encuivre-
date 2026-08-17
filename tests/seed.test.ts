import { describe, it, expect } from "vitest";
import {
  companies,
  sellOffers,
  buyRequests,
  deals,
  documents,
  followUps,
  quotes,
} from "@/lib/seed";
import { MATERIALS } from "@/lib/enums";

describe("seed dataset integrity", () => {
  it("has the expected company mix (5 suppliers, 7 buyers, 3 both)", () => {
    const suppliers = companies.filter((c) => c.role === "SUPPLIER");
    const buyers = companies.filter((c) => c.role === "BUYER");
    const both = companies.filter((c) => c.role === "BOTH");
    expect(suppliers).toHaveLength(5);
    expect(buyers).toHaveLength(7);
    expect(both).toHaveLength(3);
  });

  it("has the expected volumes (12 offers, 15 requests, 8 deals)", () => {
    expect(sellOffers).toHaveLength(12);
    expect(buyRequests).toHaveLength(15);
    expect(deals).toHaveLength(8);
  });

  it("has documents with mixed verification statuses", () => {
    const statuses = new Set(documents.map((d) => d.verificationStatus));
    expect(statuses.size).toBeGreaterThan(1);
    expect(documents.length).toBeGreaterThanOrEqual(8);
  });

  it("has follow-ups and quotes", () => {
    expect(followUps.length).toBeGreaterThanOrEqual(5);
    expect(quotes.length).toBeGreaterThanOrEqual(2);
  });

  it("uses only valid materials and unique ids", () => {
    for (const o of sellOffers) expect(MATERIALS).toContain(o.material);
    const ids = companies.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every offer references an existing supplier and every request an existing buyer", () => {
    const byId = new Set(companies.map((c) => c.id));
    for (const o of sellOffers) expect(byId.has(o.supplierId)).toBe(true);
    for (const r of buyRequests) expect(byId.has(r.buyerId)).toBe(true);
  });

  it("contains exactly one BLOCKED supplier marker", () => {
    const blocked = companies.filter((c) => c.notes?.includes("[BLOCKED]"));
    expect(blocked).toHaveLength(1);
  });
});
