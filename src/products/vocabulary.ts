// Presentation and write vocabulary. Stored snapshots must never be normalised on read.
export const lifecycleVocabulary = [
  { value: "Current", label: "Current", stored: ["Current", "Supported"] },
  { value: "LastTimeBuy", label: "Last-time buy", stored: ["LastTimeBuy"] },
  {
    value: "Discontinued",
    label: "Discontinued",
    stored: ["Discontinued", "Retired"],
  },
  { value: "Unknown", label: "Unknown", stored: ["Unknown"] },
] as const;
export type Lifecycle = (typeof lifecycleVocabulary)[number]["stored"][number];
export type WriteLifecycle = (typeof lifecycleVocabulary)[number]["value"];
export type LifecycleLabel = (typeof lifecycleVocabulary)[number]["label"];
export const lifecycleStoredValues = lifecycleVocabulary.flatMap((v) => [
  ...v.stored,
]);
export const lifecycleWriteValues = lifecycleVocabulary.map((v) => v.value);
export const lifecycleOptions = lifecycleVocabulary.map((v) => ({
  id: v.value,
  display_name: v.label,
}));
const lifecycleEntry = (value: Lifecycle) =>
  lifecycleVocabulary.find((v) =>
    (v.stored as readonly Lifecycle[]).includes(value),
  )!;
export const currentLifecycle = (value: Lifecycle): WriteLifecycle =>
  lifecycleEntry(value).value;
export const lifecycleLabel = (value: Lifecycle): LifecycleLabel =>
  lifecycleEntry(value).label;
export const lifecycleFilterValues = (
  value: WriteLifecycle,
): readonly Lifecycle[] =>
  lifecycleVocabulary.find((v) => v.value === value)!.stored;

export const relationshipVocabulary = {
  Compatibility: { from: "Compatible with", to: "Compatible with" },
  CandidateReplacement: { from: "Alternative to", to: "Alternative to" },
  Replaces: { from: "Replaced by", to: "Replaces" },
  RequiresAccessory: { from: "Requires accessory", to: "Accessory for" },
} as const;
export type RelationshipType = keyof typeof relationshipVocabulary;
export const relationshipTypes = Object.keys(
  relationshipVocabulary,
) as RelationshipType[];
export const relationshipLabel = (
  type: RelationshipType,
  side: "from" | "to",
) => relationshipVocabulary[type][side];
export const relationshipOptions = relationshipTypes.map((id) => ({
  id,
  display_name: relationshipLabel(id, "from"),
}));

export const criterionVocabulary = {
  Met: "Met",
  NotMet: "Not met",
  Unknown: "Unresolved",
} as const;
export type CriterionOutcome = keyof typeof criterionVocabulary;
export const criterionOutcomes = Object.keys(
  criterionVocabulary,
) as CriterionOutcome[];
export const criterionLabel = (outcome: CriterionOutcome) =>
  criterionVocabulary[outcome];
export const criterionOptions = criterionOutcomes.map((id) => ({
  id,
  display_name: criterionLabel(id),
}));
export const relationshipConclusions = [
  "Conditional",
  "Unresolved",
  "Rejected",
] as const;
export const conclusionLabel = (outcome: string | null) =>
  outcome === null || outcome === "Unreviewed" ? "Not reviewed" : outcome;

export const catalogueOrderVocabulary = {
  product: "Product",
  updated: "Updated",
} as const;
export type CatalogueOrder = keyof typeof catalogueOrderVocabulary;
export const catalogueOrders = Object.keys(
  catalogueOrderVocabulary,
) as CatalogueOrder[];
export const catalogueOrderOptions = catalogueOrders.map((id) => ({
  id,
  display_name: catalogueOrderVocabulary[id],
}));

/** Suggestions only: external identity matching never uses this value. */
export const normaliseDuplicate = (value: string) =>
  value
    .toLocaleLowerCase("en-AU")
    .replace(/[\s\u002d\u2010-\u2015\u2212]/gu, "");
