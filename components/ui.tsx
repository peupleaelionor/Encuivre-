import type { ReactNode } from "react";
import type { BuyerBadge, DealLevel, MarginVerdict, SupplierBadge } from "@/lib/enums";

export function Panel({
  title,
  children,
  right,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold uppercase tracking-wide muted">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="panel panel-2">
      <div className="text-xs muted">{label}</div>
      <div className="kpi-value mt-1">{value}</div>
      {hint && <div className="mt-1 text-xs muted">{hint}</div>}
    </div>
  );
}

const LEVEL_COLORS: Record<DealLevel, string> = {
  HOT: "background:#3a1408;color:#f6a97b;border-color:#7a2e12",
  WARM: "background:#3a2a08;color:#f4c874;border-color:#7a5a12",
  COOL: "background:#0e2a33;color:#7fd0e0;border-color:#164a57",
  COLD: "background:#1d1d24;color:#a3a1aa;border-color:#2a2a33",
};

export function LevelBadge({ level }: { level: DealLevel }) {
  return (
    <span className="chip" style={styleFromString(LEVEL_COLORS[level])}>
      {level}
    </span>
  );
}

const SUPPLIER_COLORS: Record<SupplierBadge, string> = {
  STRATEGIC: "background:#0e2a1a;color:#6ee7a8;border-color:#155036",
  PREFERRED: "background:#0e2033;color:#8fb8f0;border-color:#153a57",
  APPROVED: "background:#1d1d24;color:#d4d2da;border-color:#2a2a33",
  WATCH: "background:#3a2a08;color:#f4c874;border-color:#7a5a12",
  BLOCKED: "background:#3a0808;color:#f78b8b;border-color:#7a1212",
};

export function SupplierBadgeChip({ badge }: { badge: SupplierBadge }) {
  return (
    <span className="chip" style={styleFromString(SUPPLIER_COLORS[badge])}>
      {badge}
    </span>
  );
}

const BUYER_COLORS: Record<BuyerBadge, string> = {
  VIP: "background:#2a0e33;color:#e0a8f0;border-color:#57164a",
  ACTIVE: "background:#0e2a1a;color:#6ee7a8;border-color:#155036",
  OCCASIONAL: "background:#1d1d24;color:#d4d2da;border-color:#2a2a33",
  DORMANT: "background:#26241c;color:#c9b78a;border-color:#4a412a",
  RISK: "background:#3a0808;color:#f78b8b;border-color:#7a1212",
};

export function BuyerBadgeChip({ badge }: { badge: BuyerBadge }) {
  return (
    <span className="chip" style={styleFromString(BUYER_COLORS[badge])}>
      {badge}
    </span>
  );
}

const VERDICT_COLORS: Record<MarginVerdict, string> = {
  GREEN: "background:#0e2a1a;color:#6ee7a8;border-color:#155036",
  AMBER: "background:#3a2a08;color:#f4c874;border-color:#7a5a12",
  RED: "background:#3a0808;color:#f78b8b;border-color:#7a1212",
};

export function VerdictBadge({ verdict }: { verdict: MarginVerdict }) {
  return (
    <span className="chip" style={styleFromString(VERDICT_COLORS[verdict])}>
      {verdict}
    </span>
  );
}

export function ScorePill({ score }: { score: number }) {
  const color = score >= 75 ? "#6ee7a8" : score >= 50 ? "#f4c874" : "#f78b8b";
  return (
    <span className="chip" style={{ color, borderColor: "var(--border)" }}>
      {score}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg p-6 text-center text-sm muted">{children}</div>;
}

// Small helper to turn "k:v;k:v" strings into a style object (keeps JSX terse).
function styleFromString(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of s.split(";")) {
    const [k, v] = pair.split(":");
    if (!k || !v) continue;
    const key = k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[key] = v.trim();
  }
  return out;
}
