import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { AppError, unavailable } from "../../platform/errors";
import { scopedOwner } from "../../shared/authority";
import { supplyRecord } from "../../supply/context";
import { factsFor, materialBasis } from "../../supply/reads";
import {
  currentFacts,
  decimal,
  quantity,
  receiptArithmetic,
  type Fact,
} from "../../supply/model";
import type { factCommand } from "../../supply/validation";
import { conversionAuthority } from "../conversion/context";
import { dispositionHash } from "../disposition/context";
import {
  followupEvidenceAuthority,
  followupConflict,
  type Checked,
} from "./authority";
import type { FollowupBasis, FollowupEvent } from "./model";

export type ReceiptCommand = ReturnType<typeof factCommand> & {
  record_id: string;
};
export type ReceiptEvent = {
  id: string;
  workspace_id: string;
  revision_id: string;
  target_id: string;
  execution_id: string;
  sequence: number;
  action: "ReceiptPropose" | "ReceiptReceive";
  referral_id: string;
  receiving_id: string;
  proposal_id: string;
  predecessor_id: string | null;
  demand_id: string | null;
  owner_id: string;
  decision: "Proposed" | "Accepted" | "Returned" | "Held";
  basis: FollowupBasis;
  basis_hash: string;
  dependencies: ReceiptDependencies;
  dependency_hash: string;
  proposal_hash: string;
  command: ReceiptCommand;
  reason: string;
  evidence: string;
  created_by: string;
  created_at: Date;
  operation_id: string;
};
export async function receiptAvailable(c: QueryClient) {
  return !!(
    await c.query(
      "SELECT to_regclass('ppo.quote_supply_receipt_events') present",
    )
  ).rows[0].present;
}
// Supplement the existing, stable #344/#345 basis only for this new command family.
// Pre-authorise other sources before materialBasis can summarise shared readiness.
export async function receiptDependencies(
  c: QueryClient,
  p: Principal,
  basis: FollowupBasis,
  supplyId: string,
) {
  const group = basis.position.find((g) => g.supply.id === supplyId);
  if (!group)
    followupConflict(
      "Select a Supply record allocated to the exact converted Demand.",
    );
  const exact = async (id: string) =>
    (
      await c.query<{ record: typeof group.supply }>(
        "SELECT (to_jsonb(s)||jsonb_build_object('quantity',s.quantity::text)) record FROM ppo.supply_records s WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, id],
      )
    ).rows[0].record;
  const allocations = (
    await c.query<{ record: (typeof group.allocations)[number] }>(
      "SELECT (to_jsonb(a)||jsonb_build_object('quantity',a.quantity::text)) record FROM ppo.supply_allocations a WHERE workspace_id=$1 AND supply_id=$2 ORDER BY id",
      [p.workspace_id, supplyId],
    )
  ).rows.map((x) => x.record);
  const demands = [];
  for (const d of group.demands) {
    const sources = [];
    for (const a of (
      await c.query<{ supply_id: string }>(
        "SELECT DISTINCT supply_id FROM ppo.supply_allocations WHERE workspace_id=$1 AND demand_id=$2 ORDER BY supply_id",
        [p.workspace_id, d.record.id],
      )
    ).rows) {
      const record = await supplyRecord(c, p, a.supply_id);
      sources.push({
        record,
        facts: currentFacts(await factsFor(c, p, record)),
      });
    }
    demands.push({
      ...d,
      record: await exact(d.record.id),
      sources,
      material: await materialBasis(c, p, d.record, d.facts),
    });
  }
  return {
    group: { ...group, supply: await exact(supplyId), allocations, demands },
  };
}
export type ReceiptDependencies = Awaited<
  ReturnType<typeof receiptDependencies>
