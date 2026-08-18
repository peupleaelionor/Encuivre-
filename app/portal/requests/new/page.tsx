import { redirect } from "next/navigation";
import { Panel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/session";
import { getPortalCompany } from "@/lib/services/data";
import { createPortalRequestAction } from "@/app/portal-actions";
import { MATERIAL_LABELS, MVP_MATERIALS, GRADES } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function NewPortalRequestPage() {
  const ctx = await getCurrentUser();
  if (!ctx) redirect("/login");
  const company = await getPortalCompany(ctx);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Soumettre une demande (RFQ)</h1>
        <p className="muted text-sm">
          Demande soumise au nom de <strong>{company?.displayName ?? "votre société"}</strong> à EN CUIVRE.
        </p>
      </header>

      <Panel>
        <form action={createPortalRequestAction} className="grid gap-3 md:grid-cols-2">
          <Field label="Matière">
            <select name="material" className="input">
              {MVP_MATERIALS.map((m) => (
                <option key={m} value={m}>{MATERIAL_LABELS[m]}</option>
              ))}
            </select>
          </Field>
          <Field label="Grade minimum">
            <select name="minGrade" className="input">
              {GRADES.map((g) => (<option key={g} value={g}>{g}</option>))}
            </select>
          </Field>
          <Field label="Quantité (kg)">
            <input name="quantityKg" type="number" min="0" defaultValue={5000} className="input" />
          </Field>
          <Field label="Prix cible (€/t)">
            <input name="targetPricePerTonne" type="number" min="0" defaultValue={9000} className="input" />
          </Field>
          <Field label="Localisation">
            <input name="location" type="text" defaultValue={company?.country ?? ""} className="input" />
          </Field>
          <Field label="Pays">
            <input name="country" type="text" defaultValue={company?.country ?? "France"} className="input" />
          </Field>
          <div className="md:col-span-2">
            <button className="btn" type="submit">Soumettre la demande</button>
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
