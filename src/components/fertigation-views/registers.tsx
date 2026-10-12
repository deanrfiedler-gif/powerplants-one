"use client";
import { useMemo, useState, type ReactNode } from "react";
import type { Phase, Scope } from "../../estimating/fertigation/types";
import type { EvidenceStrength } from "../../estimating/fertigation/guidance";
import { WorklistMenu } from "../crm-worklist-tools";
import { RecordTabs } from "../record-ui";
import { RegisterTable } from "../ui/register-table";
import { human, registerNames, type Register } from "../fertigation-fields";
import {
  Button,
  Chip,
  Entered,
  EvidenceChip,
  Empty,
  Find,
  Panel,
  PhaseChip,
  ResultValue,
  Token,
  clock,
  fmt,
  known,
} from "../fertigation-ui";
import { viewRegisters, type ViewContext } from "./context";
import type { FertigationView } from "../fertigation-frame";

/*
 * The scope's registers, one panel per register, with the columns the design
 * board draws for each (boards 02–08). The row label opens the record; the
 * search, phase, area and master filters and the 25-row pages are unchanged.
 */

const PAGE = 25;

type Row = Scope[Register][number] & { phase?: string; evidence_ids?: string[] };

/** The strongest evidence linked to a record, as the Overview counts it. */
export function strongest(scope: Scope, row: { evidence_ids?: string[] }): EvidenceStrength {
  const rank: EvidenceStrength[] = ["none", "assumption", "observation", "document_reference"];
  let best: EvidenceStrength = "none";
  for (const id of row.evidence_ids ?? []) {
    const kind = scope.evidence.find((e) => e.id === id)?.kind;
    if (kind && rank.indexOf(kind) > rank.indexOf(best)) best = kind;
  }
  return best;
}

const label = (rows: { id: string; label: string }[], id: string | null) =>
  id ? (rows.find((r) => r.id === id)?.label ?? "Unresolved reference") : null;

const text = (value: string, missing = "Not recorded") =>
  value?.trim() ? value : <Token>{missing}</Token>;

type Column = { key: string; head: ReactNode; cell: (row: Row) => ReactNode; className?: string };

