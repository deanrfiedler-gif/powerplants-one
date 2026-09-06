import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import {
  hasPermission,
  requireCapability,
  type Capability,
  type QueryClient,
} from "../platform/permissions";
import { unavailable, AppError } from "../platform/errors";
import { visibleAppointment } from "../scheduling/planner";
import { fieldContext } from "../field/context";
import { visible } from "../shared/reads";
import { uuid } from "../shared/validation";
import { insert } from "../documents/packs";
import {
  authoriseActivityInput,
  insertActivity,
  type ActivityInput,
} from "../activities/activities";
import type { PoolClient } from "pg";
export const fail = (code: string, message: string): never => {
  throw new AppError(409, code, message);
};
export async function reportContext(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: Capability = "report.read",
) {
  await requireCapability(c, p, cap);
  const report = (
    await c.query(
      "SELECT * FROM ppo.service_reports WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "report_id")],
    )
  ).rows[0];
  if (!report) throw unavailable();
  const ctx = await visibleAppointment(c, p, report.appointment_id, cap);
  if (
    !(await hasPermission(
      c,
      p,
      "report.read",
      report.company_id,
      report.site_id,
    ))
  )
    throw unavailable();
  const service = await hasPermission(
    c,
    p,
    "service.work_order.edit",
    report.company_id,
    report.site_id,
  );
  if (!service) await fieldContext(c, p, report.appointment_id);
  if (
    ["report.review", "report.issue"].includes(cap) &&
    ctx.w.service_owner_id !== p.actor_id
  )
    throw unavailable();
  return { ...ctx, report };
}
export async function ownReport(c: QueryClient, p: Principal, id: string) {
  const ctx = await reportContext(c, p, id);
  if (ctx.report.actor_id !== p.actor_id) throw unavailable();
  await fieldContext(c, p, ctx.a.id, "field.completion.own");
  return ctx;
}
export async function bump(
  c: QueryClient,
  p: Principal,
  id: string,
  fields: Record<string, unknown>,
) {
  const e = Object.entries(fields);
  return (
    await c.query(
      `UPDATE ppo.service_reports SET version=version+1,updated_by=$3,updated_at=clock_timestamp()${e.map((x, i) => `,${x[0]}=$${i + 4}`).join("")} WHERE workspace_id=$1 AND id=$2 RETURNING *,status AS state`,
      [p.workspace_id, id, p.actor_id, ...e.map((x) => x[1])],
    )
  ).rows[0];
}
export async function followUp(
  c: PoolClient,
  p: Principal,
  ctx: Awaited<ReturnType<typeof reportContext>>,
  kind: string,
  summary: string,
) {
  const input: ActivityInput = {
    id: randomUUID(),
    company_id: ctx.a.company_id,
    site_id: ctx.a.site_id,
    kind: kind === "Review" ? "TechnicalFollowUp" : "CustomerContact",
    owner_id: ctx.w.service_owner_id,
    summary: `${ctx.report.display_number} · ${summary}`.slice(0, 2000),
    due_at: null,
    due_needed: true,
    access_class: "RestrictedService",
    links: [{ object_type: "Site", object_id: ctx.a.site_id }],
  };
  await authoriseActivityInput(c, p, input);
  await insertActivity(c, p, input);
  await insert(c, "report_follow_ups", {
    workspace_id: p.workspace_id,
    report_id: ctx.report.id,
    activity_id: input.id,
    kind,
  });
  return input.id;
}
export async function sourceGuard(
  c: QueryClient,
  p: Principal,
  ctx: Awaited<ReturnType<typeof reportContext>>,
) {
  const { a, w, report } = ctx,
    site = await visible(c, p, "Site", a.site_id),
    customer = await visible(c, p, "Organisation", w.customer_id);
  const pack = (
    await c.query(
      "SELECT id,version,current_issue_id,status,needs_review FROM ppo.packs WHERE workspace_id=$1 AND appointment_id=$2",
      [p.workspace_id, a.id],
    )
  ).rows[0];
  const entries = (
    await c.query(
      "SELECT id,version FROM ppo.field_entries e WHERE workspace_id=$1 AND attendance_id=$2 AND NOT EXISTS(SELECT 1 FROM ppo.field_entries n WHERE n.workspace_id=e.workspace_id AND n.supersedes_entry_id=e.id) ORDER BY id",
      [p.workspace_id, report.attendance_id],
    )
  ).rows;
  return {
    scope_revision_id: w.scope_revision_id,
    authorised_scope_revision_id: w.authorised_scope_revision_id,
    site_version: site.version,
    customer_version: customer.version,
    primary_contact_id: site.primary_contact_id,
    assignment_version: a.assignment_version,
    schedule_version: a.schedule_version,
    pack,
    entries,
  };
}
export async function recipient(
  c: QueryClient,
  p: Principal,
  ctx: Awaited<ReturnType<typeof reportContext>>,
  id: string,
) {
  const site = await visible(c, p, "Site", ctx.a.site_id),
    person = await visible(c, p, "Person", id);
  if (
    !person.active ||
    site.primary_contact_id !== id ||
    !(
      await c.query(
        "SELECT 1 FROM ppo.person_company_contexts WHERE workspace_id=$1 AND company_id=$2 AND person_id=$3",
        [p.workspace_id, ctx.a.company_id, id],
      )
    ).rowCount
  )
    throw unavailable();
  return { id, name: person.display_name, version: person.version };
}
