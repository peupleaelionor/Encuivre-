"use client";

import { useMemo, useState } from "react";
import { eur, formatEur } from "@/lib/money";
import { calculateQuote } from "@/lib/pricing";
import { evaluateMarginGuard, type MarginGuardThresholds } from "@/lib/margin-guard";
import { VerdictBadge } from "@/components/ui";
import { MATERIAL_LABELS, MVP_MATERIALS, GRADES } from "@/lib/enums";
import { saveQuoteAction } from "@/app/actions";

interface Option {
  id: string;
  label: string;
}

export function QuoteBuilder({
  suppliers,
  buyers,
  thresholds,
}: {
  suppliers: Option[];
  buyers: Option[];
  thresholds: MarginGuardThresholds;
}) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [buyerId, setBuyerId] = useState(buyers[0]?.id ?? "");
  const [material, setMaterial] = useState(MVP_MATERIALS[0]);
  const [grade, setGrade] = useState(GRADES[0]);
  const [quantityKg, setQuantityKg] = useState(10000);
  const [purchase, setPurchase] = useState(8500); // €/t
  const [transport, setTransport] = useState(800);
  const [insurance, setInsurance] = useState(120);
  const [customs, setCustoms] = useState(0);
  const [financing, setFinancing] = useState(300);
  const [other, setOther] = useState(80);
  const [margin, setMargin] = useState(9);

  const quote = useMemo(
    () =>
      calculateQuote({
        purchasePricePerTonneCents: eur(purchase),
        quantityKg,
        transportCents: eur(transport),
        insuranceCents: eur(insurance),
        customsFeesCents: eur(customs),
        financingCents: eur(financing),
        otherCostsCents: eur(other),
        desiredMarginPercent: margin,
      }),
    [purchase, quantityKg, transport, insurance, customs, financing, other, margin],
  );

  const guard = useMemo(
    () =>
      evaluateMarginGuard(
        {
          purchasePricePerTonneCents: eur(purchase),
          quantityKg,
          transportCents: eur(transport),
          insuranceCents: eur(insurance),
          customsFeesCents: eur(customs),
          financingCents: eur(financing),
          otherCostsCents: eur(other),
          salePricePerTonneCents: quote.quotePricePerTonneCents,
        },
        thresholds,
      ),
    [purchase, quantityKg, transport, insurance, customs, financing, other, quote, thresholds],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="panel space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide muted">Paramètres</h2>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fournisseur">
            <Select value={supplierId} onChange={setSupplierId} options={suppliers} />
          </Field>
          <Field label="Acheteur">
            <Select value={buyerId} onChange={setBuyerId} options={buyers} />
          </Field>
          <Field label="Matière">
            <select
              className="input"
              value={material}
              onChange={(e) => setMaterial(e.target.value as typeof material)}
            >
              {MVP_MATERIALS.map((m) => (
                <option key={m} value={m}>
                  {MATERIAL_LABELS[m]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Grade">
            <select
              className="input"
              value={grade}
              onChange={(e) => setGrade(e.target.value as typeof grade)}
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Num label="Quantité (kg)" value={quantityKg} onChange={setQuantityKg} />
          <Num label="Prix d'achat (€/t)" value={purchase} onChange={setPurchase} />
          <Num label="Transport (€)" value={transport} onChange={setTransport} />
          <Num label="Assurance (€)" value={insurance} onChange={setInsurance} />
          <Num label="Douane / frais (€)" value={customs} onChange={setCustoms} />
          <Num label="Financement (€)" value={financing} onChange={setFinancing} />
          <Num label="Autres coûts (€)" value={other} onChange={setOther} />
          <Num label="Marge visée (%)" value={margin} onChange={setMargin} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="panel space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide muted">Résultat</h2>
            <VerdictBadge verdict={guard.verdict} />
          </div>
          <Row label="Coût de revient (landed cost)" value={formatEur(quote.totalLandedCostCents)} />
          <Row label="Prix de vente (devis)" value={formatEur(quote.quotePriceCents)} strong />
          <Row label="Prix / tonne" value={formatEur(quote.quotePricePerTonneCents)} />
          <Row
            label="Marge brute"
            value={`${formatEur(quote.grossMarginCents)} (${quote.grossMarginPercent}%)`}
            strong
          />
        </div>

        <div className="panel space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide muted">Détail du coût</h2>
          <Row label="Achat matière" value={formatEur(quote.landedCost.purchaseCostCents)} />
          <Row label="Transport" value={formatEur(quote.landedCost.transportCents)} />
          <Row label="Assurance" value={formatEur(quote.landedCost.insuranceCents)} />
          <Row label="Douane / frais" value={formatEur(quote.landedCost.customsFeesCents)} />
          <Row label="Financement" value={formatEur(quote.landedCost.financingCents)} />
          <Row label="Autres" value={formatEur(quote.landedCost.otherCostsCents)} />
        </div>

        <div
          className="panel"
          style={{
            borderColor:
              guard.verdict === "RED"
                ? "var(--red)"
                : guard.verdict === "AMBER"
                  ? "var(--amber)"
                  : "var(--green)",
          }}
        >
          <div className="flex items-center gap-2">
            <VerdictBadge verdict={guard.verdict} />
            <span className="text-sm font-medium">
              {guard.canValidate ? "Validation autorisée" : "Validation BLOQUÉE"}
            </span>
          </div>
          {guard.warnings.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm muted">
              {guard.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
          <form action={saveQuoteAction} className="mt-3">
            <input type="hidden" name="supplierId" value={supplierId} />
            <input type="hidden" name="buyerId" value={buyerId} />
            <input type="hidden" name="material" value={material} />
            <input type="hidden" name="grade" value={grade} />
            <input type="hidden" name="quantityKg" value={quantityKg} />
            <input type="hidden" name="purchase" value={purchase} />
            <input type="hidden" name="transport" value={transport} />
            <input type="hidden" name="insurance" value={insurance} />
            <input type="hidden" name="customs" value={customs} />
            <input type="hidden" name="financing" value={financing} />
            <input type="hidden" name="other" value={other} />
            <input type="hidden" name="margin" value={margin} />
            <button className="btn" type="submit" disabled={!guard.canValidate}>
              {guard.canValidate ? "Enregistrer le devis" : "Marge insuffisante"}
            </button>
          </form>
        </div>
      </section>

      <style>{`
        .input { width:100%; background:var(--panel-2); border:1px solid var(--border); border-radius:8px; padding:6px 8px; color:var(--text); font-size:14px; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs muted">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
}) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        className="input"
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </Field>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="muted">{label}</span>
      <span className={strong ? "font-semibold" : ""} style={strong ? { color: "var(--copper-light)" } : undefined}>
        {value}
      </span>
    </div>
  );
}