function columnsFor(register: Register, ctx: ViewContext): Column[] {
  const { proposal: s, calculation: calc } = ctx;
  const evidence: Column = {
    key: "evidence",
    head: "Evidence",
    cell: (r) => <EvidenceChip strength={strongest(s, r)} />,
  };
  const phase: Column = {
    key: "phase",
    head: "Phase",
    cell: (r) => (r.phase ? <PhaseChip phase={r.phase as Phase} /> : <Token>Not recorded</Token>),
  };
  const scenario = s.scenarios.find((x) => x.id === s.selected_scenario_id);
  switch (register) {
    case "areas":
      return [
        phase,
        {
          key: "basis",
          head: "Area basis",
          cell: (r) => {
            const a = r as Scope["areas"][number];
            return a.area_basis === "unknown" ? <Token>Not recorded</Token> : human(a.area_basis);
          },
        },
        {
          key: "size",
          head: "Area",
          cell: (r) => {
            const a = r as Scope["areas"][number];
            return known(a.area_m2) ? (
              a.entered_area_unit === "ha" ? `${fmt(a.area_m2 / 10000, 2)} ha` : `${fmt(a.area_m2, 0)} m²`
            ) : (
              <Token>Not recorded</Token>
            );
          },
          className: "fn-col-num",
        },
        {
          key: "cohorts",
          head: "Cohorts",
          cell: (r) => s.crop_groups.filter((c) => c.area_id === r.id).length,
          className: "fn-col-num",
        },
        {
          key: "valves",
          head: "Irrigation valves",
          cell: (r) => {
            const cohorts = new Set(s.crop_groups.filter((c) => c.area_id === r.id).map((c) => c.id));
            return s.valves.filter((v) =>
              v.allocations.some((a) => a.area_id === r.id || (a.crop_group_id && cohorts.has(a.crop_group_id))),
            ).length;
          },
          className: "fn-col-num",
        },
        evidence,
      ];
    case "crop_groups":
      return [
        {
          key: "area",
          head: "Block",
          cell: (r) => text(label(s.areas, (r as Scope["crop_groups"][number]).area_id) ?? "", "No block"),
        },
        {
          key: "crop",
          head: "Crop",
          cell: (r) => text((r as Scope["crop_groups"][number]).crop_description),
        },
        phase,
        {
          key: "containers",
          head: "Containers / plants",
          cell: (r) => {
            const c = r as Scope["crop_groups"][number];
            return (
              <>
                {known(c.container_count) ? fmt(c.container_count, 0) : <Token>—</Token>}
                {" / "}
                {known(c.plant_count) ? fmt(c.plant_count, 0) : <Token>—</Token>}
              </>
            );
          },
          className: "fn-col-num",
        },
        {
          key: "daily",
          head: "Daily per container",
          cell: (r) => <Entered value={(r as Scope["crop_groups"][number]).daily_l_per_container} unit="L" />,
          className: "fn-col-num",
        },
        {
          key: "basis",
          head: "Demand basis",
          cell: (r) => {
            const c = r as Scope["crop_groups"][number];
            return c.demand_basis === "unknown" ? <Token>Not recorded</Token> : `${human(c.demand_basis)}${known(c.drain_fraction) ? ` · drain ${fmt(c.drain_fraction * 100, 0)}%` : ""}`;
          },
        },
        evidence,
      ];
    case "valves":
      return [
        {
          key: "master",
          head: "Mainline",
          cell: (r) => text(label(s.masters, (r as Scope["valves"][number]).master_id) ?? "", "Master unassigned"),
        },
        phase,
        {
          key: "allocations",
          head: "Allocations",
          cell: (r) => {
            const v = r as Scope["valves"][number];
            if (!v.allocations.length) return <Token>No allocation</Token>;
            return (
              <span className="fn-cell-lines">
                {v.allocations.slice(0, 3).map((a) => (
                  <span key={a.id}>
                    {label(s.crop_groups, a.crop_group_id) ?? label(s.areas, a.area_id) ?? "Unassigned"}
                    {known(a.container_count) ? ` · ${fmt(a.container_count, 0)} containers` : ""}
                  </span>
                ))}
                {v.allocations.length > 3 && <small>and {v.allocations.length - 3} more</small>}
              </span>
            );
          },
        },
        {
          key: "demand",
          head: "Demand",
          cell: (r) => <ResultValue result={calc?.valve_flows.find((x) => x.id === r.id)?.flow} />,
          className: "fn-col-num",
        },
        {
          key: "basis",
          head: "Basis",
          cell: (r) => {
            const v = r as Scope["valves"][number];
            return v.flow_basis === "unknown" ? <Token>Basis not recorded</Token> : human(v.flow_basis);
          },
        },
        {
          key: "pressure",
          head: "Outlet pressure",
          cell: (r) => <Entered value={(r as Scope["valves"][number]).pressure_bar} unit="bar" />,
          className: "fn-col-num",
        },
        evidence,
      ];
    case "masters":
      return [
        { key: "circuit", head: "Circuit", cell: (r) => text((r as Scope["masters"][number]).circuit) },
        phase,
        { key: "source", head: "Water source", cell: (r) => text(label(s.sources, (r as Scope["masters"][number]).source_id) ?? "", "Source unassigned") },
        { key: "model", head: "Location · model", cell: (r) => { const m = r as Scope["masters"][number]; return text([m.location, m.model].filter(Boolean).join(" · ")); } },
        { key: "pressure", head: "Operating pressure", cell: (r) => <Entered value={(r as Scope["masters"][number]).pressure_bar} unit="bar" />, className: "fn-col-num" },
        { key: "intent", head: "Proposed work", cell: (r) => human((r as Scope["masters"][number]).intent) },
        evidence,
      ];
    case "sources":
      return [
        { key: "type", head: "Type", cell: (r) => text((r as Scope["sources"][number]).type) },
        phase,
        { key: "reliable", head: "Reliable supply", cell: (r) => <Entered value={(r as Scope["sources"][number]).reliable_flow_m3h} unit="m³/h" />, className: "fn-col-num" },
        { key: "storage", head: "Usable storage", cell: (r) => <Entered value={(r as Scope["sources"][number]).usable_storage_m3} unit="m³" />, className: "fn-col-num" },
        {
          key: "binding",
          head: "Scenario binding",
          cell: (r) => {
            const bound = s.scenarios.filter((x) => x.source_id === r.id).map((x) => x.label);
            if (scenario && scenario.source_id !== r.id)
              return <Chip tone="incomplete">Not bound to {scenario.label}</Chip>;
            return bound.length ? bound.join(", ") : <Token>Not bound</Token>;
          },
        },
        evidence,
      ];
    case "pipes":
      return [
        { key: "route", head: "Route", cell: (r) => { const p = r as Scope["pipes"][number]; return p.from || p.to ? `${p.from || "?"} → ${p.to || "?"}` : <Token>Route not recorded</Token>; } },
        phase,
        { key: "length", head: "Length / internal diameter", cell: (r) => { const p = r as Scope["pipes"][number]; return <>{known(p.length_m) ? `${fmt(p.length_m)} m` : <Token>—</Token>} / {known(p.internal_diameter_mm) ? `${fmt(p.internal_diameter_mm)} mm` : <Token>—</Token>}</>; }, className: "fn-col-num" },
        { key: "flow", head: "Flow basis", cell: (r) => <Entered value={(r as Scope["pipes"][number]).design_flow_m3h} unit="m³/h" />, className: "fn-col-num" },
        { key: "volume", head: "Internal volume", cell: (r) => <ResultValue result={calc?.pipes.find((x) => x.id === r.id)?.volume_l} />, className: "fn-col-num" },
        { key: "transit", head: "Transit", cell: (r) => <ResultValue result={calc?.pipes.find((x) => x.id === r.id)?.transit_seconds} />, className: "fn-col-num" },
        { key: "loss", head: "Head-loss basis", cell: (r) => text((r as Scope["pipes"][number]).loss_basis) },
      ];
    case "filters":
      return [
        { key: "process", head: "Process", cell: (r) => text((r as Scope["filters"][number]).process) },
        phase,
        { key: "path", head: "Flow path", cell: (r) => { const f = r as Scope["filters"][number]; return f.path === "unknown" ? <Chip tone="incomplete">Flow path to confirm</Chip> : human(f.path); } },
        { key: "capacity", head: "Capacity", cell: (r) => <Entered value={(r as Scope["filters"][number]).capacity_m3h} unit="m³/h" />, className: "fn-col-num" },
        { key: "loss", head: "Dirty loss", cell: (r) => <Entered value={(r as Scope["filters"][number]).dirty_loss_m} unit="m" />, className: "fn-col-num" },
        { key: "backwash", head: "Backwash", cell: (r) => <Entered value={(r as Scope["filters"][number]).backwash_m3h} unit="m³/h" />, className: "fn-col-num" },
        { key: "discharge", head: "Discharge", cell: (r) => text((r as Scope["filters"][number]).discharge) },
        evidence,
      ];
    case "water_samples":
      return [
        { key: "source", head: "Source", cell: (r) => text(label(s.sources, (r as Scope["water_samples"][number]).source_id) ?? "", "Source not linked") },
        { key: "date", head: "Sample date", cell: (r) => text((r as Scope["water_samples"][number]).sample_date ?? "") },
        { key: "lab", head: "Laboratory", cell: (r) => text((r as Scope["water_samples"][number]).laboratory) },
        { key: "ph", head: "pH", cell: (r) => <Entered value={(r as Scope["water_samples"][number]).ph} unit="" digits={2} />, className: "fn-col-num" },
        { key: "ec", head: "EC", cell: (r) => <Entered value={(r as Scope["water_samples"][number]).ec_mscm} unit="mS/cm" digits={2} />, className: "fn-col-num" },
        { key: "alk", head: "Alkalinity", cell: (r) => text((r as Scope["water_samples"][number]).alkalinity) },
        evidence,
      ];
    case "recipes":
      return [
        { key: "author", head: "Author / revision", cell: (r) => { const x = r as Scope["recipes"][number]; return x.author || x.revision ? [x.author, x.revision].filter(Boolean).join(" · ") : <Token>To confirm</Token>; } },
        phase,
        { key: "ph", head: "Target feed pH", cell: (r) => <Entered value={(r as Scope["recipes"][number]).ph_target} unit="" digits={2} />, className: "fn-col-num" },
        { key: "ec", head: "Target feed EC", cell: (r) => <Entered value={(r as Scope["recipes"][number]).ec_target_mscm} unit="mS/cm" digits={2} />, className: "fn-col-num" },
        { key: "basis", head: "EC basis", cell: (r) => { const x = r as Scope["recipes"][number]; return x.ec_basis === "unknown" ? <Token>Not recorded</Token> : human(x.ec_basis); } },
        { key: "groups", head: "Serves", cell: (r) => { const g = s.groups.filter((x) => x.recipe_id === r.id).map((x) => x.label); return g.length ? g.join(", ") : <Token>No group</Token>; } },
        evidence,
      ];
    case "stocks":
      return [
        { key: "recipe", head: "Recipe", cell: (r) => text(label(s.recipes, (r as Scope["stocks"][number]).recipe_id) ?? "", "No recipe") },
        { key: "function", head: "Function", cell: (r) => human((r as Scope["stocks"][number]).function) },
        phase,
        { key: "dose", head: "Dose", cell: (r) => <Entered value={(r as Scope["stocks"][number]).dose_l_m3} unit="L/m³" digits={2} />, className: "fn-col-num" },
        { key: "usable", head: "Usable stock", cell: (r) => <Entered value={(r as Scope["stocks"][number]).usable_l} unit="L" />, className: "fn-col-num" },
        { key: "concentration", head: "Concentration", cell: (r) => text((r as Scope["stocks"][number]).concentration, "Product not recorded") },
        evidence,
      ];
    case "channels":
      return [
        { key: "candidate", head: "Configured on", cell: (r) => text(label(s.candidates, (r as Scope["channels"][number]).candidate_id) ?? "", "No candidate") },
        { key: "stock", head: "Stock", cell: (r) => text(label(s.stocks, (r as Scope["channels"][number]).stock_id) ?? "", "No stock") },
        phase,
        { key: "range", head: "Injection range", cell: (r) => { const c = r as Scope["channels"][number]; return known(c.minimum_lph) && known(c.maximum_lph) ? `${fmt(c.minimum_lph)}–${fmt(c.maximum_lph)} L/h` : <Token>Not entered</Token>; }, className: "fn-col-num" },
        { key: "conditions", head: "Conditions", cell: (r) => text((r as Scope["channels"][number]).conditions) },
        evidence,
      ];
    case "controllers":
      return [
        { key: "family", head: "Family", cell: (r) => { const c = r as Scope["controllers"][number]; return c.family === "unknown" ? <Token>Not recorded</Token> : c.family; } },
        phase,
        { key: "model", head: "Model · serial", cell: (r) => { const c = r as Scope["controllers"][number]; return text([c.model, c.serial].filter(Boolean).join(" · ")); } },
        { key: "software", head: "Software / licences", cell: (r) => { const c = r as Scope["controllers"][number]; return c.software || c.licences ? [c.software, c.licences].filter(Boolean).join(" · ") : <Token>Licences unconfirmed</Token>; } },
        evidence,
      ];
    case "banks":
      return [
        { key: "controller", head: "Controller", cell: (r) => text(label(s.controllers, (r as Scope["banks"][number]).controller_id) ?? "", "No controller") },
        { key: "signal", head: "Signal · voltage", cell: (r) => { const b = r as Scope["banks"][number]; return `${b.signal === "unknown" ? "Signal not recorded" : human(b.signal)}${b.voltage ? ` · ${b.voltage}` : ""}`; } },
        phase,
        { key: "channels", head: "Installed · used · reserved · faulty", cell: (r) => { const b = r as Scope["banks"][number]; return [b.installed, b.used, b.reserved, b.faulty].map((v) => (known(v) ? fmt(v, 0) : "—")).join(" · "); }, className: "fn-col-num" },
        { key: "spare", head: "Spare after expansion", cell: (r) => <ResultValue result={calc?.io.find((x) => x.bank_id === r.id)?.spare} />, className: "fn-col-num" },
        evidence,
      ];
    case "sensors":
      return [
        { key: "measurement", head: "Measurement", cell: (r) => text((r as Scope["sensors"][number]).measurement) },
        phase,
        { key: "crop", head: "Represents", cell: (r) => text(label(s.crop_groups, (r as Scope["sensors"][number]).crop_group_id) ?? "", "Not linked") },
        { key: "bank", head: "I/O bank · channel", cell: (r) => { const x = r as Scope["sensors"][number]; const bank = label(s.banks, x.control.bank_id); return bank ? `${bank}${x.control.channel ? ` · ${x.control.channel}` : ""}` : <Token>Not assigned</Token>; } },
        { key: "signal", head: "Interface", cell: (r) => { const x = r as Scope["sensors"][number]; return x.control.signal === "unknown" ? <Token>To confirm</Token> : human(x.control.signal); } },
        evidence,
      ];
    case "strategies":
      return [
        { key: "trigger", head: "Trigger", cell: (r) => text((r as Scope["strategies"][number]).trigger) },
        phase,
        { key: "sensor", head: "Sensor", cell: (r) => text(label(s.sensors, (r as Scope["strategies"][number]).sensor_id) ?? "", "Not linked") },
        { key: "groups", head: "Operating groups", cell: (r) => { const g = (r as Scope["strategies"][number]).group_ids.map((id) => label(s.groups, id)).filter(Boolean); return g.length ? g.join(", ") : <Token>None</Token>; } },
        { key: "reset", head: "Reset basis", cell: (r) => text((r as Scope["strategies"][number]).reset_basis, "To confirm") },
        { key: "fallback", head: "Fallback", cell: (r) => text((r as Scope["strategies"][number]).fallback, "To confirm") },
        evidence,
      ];
    case "groups":
      return [
        { key: "valves", head: "Simultaneous valves", cell: (r) => { const g = (r as Scope["groups"][number]).valve_ids.map((id) => label(s.valves, id)).filter(Boolean); return g.length ? g.join(", ") : <Token>No valves</Token>; } },
        phase,
        { key: "recipe", head: "Recipe", cell: (r) => text(label(s.recipes, (r as Scope["groups"][number]).recipe_id) ?? "", "No recipe") },
        { key: "flow", head: "Unit / pump flow", cell: (r) => { const f = calc?.group_flows.find((x) => x.id === r.id); return f ? <><ResultValue result={f.unit} /> / <ResultValue result={f.pump} /></> : <Token>Not assessed</Token>; }, className: "fn-col-num" },
        { key: "timing", head: "Prepare / deliver / flush", cell: (r) => { const g = r as Scope["groups"][number]; return [g.prepare_seconds, g.delivery_seconds, g.flush_seconds].every(known) ? `${fmt(g.prepare_seconds!, 0)} / ${fmt(g.delivery_seconds!, 0)} / ${fmt(g.flush_seconds!, 0)} s` : <Token>Durations incomplete</Token>; }, className: "fn-col-num" },
        { key: "dry", head: "Dry interval limit", cell: (r) => { const g = r as Scope["groups"][number]; return known(g.maximum_dry_min) ? `${fmt(g.maximum_dry_min)} min` : <Token>Limit not recorded</Token>; }, className: "fn-col-num" },
      ];
    case "scenarios":
      return [
        { key: "selected", head: "Selected", cell: (r) => (r.id === s.selected_scenario_id ? <Chip tone="success" icon="check">Selected</Chip> : <span className="fn-muted">—</span>) },
        { key: "phases", head: "Phase basis", cell: (r) => ((r as Scope["scenarios"][number]).include_future ? "Existing + proposed + future" : "Existing + proposed") },
        { key: "window", head: "Window", cell: (r) => { const x = r as Scope["scenarios"][number]; return known(x.start_minute) && known(x.end_minute) ? `${clock(x.start_minute)}–${clock(x.end_minute)}` : <Token>Window not recorded</Token>; } },
        { key: "cycles", head: "Cycles · spacing", cell: (r) => { const x = r as Scope["scenarios"][number]; return `${known(x.cycles) ? fmt(x.cycles, 0) : "—"} · ${known(x.spacing_min) ? `${fmt(x.spacing_min)} min ${x.spacing_basis === "unknown" ? "" : human(x.spacing_basis).toLowerCase()}` : "—"}`; } },
        { key: "source", head: "Supply", cell: (r) => text(label(s.sources, (r as Scope["scenarios"][number]).source_id) ?? "", "Not bound") },
        { key: "storage", head: "Start · refill · reserve", cell: (r) => { const x = r as Scope["scenarios"][number]; return `${known(x.initial_storage_m3) ? `${fmt(x.initial_storage_m3)} m³` : "—"} · ${known(x.refill_m3h) ? `${fmt(x.refill_m3h)} m³/h` : "—"} · ${known(x.reserve_m3) ? `${fmt(x.reserve_m3)} m³` : "—"}`; }, className: "fn-col-num" },
      ];
    case "candidates":
      return [
        { key: "family", head: "Family", cell: (r) => (r as Scope["candidates"][number]).family },
        phase,
        { key: "variant", head: "Variant · arrangement", cell: (r) => { const c = r as Scope["candidates"][number]; return text([c.variant, c.arrangement].filter(Boolean).join(" · "), "Variant not recorded"); } },
        { key: "envelope", head: "Entered flow envelope", cell: (r) => { const c = r as Scope["candidates"][number]; return known(c.minimum_m3h) && known(c.maximum_m3h) ? `${fmt(c.minimum_m3h)}–${fmt(c.maximum_m3h)} m³/h` : <Token>Not entered</Token>; }, className: "fn-col-num" },
        { key: "status", head: "Capacity check", cell: (r) => { const st = calc?.candidates.find((x) => x.id === r.id)?.status; return !st ? <Token>Not assessed</Token> : st === "outside_entered_limits" ? <Chip tone="conflict" icon="conflict">Outside entered limits</Chip> : st === "not_assessable" ? <Chip tone="unknown">Not assessable</Chip> : <Chip tone="incomplete">Within entered checks · confirmation pending</Chip>; } },
        { key: "shortlisted", head: "Shortlisted", cell: (r) => ((r as Scope["candidates"][number]).shortlisted ? <Chip tone="success" icon="check">Shortlisted</Chip> : <span className="fn-muted">—</span>) },
        evidence,
      ];
    case "evidence":
      return [
        { key: "kind", head: "Kind", cell: (r) => <EvidenceChip strength={(r as Scope["evidence"][number]).kind} /> },
        { key: "reference", head: "Reference", cell: (r) => text((r as Scope["evidence"][number]).reference) },
        { key: "source", head: "Source revision · date", cell: (r) => { const e = r as Scope["evidence"][number]; return text([e.source_revision, e.captured_date].filter(Boolean).join(" · ")); } },
        { key: "attribution", head: "Attribution", cell: (r) => text((r as Scope["evidence"][number]).attribution) },
        { key: "applicability", head: "Applicability", cell: (r) => text((r as Scope["evidence"][number]).applicability) },
      ];
    case "actions":
      return [
        { key: "purpose", head: "Purpose", cell: (r) => human((r as Scope["actions"][number]).purpose) },
        { key: "owner", head: "Owner", cell: (r) => text((r as Scope["actions"][number]).owner, "Unassigned") },
        { key: "due", head: "Due", cell: (r) => text((r as Scope["actions"][number]).due_date ?? "", "Not agreed") },
        { key: "status", head: "State", cell: (r) => { const a = r as Scope["actions"][number]; return a.status === "recorded" ? <Chip tone="success">Recorded</Chip> : <Chip tone="incomplete">Open</Chip>; } },
        phase,
      ];
    default:
      return [];
  }
}

