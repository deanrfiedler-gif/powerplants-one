import {
  object,
  choice,
  uuid,
  dateOnly,
  invalid,
  label,
} from "../shared/validation";
import { list } from "../service/work-scope-validation";

// Explicit fee only: a missing schedule preserves historical agreement bytes.
export function chargeSchedule(
  input: unknown,
  effectiveFrom: string,
  effectiveTo: string,
) {
  const v = object(input, ["currency", "tax_basis", "lines"]);
  const currency = choice(v.currency, "currency", ["AUD"] as const);
  const tax_basis = label(v.tax_basis, "tax_basis", 200);
  const lines = list(
    v.lines,
    "charge lines",
    (x) => {
      const l = object(x, ["id", "due_date", "amount"]);
      const due_date =
        l.due_date === undefined
          ? effectiveFrom
          : dateOnly(l.due_date, "due_date");
      if (due_date < effectiveFrom || due_date > effectiveTo)
        invalid(
          "due_date",
          "Charge dates must be within the exact agreement term.",
        );
      if (
        typeof l.amount !== "string" ||
        !/^(0|[1-9]\d{0,11})\.\d{2}$/.test(l.amount) ||
        BigInt(l.amount.replace(".", "")) <= 0n
      )
        invalid(
          "amount",
          "Use a positive exact amount with two decimal places; no rounding or tax calculation is implied.",
        );
      return {
        id: uuid(l.id, "charge line id"),
        due_date,
        amount: l.amount as string,
      };
    },
    1,
    50,
  ).sort(
    (a, b) => a.due_date.localeCompare(b.due_date) || a.id.localeCompare(b.id),
  );
  if (new Set(lines.map((l) => l.id)).size !== lines.length)
    invalid("lines", "Do not repeat a charge line identity.");
  return { currency, tax_basis, lines };
}
