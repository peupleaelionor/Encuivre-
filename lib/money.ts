/**
 * Money — integer-cents arithmetic for EN CUIVRE OS.
 *
 * FINANCIAL RULE (see CLAUDE.md): money is NEVER stored or computed as a naive
 * float. All amounts are integer minor units (euro cents). Conversions happen
 * only at the edges (parsing user input, formatting for display). Rounding is
 * explicit and uses banker's-safe half-up-away-from-zero at the last step.
 *
 * Units convention across the domain:
 *   - `Cents`      : integer euro cents (1 EUR = 100 cents).
 *   - prices are expressed per METRIC TONNE (€/t), stored as cents-per-tonne.
 *   - quantities are expressed in KILOGRAMS (kg). 1 t = 1000 kg.
 */

export type Cents = number;

/** Convert a decimal EUR amount (e.g. 8540.5) to integer cents. */
export function eur(amount: number): Cents {
  if (!Number.isFinite(amount)) {
    throw new Error(`eur(): amount must be finite, got ${amount}`);
  }
  return Math.round(amount * 100);
}

/** Convert integer cents back to a decimal EUR number (for display/tests only). */
export function toEur(cents: Cents): number {
  return cents / 100;
}

/** Round any fractional cents result to the nearest integer cent, half away from 0. */
export function roundCents(value: number): Cents {
  if (!Number.isFinite(value)) {
    throw new Error(`roundCents(): value must be finite, got ${value}`);
  }
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/** Sum a list of cent amounts. */
export function sum(...values: Cents[]): Cents {
  return values.reduce((acc, v) => acc + v, 0);
}

/**
 * Multiply a price expressed in cents-per-tonne by a quantity in kilograms.
 * Rounds to the nearest cent only once, at the end.
 */
export function priceForKg(pricePerTonneCents: Cents, quantityKg: number): Cents {
  if (quantityKg < 0) {
    throw new Error(`priceForKg(): quantityKg must be >= 0, got ${quantityKg}`);
  }
  return roundCents((pricePerTonneCents * quantityKg) / 1000);
}

/** Apply a percentage (e.g. 8 for 8%) to a cent amount, rounded to the cent. */
export function applyPercent(cents: Cents, percent: number): Cents {
  return roundCents((cents * percent) / 100);
}

/**
 * Gross margin percentage of a sale, computed from integer cents.
 * Returns a number rounded to one decimal. Defined as
 * (salePrice - landedCost) / salePrice * 100.
 * Returns 0 when salePrice is 0 to avoid division by zero.
 */
export function marginPercent(salePriceCents: Cents, landedCostCents: Cents): number {
  if (salePriceCents === 0) return 0;
  const raw = ((salePriceCents - landedCostCents) / salePriceCents) * 100;
  return Math.round(raw * 10) / 10;
}

/** Format cents as a localized EUR string, e.g. 1234567 -> "12 345,67 €". */
export function formatEur(cents: Cents): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** Format a quantity in kg into a readable "t / kg" string. */
export function formatQuantity(quantityKg: number): string {
  if (quantityKg >= 1000) {
    const tonnes = quantityKg / 1000;
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(tonnes)} t`;
  }
  return `${new Intl.NumberFormat("fr-FR").format(quantityKg)} kg`;
}
