import { QuoteBuilder } from "@/components/quote-builder";
import { marginThresholdsFromEnv } from "@/lib/margin-guard";
import { buyers, suppliers } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  const [supplierList, buyerList] = await Promise.all([suppliers(), buyers()]);
  const supplierOptions = supplierList.map((c) => ({ id: c.id, label: c.displayName }));
  const buyerOptions = buyerList.map((c) => ({ id: c.id, label: c.displayName }));
  const thresholds = marginThresholdsFromEnv();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Nouveau devis</h1>
        <p className="muted text-sm">
          Calcul financier fiable (centimes, jamais de float) + Margin Guard en direct.
        </p>
      </header>
      <QuoteBuilder suppliers={supplierOptions} buyers={buyerOptions} thresholds={thresholds} />
    </div>
  );
}
