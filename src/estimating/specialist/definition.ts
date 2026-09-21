import manifest from "./source-manifest.json" with { type: "json" };
import type { DraftProposal, Price } from "./types";
export const definition = manifest;
export const bundleId = "42482a87-bf98-51b6-85ea-e1ee390e14e7";
// Updated only by extract-specialist-native.mjs; source bytes are retained separately.
export const bundleHash = manifest.bundle_hash;
export const views = [
  "configure",
  "parts",
  "pricing",
  "compare",
  "definition",
  "history",
] as const;
export const viewLabels = [
  "Configure",
  "Parts & working",
  "Pricing",
  "Compare & save",
  "Definition review",
  "Run history",
];
export const groupLabels = [
  "Greenhouse",
  "Cloth & edges",
  "Bed & wire",
  "Drive & motors",
  "Supports & tape",
  "Commercial",
];
export const emptyPrice = (): Price => ({
  cost: "",
  sell: "",
  currency: "AUD",
  no_purchase: false,
  reason: "Rate not supplied",
  effective_date: null,
});
export function initialProposal(): DraftProposal {
  return {
    schema_version: 1,
    definition_bundle_id: bundleId,
    definition_bundle_hash: bundleHash,
    inputs: Object.fromEntries(
      definition.fields.map((f) => [
        f.key,
        {
          raw: f.value,
          attribution: {
            kind: "recovered-default",
            note: "Recovered design default; not a confirmed customer requirement",
            source_field: null,
          },
        },
      ]),
    ),
    extra_screens: Array.from({ length: 5 }, (_, i) => ({
      id: `EXTRA-${i + 1}`,
      count: "0",
      length: "0",
      overhang: "0",
      width: "0",
      material: "Not selected",
      reason: "Inactive recovered slot",
    })),
    parameters: Object.fromEntries(
      definition.catalogue.parameters.map((p) => [
        p.id,
        { raw: p.default, reason: "Recovered definition default" },
      ]),
    ),
    manual_quantities: Object.fromEntries(
      definition.manual_rows.map((r) => [
        `CE-LINE-${r}`,
        {
          value: null,
          reason: "Manual quantity requires review",
          basis_hash: null,
        },
      ]),
    ),
    gates: Object.fromEntries(
      definition.gates.map((r) => [
        `B${r}`,
        {
          include: false,
          reason: "Recovered draft default; review scope inclusion",
        },
      ]),
    ),
    exclusions: [],
    illustrative_prices: [],
  };
}
export const sectionFor = (r: number) =>
  r < 223
    ? "Kit"
    : r < 235
      ? "Screens"
      : r < 240
        ? "Edge seals"
        : r < 263
          ? "Bed"
          : r < 296
            ? "Drive"
            : r < 311
              ? "Motors"
              : r < 320
                ? "Fixings"
                : r < 356
                  ? "Extras"
                  : r < 362
                    ? "Transport"
                    : r < 383
                      ? "Installation"
                      : "Adjustments";
export const unitFor = (r: number) =>
  [223, 224, 227, 228, 229, 230, 231].includes(r)
    ? "m²"
    : [225, 232, 233, 241, 253, 286, 287].includes(r)
      ? "m"
      : [235, 237, 240, 260].includes(r)
        ? "roll"
        : [250, 251, 252, 273, 275, 285].includes(r)
          ? "stock length"
          : r === 236
            ? "pack"
            : "each";
