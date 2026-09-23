import { AppError } from "../platform/errors";
import { object } from "../shared/validation";

export function searchQuery(input: unknown) {
  const value = object(input, ["q"]).q;
  if (typeof value !== "string" || value.trim().length < 2 || value.length > 200 || /[\u0000-\u001f\u007f]/.test(value))
    throw new AppError(422, "InvalidSearch", "Enter between 2 and 200 characters.");
  return value.trim();
}
