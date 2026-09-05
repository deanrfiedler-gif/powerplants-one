import { AppError } from "./errors";
export function invalid(field: string, message: string): never {
  throw new AppError(422, "InvalidData", "Check the highlighted details.", [
    { field, message },
  ]);
}
export function object(
  value: unknown,
  keys: string[],
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return invalid("payload", "A JSON object is required.");
  for (const key of Object.keys(value))
    if (!keys.includes(key)) invalid(key, "This field is not accepted.");
  return value as Record<string, unknown>;
}
export function uuid(value: unknown, field: string): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    return invalid(field, "A valid UUID is required.");
  return value.toLowerCase();
}
export function label(value: unknown, field: string, max: number): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > max ||
    /[\u0000-\u001f\u007f]/.test(value)
  )
    return invalid(field, `Enter 1–${max} characters on one line.`);
  return value.trim();
}
