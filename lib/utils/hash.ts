import { createHash } from "node:crypto";

export function createClassKeyFromParts(parts: Array<string | undefined>) {
  const normalized = parts
    .map((part) => part?.trim().toLowerCase())
    .filter((part): part is string => Boolean(part))
    .join("|");

  return createHash("sha256").update(normalized).digest("hex");
}
