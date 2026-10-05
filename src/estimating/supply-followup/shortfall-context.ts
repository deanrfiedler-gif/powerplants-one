import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { AppError, unavailable } from "../../platform/errors";
import { supplyRecord } from "../../supply/context";
import { decimal, quantity } from "../../supply/model";
import {
  allocationChanges,
  reductionHolds,
  pickedMinimum,
  type AllocationEffectCommand,
} from "../../supply/reductions";
import { conversionAuthority } from "../conversion/context";
import { dispositionHash } from "../disposition/context";
import {
  followupEvidenceAuthority,
  followupConflict,
  type Checked,
} from "./authority";
import type { FollowupBasis, FollowupEvent } from "./model";
import {
  receiptDependencies,
  currentEvidenceChecked,
  receiptEvidenceAuthority,
  effectOwner,
  type ReceiptEvent,
  type ReceiptDependencies,
} from "./receipt-context";

export type ShortfallDependencies = ReceiptDependencies & {
  correction: FollowupEvent;
  demand_allocations: {
    id: string;
    demand_id: string;
    supply_id: string;
    quantity: string;
    basis: string;
    version: number;
  }[];
};
export type ShortfallEvent = Omit<
  ReceiptEvent,
  "action" | "command" | "dependencies"
> & {
  action: "ShortfallPropose" | "ShortfallReceive";
  command: AllocationEffectCommand;
  dependencies: ShortfallDependencies;
};
export async function shortfallAvailable(c: QueryClient) {
  return !!(
    await c.query(
      "SELECT to_regclass('ppo.quote_supply_shortfall_events') present",
    )
  ).rows[0].present;
}
export async function shortfallEvidenceAuthority(
  c: QueryClient,
  p: Principal,
  e: ShortfallEvent,
  checked: Checked = {
    revisions: new Set(),
    records: new Set(),
    credits: new Set(),
  },
) {
  await receiptEvidenceAuthority(c, p, e, checked);
  for (const supply of new Set(
    e.dependencies.demand_allocations.map((a) => a.supply_id),
  )) {
    if (!checked.records.has(supply)) {
      await supplyRecord(c, p, supply, "supply.read");
      checked.records.add(supply);
    }
  }
  await followupEvidenceAuthority(c, p, e.dependencies.correction, checked);
}
export async function shortfallHistory(
  c: QueryClient,
  p: Principal,
  target: string,
  checked?: Checked,
) {
  if (!(await shortfallAvailable(c))) return [];
  const rows = (
    await c.query<ShortfallEvent>(
      "SELECT * FROM ppo.quote_supply_shortfall_events WHERE workspace_id=$1 AND target_id=$2 ORDER BY sequence",
      [p.workspace_id, target],
    )
  ).rows;
  const cache = checked ?? {
    revisions: new Set<string>(),
    records: new Set<string>(),
    credits: new Set<string>(),
  };
  for (const row of rows) await shortfallEvidenceAuthority(c, p, row, cache);
  return rows;
}
export async function shortfallDependencies(
  c: QueryClient,
  p: Principal,
  basis: FollowupBasis,
  correction: FollowupEvent,
) {
  if (!correction.command || !("record_id" in correction.command))
    throw unavailable();
  const deps = await receiptDependencies(
    c,
    p,
    basis,
    correction.command.record_id,
  );
  const demand_allocations = (
    await c.query<ShortfallDependencies["demand_allocations"][number]>(
      "SELECT id,demand_id,supply_id,quantity::text, basis,version FROM ppo.supply_allocations WHERE workspace_id=$1 AND demand_id=ANY($2::uuid[]) ORDER BY id",
      [p.workspace_id, deps.group.demands.map((d) => d.record.id)],
    )
  ).rows;
  for (const supply of new Set(demand_allocations.map((a) => a.supply_id)))
    await supplyRecord(c, p, supply, "supply.read");
  return { ...deps, correction, demand_allocations };
}
export function shortfallCandidates(
  basis: FollowupBasis,
  events: FollowupEvent[],
) {
  return events
    .filter(
      (e) =>
        e.action === "Apply" &&
        e.decision === "CorrectReceipt" &&
        e.native_receipt &&
        e.command &&
        "record_id" in e.command,
    )
    .flatMap((correction) => {
      const cmd = correction.command!;
      if (!("record_id" in cmd)) return [];
      const group = basis.position.find((g) => g.supply.id === cmd.record_id);
      if (
        !group ||
        group.supply.data.supply_kind !== "Shipment" ||
        group.usable === null ||
        decimal(group.usable_allocated) <= decimal(group.usable) ||
        !group.facts.some((f) => f.id === cmd.id)
      )
        return [];
      return [
        {
          correction,
          group,
          shortfall: quantity(
            decimal(group.usable_allocated) - decimal(group.usable),
          ),
        },
      ];
    });
}
export function shortfallEffects(
  deps: ShortfallDependencies,
  cmd: AllocationEffectCommand,
) {
  const g = deps.group,
    changes = allocationChanges(cmd);
  const holds: string[] = [];
  if (
    g.supply.data.supply_kind !== "Shipment" ||
    g.usable === null ||
    decimal(g.usable_allocated) <= decimal(g.usable)
  )
    holds.push(
      "A current evidenced Shipment shortfall from the applied Receipt correction is required.",
    );
  if (
    g.facts.some(
      (f) => f.kind === "ExternalOutcome" && f.data.state === "Unknown",
    )
  )
    holds.push(
      "Reconcile the original unknown Supply outcome before allocation reduction.",
    );
  const proposed = g.allocations.map((a) => {
    const change = changes.find((x) => x.id === a.id);
    return {
      ...a,
      before: a.quantity,
      after: change?.quantity ?? a.quantity,
      changed: !!change,
    };
  });
  for (const change of changes) {
    const a = g.allocations.find((a) => a.id === change.id),
      d = g.demands.find((d) => d.record.id === change.demand_id);
    if (
      !a ||
      !d ||
      a.basis !== "Usable" ||
      a.supply_id !== cmd.supply_id ||
      a.demand_id !== change.demand_id ||
      a.version !== change.expected_version ||
      d.record.version !== change.demand_version ||
      g.supply.version !== change.supply_version ||
      a.unit !== change.unit ||
      change.basis !== a.basis ||
      decimal(change.quantity) >= decimal(a.quantity)
    ) {
      holds.push(
        "Reduce exact existing Usable allocations only; identity, company, item, unit and basis must remain unchanged.",
      );
      continue;
    }
    holds.push(...reductionHolds(d));
    const total = deps.demand_allocations
      .filter((x) => x.demand_id === d.record.id && x.basis === "Usable")
      .reduce(
        (n, x) =>
          n +
          decimal(changes.find((c) => c.id === x.id)?.quantity ?? x.quantity),
        0n,
      );
    if (total < decimal(pickedMinimum(d.facts)))
      holds.push(
        `${d.record.reference}: retain at least ${pickedMinimum(d.facts)} ${d.record.unit} for already picked goods; the owning fulfilment workflow must resolve any lower position.`,
      );
    if (total > decimal(d.record.quantity))
      holds.push(`${d.record.reference}: allocation exceeds Demand quantity.`);
  }
  const allocated = quantity(
    proposed
      .filter((a) => a.basis === "Usable")
      .reduce((n, a) => n + decimal(a.after), 0n),
  );
  if (g.usable === null || decimal(allocated) > decimal(g.usable))
    holds.push(
      "Proposed final allocations still exceed evidenced usable capacity. Continue the hold or obtain a complete permitted proposal.",
    );
  return {
    usable: g.usable,
    before_allocated: g.usable_allocated,
    allocated,
    allocations: proposed,
    holds,
    shortfall:
      g.usable === null
        ? null
        : quantity(
            decimal(allocated) > decimal(g.usable)
              ? decimal(allocated) - decimal(g.usable)
              : 0n,
          ),
    demands: g.demands.map((d) => {
      const total = deps.demand_allocations
        .filter((a) => a.demand_id === d.record.id && a.basis === "Usable")
        .reduce(
          (n, a) =>
            n +
            decimal(changes.find((c) => c.id === a.id)?.quantity ?? a.quantity),
          0n,
        );
      return {
        record: d.record,
        changed: changes.some((c) => c.demand_id === d.record.id),
        allocated: quantity(total),
        unmet: quantity(
          decimal(d.record.quantity) > total
            ? decimal(d.record.quantity) - total
            : 0n,
        ),
        picked: pickedMinimum(d.facts),
        facts: d.facts,
        children: d.children,
        readiness: d.material,
      };
    }),
    effect:
      "Version Supply once and each changed Demand once; append owned Requested Impacts. Preserve Demand content, Receipt evidence, allocation identities and unchanged Demands. Capacity validity does not resolve unmet Demand or operational holds.",
  };
}
export async function shortfallCommandAuthority(
  c: QueryClient,
  p: Principal,
  e: ShortfallEvent,
  checked?: Checked,
) {
  await supplyRecord(c, p, e.command.supply_id, "supply.coordinate");
  for (const change of allocationChanges(e.command))
    await supplyRecord(c, p, change.demand_id, "supply.coordinate");
  await shortfallEvidenceAuthority(c, p, e, checked);
}
export async function shortfallState(
  c: QueryClient,
  p: Principal,
  basis: FollowupBasis,
  referral: FollowupEvent | null,
  receiving: FollowupEvent | null,
  followups: FollowupEvent[],
  checked: Checked = currentEvidenceChecked(basis),
) {
  const events = await shortfallHistory(
    c,
    p,
    basis.conversion.target.id,
    checked,
  );
  const proposal =
    events
      .filter(
        (e) =>
          e.action === "ShortfallPropose" && e.referral_id === referral?.id,
      )
      .at(-1) ?? null;
  const candidates = shortfallCandidates(basis, followups);
  const dependencies = proposal
    ? await shortfallDependencies(c, p, basis, proposal.dependencies.correction)
    : null;
  const holds: string[] = [];
  if (proposal) {
    if (
      proposal.basis_hash !== dispositionHash(basis) ||
      proposal.dependency_hash !== dispositionHash(dependencies)
    )
      holds.push(
        "Quotation, Receipt, Supply, allocations, affected Demand or ownership changed. Propose again and independently receive the exact current position.",
      );
    if (
      receiving?.decision !== "Accepted" ||
      receiving.id !== proposal.receiving_id
    )
      holds.push(
        "The referral acceptance changed. Accept the current referral and propose again.",
      );
    if (
      !candidates.some(
        (x) => x.correction.id === proposal.dependencies.correction.id,
      )
    )
      holds.push(
        "The applied correction no longer identifies a current Shipment shortfall.",
      );
  }
  const required = [];
  for (const d of proposal?.dependencies.group.demands.filter((d) =>
    allocationChanges(proposal.command).some(
      (a) => a.demand_id === d.record.id,
    ),
  ) ?? []) {
    const decision =
      events
        .filter(
          (e) =>
            e.action === "ShortfallReceive" &&
            e.proposal_id === proposal!.id &&
            e.demand_id === d.record.id,
        )
        .at(-1) ?? null;
    const localHolds: string[] = [];
    if (decision?.decision !== "Accepted")
      localHolds.push(
        `${d.record.reference} requires its owner's separate allocation acceptance; ${decision?.decision ?? "not received"}. Receipt acceptance is not allocation consent.`,
      );
    let canReceive = false;
    try {
      const owner = await effectOwner(c, p, proposal!, d.record.id, checked);
      canReceive = owner.actor_id === p.actor_id;
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      localHolds.push(
        "The affected owner's current source/linked or coordination authority is unavailable.",
      );
    }
    if (
      decision &&
      (decision.created_by !==
        dependencies?.group.demands.find((x) => x.record.id === d.record.id)
          ?.record.owner_id ||
        decision.basis_hash !== dispositionHash(basis) ||
        decision.dependency_hash !== dispositionHash(dependencies))
    )
      localHolds.push("This independently received decision is stale.");
    required.push({
      demand: d.record,
      decision,
      holds: localHolds,
      can_receive: canReceive,
    });
  }
  return {
    events,
    proposal,
    dependencies,
    candidates,
    holds,
    required,
    sequence: events.at(-1)?.sequence ?? 0,
    effects: proposal
      ? shortfallEffects(proposal.dependencies, proposal.command)
      : null,
  };
}
export function acceptedShortfall(
  state: Awaited<ReturnType<typeof shortfallState>>,
  id: string,
) {
  if (!state.proposal || state.proposal.id !== id)
    followupConflict("Review the latest exact allocation proposal.");
  const holds = [
    ...state.holds,
    ...state.required.flatMap((x) => x.holds),
    ...(state.effects?.holds ?? []),
  ];
  if (holds.length) followupConflict(holds.join(" "));
  return {
    proposal: state.proposal,
    receiving_ids: state.required.map((x) => x.decision!.id),
  };
}
export async function shortfallOriginalAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  if (!(await shortfallAvailable(c))) throw unavailable();
  const e = (
    await c.query<ShortfallEvent>(
      "SELECT * FROM ppo.quote_supply_shortfall_events WHERE workspace_id=$1 AND revision_id=$2 AND created_by=$3 AND operation_id=$4",
      [p.workspace_id, id, p.actor_id, operation],
    )
  ).rows[0];
  if (!e) throw unavailable();
  await conversionAuthority(c, p, id, e.action === "ShortfallPropose");
  await shortfallEvidenceAuthority(c, p, e);
  if (e.action === "ShortfallPropose") await shortfallCommandAuthority(c, p, e);
  else await supplyRecord(c, p, e.demand_id!, "supply.coordinate");
}
