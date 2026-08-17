/** Small id helpers. Platform rows use uuids; domain rows keep readable ids. */

import { randomUUID } from "node:crypto";

export function uuid(): string {
  return randomUUID();
}

export function prefixedId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
