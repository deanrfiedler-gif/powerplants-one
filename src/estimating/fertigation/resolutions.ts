import { findingCode, type ResponsibleRole } from "./guidance";
import type { Calculation, Finding, Group, Scope } from "./types";

/**
 * Resolution register for contradictions (proposed feature F2).
 *
 * Each option restates the engine's own pass condition for the failing check,
 * so nothing new is calculated. Where a draft edit is unambiguous and
 * reversible, the option carries a transform; the workbench previews its
 * consequences through the server preview endpoint and applies it to the
 * working draft only. Nothing is saved without a revision and reason.
 */

export interface ResolutionOption {
  id: string;
  title: string;
  role: ResponsibleRole;
  /** The condition under which the engine's check passes, in words. */
  condition: string;
  detail: string;
  /** Present only when the edit is unambiguous; returns a new proposal. */
  transform?: (scope: Scope) => Scope;
}

export interface Resolvable {
  key: string;
  title: string;
  message: string;
  options: ResolutionOption[];
}

const known = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);
const fmt = (v: number) =>
  v.toLocaleString("en-AU", {
    minimumFractionDigits: Number.isInteger(v) ? 0 : 1,
    maximumFractionDigits: 2,
  });
const uuid = () => globalThis.crypto.randomUUID();

/** Split one group into one group per distinct valve, in the same place in
 * every scenario sequence and strategy target list. Durations, recipe,
 * phase and limits are copied unchanged. */
export function splitGroup(scope: Scope, groupId: string): Scope {
  const next = structuredClone(scope);
  const group = next.groups.find((g) => g.id === groupId);
  if (!group) return next;
  const valves = [...new Set(group.valve_ids)];
  if (valves.length < 2) return next;
  const parts: Group[] = valves.map((valveId, i) => {
    const valve = next.valves.find((v) => v.id === valveId);
    return {
      ...structuredClone(group),
      id: i === 0 ? group.id : uuid(),
      label: `${group.label.split(" · ")[0]}${String.fromCharCode(97 + i)} · ${valve?.label ?? "valve"}`,
      valve_ids: [valveId],
    };
  });
  const ids = parts.map((p) => p.id);
  next.groups = next.groups.flatMap((g) => (g.id === groupId ? parts : [g]));
  for (const s of next.scenarios)
    s.group_ids = s.group_ids.flatMap((id) => (id === groupId ? ids : [id]));
  for (const s of next.strategies)
    s.group_ids = s.group_ids.flatMap((id) => (id === groupId ? ids : [id]));
  return next;
}

function bankResolution(
  scope: Scope,
  calc: Calculation,
  f: Finding,
): Resolvable | null {
  const bank = scope.banks.find((b) => b.id === f.record_id);
  const io = calc.io.find((b) => b.bank_id === f.record_id);
  if (!bank) return null;
  const devices = [
    ...scope.valves.map((v) => ({ label: v.label, control: v.control })),
    ...scope.masters.map((v) => ({ label: v.label, control: v.control })),
    ...scope.sensors.map((v) => ({ label: v.label, control: v.control })),
  ].filter(
    (d) =>
      d.control.owner === "ppo_controller" && d.control.bank_id === bank.id,
  );
  const derived = devices.reduce(
    (n, d) =>
      n +
      (known(d.control.additional_channels)
        ? d.control.additional_channels
        : 0),
    0,
  );
  const code = findingCode(f);
  if (code === "io_reconcile")
    return {
      key: f.id,
      title: `${bank.label}: declared demand differs from the recorded devices`,
      message: f.message,
      options: [
        {
          id: "use-devices",
          title: `Use the recorded devices: ${derived} additional ${derived === 1 ? "channel" : "channels"}`,
          role: "priva_specialist",
          condition:
            "The check passes when the declared demand equals the channels the assigned devices add.",
          detail: `${devices.length} devices are assigned to this bank (${devices.map((d) => d.label).join(", ") || "none"}); together they add ${derived}. The declared demand is ${bank.manual_required ?? "not recorded"}.`,
          transform: (s) => {
            const next = structuredClone(s);
            const b = next.banks.find((x) => x.id === bank.id);
            if (b) b.manual_required = derived;
            return next;
          },
        },
        {
          id: "record-devices",
          title: `Keep ${bank.manual_required} declared and record the missing devices`,
          role: "priva_specialist",
          condition:
            "The check passes when every device that needs a channel on this bank is recorded against it.",
          detail:
            "Add or assign the valves, masters or sensors the declared demand was counting. The workbench does not invent devices.",
        },
      ],
    };
  if (
    code === "io_deficit" &&
    io &&
    known(io.required.value) &&
    known(io.available.value)
  )
    return {
      key: f.id,
      title: `${bank.label}: not enough free channels`,
      message: f.message,
      options: [
        {
          id: "expand",
          title: `Provide ${io.required.value - io.available.value} more free ${bank.signal.replaceAll("_", " ")} channels`,
          role: "priva_specialist",
          condition: `The check passes when free channels (${io.available.value}) cover the additional demand (${io.required.value}).`,
          detail:
            "Record an added module or a released channel with its evidence. Existing use and software licences stay separate.",
        },
        {
          id: "reduce",
          title: "Move a device to another bank or controller",
          role: "priva_specialist",
          condition:
            "The check passes when the devices assigned here need no more channels than are free.",
          detail:
            "Reassign the device's control record; the other bank is then checked in the same way.",
        },
      ],
    };
  return null;
}

