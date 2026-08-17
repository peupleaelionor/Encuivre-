import { Panel } from "@/components/ui";
import { createBuyRequestAction } from "@/app/actions";
import { MATERIAL_LABELS, MVP_MATERIALS, GRADES } from "@/lib/enums";
import { buyers } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function NewRequestPage() {
  const buyerOptions = buyers();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Nouvelle demande d&apos;achat</h1>
        <p className="muted text-sm">Enregistrer un besoin acheteur (persisté en base).</p>
      </header>

      <Panel>
        <form action={createBuyRequestAction} className="grid gap-3 md:grid-cols-2">
          <Field label="Acheteur">
            <select name="buyerId" className="input" required>
              {buyerOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Matière">
            <select name="material" className="input">
              {MVP_MATERIALS.map((m) => (
                <option key={m} value={m}>
                  {MATERIAL_LABELS[m]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Grade minimum">
            <select name="minGrade" className="input">
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantité (kg)">
            <input name="quantityKg" type="number" min="0" defaultValue={5000} className="input" />
          </Field>
          <Field label="Prix cible (€/t)">
            <input name="targetPricePerTonne" type="number" min="0" defaultValue={8900} className="input" />
          </Field>
          <Field label="Localisation">
            <input name="location" type="text" defaultValue="Paris" className="input" />
          </Field>
          <Field label="Pays">
            <input name="country" type="text" defaultValue="France" className="input" />
          </Field>
          <div className="md:col-span-2">
            <button className="btn" type="submit">
              Enregistrer la demande
            </button>
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