/** The panel subtitle the board gives each register. */
const subtitles: Partial<Record<Register, string>> = {
  areas: "Block area is physical area. A valve can serve several allocations; the same plants must not be counted twice.",
  crop_groups: "Flow per container comes from independent hubs; shared splitter outlets are not multiplied.",
  valves: "Demand follows the selected basis for each valve.",
  masters: "Upstream of the valves it serves; pressure is the basis to verify.",
  sources: "Reliable seasonal supply, storage and the scenario each source serves.",
  pipes: "Ideal volume ÷ flow estimate · confirm arrival in the field.",
  filters: "Process order, capacity and backwash concurrency.",
  water_samples: "Laboratory qualifiers and reporting units are retained.",
  recipes: "No universal crop defaults are applied.",
  stocks: "Stock dose is an agronomist or supplier input; it is never inferred from pH or EC alone.",
  channels: "Entered injection ranges are hypothetical inputs, not Priva product ratings.",
  controllers: "Configuration backups are referenced; this module does not connect to live Priva systems.",
  banks: "Each channel is one physical address; counts are mutually exclusive.",
  sensors: "Representative sampling and the input each sensor needs.",
  strategies: "Capabilities require evidence; a requirement is not a controller feature.",
  groups: "Register order sets the order in every scenario.",
  scenarios: "Scenarios share the farm registers; keep a snapshot to retain a different physical design.",
  candidates: "Only entered configuration limits feed the capacity engine.",
  evidence: "Photographs, analyses, curves, supplier confirmations and meeting notes.",
  actions: "Design, supply, install, connect, configure, test, train and maintain.",
};