function candidateResolutions(scope: Scope, calc: Calculation): Resolvable[] {
  const out: Resolvable[] = [];
  for (const c of calc.candidates.filter((x) => x.failures.length)) {
    const candidate = scope.candidates.find((x) => x.id === c.id);
    if (!candidate) continue;
    for (const ch of scope.channels.filter((x) => x.candidate_id === c.id)) {
      for (const need of calc.injection.filter(
        (i) => i.stock_id === ch.stock_id,
      )) {
        const lph = need.required_lph.value;
        if (!known(lph) || !known(ch.maximum_lph) || lph <= ch.maximum_lph)
          continue;
        const group = scope.groups.find((g) => g.id === need.group_id);
        const stock = scope.stocks.find((s) => s.id === ch.stock_id);
        const flow = calc.group_flows.find((g) => g.id === need.group_id)?.unit
          .value;
        if (!group || !stock || !known(flow)) continue;
        const valves = [...new Set(group.valve_ids)];
        const options: ResolutionOption[] = [];
        if (valves.length > 1)
          options.push({
            id: "split",
            title: `Split ${group.label} into ${valves.length} groups`,
            role: "irrigation_designer",
            condition: `The check passes when each group's flow × ${fmt(stock.dose_l_m3!)} L/m³ is no more than ${fmt(ch.maximum_lph)} L/h.`,
            detail:
              "Each valve runs as its own group with the same recipe and durations, in the same place in the sequence and strategy.",
            transform: (s) => splitGroup(s, group.id),
          });
        options.push(
          {
            id: "dose",
            title: "Use a stronger stock solution",
            role: "agronomist",
            condition: `The check passes when the dose is no more than ${fmt(ch.maximum_lph)} ÷ ${fmt(flow)} = ${fmt(ch.maximum_lph / flow)} L/m³.`,
            detail:
              "Only the agronomist can change the stock concentration and dose. The workbench does not propose one.",
          },
          {
            id: "channel",
            title: `Specify a channel rated for at least ${fmt(lph)} L/h`,
            role: "priva_specialist",
            condition: `The check passes when the channel's entered maximum is at least ${fmt(lph)} L/h.`,
            detail:
              "Bind rating evidence under the recorded suction and pressure conditions; an entered range is not a manufacturer rating.",
          },
        );
        out.push({
          key: `injection:${c.id}:${ch.id}:${group.id}`,
          title: `${ch.label}: ${group.label} needs ${fmt(lph)} L/h; the entered maximum is ${fmt(ch.maximum_lph)} L/h`,
          message: `Required injection = ${fmt(flow)} m³/h × ${fmt(stock.dose_l_m3!)} L/m³ on ${candidate.label}.`,
          options,
        });
      }
    }
  }
  return out;
}

