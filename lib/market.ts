/**
 * Indicative market reference prices (cents per tonne) per material.
 *
 * These are NOT a live feed and NOT a source of financial truth — they are
 * coarse anchors used only to flag suspicious pricing ("prix trop beau pour être
 * vrai"). A real LME/premium feed would replace this in a later version.
 */

import type { Material } from "./enums";
import { eur, type Cents } from "./money";

export const REFERENCE_PRICE_PER_TONNE_CENTS: Record<Material, Cents> = {
  COPPER_CATHODE_GRADE_A: eur(8600),
  COPPER_MILLBERRY: eur(7900),
  COPPER_BARS_BUSBARS: eur(9600),
  COPPER_TUBES: eur(11000),
  COPPER_SHEETS_PLATES: eur(10000),
  BRASS: eur(5400),
  BRONZE: eur(6400),
  ALUMINIUM: eur(2400),
  TIN: eur(28000),
  COBALT: eur(30000),
};

/** Reference price for a material, or undefined if unknown. */
export function referencePrice(material: Material): Cents | undefined {
  return REFERENCE_PRICE_PER_TONNE_CENTS[material];
}
