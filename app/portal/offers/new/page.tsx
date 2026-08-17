import { redirect } from "next/navigation";
import { Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/session";
import { getPortalCompany } from "@/lib/services/data";
import { createPortalOfferAction } from "@/app/portal-actions";
import { MATERIAL_LABELS, MVP_MATERIALS, GRADES, PROVENANCES, PROVENANCE_LABELS } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function NewPortalOfferPage() {
  const ctx = await getCurrentUser();
  if (!ctx) redirect("/login");
  const company = await getPortalCompany(ctx);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Proposer une offre (RFO)</h1>
        <p className="muted text-sm">
          Offre soumise au nom de <strong>{company?.displayName ?? "votre société"}</strong> à EN CUIVRE.
        </p>
      </header>

      <Panel>
        <form action={createPortalOfferAction} className="grid gap-3 md:grid-cols-2">
          <Field label="Matière">
            <select name="material" className="input">
              {MVP_MATERIALS.map((m) => (
                <option key={m} value={m}>{MATERIAL_LABELS[m]}</option>
              ))}
            </select>
          </Field>
          <Field label="Grade">
            <select name="grade" className="input">
              {GRADES.map((g) => (<option key={g} value={g}>{g}</option>))}
            </select>
          </Field>
          <Field label="Provenance">
            <select name="provenance" className="input">
              {PROVENANCES.map((p) => (<option key={p} value={p}>{PROVENANCE_LABELS[p]}</option>))}
            </select>
          </Field>
          <Field label="Quantité (kg)">
            <input name="quantityKg" type="number" min="0" defaultValue={2000} className="input" />
          </Field>
          <Field label="Prix demandé (€/t)">
            <input name="pricePerTonne" type="number" min="0" defaultValue={8000} className="input" />
          </Field>
          <Field label="Localisation">
            <input name="location" type="text" defaultValue={company?.country ?? ""} className="input" />
          </Field>
          <Field label="Pays">
            <input name="country" type="text" defaultValue={company?.country ?? "France"} className="input" />
          </Field>
          <div className="md:col-span-2">
            <button className="btn" type="submit">Soumettre l&apos;offre</button>
          </div>
        </form>
      </Panel>

      <style>{`.input{width:100%;background:var(--panel-2);border:1px solid var(--border);border-radius:8px;padding:6px 8px;color:var(--text);font-size:14px}`}</style>
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
