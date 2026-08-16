/**
 * Relative-date helpers for the seed dataset so the demo dashboard is always
 * "current" regardless of when it is run. V1 computes these at module load.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysAgo(n: number): string {
  return new Date(Date.now() - n * DAY_MS).toISOString();
}

export function daysFromNow(n: number): string {
  return new Date(Date.now() + n * DAY_MS).toISOString();
}

export function today(): string {
  return new Date().toISOString();
}
