import { readFileSync } from "node:fs";
import {
  previewImport,
  requireConfirmableImport,
} from "../../src/estimating/fertigation/interchange";
import { proposedPlacement } from "../../src/estimating/fertigation/import-placement";
import { validateScope } from "../../src/estimating/fertigation/validation";
import type { Scope } from "../../src/estimating/fertigation/types";

/**
 * The design board's reference scope (retained captures:
 * docs/reference/ui/estimating/fertigation-design-board-r01/).
 *
 * r02's own synthetic sample, imported with the proposed placements
 * (ADR-0044), then completed with the declarations the board shows as made.
 * Values that r02 does not record (voltages, channels, the shortlisted
 * candidate's envelope, Channel A's range) are synthetic choices made to
 * reproduce the board. They are fixture values, not r02 facts or ratings.
 * Records are found by label, so the result does not depend on identities.
 */
export function boardReferenceScope(
  target = "7a1c3f4e-2b5d-4c6e-8f90-1a2b3c4d5e6f",
): Scope {
  const raw = readFileSync(
    "tests/fixtures/fertigation-r02-sample-export.json",
    "utf8",
  );
  const preview = previewImport(raw, target);
  const s = requireConfirmableImport(
    preview,
    preview.source_hash,
    preview.preview_hash,
    preview.losses.map((l) => ({
      path: l.path,
      disposition: proposedPlacement(l.path),
    })),
  );
  const by = <T extends { label: string }>(rows: T[], prefix: string) => {
    const row = rows.find((r) => r.label.startsWith(prefix));
    if (!row) throw new Error(`Board scope: no record labelled ${prefix}`);
    return row;
  };

  // D-01 production context, for the scope and each represented area.
  s.production_context = {
    ...s.production_context,
    tags: ["commercial_berries"],
    crop_description: "Blueberries and raspberries in substrate pots",
    growing_system: "hydroponic_soilless",
    application_method: "drip",
    hydraulic_arrangement: "single_pass",
    source_note: "Declared on import from the r02 file",
  };
  for (const a of s.areas) a.context = { ...s.production_context };
  // D-02 phases.
  by(s.crop_groups, "A").phase = "existing";
  by(s.crop_groups, "B").phase = "proposed";
  by(s.crop_groups, "C").phase = "future";
  by(s.groups, "G1").phase = "proposed";
  by(s.groups, "G2").phase = "existing";
  by(s.groups, "G3").phase = "future";
  for (const sc of s.scenarios)
    sc.phase = sc.include_future ? "future" : "proposed";
  for (const r of [...s.pipes, ...s.filters, ...s.controllers, ...s.banks])
    r.phase = "existing";
  for (const r of [...s.recipes, ...s.stocks, ...s.strategies])
    r.phase = "proposed";
  // D-03 represented areas.
  by(s.crop_groups, "A").represented_area_m2 = 20000;
  by(s.crop_groups, "B").represented_area_m2 = 10000;
  // D-06 supply source.
  for (const sc of s.scenarios) sc.source_id = s.sources[0].id;
  // D-08 bank signal and voltage (synthetic).
  const io1 = by(s.banks, "IO-01"),
    io2 = by(s.banks, "IO-02"),
    controller = s.controllers[0];
  io1.voltage = "24 V AC";
  io2.voltage = "24 V DC";
  io2.signal = "analogue_input";
  // D-09 control ownership: existing outputs retained, new valves add one each.
  s.valves.forEach((v, i) => {
    v.control = {
      ...v.control,
      owner: "ppo_controller",
      controller_id: controller.id,
      bank_id: io1.id,
      channel: `DO-${String(i + 3).padStart(2, "0")}`,
      signal: "digital_output",
      voltage: "24 V AC",
      additional_channels:
        v.intent === "new" || v.label === "B1" || v.label === "C1" ? 1 : 0,
    };
  });
  s.masters[0].control = {
    ...s.masters[0].control,
    owner: "ppo_controller",
    controller_id: controller.id,
    bank_id: io1.id,
    channel: "DO-01",
    signal: "digital_output",
    voltage: "24 V AC",
    additional_channels: 0,
  };
  // D-10 sensor assignment.
  s.sensors[0].control = {
    ...s.sensors[0].control,
    bank_id: io2.id,
    channel: "AI-07",
    signal: "analogue_input",
    voltage: "24 V DC",
    additional_channels: 1,
  };
  s.sensors[0].crop_group_id = by(s.crop_groups, "A").id;
  // D-12 filter path.
  s.filters[0].path = "pump";
  // One shortlisted candidate with an entered, unverified envelope, and
  // Channel A with a hypothetical range.
  const nutrifit = by(s.candidates, "NutriFit");
  Object.assign(nutrifit, {
    phase: "proposed",
    shortlisted: true,
    minimum_m3h: 10,
    maximum_m3h: 30,
    variant: "SYN example variant",
    pressure_boundary: "unit_inlet",
  });
  s.channels = [
    {
      id: "9b0c3d9e-1c1f-4a55-9e21-6b2c8f4d7a10",
      label: "Channel A · Nutrient",
      phase: "proposed",
      evidence_ids: [],
      notes: "Hypothetical 5–50 L/h range; not a Priva rating.",
      candidate_id: nutrifit.id,
      stock_id: s.stocks[0].id,
      minimum_lph: 5,
      maximum_lph: 50,
      conditions: "",
    },
  ];
  // Evidence: the site-visit observation covers the controller; the r02
  // values are assumptions.
  const assumption = {
    ...s.evidence[0],
    id: "5d1f6c2a-3b4e-4f5a-8c7d-9e0f1a2b3c4d",
    label: "r02 synthetic sample values",
    kind: "assumption" as const,
    applicability: "Source, filter, stock and pump values",
    notes: "Synthetic interaction values carried from the r02 sample.",
  };
  s.evidence.push(assumption);
  controller.evidence_ids = [s.evidence[0].id];
  for (const r of [...s.sources, ...s.filters, ...s.stocks])
    r.evidence_ids = [assumption.id];
  return validateScope(s);
}