export function ScopeRegister({
  ctx,
  register,
}: {
  ctx: ViewContext;
  register: Register;
}) {
  const { proposal: scope, canEdit } = ctx;
  const [search, setSearch] = useState(""),
    [phase, setPhase] = useState(""),
    [page, setPage] = useState(0),
    [area, setArea] = useState(""),
    [master, setMaster] = useState("");
  const rows = scope[register] as Row[],
    filtered = useMemo(
      () =>
        rows
          .filter(
            (row) =>
              row.label.toLowerCase().includes(search.toLowerCase()) &&
              (!phase || ("phase" in row && row.phase === phase)) &&
              (!master || ("master_id" in row && row.master_id === master)) &&
              (!area ||
                ("allocations" in row &&
                  (row as Scope["valves"][number]).allocations.some(
                    (allocation) =>
                      allocation.area_id === area ||
                      scope.crop_groups.some(
                        (crop) =>
                          crop.id === allocation.crop_group_id &&
                          crop.area_id === area,
                      ),
                  ))),
          )
          .toSorted(
            (a, b) =>
              a.label.localeCompare(b.label) || a.id.localeCompare(b.id),
          ),
      [rows, search, phase, master, area, scope.crop_groups],
    );
  const columns = columnsFor(register, ctx);
  const [plural, singular] = registerNames[register];
  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const id = `fn-register-${register}`;
  return (
    <Panel
      id={`${id}-title`}
      title={plural}
      count={rows.length}
      subtitle={subtitles[register]}
      flush
      className="fn-register-panel"
      actions={
        <>
          {register !== "evidence" && (
            <div className="fn-register-filters">
              <label className="fn-filter">
                <span>Phase filter</span>
                <select
                  value={phase}
                  onChange={(e) => {
                    setPhase(e.target.value);
                    setPage(0);
                  }}
                >
                  <option value="">All phases</option>
                  {[
                    "unknown",
                    "existing",
                    "proposed",
                    "future",
                    "excluded",
                  ].map((p) => (
                    <option key={p} value={p}>
                      {human(p)}
                    </option>
                  ))}
                </select>
              </label>
              {register === "valves" && (
                <>
                  <label className="fn-filter">
                    <span>Area filter</span>
                    <select
                      value={area}
                      onChange={(e) => {
                        setArea(e.target.value);
                        setPage(0);
                      }}
                    >
                      <option value="">All areas</option>
                      {scope.areas.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="fn-filter">
                    <span>Master filter</span>
                    <select
                      value={master}
                      onChange={(e) => {
                        setMaster(e.target.value);
                        setPage(0);
                      }}
                    >
                      <option value="">All masters</option>
                      {scope.masters.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </div>
          )}
          <Find
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(0);
            }}
            label={`Search ${plural.toLowerCase()}`}
          />
          {canEdit && (
            <Button
              variant="secondary"
              icon="plus"
              onClick={() => ctx.edit(register)}
            >
              + Add {singular}
            </Button>
          )}
        </>
      }
      foot={
        filtered.length > PAGE || page > 0 ? (
          <div className="fn-paging">
            <span>
              {page * PAGE + 1}–{Math.min((page + 1) * PAGE, filtered.length)}{" "}
              of {filtered.length}
            </span>
            <span className="fn-paging-actions">
              {page > 0 && (
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                >
                  Previous {PAGE}
                </Button>
              )}
              {(page + 1) * PAGE < filtered.length && (
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                >
                  Next {PAGE}
                </Button>
              )}
            </span>
          </div>
        ) : (
          <span>
            {rows.length} in this {canEdit ? "working scope" : "saved revision"}{" "}
            · {filtered.length} matching
          </span>
        )
      }
    >
      {filtered.length === 0 ? (
        <Empty
          icon={rows.length ? "search" : "plus"}
          title={
            rows.length
              ? "No matching records"
              : `No ${plural.toLowerCase()} yet`
          }
          action={
            rows.length ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setPhase("");
                  setMaster("");
                  setArea("");
                  setPage(0);
                }}
              >
                Clear filters
              </Button>
            ) : (
              canEdit && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon="plus"
                  onClick={() => ctx.edit(register)}
                >
                  Add {singular}
                </Button>
              )
            )
          }
        >
          {rows.length
            ? "Change the filters; all working records are retained."
            : "Add the known identity and source. Missing optional technical details can remain unknown."}
        </Empty>
      ) : (
        <>
          {register === "valves" && (
            <div className="fn-valve-list" aria-label="Irrigation valves">
              {(shown as Scope["valves"]).map((valve) => {
                const allocations = valve.allocations
                  .map(
                    (a) => [
                      scope.crop_groups.find((c) => c.id === a.crop_group_id)
                        ?.label ??
                      scope.areas.find((x) => x.id === a.area_id)?.label ??
                      "Unassigned",
                      known(a.container_count) ? `${fmt(a.container_count, 0)} containers` : null,
                    ].filter(Boolean).join(" · "),
                  )
                  .join(", ");
                return (
                  <article className="fn-valve-row" key={valve.id}>
                    <button
                      type="button"
                      className="fn-row-title"
                      aria-label={valve.label}
                      onClick={() => ctx.edit("valves", valve)}
                    >
                      {valve.label}
                    </button>
                    <strong className="fn-valve-flow"><ResultValue result={ctx.calculation?.valve_flows.find(v => v.id === valve.id)?.flow} /></strong>
                    <WorklistMenu
                      label={`Actions for ${valve.label}`}
                      icon="more"
                    >
                      <button
                        data-menu-close
                        type="button"
                        onClick={() => ctx.edit("valves", valve)}
                      >
                        {canEdit ? "Edit" : "View"}
                      </button>
                      {canEdit && (
                        <button
                          data-menu-close
                          type="button"
                          onClick={() => ctx.remove("valves", valve.id)}
                        >
                          Remove
                        </button>
                      )}
                    </WorklistMenu>
                    <p>
                      {scope.masters.find((m) => m.id === valve.master_id)
                        ?.label ?? "Master unassigned"}{" "}<PhaseChip phase={valve.phase} />
                    </p>
                    <p>{allocations || "No allocation"}</p>
                    <p>{human(valve.flow_basis)} <EvidenceChip strength={strongest(scope, valve)} /></p>
                  </article>
                );
              })}
            </div>
          )}
          <RegisterTable
            variant="panel"
            caption={`${plural}: the row label opens the record; Edit, View and Remove act on one record.`}
          >
            <thead>
              <tr>
                <th scope="col">
                  <span className="ppo-register-label">Label / reference</span>
                </th>
                {columns.map((c) => (
                  <th scope="col" key={c.key} className={c.className}>
                    <span className="ppo-register-label">{c.head}</span>
                  </th>
                ))}
                <th scope="col" className="fn-col-actions">
                  <span className="ppo-register-label">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.id}>
                  <td className="ppo-register-wrap fn-col-label">
                    <button
                      type="button"
                      className="fn-row-title"
                      onClick={() => ctx.edit(register, row)}
                    >
                      {row.label || <Token>Unlabelled record</Token>}
                    </button>
                    {register === "areas" && (
                      <small>
                        {
                          (row as Scope["areas"][number]).context
                            .crop_description
                        }
                      </small>
                    )}
                  </td>
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`ppo-register-wrap${c.className ? ` ${c.className}` : ""}`}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                  <td className="fn-col-actions">
                    <WorklistMenu
                      label={`Actions for ${row.label}`}
                      icon="more"
                    >
                      <button
                        data-menu-close
                        type="button"
                        onClick={() => ctx.edit(register, row)}
                      >
                        {canEdit ? "Edit" : "View"}
                      </button>
                      {canEdit && (
                        <button
                          data-menu-close
                          type="button"
                          onClick={() => ctx.remove(register, row.id)}
                        >
                          Remove
                        </button>
                      )}
                    </WorklistMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </RegisterTable>
        </>
      )}
    </Panel>
  );
}

