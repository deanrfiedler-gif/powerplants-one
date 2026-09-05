import { invalid, label, object, uuid } from "../platform/validation";
export { invalid, label, object, uuid };
export function choice<T extends string>(
  value: unknown,
  field: string,
  values: readonly T[],
): T {
  if (typeof value !== "string" || !values.includes(value as T))
    invalid(field, `Choose ${values.join(", ")}.`);
  return value as T;
}
export function exact(value: unknown, field: string): string {
  if (
    typeof value !== "string" ||
    !value.length ||
    value.length > 200 ||
    /[\u0000-\u001f\u007f]/.test(value)
  )
    invalid(field, "Enter an exact text identifier of 1–200 characters.");
  return value;
}
export const optionalText = (value: unknown, field: string, max = 200) =>
  value === undefined || value === null ? null : label(value, field, max);
export const optionalId = (value: unknown, field: string) =>
  value === undefined || value === null ? null : uuid(value, field);
export function instant(value: unknown, field: string): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value.slice(0, 10)
  )
    invalid(field, "Enter a valid UTC ISO instant ending in Z.");
  return new Date(value).toISOString();
}
export function dateOnly(value: unknown, field: string): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    invalid(field, "Enter a valid YYYY-MM-DD date.");
  return value;
}
export function period(p: Record<string, unknown>, date = false) {
  const read = date ? dateOnly : instant;
  const valid_from = read(p.valid_from, "valid_from"),
    valid_to =
      p.valid_to === undefined || p.valid_to === null
        ? null
        : read(p.valid_to, "valid_to");
  if (valid_to && valid_to <= valid_from)
    invalid(
      "valid_to",
      "The end must follow the start; adjacent periods are allowed.",
    );
  return { valid_from, valid_to };
}
export function common(p: Record<string, unknown>) {
  if (p.schema_version !== 1)
    invalid("schema_version", "Only schema version 1 is supported.");
  return {
    operation_id: uuid(p.operation_id, "operation_id"),
    schema_version: 1 as const,
    reason: label(p.reason, "reason", 1000),
  };
}
export const commonKeys = ["operation_id", "schema_version", "reason"];
export function version(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 1)
    invalid("expected_version", "A positive record version is required.");
  return Number(value);
}
export const accessClasses = [
  "Internal",
  "RestrictedService",
  "RestrictedFinance",
  "CustomerApproved",
] as const;
export const identityStates = ["Verified", "Unresolved", "Disputed"] as const;

// Multiline narratives extend accepted single-line normalisation without altering old hashes.
export function narrative(value: unknown, field: string, max = 10000): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
  )
    invalid(
      field,
      `Enter 1–${max} characters; line breaks and tabs are allowed.`,
    );
  return value.trim();
}
export const optionalNarrative = (
  value: unknown,
  field: string,
  max = 10000,
) =>
  value === undefined || value === null ? null : narrative(value, field, max);