const simple: Record<
  string,
  (scope: Scope, calc: Calculation, f: Finding) => Resolvable | null
> = {
  filter_capacity: (scope, _calc, f) => {
    const filter = scope.filters.find((x) => x.id === f.record_id);
    if (!filter) return null;
    return {
      key: f.id,
      title: `${filter.label}: duty exceeds the entered capacity`,
      message: f.message,
      options: [
        {
          id: "capacity",
          title: "Confirm a larger filter or a parallel filter",
          role: "irrigation_designer",
          condition: `The check passes when the entered capacity (${filter.capacity_m3h ?? "not recorded"} m³/h) is at least the duty on its path.`,
          detail:
            "Record the filter's rated capacity with evidence; backwash concurrency is assessed separately.",
        },
        {
          id: "path",
          title: "Confirm the filter's actual hydraulic path",
          role: "irrigation_designer",
          condition:
            "The duty is taken from the recorded path: pump, dosing unit or crop.",
          detail:
            "A filter on the crop path sees only the largest group's crop flow.",
        },
      ],
    };
  },
  window_overflow: (_s, _c, f) => ({
    key: f.id,
    title: "The operating sequence runs past its daily window",
    message: f.message,
    options: [
      {
        id: "window",
        title: "Extend the window, or reduce cycles or spacing",
        role: "grower",
        condition:
          "The check passes when the last group finishes before the window ends.",
        detail: "Every cycle's full prepare, deliver and flush time counts.",
      },
    ],
  }),
  cycle_overlap: (_s, _c, f) => ({
    key: f.id,
    title: "Starts are closer together than one full cycle",
    message: f.message,
    options: [
      {
        id: "spacing",
        title: "Set start spacing to at least one full cycle",
        role: "grower",
        condition:
          "The check passes when start-to-start spacing is at least the sequential cycle length.",
        detail:
          "The provisional sequence already uses the earliest feasible spacing; the recorded value should match it.",
      },
    ],
  }),
  storage_reserve: (_s, _c, f) => ({
    key: f.id,
    title: "Stored water falls below the entered reserve",
    message: f.message,
    options: [
      {
        id: "supply",
        title: "Raise refill, starting storage or usable capacity",
        role: "irrigation_designer",
        condition:
          "The check passes when the simplified balance stays at or above the reserve all day.",
        detail: "Refill cannot exceed the source's entered reliable supply.",
      },
    ],
  }),
  storage_shortage: (_s, _c, f) => ({
    key: f.id,
    title: "The simplified storage balance runs out",
    message: f.message,
    options: [
      {
        id: "supply",
        title: "Raise refill or starting storage",
        role: "irrigation_designer",
        condition: "The check passes when the balance never falls below zero.",
        detail: "Refill cannot exceed the source's entered reliable supply.",
      },
    ],
  }),
  duplicate_valve: (scope, _c, f) => {
    const group = scope.groups.find((g) => g.id === f.record_id);
    if (!group) return null;
    return {
      key: f.id,
      title: `${group.label}: a valve is listed twice`,
      message: f.message,
      options: [
        {
          id: "dedupe",
          title: "Keep each valve once",
          role: "irrigation_designer",
          condition:
            "The check passes when every physical valve appears once in the group.",
          detail:
            "The engine already counts the flow once; this makes the record match.",
          transform: (s) => {
            const next = structuredClone(s);
            const g = next.groups.find((x) => x.id === group.id);
            if (g) g.valve_ids = [...new Set(g.valve_ids)];
            return next;
          },
        },
      ],
    };
  },
};

/** Every contradiction on the calculation that has registered options. */
export function resolvables(scope: Scope, calc: Calculation): Resolvable[] {
  const out: Resolvable[] = [];
  for (const f of calc.findings.filter((x) => x.severity === "conflict")) {
    const code = findingCode(f);
    const r =
      code === "io_reconcile" || code === "io_deficit"
        ? bankResolution(scope, calc, f)
        : (simple[code]?.(scope, calc, f) ?? null);
    if (r) out.push(r);
  }
  return [...out, ...candidateResolutions(scope, calc)];
}
