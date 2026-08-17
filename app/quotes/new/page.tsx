import { QuoteBuilder } from "@/components/quote-builder";
import { marginThresholdsFromEnv } from "@/lib/margin-guard";
import { buyers, suppliers } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function NewQuotePage() {
  const supplierOptions = suppliers().map((c) => ({ id: c.id, label: c.displayName }));
  const buyerOptions = buyers().map((c) => ({ id: c.id, label: c.displayName }));
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
