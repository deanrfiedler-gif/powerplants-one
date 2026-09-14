// Adopted SYN-E2-QUESTIONS-r01 only. No historical delivery routing rules.
export const systemTags = [
  "ProductSupply",
  "DefinedLabour",
  "Freight",
] as const;
export type SystemTag = (typeof systemTags)[number];
export type Question = {
  id: string;
  label: string;
  type: "Text" | "TextOrNone" | "Integer" | "Decimal" | "Choice";
  required: boolean;
  max_length?: number;
  minimum?: number;
  maximum?: number;
  unit?: string;
  choices?: readonly string[];
  system?: SystemTag;
  when?: { question_id: string; equals: string };
};
export type Definition = {
  id: string;
  revision: string;
  questions: readonly Question[];
};
export function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
export const discoveryDefinition: Readonly<Definition> = freeze({
  id: "SYN-E2-QUESTIONS",
  revision: "r01",
  questions: [
    {
      id: "Q01",
      label: "Included work",
      type: "Text",
      required: true,
      max_length: 2000,
    },
    {
      id: "Q02",
      label: "Exclusions",
      type: "TextOrNone",
      required: true,
      max_length: 2000,
      choices: ["NoneDeclared"],
    },
    {
      id: "Q03",
      label: "Assumptions",
      type: "TextOrNone",
      required: true,
      max_length: 2000,
      choices: ["NoneDeclared"],
    },
    {
      id: "Q04",
      label: "Contract review need",
      type: "Choice",
      required: false,
      choices: ["Required", "NotRequired", "Unknown"],
    },
    {
      id: "Q05",
      label: "Product description",
      type: "Text",
      required: true,
      max_length: 500,
      system: "ProductSupply",
    },
    {
      id: "Q06",
      label: "Product count",
      type: "Integer",
      required: true,
      minimum: 1,
      maximum: 100000,
      unit: "Each",
      system: "ProductSupply",
    },
    {
      id: "Q07",
      label: "Is work on site?",
      type: "Choice",
      required: true,
      choices: ["Yes", "No", "Unknown"],
      system: "DefinedLabour",
    },
    {
      id: "Q08",
      label: "On-site work description",
      type: "Text",
      required: true,
      max_length: 1000,
      system: "DefinedLabour",
      when: { question_id: "Q07", equals: "Yes" },
    },
    {
      id: "Q09",
      label: "Freight responsibility",
      type: "Choice",
      required: true,
      choices: ["PPO", "Customer", "Unknown"],
      system: "Freight",
    },
    {
      id: "Q10",
      label: "Delivery description",
      type: "Text",
      required: true,
      max_length: 500,
      system: "Freight",
      when: { question_id: "Q09", equals: "PPO" },
    },
  ],
});
