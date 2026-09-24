import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import type { QueryClient } from "../platform/permissions";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  invalid,
  choice,
  dateOnly,
} from "../shared/validation";
import {
  agreementCurrentness,
  occurrenceDates,
  planFields,
  scopeIncludes,
  text,
  type PlanContent,
} from "./model";
import {
  calendarDates,
  agreementRevision,
  assetSnapshot,
  bump,
  contextAuthority,
  event,
  expected,
  hash,
  insert,
  meta,
  owner,
  record,
  reference,
  sourceAccess,
  conflict,
  type Plan,
  type PlanRevision,
  type Occurrence,
} from "./context";

export async function planRevision(c: QueryClient, p: Principal, id: string) {
  const rev = (
    await c.query<PlanRevision>(
      "SELECT * FROM ppo.maintenance_plan_revisions WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, id],
    )
  ).rows[0];
  if (!rev) conflict("The source plan revision is unavailable.");
  await record(c, p, "plans", rev.plan_id);
  await agreementRevision(c, p, rev.agreement_revision_id);
  return calendarDates(rev);
}
async function planBasis(
  c: QueryClient,
  p: Principal,
  row: Pick<Plan, "asset_id" | "company_id" | "site_id" | "customer_id">,
  x: PlanContent,
  review = false,
) {
  await sourceAccess(
    c,
    p,
    row.company_id,
    row.site_id,
    x.interval_source.access_class,
  );
  const asset = await assetSnapshot(c, p, row.asset_id),
    agreement = await agreementRevision(c, p, x.agreement_revision_id);
  if (
    asset.site_id !== row.site_id ||
    agreement.row.company_id !== row.company_id ||
    agreement.row.customer_id !== row.customer_id
  )
    invalid(
      "asset_id",
      "Keep the plan in the exact customer/company/site context.",
    );
  if (
    review &&
    (asset.lifecycle_status !== "Active" ||
      asset.identity_status !== "Verified")
  )
    conflict(
      "Review requires verified active equipment. Removed or replaced equipment does not transfer maintenance.",
    );
  if (
    review &&
    (agreement.row.current_revision_id !== x.agreement_revision_id ||
      agreement.row.state !== "Active" ||
      agreement.revision.content.source.availability !== "Available" ||
      x.interval_source.availability !== "Available" ||
      !scopeIncludes(
        agreement.revision.content,
        row.site_id!,
        row.asset_id,
        asset.facility_id,
      ))
  )
    conflict(
      "Review the exact available agreement, interval source and included asset/area before generation.",
    );
  return { asset, agreement };
}
async function saveRevision(
  c: QueryClient,
  p: Principal,
  row: Plan,
  id: string,
  x: PlanContent,
  reason: string,
  predecessor: string | null,
) {
  await insert(c, "maintenance_plan_revisions", {
    id,
    workspace_id: p.workspace_id,
    company_id: row.company_id,
    plan_id: row.id,
    revision: row.revision,
    predecessor_id: predecessor,
    agreement_revision_id: x.agreement_revision_id,
    effective_from: x.effective_from,
    content: x,
    content_hash: hash(x),
    created_by: p.actor_id,
    reason,
  });
  for (const [i, t] of x.tasks.entries())
    await insert(c, "maintenance_plan_tasks", {
      workspace_id: p.workspace_id,
      revision_id: id,
      id: t.id,
      sequence: i + 1,
      description: t.description,
      expected_outcome: t.expected_outcome,
      completion_requirements: t.completion_requirements,
      kind: t.kind,
    });
}
export async function createPlan(p: Principal, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "id",
    "company_id",
    "site_id",
    "customer_id",
    "owner_id",
    "asset_id",
    "content",
  ]);
  const cmd = {
    ...common(r),
    id: uuid(r.id, "id"),
    company_id: uuid(r.company_id, "company_id"),
    site_id: uuid(r.site_id, "site_id"),
    customer_id: uuid(r.customer_id, "customer_id"),
    owner_id: uuid(r.owner_id, "owner_id"),
    asset_id: uuid(r.asset_id, "asset_id"),
    content: planFields(r.content),
  };
  return sharedOperation(
    p,
    cmd,
    "Maintenance:CreatePlan",
    async (c) => {
      await contextAuthority(
        c,
        p,
        cmd.company_id,
        cmd.site_id,
        cmd.customer_id,
        "maintenance.manage",
      );
      await owner(c, p, cmd, cmd.owner_id, "maintenance.manage");
      return planBasis(c, p, cmd, cmd.content);
    },
    async (c, basis) => {
      const revision = randomUUID();
      const row = await insert<Plan>(c, "maintenance_plans", {
        ...meta(p),
        id: cmd.id,
        company_id: cmd.company_id,
        site_id: cmd.site_id,
        customer_id: cmd.customer_id,
        owner_id: cmd.owner_id,
        asset_id: cmd.asset_id,
        asset_version: basis.asset.version,
        reference: reference("MPL", cmd.id),
        current_revision_id: revision,
      });
      await saveRevision(c, p, row, revision, cmd.content, cmd.reason, null);
      await event(c, p, row, "Created", { revision_id: revision }, cmd.reason);
      return row;
    },
    "MaintenancePlan",
    "MaintenanceChanged",
  );
}
export async function planCommand(p: Principal, id: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "action",
    "content",
    "from",
    "until",
  ]);
  const action = choice(r.action, "action", [
    "Revise",
    "Review",
    "Hold",
    "Generate",
  ] as const);
  const cmd = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    action,
    content: action === "Revise" ? planFields(r.content) : null,
    from: action === "Generate" ? dateOnly(r.from, "from") : null,
    until: action === "Generate" ? dateOnly(r.until, "until") : null,
  };
  return sharedOperation(
    p,
    cmd,
    `Maintenance:Plan:${action}`,
    (c) =>
      record<Plan>(
        c,
        p,
        "plans",
        id,
        action === "Review" ? "maintenance.assess" : "maintenance.manage",
      ),
    async (c, row) => {
      expected(row.version, cmd.expected_version);
      const current = await planRevision(c, p, row.current_revision_id);
      if (action === "Revise") {
        const x = cmd.content!;
        await planBasis(c, p, row, x);
        if (
          x.anchor !== current.content.anchor ||
          x.timezone !== current.content.timezone
        )
          invalid(
            "anchor",
            "Retain the original anchor and timezone within one plan. A new identity needs a separately reviewed overlap disposition.",
          );
        if (x.effective_from <= current.effective_from)
          invalid(
            "effective_from",
            "A successor takes effect after the prior revision and never rewrites generated instances.",
          );
        const revision = randomUUID(),
          next = { ...row, revision: row.revision + 1 };
        await saveRevision(
          c,
          p,
          next,
          revision,
          x,
          cmd.reason,
          row.current_revision_id,
        );
        return bump(
          c,
          p,
          "plans",
          row,
          "Revised",
          { revision_id: revision, predecessor_id: row.current_revision_id },
          cmd.reason,
          {
            revision: next.revision,
            current_revision_id: revision,
            state: "Draft",
          },
        );
      }
      if (action === "Hold")
        return bump(
          c,
          p,
          "plans",
          row,
          "Held",
          { revision_id: row.current_revision_id },
          cmd.reason,
          { state: "Held" },
        );
      const basis = await planBasis(c, p, row, current.content, true);
      if (action === "Review")
        return bump(
          c,
          p,
          "plans",
          row,
          "Reviewed",
          {
            revision_id: row.current_revision_id,
            asset_version: basis.asset.version,
          },
          cmd.reason,
          { state: "Reviewed", asset_version: basis.asset.version },
        );
      if (row.state !== "Reviewed" || row.asset_version !== basis.asset.version)
        conflict(
          "Review the exact plan and changed Equipment context before generation.",
        );
      const revisions = (
        await c.query<PlanRevision>(
          "SELECT * FROM ppo.maintenance_plan_revisions WHERE workspace_id=$1 AND plan_id=$2 ORDER BY revision",
          [p.workspace_id, id],
        )
      ).rows;
      const reviewed = new Set(
        (
          await c.query<{ id: string }>(
            "SELECT content->>'revision_id' AS id FROM ppo.maintenance_events WHERE workspace_id=$1 AND record_id=$2 AND action='Reviewed'",
            [p.workspace_id, id],
          )
        ).rows.map((x) => x.id),
      );
      const created: string[] = [],
        retained: string[] = [];
      for (const [i, rev] of revisions.entries()) {
        if (!reviewed.has(rev.id)) continue;
        calendarDates(rev);
        const next = revisions[i + 1]
          ? calendarDates(revisions[i + 1])
          : undefined;
        for (const due of occurrenceDates(rev.content, cmd.from!, cmd.until!)) {
          if (next && due >= next.effective_from) continue;
          const exists = (
            await c.query<{ id: string }>(
              "SELECT id FROM ppo.maintenance_occurrences WHERE workspace_id=$1 AND plan_id=$2 AND original_due=$3",
              [p.workspace_id, id, due],
            )
          ).rows[0];
          if (exists) {
            retained.push(exists.id);
            continue;
          }
          const agreement = await agreementRevision(
            c,
            p,
            rev.agreement_revision_id,
          );
          if (
            agreement.row.current_revision_id !== rev.agreement_revision_id ||
            agreementCurrentness(
              agreement.row.state,
              agreement.revision.content,
              due,
            ) !== "Current"
          )
            conflict(
              "An ungenerated date needs current agreement terms. Prepare and review a reconciled plan successor.",
            );
          const oid = randomUUID();
          const occurrence = await insert<Occurrence>(
            c,
            "maintenance_occurrences",
            {
              ...meta(p),
              id: oid,
              company_id: row.company_id,
              site_id: row.site_id,
              customer_id: row.customer_id,
              owner_id: row.owner_id,
              reference: reference("MOC", oid),
              plan_id: id,
              plan_revision_id: rev.id,
              asset_id: row.asset_id,
              original_due: due,
              target_date: due,
              timezone: rev.content.timezone,
              asset_snapshot: basis.asset,
            },
          );
          await event(
            c,
            p,
            occurrence,
            "Generated",
            { plan_revision_id: rev.id, original_due: due },
            cmd.reason,
          );
          created.push(oid);
        }
      }
      return bump(
        c,
        p,
        "plans",
        row,
        "Generated",
        { from: cmd.from, until: cmd.until, created, retained },
        cmd.reason,
      );
    },
    "MaintenancePlan",
    "MaintenanceChanged",
  );
}
export async function occurrenceCommand(
  p: Principal,
  id: string,
  input: unknown,
) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "action",
    "target_date",
    "source_reference",
    "owner_id",
  ]);
  const action = choice(r.action, "action", [
    "Defer",
    "Skip",
    "Cancel",
  ] as const);
  const cmd = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    action,
    target_date:
      action === "Defer" ? dateOnly(r.target_date, "target_date") : null,
    source_reference: text(r.source_reference, "source_reference"),
    owner_id: uuid(r.owner_id, "owner_id"),
  };
  return sharedOperation(
    p,
    cmd,
    `Maintenance:Occurrence:${action}`,
    async (c) => {
      const row = await record<Occurrence>(
        c,
        p,
        "due",
        id,
        "maintenance.manage",
      );
      await owner(c, p, row, cmd.owner_id, "maintenance.manage");
      return row;
    },
    async (c, row) => {
      expected(row.version, cmd.expected_version);
      if (
        !["Open", "Deferred"].includes(row.state) ||
        (
          await c.query(
            "SELECT 1 FROM ppo.maintenance_work_requests WHERE workspace_id=$1 AND occurrence_id=$2",
            [p.workspace_id, id],
          )
        ).rowCount
      )
        conflict(
          "Requested or completed work needs an explicit Service receiving disposition; this occurrence cannot be skipped, cancelled or retargeted here.",
        );
      if (action === "Defer" && cmd.target_date! <= row.target_date)
        invalid(
          "target_date",
          "Record a later target; the original due date remains unchanged.",
        );
      return bump(
        c,
        p,
        "due",
        row,
        action,
        {
          source_reference: cmd.source_reference,
          original_due: row.original_due,
          prior_target: row.target_date,
          target_date: cmd.target_date,
          owner_id: cmd.owner_id,
        },
        cmd.reason,
        {
          state:
            action === "Defer"
              ? "Deferred"
              : action === "Skip"
                ? "Skipped"
                : "Cancelled",
          owner_id: cmd.owner_id,
          ...(cmd.target_date ? { target_date: cmd.target_date } : {}),
        },
      );
    },
    "MaintenanceOccurrence",
    "MaintenanceChanged",
  );
}