/** The register tabs of a view and the chosen register's panel. */
export function RegisterTabs({
  ctx,
  view,
}: {
  ctx: ViewContext;
  view: FertigationView;
}) {
  const registers = viewRegisters[view] ?? [];
  if (!registers.length) return null;
  const selected = registers.includes(ctx.section) ? ctx.section : registers[0];
  return (
    <div className="fn-registers">
      {registers.length > 1 && (
        <RecordTabs
          id="fertigation-register"
          label={`${view} registers`}
          tabs={registers.map((id) => ({
            id,
            label: (
              <>
                {registerNames[id][0]}
                {id === selected && (
                  <span className="fn-tab-count" aria-hidden="true">
                    {scopeCount(ctx, id)}
                  </span>
                )}
              </>
            ),
          }))}
          value={selected}
          onChange={(value) => ctx.setSection(value as Register)}
        />
      )}
      <div
        role={registers.length > 1 ? "tabpanel" : undefined}
        id={`fertigation-register-panel-${selected}`}
        aria-labelledby={
          registers.length > 1
            ? `fertigation-register-tab-${selected}`
            : undefined
        }
      >
        <ScopeRegister key={selected} ctx={ctx} register={selected} />
      </div>
    </div>
  );
}

function scopeCount(ctx: ViewContext, register: Register) {
  return ctx.proposal[register].length;
}