>;
export async function receiptEvidenceAuthority(
  c: QueryClient,
  p: Principal,
  e: Pick<ReceiptEvent, "revision_id" | "target_id" | "basis" | "dependencies">,
  checked: Checked = {
    revisions: new Set(),
    records: new Set(),
    credits: new Set(),
  },
) {
  await followupEvidenceAuthority(c, p, e, checked);
  for (const d of e.dependencies.group.demands)
    for (const s of d.sources) {
      if (!checked.records.has(s.record.id)) {
        await supplyRecord(c, p, s.record.id);
        checked.records.add(s.record.id);
      }
    }
}
export async function receiptHistory(
  c: QueryClient,
  p: Principal,
  target: string,
  checked: Checked = {
    revisions: new Set(),
    records: new Set(),
    credits: new Set(),
  },
) {
  if (!(await receiptAvailable(c))) return [];
  const events = (
    await c.query<ReceiptEvent>(
      "SELECT * FROM ppo.quote_supply_receipt_events WHERE workspace_id=$1 AND target_id=$2 ORDER BY sequence",
      [p.workspace_id, target],
    )
  ).rows;
  for (const e of events) await receiptEvidenceAuthority(c, p, e, checked);
  return events;
}
export function receiptHolds(facts: Fact[]) {
  return facts.some(
    (f) => f.kind === "ExternalOutcome" && f.data.state === "Unknown",
  )
    ? [
        "Unknown external outcome on this Supply requires original-operation reconciliation before the native Receipt command.",
      ]
    : [];
}
export function receiptEffects(deps: ReceiptDependencies, cmd: ReceiptCommand) {
  const g = deps.group;
  try {
    receiptArithmetic(cmd.data);
  } catch (e) {
    followupConflict((e as Error).message);
  }
  if (
    cmd.data.identity_status !== "Verified" &&
    decimal(cmd.data.usable!) !== 0n
  )
    followupConflict(
      "Unresolved item identity cannot provide usable receipt evidence.",
    );
  const others = g.facts.filter(
    (f) => f.kind === "Receipt" && f.id !== cmd.predecessor_id,
  );
  const received = others.reduce(
    (n, f) => n + decimal(f.data.received!),
    decimal(cmd.data.received!),
  );
  if (received > decimal(g.supply.quantity))
    followupConflict(
      "Corrected current Receipt totals exceed the stated Supply line quantity.",
    );
  const usable =
    g.supply.completeness !== "Complete"
      ? null
      : g.supply.data.supply_kind === "Stock"
        ? g.usable
        : quantity(
            others
              .filter((f) => f.completeness === "Complete")
              .reduce(
                (n, f) => n + decimal(f.data.usable!),
                cmd.completeness === "Complete"
                  ? decimal(cmd.data.usable!)
                  : 0n,
              ),
          );
  const shortfall =
    usable === null
      ? null
      : quantity(
          decimal(g.usable_allocated) > decimal(usable)
            ? decimal(g.usable_allocated) - decimal(usable)
            : 0n,
        );
  return {
    usable,
    allocated: g.usable_allocated,
    shortfall,
    capacity_basis:
      g.supply.data.supply_kind === "Stock"
        ? "Separate Stock observation unchanged"
        : "Complete current Receipt evidence",
    incomplete:
      cmd.completeness !== "Complete" ||
      others.some((f) => f.completeness !== "Complete"),
    affected_demands: g.demands.map((d) => ({
      id: d.record.id,
      owner_id: d.record.owner_id,
      version: d.record.version,
      resulting_version: d.record.version + 1,
    })),
    effect:
      "Version Supply and each allocated Demand; append Receipt successor and owned Requested Impacts. Preserve quantities, classes, allocations, children and downstream records.",
  };
}
export async function effectOwner(
  c: QueryClient,
  p: Principal,
  proposal: Pick<
    ReceiptEvent,
    "revision_id" | "target_id" | "basis" | "dependencies"
  >,
  demandId: string,
  checked?: Checked,
) {
  const demand = proposal.dependencies.group.demands.find(
    (d) => d.record.id === demandId,
  )?.record;
  if (!demand)
    followupConflict(
      "This demand is not an affected record of the exact proposal.",
    );
  const current = await supplyRecord(c, p, demandId);
  const owner = await scopedOwner(
    c,
    p,
    current.owner_id,
    current.company_id,
    current.site_id ?? undefined,
    "supply.coordinate",
  );
  await receiptEvidenceAuthority(
    c,
    owner,
    proposal,
    owner.actor_id === p.actor_id ? checked : undefined,
  );
  return owner;
}
export function currentEvidenceChecked(basis: FollowupBasis): Checked {
  // The caller just authorised this exact current basis through targetBasis and
  // allocationPosition. Cache only within this read; historical removed links
  // and other actors still require independent current authority.
  return {
    revisions: new Set([
      basis.conversion.original_evidence.receiving.revision_id,
    ]),
    records: new Set([
      basis.conversion.target.id,
      ...basis.position.flatMap((g) => [
        g.supply.id,
        ...g.demands.flatMap((d) => [
          d.record.id,
          ...d.children.map((x) => x.record.id),
        ]),
      ]),
    ]),
    credits: new Set(),
  } satisfies Checked;
}
export async function receiptState(
  c: QueryClient,
  p: Principal,
  basis: FollowupBasis,
  referral: FollowupEvent | null,
  receiving: FollowupEvent | null,
  checked: Checked = currentEvidenceChecked(basis),
) {
  const events = await receiptHistory(
    c,
    p,
    basis.conversion.target.id,
    checked,
  );
  const proposal =
    events
      .filter(
        (e) => e.action === "ReceiptPropose" && e.referral_id === referral?.id,
      )
      .at(-1) ?? null;
  const dependencies = proposal
    ? await receiptDependencies(c, p, basis, proposal.command.record_id)
    : null;
  const holds: string[] = [];
  if (proposal) {
    if (
      proposal.basis_hash !== dispositionHash(basis) ||
      proposal.dependency_hash !== dispositionHash(dependencies)
    )
      holds.push(
        "Quotation, Receipt, Supply, allocation or affected-demand evidence changed. Record a successor proposal and fresh affected-demand decisions.",
      );
    if (
      receiving?.decision !== "Accepted" ||
      receiving.id !== proposal.receiving_id
    )
      holds.push(
        "The referral acceptance changed. Accept the current referral and propose again.",
      );
    if (
      !basis.position.some((g) =>
        g.facts.some((f) => f.id === proposal.command.predecessor_id),
      )
    )
      holds.push(
        "The original Receipt has a successor; review the current fact through a new proposal.",
      );
  }
  const required = [];
  for (const d of proposal?.dependencies.group.demands ?? []) {
    const decision =
      events
        .filter(
          (e) =>
            e.action === "ReceiptReceive" &&
            e.proposal_id === proposal!.id &&
            e.demand_id === d.record.id,
        )
        .at(-1) ?? null;
    const localHolds: string[] = [];
    if (decision?.decision !== "Accepted")
      localHolds.push(
        `Affected Demand ${d.record.reference} requires its owner's explicit acceptance; ${decision?.decision ?? "not received"}.`,
      );
    let canReceive = false;
    try {
      const owner = await effectOwner(c, p, proposal!, d.record.id, checked);
      canReceive = owner.actor_id === p.actor_id;
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      localHolds.push(
        "The affected owner's current evidence or coordination authority is unavailable.",
      );
    }
    if (
      decision &&
      (decision.basis_hash !== dispositionHash(basis) ||
        decision.dependency_hash !== dispositionHash(dependencies) ||
        decision.created_by !==
          dependencies?.group.demands.find((x) => x.record.id === d.record.id)
            ?.record.owner_id)
    )
      localHolds.push(
        "Affected-demand receiving is stale; its owner must decide on a current proposal.",
      );
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
    holds,
    required,
    effects: proposal
      ? receiptEffects(proposal.dependencies, proposal.command)
      : null,
    sequence: events.at(-1)?.sequence ?? 0,
    candidates: basis.position.flatMap((g) =>
      g.facts
        .filter((f) => f.kind === "Receipt")
        .map((fact) => ({
          supply: g.supply,
          fact,
          holds: receiptHolds(g.facts),
        })),
    ),
  };
}
export function acceptedReceipt(
  state: Awaited<ReturnType<typeof receiptState>>,
  id: string,
) {
  if (!state.proposal || state.proposal.id !== id)
    followupConflict("Review the latest exact Receipt correction proposal.");
  const holds = [...state.holds, ...state.required.flatMap((x) => x.holds)];
  if (holds.length) followupConflict(holds.join(" "));
  return {
    proposal: state.proposal,
    receiving_ids: state.required.map((x) => x.decision!.id),
  };
}
export async function receiptCommandAuthority(
  c: QueryClient,
  p: Principal,
  proposal: ReceiptEvent,
  checked?: Checked,
) {
  await supplyRecord(c, p, proposal.command.record_id, "supply.inspect");
  for (const d of proposal.dependencies.group.demands)
    await supplyRecord(c, p, d.record.id, "supply.coordinate");
  await receiptEvidenceAuthority(c, p, proposal, checked);
}
export async function receiptOriginalAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  const e = (
    await c.query<ReceiptEvent>(
      "SELECT * FROM ppo.quote_supply_receipt_events WHERE workspace_id=$1 AND revision_id=$2 AND created_by=$3 AND operation_id=$4",
      [p.workspace_id, id, p.actor_id, operation],
    )
  ).rows[0];
  if (!e) throw unavailable();
  await conversionAuthority(c, p, id, e.action === "ReceiptPropose");
  await receiptEvidenceAuthority(c, p, e);
  if (e.action === "ReceiptPropose") await receiptCommandAuthority(c, p, e);
  else await supplyRecord(c, p, e.demand_id!, "supply.coordinate");
}
