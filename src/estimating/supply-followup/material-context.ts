import type { Principal } from "../../platform/identity";
import {
  hasPermission,
  type QueryClient,
  type Capability,
} from "../../platform/permissions";
import { AppError, unavailable } from "../../platform/errors";
import { scopedOwner } from "../../shared/authority";
import { visibleActivity } from "../../activities/activities";
import { supplyRecord, financeAllowed } from "../../supply/context";
import { factsFor, materialBasis } from "../../supply/reads";
import { currentFacts, decimal, quantity, type Fact } from "../../supply/model";
import { allocationChanges } from "../../supply/reductions";
import { projectRow, tasksFor } from "../../projects/service";
import {
  forecastPosition,
  forecastHolds,
} from "../../projects/material-resolution";
import type { parseTask } from "../../projects/validation";
import type { factCommand } from "../../supply/validation";
import type { OperationReceipt } from "../../platform/operations";
import { conversionAuthority } from "../conversion/context";
import { dispositionHash } from "../disposition/context";
import {
  followupEvidenceAuthority,
  followupConflict,
  type Checked,
} from "./authority";
import { currentEvidenceChecked } from "./receipt-context";
import { materialRoles, type MaterialRole } from "./material-input";
import type { FollowupBasis, FollowupEvent } from "./model";

export const materialAvailable = async (c: QueryClient) =>
  !!(await c.query("SELECT to_regclass('ppo.quote_material_events') present"))
    .rows[0].present;
export type MaterialDependencies = Awaited<
  ReturnType<typeof materialDependencies>
