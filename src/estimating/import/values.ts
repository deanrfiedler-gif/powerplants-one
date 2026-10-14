import type { WorkbookCell } from "./reader";
import { decimal } from "../math";

// OOXML numbers are decimal strings. Never pass money through binary float.
export function workbookNumber(
  cell: WorkbookCell | undefined,
  places: number,
  maximum: bigint,
  positive = false,
): string | null {
  if (cell?.kind !== "number" || typeof cell.value !== "string") return null;
  const match = /^([+]?)([0-9]*)(?:\.([0-9]*))?(?:[Ee]([+-]?[0-9]+))?$/.exec(
    cell.value,
  );
  if (!match || !(match[2] || match[3])) return null;
  const exponent = Number(match[4] ?? 0);
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100) return null;
  const digits = BigInt((match[2] || "0") + (match[3] ?? ""));
  const shift = places + exponent - (match[3]?.length ?? 0);
  let scaled: bigint;
  if (shift >= 0) scaled = digits * 10n ** BigInt(shift);
  else {
    const divisor = 10n ** BigInt(-shift);
    if (digits % divisor) return null;
    scaled = digits / divisor;
  }
  if (scaled > maximum || (positive && scaled === 0n)) return null;
  return places ? decimal(scaled, places) : scaled.toString();
}

export function workbookDate(cell: WorkbookCell | undefined): string | null {
  if (cell?.kind === "number") {
    const serial = workbookNumber(cell, 0, 2958465n, true);
    if (!serial || serial === "60") return null;
    const day = Number(serial);
    return new Date(
      Date.UTC(1899, 11, 31) + (day > 60 ? day - 1 : day) * 86400000,
    )
      .toISOString()
      .slice(0, 10);
  }
  const value = cell?.kind === "text" ? String(cell.value) : "";
  return /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) &&
    value >= "1900-01-01" &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
    ? value
    : null;
}

export function workbookBoolean(
  cell: WorkbookCell | undefined,
): boolean | null {
  if (cell?.kind === "boolean") return cell.value as boolean;
  if (cell?.kind === "text" && (cell.value === "Yes" || cell.value === "No"))
    return cell.value === "Yes";
  return null;
}

export function workbookText(
  cell: WorkbookCell | undefined,
  max: number,
  optional = false,
): string | null {
  if ((!cell || cell.kind === "blank") && optional) return "";
  if (
    cell?.kind !== "text" ||
    typeof cell.value !== "string" ||
    !cell.value.trim() ||
    cell.value.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(cell.value)
  )
    return null;
  return cell.value;
}
