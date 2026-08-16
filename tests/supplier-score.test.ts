import { describe, it, expect } from "vitest";
import { calculateSupplierScore, badgeForScore, scoreSupplierCompany } from "@/lib/supplier-score";
import type { SupplierMetrics } from "@/lib/types";
import { companies } from "@/lib/seed";

const excellent: SupplierMetrics = {
  pricing: 80,
  quality: 92,
  reliability: 90,
  availability: 85,
  compliance: 90,
  speed: 85,
  communication: 88,
  terms: 84,
};

describe("calculateSupplierScore", () => {
  it("scores an excellent verified supplier as STRATEGIC/PREFERRED", () => {
    const r = calculateSupplierScore({ metrics: excellent, verification: "VERIFIED" });
    expect(r.score).toBeGreaterThanOrEqual(85);
    expect(["STRATEGIC", "PREFERRED"]).toContain(r.badge);
    expect(r.blocked).toBe(false);
  });

  it("caps unverified suppliers below PREFERRED", () => {
    const r = calculateSupplierScore({ metrics: excellent, verification: "PENDING" });
    expect(["APPROVED", "WATCH"]).toContain(r.badge);
    expect(r.reasons.some((x) => x.toLowerCase().includes("non vérifiée"))).toBe(true);
  });

  it("penalizes quality incidents", () => {
    const clean = calculateSupplierScore({ metrics: excellent, verification: "VERIFIED" });
    const dirty = calculateSupplierScore({
      metrics: excellent,
      verification: "VERIFIED",
      qualityIncidents: 3,
    });
    expect(dirty.score).toBeLessThan(clean.score);
  });

  it("honours a manual BLOCKED badge and marks blocked=true", () => {
    const r = calculateSupplierScore({
      metrics: excellent,
      verification: "VERIFIED",
      manualBadge: "BLOCKED",
    });
    expect(r.badge).toBe("BLOCKED");
    expect(r.blocked).toBe(true);
    expect(r.reasons[0]).toContain("BLOQUÉ");
  });

  it("badgeForScore thresholds", () => {
    expect(badgeForScore(90)).toBe("STRATEGIC");
    expect(badgeForScore(72)).toBe("PREFERRED");
    expect(badgeForScore(55)).toBe("APPROVED");
    expect(badgeForScore(30)).toBe("WATCH");
  });

  it("detects the seeded BLOCKED supplier via notes marker", () => {
    const blocked = companies.find((c) => c.id === "sup-globalscrap")!;
    const r = scoreSupplierCompany(blocked);
    expect(r.blocked).toBe(true);
    expect(r.badge).toBe("BLOCKED");
  });
});