>;
export type MaterialEvent = {
  id: string;
  workspace_id: string;
  revision_id: string;
  target_id: string;
  execution_id: string;
  sequence: number;
  action:
    "MaterialPropose" | "MaterialReceive" | "MaterialReview" | "MaterialApply";
  referral_id: string;
  receiving_id: string;
  proposal_id: string;
  predecessor_id: string | null;
  review_id: string | null;
  allocation_outcome_id: string;
  demand_id: string;
  impact_id: string;
  task_id: string;
  role: MaterialRole | null;
  decision:
    | "Proposed"
    | "Accepted"
    | "Returned"
    | "Held"
    | "WithdrawForecast"
    | "Retain"
    | "Hold";
  basis: FollowupBasis;
  basis_hash: string;
  dependencies: MaterialDependencies;
  dependency_hash: string;
  proposal_hash: string;
  review_hash: string | null;
  effect_receiving_ids: string[];
  project_command: ReturnType<typeof parseTask>;
  successor_command?: ReturnType<typeof parseTask> | null;
  impact_command: ReturnType<typeof factCommand> & { record_id: string };
  reason: string;
  evidence: string;
  created_by: string;
  created_at: Date;
  operation_id: string;
  native_receipts: OperationReceipt[];
  after: MaterialDependencies | null;
};
export function allocationMaterialCandidates(
  basis: FollowupBasis,
  events: FollowupEvent[],
) {
  return events
    .filter(
      (e) =>
        e.action === "Apply" &&
        e.decision === "ReduceAllocations" &&
        e.native_receipt &&
        e.command &&
        "supply_id" in e.command,
    )
    .flatMap((outcome) => {
      const cmd = outcome.command!;
      if (!("supply_id" in cmd)) return [];
      return allocationChanges(cmd).flatMap((change) => {
        const old = outcome.basis.position
          .find((g) => g.supply.id === cmd.supply_id)
          ?.demands.find((d) => d.record.id === change.demand_id);
        const now = basis.position
          .flatMap((g) => g.demands)
          .find((d) => d.record.id === change.demand_id);
        if (
          !old ||
          !now ||
          now.record.data.origin_kind !== "Project" ||
          !now.record.data.origin_id
        )
          return [];
        return old.facts
          .filter(
            (f) =>
              f.kind === "Impact" &&
              f.data.state === "Requested" &&
              f.activity_id &&
              now.facts.some((n) => n.id === f.id),
          )
          .map((impact) => ({ outcome, demand: now.record, impact }));
      });
    });
}
export async function materialDependencies(
  c: QueryClient,
  p: Principal,
  basis: FollowupBasis,
  outcome: FollowupEvent,
  demandId: string,
  impactId: string,
  taskId: string,
  nativeActor: string = p.actor_id,
  successorId?: string,
) {
  const demand = await supplyRecord(c, p, demandId);
  if (demand.data.origin_kind !== "Project" || !demand.data.origin_id)
    followupConflict(
      "This Demand has no existing native Project origin. Do not relabel it.",
    );
  const allFacts = await factsFor(c, p, demand),
    facts = currentFacts(allFacts);
  const impact = allFacts.find((f) => f.id === impactId && f.kind === "Impact");
  if (!impact?.activity_id) throw unavailable();
  const chain: Fact[] = [];
  let ancestor: Fact | undefined = impact;
  while (ancestor) {
    chain.push(ancestor);
    ancestor = allFacts.find((f) => f.id === ancestor!.predecessor_id);
  }
  const activity = await visibleActivity(c, p, impact.activity_id);
  const sources = [];
  for (const a of (
    await c.query<{ supply_id: string }>(
      "SELECT DISTINCT supply_id FROM ppo.supply_allocations WHERE workspace_id=$1 AND demand_id=$2 ORDER BY supply_id",
      [p.workspace_id, demandId],
    )
  ).rows) {
    const record = await supplyRecord(c, p, a.supply_id);
    sources.push({ record, facts: currentFacts(await factsFor(c, p, record)) });
  }
  const children = [];
  for (const row of (
    await c.query<{ id: string }>(
      "SELECT id FROM ppo.supply_records WHERE workspace_id=$1 AND parent_id=$2 ORDER BY id",
      [p.workspace_id, demandId],
    )
  ).rows)
    children.push(await supplyRecord(c, p, row.id));
  const material = await materialBasis(c, p, demand, facts);
  const allocated = decimal(material.usable);
  const unmet = quantity(
    decimal(demand.quantity) > allocated
      ? decimal(demand.quantity) - allocated
      : 0n,
  );
  const project = await forecastPosition(
    c,
    p,
    demand.data.origin_id,
    taskId,
    successorId,
  );
  // Bind effective authority without exposing another owner's grant rows.
  // Only duties and scopes used by this exact source/downstream graph enter it.
  const scopes = [
    demand,
    ...sources.map((s) => s.record),
    ...children,
    basis.conversion.target,
    ...basis.position.flatMap((g) => [
      g.supply,
      ...g.demands.map((d) => d.record),
    ]),
  ];
  const authorities = [];
  const readDuties: Capability[] = [
    "shared.read",
    "shared.internal.read",
    "supply.read",
    "project.read",
    "activity.read",
    "crm.opportunity.read",
    "estimating.read",
    "estimating.quote.read",
  ];
  if (project.engineering.length) readDuties.push("engineering.read");
  if (project.stages.length) readDuties.push("acceptance.scope");
  if (
    [
      ...facts,
      ...sources.flatMap((s) => s.facts),
      ...basis.position.flatMap((g) => [
        ...g.facts,
        ...g.demands.flatMap((d) => d.facts),
      ]),
    ].some((f) => f.kind === "Credit")
  )
    readDuties.push("finance.read", "shared.finance.read");
  for (const [role, owner, duties] of [
    ["Demand", demand.owner_id, ["supply.coordinate"]],
    ["Project", project.project.coordinator_id, ["project.edit"]],
    ["Task", project.task.owner_id, []],
    ["MaterialAction", activity.owner_id, ["activity.edit"]],
    ...(project.successor
      ? [["Successor", project.successor.owner_id, []] as const]
      : []),
    ["NativeActor", nativeActor, ["supply.coordinate", "project.edit"]],
  ] as const) {
    const grants = (
      await c.query(
        `SELECT g.id,g.capability,g.scope_type,g.company_id,g.site_id,g.scope_id,g.valid_from,g.valid_to,u.active
       FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
       WHERE g.workspace_id=$1 AND g.user_id=$2 AND u.active AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
       AND g.capability=ANY($3::text[]) AND (g.scope_type='Workspace' OR EXISTS(
         SELECT 1 FROM jsonb_to_recordset($4::jsonb) s(company_id uuid,site_id uuid)
         WHERE s.company_id=g.company_id AND (g.scope_type='Company' OR s.site_id=g.site_id))) ORDER BY g.id`,
        [
          p.workspace_id,
          owner,
          [...readDuties, ...duties],
          JSON.stringify(
            scopes.map((s) => ({
              company_id: s.company_id,
              site_id: s.site_id,
            })),
          ),
        ],
      )
    ).rows;
    authorities.push({
      role,
      owner_id: owner,
      hash: dispositionHash(JSON.parse(JSON.stringify(grants))),
    });
  }
  // Every value is stable JSON evidence, including database dates. No read clock in hashes.
  return JSON.parse(
    JSON.stringify({
      allocation_outcome: outcome,
      demand,
      facts,
      impact,
      impact_chain: chain,
      activity: { ...activity, state: activity.status },
      sources,
      children,
      material,
      allocated: quantity(allocated),
      unmet,
      project,
      authorities,
    }),
  ) as {
    allocation_outcome: FollowupEvent;
    demand: typeof demand;
    facts: Fact[];
    impact: Fact;
    impact_chain: Fact[];
    activity: {
      id: string;
      version: number;
      owner_id: string;
      state: string;
      due_at: string | null;
      due_needed: boolean;
    };
    sources: typeof sources;
    children: typeof children;
    material: typeof material;
    allocated: string;
    unmet: string;
    project: Awaited<ReturnType<typeof forecastPosition>>;
    authorities: typeof authorities;
  };
}
export function materialHolds(d: MaterialDependencies) {
  const holds = forecastHolds(d.project);
  if (
    !d.facts.some((f) => f.id === d.impact.id && f.data.state === "Requested")
  )
    holds.push(
      "The selected exact Requested Impact has a successor; retain the original and review current owning-workflow evidence.",
    );
  if (
    d.demand.completeness !== "Complete" ||
    d.material.sources.some((s) => !s.valid)
  )
    holds.push("Complete current material-source evidence is required.");
  if (
    d.children.length ||
    d.facts.some((f) => !["Impact", "Assessment"].includes(f.kind))
  )
    holds.push(
      "Consequential Demand facts, external outcomes or custody/return children require their owning workflow.",
    );
  if (
    ["appointment_id", "engineering_id", "customer_commitment"].some(
      (k) => d.demand.data[k],
    )
  )
    holds.push(
      "Linked attendance, technical or customer commitments require separately authorised downstream follow-up.",
    );
  if (["Completed", "Cancelled"].includes(d.activity.state))
    holds.push(
      "The MaterialAction is no longer actionable. Its owner must explicitly restore owned follow-up; completion never clears the Impact.",
    );
  return holds;
}
export function materialEffects(d: MaterialDependencies) {
  const roles: MaterialRole[] = [
    ...materialRoles,
    ...(d.project.successor ? ["Successor" as const] : []),
  ];
  return roles.map((role) => ({
    role,
    record_id:
      role === "Demand"
        ? d.demand.id
        : role === "Project"
          ? d.project.project.id
          : role === "Task"
            ? d.project.task.id
            : role === "Successor"
              ? d.project.successor!.id
              : d.activity.id,
    owner_id:
      role === "Demand"
        ? d.demand.owner_id
        : role === "Project"
          ? d.project.project.coordinator_id
          : role === "Task"
            ? d.project.task.owner_id
            : role === "Successor"
              ? d.project.successor!.owner_id
              : d.activity.owner_id,
  }));
}
// The caller owns Checked for one actor's serialized read only. Do not retain
// authority on a pooled client, across a command, or across independent owners.
const checkedMaterial = new WeakMap<Checked, Map<string, Set<string>>>();
const receivingOwnerChecks = new WeakMap<Checked, Map<string, Checked>>();
export async function materialEvidenceAuthority(
  c: QueryClient,
  p: Principal,
  e: Pick<
    MaterialEvent,
    "revision_id" | "target_id" | "basis" | "dependencies" | "after"
  >,
  checked?: Checked,
) {
  const key = dispositionHash({
    revision_id: e.revision_id,
    target_id: e.target_id,
    basis: e.basis,
    dependencies: e.dependencies,
    after: e.after,
  });
  const actorKey = p.workspace_id + ":" + p.actor_id;
  const actors = checked
    ? (checkedMaterial.get(checked) ?? new Map<string, Set<string>>())
    : null;
  const seen = actors?.get(actorKey) ?? new Set<string>();
  if (seen.has(key)) return;
  await followupEvidenceAuthority(c, p, e, checked);
  for (const d of [e.dependencies, ...(e.after ? [e.after] : [])]) {
    await followupEvidenceAuthority(c, p, d.allocation_outcome, checked);
    await supplyRecord(c, p, d.demand.id);
    await projectRow(c, p, d.project.project.id);
    await visibleActivity(c, p, d.activity.id);
    for (const s of [...d.sources.map((s) => s.record), ...d.children])
      await supplyRecord(c, p, s.id);
    for (const snapshot of [
      { record: d.demand, facts: d.facts },
      ...d.sources,
    ]) {
      if (
        snapshot.facts.some((f) => f.kind === "Credit") &&
        !(await financeAllowed(
          c,
          p,
          await supplyRecord(c, p, snapshot.record.id),
        ))
      )
        throw unavailable();
    }
    // Reuse native protected dependency readers before historical snapshots/counts.
    await forecastPosition(
      c,
      p,
      d.project.project.id,
      d.project.task.id,
      d.project.successor?.id,
    );
    for (const row of d.project.engineering) {
      const { engineeringRow } = await import("../../engineering/service");
      await engineeringRow(c, p, row.id);
    }
    if (d.project.stages.length) {
      const { access } = await import("../../projects/acceptance/context");
      await access(c, p, d.project.project.id, "scope");
    }
  }
  if (checked && actors) {
    seen.add(key);
    actors.set(actorKey, seen);
    checkedMaterial.set(checked, actors);
  }
}
export async function materialHistory(
  c: QueryClient,
  p: Principal,
  target: string,
  checked?: Checked,
) {
  if (!(await materialAvailable(c))) return [];
  const events = (
    await c.query<MaterialEvent>(
      "SELECT * FROM ppo.quote_material_events WHERE workspace_id=$1 AND target_id=$2 ORDER BY sequence",
      [p.workspace_id, target],
    )
  ).rows;
  for (const e of events) await materialEvidenceAuthority(c, p, e, checked);
  return events;
}
// A worklist lifecycle label is not an applicability or readiness assessment.
export function materialFollowupStatus(
  events: MaterialEvent[],
  referral: FollowupEvent | null,
  receiving: FollowupEvent | null,
) {
  if (receiving?.decision !== "Accepted") return null;
  const proposal = events
    .filter(
      (e) => e.action === "MaterialPropose" && e.referral_id === referral?.id,
    )
    .at(-1);
  if (!proposal) return null;
  const applied = events.find(
    (e) => e.proposal_id === proposal.id && e.action === "MaterialApply",
  );
  if (applied?.decision === "WithdrawForecast")
    return "Forecast withdrawn; follow-up reviewed";
  if (applied?.decision === "Hold") return "Continuing material hold";
  if (applied) return "Material evidence retained; follow-up continues";
  return "Downstream material receiving and review";
}
export async function materialOwner(
  c: QueryClient,
  p: Principal,
  e: MaterialEvent,
  role: MaterialRole,
  checked?: Checked,
) {
  const effect = materialEffects(e.dependencies).find((x) => x.role === role)!;
  if (!effect?.owner_id) throw unavailable();
  const r = e.dependencies.demand;
  const cap =
    role === "Demand"
      ? "supply.coordinate"
      : role === "Project"
        ? "project.edit"
        : role === "Task" || role === "Successor"
          ? "project.read"
          : "activity.edit";
  const owner = await scopedOwner(
    c,
    p,
    effect.owner_id,
    r.company_id,
    r.site_id ?? undefined,
    cap,
  );
  let ownerChecked = owner.actor_id === p.actor_id ? checked : undefined;
  if (checked && owner.actor_id !== p.actor_id) {
    const owners =
      receivingOwnerChecks.get(checked) ?? new Map<string, Checked>();
    const key = owner.workspace_id + ":" + owner.actor_id;
    ownerChecked = owners.get(key) ?? {
      revisions: new Set(),
      records: new Set(),
      credits: new Set(),
    };
    owners.set(key, ownerChecked);
    receivingOwnerChecks.set(checked, owners);
  }
  await materialEvidenceAuthority(c, owner, e, ownerChecked);
  return owner;
}
export async function materialCommandAuthority(
  c: QueryClient,
  p: Principal,
  e: MaterialEvent,
  checked?: Checked,
) {
  await conversionAuthority(c, p, e.revision_id, true);
  await supplyRecord(c, p, e.demand_id, "supply.coordinate");
  await projectRow(c, p, e.dependencies.project.project.id, true);
  await materialEvidenceAuthority(c, p, e, checked);
}
export async function materialState(
  c: QueryClient,
  p: Principal,
  basis: FollowupBasis,
  referral: FollowupEvent | null,
  receiving: FollowupEvent | null,
  followups: FollowupEvent[],
  checked: Checked = currentEvidenceChecked(basis),
) {
  const events = await materialHistory(
    c,
    p,
    basis.conversion.target.id,
    checked,
  );
  const candidates = [];
  for (const candidate of allocationMaterialCandidates(basis, followups)) {
    const activity = await visibleActivity(c, p, candidate.impact.activity_id!);
    const project = await projectRow(c, p, candidate.demand.data.origin_id!);
    const tasks = (await tasksFor(c, p, project.id)).filter(
      (t) => t.owner_id && !t.owner_unavailable,
    );
    candidates.push({
      ...candidate,
      activity_id: activity.id,
      activity_owner_id: activity.owner_id,
      project,
      tasks,
    });
  }
  const proposal =
    events.filter((e) => e.action === "MaterialPropose").at(-1) ?? null;
  const current = events.filter((e) => e.proposal_id === proposal?.id);
  const review =
    current.filter((e) => e.action === "MaterialReview").at(-1) ?? null;
  const applied = current.find((e) => e.action === "MaterialApply") ?? null;
  const dependencies = proposal
    ? await materialDependencies(
        c,
        p,
        basis,
        proposal.dependencies.allocation_outcome,
        proposal.demand_id,
        proposal.impact_id,
        proposal.task_id,
        proposal.created_by,
        proposal.dependencies.project.successor?.id,
      )
    : null;
  const holds: string[] = [];
  if (proposal && !applied) {
    if (
      proposal.referral_id !== referral?.id ||
      proposal.receiving_id !== receiving?.id ||
      receiving?.decision !== "Accepted"
    )
      holds.push(
        "The current exact referral acceptance changed; propose again after receiving.",
      );
    if (
      proposal.basis_hash !== dispositionHash(basis) ||
      proposal.dependency_hash !== dispositionHash(dependencies)
    )
      holds.push(
        "Source, allocation, Impact, readiness, Project, ownership or dependencies changed. Propose again and receive each exact effect.",
      );
    if (
      !candidates.some(
        (x) =>
          x.outcome.id === proposal.allocation_outcome_id &&
          x.impact.id === proposal.impact_id &&
          x.demand.id === proposal.demand_id,
      )
    )
      holds.push(
        "The exact allocation outcome no longer has this current Requested Impact.",
      );
  }
  const required = [];
  for (const effect of proposal ? materialEffects(proposal.dependencies) : []) {
    const decision =
      current
        .filter((e) => e.action === "MaterialReceive" && e.role === effect.role)
        .at(-1) ?? null;
    const local: string[] = [];
    let can_receive = false;
    if (decision?.decision !== "Accepted")
      local.push(
        effect.role +
          " requires separate downstream acceptance; " +
          (decision?.decision ?? "not received") +
          ". Receipt/allocation acceptance is insufficient.",
      );
    try {
      const owner = await materialOwner(c, p, proposal!, effect.role, checked);
      can_receive = owner.actor_id === p.actor_id;
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      local.push(
        "Current independently receiving owner authority is unavailable.",
      );
    }
    if (
      decision &&
      (decision.basis_hash !== dispositionHash(basis) ||
        decision.dependency_hash !== dispositionHash(dependencies))
    )
      local.push("The received exact evidence is stale.");
    required.push({
      ...effect,
      decision,
      holds: applied ? [] : local,
      can_receive: !applied && can_receive,
    });
  }
  const review_holds = [...holds];
  if (review?.decision === "WithdrawForecast" && !applied)
    review_holds.push(
      ...required.flatMap((r) => r.holds),
      ...(dependencies ? materialHolds(dependencies) : []),
    );
  if (
    review &&
    dispositionHash(review.effect_receiving_ids) !==
      dispositionHash(
        required.filter((r) => r.decision).map((r) => r.decision!.id),
      )
  )
    review_holds.push(
      "Receiving was corrected after review. Freeze a new review.",
    );
  let can_write = false;
  if (proposal)
    try {
      await materialCommandAuthority(c, p, proposal, checked);
      can_write = p.actor_id === referral?.owner_id;
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
    }
  return {
    events,
    sequence: events.at(-1)?.sequence ?? 0,
    candidates,
    proposal,
    dependencies,
    review,
    applied,
    holds,
    required,
    review_holds,
    can_write,
    can_apply: !!review && !applied && !review_holds.length && can_write,
    native_holds: dependencies && !applied ? materialHolds(dependencies) : [],
  };
}
export async function materialOriginalAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  if (!(await materialAvailable(c))) throw unavailable();
  const e = (
    await c.query<MaterialEvent>(
      "SELECT * FROM ppo.quote_material_events WHERE workspace_id=$1 AND revision_id=$2 AND created_by=$3 AND operation_id=$4",
      [p.workspace_id, id, p.actor_id, operation],
    )
  ).rows[0];
  if (!e) throw unavailable();
  await conversionAuthority(c, p, id, e.action !== "MaterialReceive");
  await materialEvidenceAuthority(c, p, e);
  // Original disclosure follows current duties, not current assignment.
  if (e.action !== "MaterialReceive") await materialCommandAuthority(c, p, e);
  else {
    const role = e.role!,
      d = e.dependencies.demand;
    const cap =
      role === "Demand"
        ? "supply.coordinate"
        : role === "Project"
          ? "project.edit"
          : role === "Task" || role === "Successor"
            ? "project.read"
            : "activity.edit";
    if (!(await hasPermission(c, p, cap, d.company_id, d.site_id ?? undefined)))
      throw unavailable();
  }
}
export async function materialNativeAuthority(
  c: QueryClient,
  p: Principal,
  target: string,
  operation: string,
) {
  if (!(await materialAvailable(c))) return;
  const proposal = (
    await c.query<MaterialEvent>(
      "SELECT * FROM ppo.quote_material_events WHERE workspace_id=$1 AND action='MaterialPropose' AND (project_command->>'operation_id'=$2 OR to_jsonb(quote_material_events)->'successor_command'->>'operation_id'=$2 OR impact_command->>'operation_id'=$2)",
      [p.workspace_id, operation],
    )
  ).rows[0];
  if (!proposal) return;
  const applied = (
    await c.query<MaterialEvent>(
      "SELECT * FROM ppo.quote_material_events WHERE workspace_id=$1 AND proposal_id=$2 AND action='MaterialApply'",
      [p.workspace_id, proposal.id],
    )
  ).rows[0];
  const expected =
    proposal.project_command.operation_id === operation ||
    proposal.successor_command?.operation_id === operation
      ? proposal.project_command.project_id
      : proposal.demand_id;
  if (!applied || applied.created_by !== p.actor_id || target !== expected)
    followupConflict(
      "Reserved original material operation: recover and apply its exact reviewed proposal.",
    );
  await materialCommandAuthority(c, p, applied);
}
