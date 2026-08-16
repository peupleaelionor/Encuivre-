import { describe, it, expect } from "vitest";
import { eur } from "@/lib/money";
import { bucketFollowUps, deriveDealAlerts } from "@/lib/follow-ups";
import type { Deal, FollowUp } from "@/lib/types";

const NOW = new Date("2026-08-16T10:00:00.000Z");
const iso = (offsetDays: number) =>
  new Date(NOW.getTime() + offsetDays * 24 * 60 * 60 * 1000).toISOString();

const base: Omit<FollowUp, "id" | "dueAt"> = {
  companyId: "b1",
  action: "call",
  ownerId: "ceo",
  priority: "WARM",
  done: false,
};

describe("bucketFollowUps", () => {
  const fus: FollowUp[] = [
    { ...base, id: "f-today", dueAt: iso(0), lastContactAt: iso(-1) },
    { ...base, id: "f-overdue", dueAt: iso(-3), lastContactAt: iso(-2) },
    { ...base, id: "f-week", dueAt: iso(4), lastContactAt: iso(-1) },
    { ...base, id: "f-noact", dueAt: iso(10), lastContactAt: iso(-40) },
    { ...base, id: "f-done", dueAt: iso(0), lastContactAt: iso(-1), done: true },
  ];

  it("buckets today / overdue / next 7 days", () => {
    const b = bucketFollowUps(fus, NOW);
    expect(b.today.map((f) => f.id)).toContain("f-today");
    expect(b.overdue.map((f) => f.id)).toContain("f-overdue");
    expect(b.next7Days.map((f) => f.id)).toContain("f-week");
  });

  it("flags no-activity items independently of due date", () => {
    const b = bucketFollowUps(fus, NOW);
    expect(b.noActivity.map((f) => f.id)).toContain("f-noact");
  });

  it("ignores done follow-ups", () => {
    const b = bucketFollowUps(fus, NOW);
    const all = [...b.today, ...b.overdue, ...b.next7Days, ...b.noActivity];
    expect(all.map((f) => f.id)).not.toContain("f-done");
  });
});

describe("deriveDealAlerts", () => {
  const dealBase: Deal = {
    id: "d1",
    title: "d",
    buyerId: "b1",
    supplierId: "s1",
    material: "COPPER_MILLBERRY",
    quantityKg: 1000,
    stage: "QUOTED",
    salePricePerTonneCents: eur(8000),
    purchasePricePerTonneCents: eur(7000),
    closeProbability: 0.5,
    ownerId: "ceo",
    createdAt: iso(-10),
    lastContactAt: iso(-5),
    documents: [],
    riskFlags: [],
    businessLine: "TRADE",
  };

  it("alerts on an unanswered quoted offer", () => {
    const alerts = deriveDealAlerts(dealBase, NOW);
    expect(alerts.some((a) => a.kind === "OFFER_UNANSWERED")).toBe(true);
  });

  it("alerts on an unsigned contract", () => {
    const alerts = deriveDealAlerts({ ...dealBase, stage: "CONTRACT" }, NOW);
    expect(alerts.some((a) => a.kind === "CONTRACT_UNSIGNED")).toBe(true);
  });

  it("alerts on missing COA/origin during contract", () => {
    const alerts = deriveDealAlerts({ ...dealBase, stage: "CONTRACT", documents: ["CONTRACT"] }, NOW);
    expect(alerts.some((a) => a.kind === "DOCUMENTS_MISSING")).toBe(true);
  });

  it("alerts on a dormant client", () => {
    const alerts = deriveDealAlerts(
      { ...dealBase, stage: "QUALIFIED", lastContactAt: iso(-60) },
      NOW,
    );
    expect(alerts.some((a) => a.kind === "DORMANT_CLIENT")).toBe(true);
  });
});
