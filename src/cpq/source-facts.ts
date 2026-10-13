import { Fraction } from "./expression";
import { AppError } from "../platform/errors";
import type { DiscoveryInput } from "../estimating/discovery";
import { calculationInput } from "./validation";
import type { Definition, Scalar } from "./types";
export function sourceFacts(d: Definition, discovery: DiscoveryInput | null) {
  return Object.fromEntries(
    d.facts
      .filter((f) => f.binding)
      .map((f) => {
        const answer = discovery?.answers.find(
          (a) => a.question_id === f.binding!.question_id,
        );
        const known =
          answer && ["Answered", "Confirmed", "Assumed"].includes(answer.state);
        let value: Scalar =
          known &&
          (typeof answer.value === "string" || typeof answer.value === "number")
            ? String(answer.value)
            : null;
        if (
          typeof value === "string" &&
          ["Decimal", "Integer"].includes(f.type)
        )
          value = Fraction.fromDecimal(value).exactDecimal();
        return [
          f.key,
          {
            value,
            question_id: f.binding!.question_id,
            state: answer?.state ?? "Empty",
            source: answer?.source ?? null,
          },
        ];
      }),
  );
}
export function boundInput(
  d: Definition,
  value: unknown,
  discovery: DiscoveryInput | null,
) {
  const input = calculationInput(value, d.facts, d.schema_version === 3),
    bound = sourceFacts(d, discovery);
  for (const i of input.instances)
    for (const [key, b] of Object.entries(bound)) {
      if (i.facts[key] !== b.value || i.not_applicable?.includes(key))
        throw new AppError(
          409,
          "CpqSourceFactChanged",
          "Use the exact facts from this discovery revision. Refresh the source facts; changes belong in the estimation wizard.",
        );
    }
  return input;
}
