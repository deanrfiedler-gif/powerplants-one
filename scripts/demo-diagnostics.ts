// Emit only fixed diagnostic labels; never stringify an exception or SQL detail.
const knownFailures = new Map([
  ["Hosted demo requires explicit HTTPS, Entra identity and a compiled production runtime.", "hosted-mode-configuration"],
  ["Set the exact HTTPS Container Apps demo origin.", "origin-configuration"],
  ["Set an epoch-specific Azure PostgreSQL demo database without URL options.", "database-configuration"],
  ["Configure the demo application Entra registration.", "entra-configuration"],
  ["Configure private Blob storage for the same demo epoch as the database.", "storage-configuration"],
  ["Invalid demo port.", "port-configuration"],
  ["Connection terminated due to connection timeout", "connection-timeout"],
  ["Review the existing-demo upgrade for this release.", "release-review-required"],
  ["The existing database and runtime role must match.", "target-role-mismatch"],
  ["Unknown migration history; preserve and review this database.", "unknown-migration-history"],
  ["Missing baseline or incompatible migration; preserve and review this database.", "incompatible-migration-history"],
  ["Existing hosted identity migration must match.", "identity-history-mismatch"],
  ["Missing baseline or unknown seed receipts; preserve this database.", "seed-history-mismatch"],
  ["Existing testers need the explicit upgrade-and-deploy operation.", "tester-upgrade-required"],
  ["Runtime role needs the explicit database upgrade.", "runtime-grants-required"],
  ["Runtime role has unexpected identity privileges.", "runtime-identity-privileges"],
]);
const databaseCodes = new Set(["08001", "08006", "28P01", "28000", "3D000", "42501", "42P01", "42703", "42601", "23503", "23505", "23514", "55000", "57014", "40P01", "P0001", "P0002"]);
const connectionCodes = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET", "CERT_HAS_EXPIRED", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "SELF_SIGNED_CERT_IN_CHAIN"]);

export function operatorFailureCode(error: unknown): string {
  if (!(error instanceof Error)) return "unclassified";
  const known = knownFailures.get(error.message);
  if (known) return known;
  const code = "code" in error ? error.code : undefined;
  if (typeof code === "string" && databaseCodes.has(code)) return `postgres-${code}`;
  if (typeof code === "string" && connectionCodes.has(code)) return `connection-${code}`;
  return "unclassified";
}
