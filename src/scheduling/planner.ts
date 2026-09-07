import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import {
  hasPermission,
  requireCapability,
  scopeSql,
  type Capability,
  type QueryClient,
} from "../platform/permissions";
import { sharedOperation } from "../platform/operations";
import {
  authoriseActivityInput,
  insertActivity,
  visibleActivity,
  type ActivityInput,
} from "../activities/activities";
import { visible, envelope } from "../shared/reads";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  narrative,
  choice,
  instant,
  optionalId,
} from "../shared/validation";
import {
  visibleWorkOrder,
  orderVisibility,
  scopeDetail,
  readiness,
  blockers,
  type WorkOrder,
} from "../service/work-orders";
import {
  bookingCommand,
  bookingFields,
  bookingKeys,
  crewFields,
  interval,
  sameVersion,
  timezone,
  SCHEDULING_POLICY_ID,
  type BookingInput,
  type CrewInput,
} from "./validation";
export type Appointment = {
  id: string;
  workspace_id: string;
  company_id: string;
  site_id: string;
  work_order_id: string;
  display_number: string;
  version: number;
  assignment_version: number;
  schedule_version: number;
  status:
    | "Proposed"
    | "Confirmed"
    | "InProgress"
    | "CompletedPendingReview"
    | "Completed"
    | "Cancelled";
  start_at: Date;
  end_at: Date;
  site_timezone: string;
  requested_window_start: Date | null;
  requested_window_end: Date | null;
  scope_revision_id: string;
  scope_version: number;
  policy_version_id: string;
  scheduling_policy_id: string | null;
  customer_commitment: string;
  preparation_status: string;
  dispatch_hold: boolean;
  pack_requirement: string;
  actual_start_at: Date | null;
  actual_end_at: Date | null;
  updated_at: Date;
};
export async function visibleAppointment(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: Capability = "schedule.read",
) {
  await requireCapability(c, p, cap);
  await requireCapability(c, p, "schedule.read");
  const a = (
    await c.query<Appointment>(
      "SELECT * FROM ppo.appointments WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "appointment_id")],
    )
  ).rows[0];
  if (
    !a ||
    !(await hasPermission(c, p, cap, a.company_id, a.site_id)) ||
    !(await hasPermission(c, p, "schedule.read", a.company_id, a.site_id))
  )
    throw unavailable();
  const w = await visibleWorkOrder(c, p, a.work_order_id);
  return { a, w };
}
export async function visibleResource(
  c: QueryClient,
  p: Principal,
  id: string,
  siteId?: string,
) {
  await requireCapability(c, p, "schedule.read");
  const r = (
    await c.query(
      `SELECT r.* FROM ppo.resources r WHERE r.workspace_id=$1 AND r.id=$3 AND EXISTS(SELECT 1 FROM ppo.resource_sites rs JOIN ppo.sites s ON (s.workspace_id,s.id)=(rs.workspace_id,rs.site_id) WHERE rs.workspace_id=r.workspace_id AND rs.resource_id=r.id AND ${scopeSql("s.company_id", "s.id", "schedule.read")} AND ${scopeSql("s.company_id", "s.id")} AND ($4::uuid IS NULL OR s.id=$4))`,
      [p.workspace_id, p.actor_id, uuid(id, "resource_id"), siteId ?? null],
    )
  ).rows[0];
  if (!r) throw unavailable();
  return r;
}
async function insert(
  c: QueryClient,
  table: string,
  data: Record<string, unknown>,
) {
  const e = Object.entries(data);
  return (
    await c.query(
      `INSERT INTO ppo.${table}(${e.map((x) => x[0]).join(",")}) VALUES(${e.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`,
      e.map((x) => x[1]),
    )
  ).rows[0];
}
const childMeta = (
  p: Principal,
  a: Appointment,
  id: string = randomUUID(),
) => ({
  id,
  workspace_id: p.workspace_id,
  company_id: a.company_id,
  site_id: a.site_id,
  appointment_id: a.id,
  created_by: p.actor_id,
  updated_by: p.actor_id,
});
async function lockCrew(
  c: QueryClient,
  p: Principal,
  a: Appointment,
  crew: CrewInput,
) {
  const old = (
    await c.query(
      "SELECT resource_id FROM ppo.assignments WHERE workspace_id=$1 AND appointment_id=$2 AND active",
      [p.workspace_id, a.id],
    )
  ).rows.map((x) => x.resource_id as string);
  const ids = [...new Set([...old, ...crew.map((x) => x.resource_id)])].sort();
  for (const id of ids)
    await c.query(
      "SELECT id FROM ppo.resources WHERE workspace_id=$1 AND id=$2 FOR UPDATE",
      [p.workspace_id, id],
    );
}
async function followUp(
  c: PoolClient,
  p: Principal,
  a: Appointment,
  w: WorkOrder,
  consequence: string,
) {
  const input: ActivityInput = {
    id: randomUUID(),
    company_id: a.company_id,
    site_id: a.site_id,
    kind: "CustomerContact",
    owner_id: w.service_owner_id,
    summary: `${a.display_number} · ${consequence === "ChangedSchedule" ? "Confirm changed visit dates and crew" : consequence === "Cancellation" ? "Review cancellation and record customer contact" : consequence === "ContactUnsuccessful" ? "Follow up unsuccessful customer contact" : "Review booking contact and preparation"} · Schedule v${a.schedule_version}`,
    due_at: null,
    due_needed: true,
    access_class: "RestrictedService",
    links: [{ object_type: "Site", object_id: a.site_id }],
  };
  await authoriseActivityInput(c, p, input);
  await insertActivity(c, p, input);
  await insert(c, "schedule_follow_ups", {
    workspace_id: p.workspace_id,
    appointment_id: a.id,
    activity_id: input.id,
    schedule_version: a.schedule_version,
    consequence,
  });
  return input.id;
}
async function bumpAppointment(
  c: QueryClient,
  p: Principal,
  a: Appointment,
  changes: Record<string, unknown>,
) {
  const e = Object.entries(changes);
  const row = (
    await c.query<Appointment>(
      `UPDATE ppo.appointments SET version=version+1,updated_by=$3,updated_at=clock_timestamp()${e.map(([k], i) => `,${k}=$${i + 4}`).join("")} WHERE workspace_id=$1 AND id=$2 RETURNING *`,
      [p.workspace_id, a.id, p.actor_id, ...e.map((x) => x[1])],
    )
  ).rows[0];
  return row;
}
async function schedulingPolicy(
  c: QueryClient,
  p: Principal,
  id = SCHEDULING_POLICY_ID,
  requireCurrent = true,
) {
  const r = (
    await c.query(
      "SELECT * FROM ppo.scheduling_policies WHERE workspace_id=$1 AND id=$2 AND status='Published' AND ($3::boolean=false OR (effective_from<=clock_timestamp() AND effective_to>clock_timestamp()))",
      [p.workspace_id, id, requireCurrent],
    )
  ).rows[0];
  if (!r)
    throw new AppError(
      422,
      "PolicyUnavailable",
      "The published synthetic scheduling policy is unavailable.",
    );
  return r;
}
function blocked(field: string, message: string, code = "BookingBlocked") {
  throw new AppError(code === "ResourceConflict" ? 409 : 422, code, message, [
    { field, message },
  ]);
}
async function guardBooking(
  c: PoolClient,
  p: Principal,
  a: Appointment,
  w: WorkOrder,
  cmd: BookingInput,
  move: boolean,
) {
  sameVersion(a.version, cmd.expected_version, "appointment");
  sameVersion(w.version, cmd.expected_work_order_version, "work order");
  sameVersion(a.assignment_version, cmd.expected_assignment_version, "crew");
  if (a.status !== (move ? "Confirmed" : "Proposed"))
    blocked(
      "status",
      "Only a current proposal can be confirmed, or a confirmed future booking moved.",
    );
  if (a.actual_start_at || a.actual_end_at)
    blocked(
      "actual_work",
      "Work has already been recorded. Submit attendance for review instead.",
      "ActualWorkRecorded",
    );
  const start = new Date(cmd.start_at),
    end = new Date(cmd.end_at);
  if (
    start.getTime() <= Date.now() ||
    (move && a.start_at.getTime() <= Date.now())
  )
    blocked(
      "start_at",
      "Only future, unstarted attendance can be booked or moved.",
    );
  if (
    w.status !== "Authorised" ||
    w.scope_revision_id !== w.authorised_scope_revision_id ||
    a.scope_revision_id !== w.authorised_scope_revision_id ||
    cmd.scope_revision_id !== a.scope_revision_id
  )
    blocked(
      "scope_revision_id",
      "Review the current authorised scope and unresolved successor. Create a new proposal against the authorised revision.",
      "ScopeReviewRequired",
    );
  const r = await scopeDetail(c, p, w, a.scope_revision_id);
  sameVersion(r.version, cmd.scope_version, "scope");
  sameVersion(r.version, a.scope_version, "proposed scope");
  if (
    !r.approved_at ||
    r.policy_version_id !== cmd.policy_version_id ||
    a.policy_version_id !== cmd.policy_version_id
  )
    blocked(
      "policy_version_id",
      "The exact proposed scope/readiness policy no longer matches.",
      "ScopeReviewRequired",
    );
  const pol = await schedulingPolicy(c, p, cmd.scheduling_policy_id);
  sameVersion(pol.version, cmd.scheduling_policy_version, "scheduling policy");
  if (a.scheduling_policy_id && a.scheduling_policy_id !== pol.id)
    blocked(
      "scheduling_policy_id",
      "Existing bookings retain their exact published policy.",
      "PolicyUnavailable",
    );
  if (
    start < pol.effective_from ||
    end > pol.effective_to ||
    (end.getTime() - start.getTime()) / 60000 > pol.max_visit_minutes
  )
    blocked(
      "end_at",
      "The visit must fit the explicit synthetic policy period and duration.",
    );
  const site = await visible(c, p, "Site", a.site_id);
  if (site.company_id !== a.company_id || site.timezone !== a.site_timezone)
    blocked(
      "site_timezone",
      "Site context changed; review a new appointment proposal.",
    );
  const originalSite = r.approved_snapshot?.site;
  if (originalSite && originalSite.version !== site.version)
    blocked(
      "site",
      "Site evidence changed since scope authorisation. Review scope.",
      "ScopeReviewRequired",
    );
  if (
    a.requested_window_start &&
    (start < a.requested_window_start || end > a.requested_window_end!)
  )
    blocked(
      "requested_window_start",
      "The move must remain inside the recorded customer window. A new window requires a new proposal.",
    );
  const issues = await blockers(c, p, w, r);
  if (issues.length)
    throw new AppError(
      422,
      "BookingBlocked",
      "Current mandatory work authority is not ready.",
      issues,
    );
  const authControls = await readiness(c, p, r);
  for (const x of authControls)
    if (x.valid_until && x.valid_until < end)
      blocked(
        x.criterion_code,
        "Mandatory authority evidence must remain valid through the visit end.",
      );
  const assets = (
    await c.query(
      `SELECT a.id,a.version,a.identity_status,ac.verification_status,sa.configuration_id FROM ppo.scope_assets sa JOIN ppo.assets a ON (a.workspace_id,a.id)=(sa.workspace_id,sa.asset_id) LEFT JOIN ppo.asset_configurations ac ON ac.id=sa.configuration_id WHERE sa.workspace_id=$1 AND sa.scope_revision_id=$2`,
      [p.workspace_id, r.id],
    )
  ).rows;
  for (const asset of assets) {
    if (asset.configuration_id && asset.verification_status !== "Verified")
      blocked(
        "configuration",
        "Review required configuration is not verified evidence.",
      );
    const snap = r.approved_snapshot?.items
      ?.flatMap(
        (i: { assets?: { asset_id: string; asset_version: number }[] }) =>
          i.assets ?? [],
      )
      .find((x: { asset_id: string }) => x.asset_id === asset.id);
    if (snap && snap.asset_version !== asset.version)
      blocked(
        "asset",
        "Equipment context changed since approval; review scope.",
        "ScopeReviewRequired",
      );
  }
  const controls = await readiness(c, p, r, a.id);
  if (
    controls.some(
      (x) => x.criterion_code === "CrewCompetency" && x.outcome === "Blocked",
    )
  )
    blocked(
      "CrewCompetency",
      "An explicit crew control blocker requires review before booking.",
    );
  for (const x of controls.filter(
    (x) =>
      x.blocking_stage === "Booking" && x.criterion_code !== "CrewCompetency",
  )) {
    if (
      !["Pass", "PermittedException", "NotApplicable"].includes(x.outcome) ||
      (x.valid_until && x.valid_until < end)
    )
      blocked(
        x.criterion_code,
        `${x.label} needs current reviewed evidence through visit end.`,
      );
    if (x.outcome === "PermittedException" && !x.exception_allowed)
      blocked(x.criterion_code, "A mandatory control cannot be waived.");
  }
  if (a.preparation_status !== "Preparing")
    blocked(
      "preparation_status",
      "Record an owned preparation plan before booking.",
    );
  const lastContact = (
    await c.query(
      "SELECT * FROM ppo.contact_outcomes WHERE workspace_id=$1 AND appointment_id=$2 AND schedule_version=$3 ORDER BY created_at DESC,id DESC LIMIT 1",
      [p.workspace_id, a.id, a.schedule_version],
    )
  ).rows[0];
  if (
    !move &&
    (!lastContact ||
      lastContact.outcome !== "Confirmed" ||
      lastContact.start_at.getTime() !== start.getTime() ||
      lastContact.end_at.getTime() !== end.getTime() ||
      lastContact.recipient_id !== site.primary_contact_id ||
      a.customer_commitment !== "Confirmed")
  )
    blocked(
      "customer_commitment",
      "Record explicit customer agreement to these proposed dates before initial confirmation.",
      "CustomerContactRequired",
    );
  // Exact resource locks cover old and replacement crews. Published sources cannot mutate via another command.
  await lockCrew(c, p, a, cmd.crew);
  const required: string[] = [
    ...new Set(
      r.items.flatMap(
        (i: { required_skill_codes: string[] }) => i.required_skill_codes,
      ),
    ),
  ] as string[];
  const evidence = [];
  for (const member of cmd.crew) {
    const resource = await visibleResource(c, p, member.resource_id, a.site_id);
    if (resource.company_id !== a.company_id) throw unavailable();
    sameVersion(resource.version, member.resource_version, "resource");
    const before = new Date(
        start.getTime() - member.travel_before_minutes * 60000,
      ),
      after = new Date(end.getTime() + member.travel_after_minutes * 60000);
    if (
      !resource.active ||
      resource.status !== "Published" ||
      before < resource.effective_from ||
      after > resource.effective_to
    )
      blocked(
        "crew",
        `${resource.name}: inactive or outside the published resource period.`,
        "SkillOrTravelInvalid",
      );
    if (resource.user_id) {
      const u = (
        await c.query(
          "SELECT active FROM ppo.users WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, resource.user_id],
        )
      ).rows[0];
      if (!u?.active)
        blocked(
          "crew",
          `${resource.name}: linked identity is inactive.`,
          "SkillOrTravelInvalid",
        );
    }
    const calendar = (
      await c.query(
        "SELECT * FROM ppo.working_calendars WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, resource.calendar_id],
      )
    ).rows[0];
    sameVersion(calendar.version, member.calendar_version, "calendar");
    if (
      calendar.status !== "Published" ||
      before < calendar.effective_from ||
      after > calendar.effective_to
    )
      blocked(
        "calendar",
        "Use a published working calendar valid for the complete reservation.",
        "SkillOrTravelInvalid",
      );
    // PostgreSQL converts both endpoints into the calendar timezone, including DST. No browser timezone guess.
    const fits = (
      await c.query(
        `SELECT EXISTS(SELECT 1 FROM ppo.calendar_intervals i WHERE i.workspace_id=$1 AND i.calendar_id=$2 AND i.weekday=extract(dow FROM $3::timestamptz AT TIME ZONE $5) AND ($3::timestamptz AT TIME ZONE $5)::date=(($4::timestamptz-interval '1 microsecond') AT TIME ZONE $5)::date AND $3::timestamptz >= (((($3::timestamptz AT TIME ZONE $5)::date)::timestamp + make_interval(mins=>i.start_minute)) AT TIME ZONE $5) AND $4::timestamptz <= (((($3::timestamptz AT TIME ZONE $5)::date)::timestamp + make_interval(mins=>i.end_minute)) AT TIME ZONE $5)) AS fits`,
        [p.workspace_id, calendar.id, before, after, calendar.timezone],
      )
    ).rows[0].fits;
    if (!fits)
      blocked(
        "calendar",
        `${resource.name}: visit and explicit travel must fit one published working interval.`,
        "SkillOrTravelInvalid",
      );
    const closed = await c.query(
      "SELECT 1 FROM ppo.calendar_exceptions WHERE workspace_id=$1 AND calendar_id=$2 AND tstzrange(start_at,end_at,'[)') && tstzrange($3,$4,'[)')",
      [p.workspace_id, calendar.id, before, after],
    );
    const absent = await c.query(
      "SELECT 1 FROM ppo.availability_blocks WHERE workspace_id=$1 AND resource_id=$2 AND active AND tstzrange(start_at,end_at,'[)') && tstzrange($3,$4,'[)')",
      [p.workspace_id, resource.id, before, after],
    );
    if (closed.rowCount || absent.rowCount)
      blocked(
        "crew",
        `${resource.name}: unavailable during the visit or travel allowance.`,
        "ResourceConflict",
      );
    const skills = (
      await c.query(
        "SELECT s.*,e.content_hash,e.reviewer_id,e.reviewed_at FROM ppo.skill_evidence s JOIN ppo.resource_evidence e ON (e.workspace_id,e.resource_id,e.id)=(s.workspace_id,s.resource_id,s.evidence_ref) WHERE s.workspace_id=$1 AND s.resource_id=$2 AND s.active AND s.status='Verified' AND s.valid_from<=$3 AND s.valid_to>=$4 AND s.source_as_at<=clock_timestamp() AND e.reviewed_at<=clock_timestamp()",
        [p.workspace_id, resource.id, start, end],
      )
    ).rows;
    for (const skill of required)
      if (!skills.some((s) => s.skill_code === skill))
        blocked(
          "crew",
          `${resource.name}: reviewed ${skill} evidence is required through visit end.`,
          "SkillOrTravelInvalid",
        );
    const conflict = (
      await c.query(
        "SELECT rr.start_at,rr.end_at FROM ppo.resource_reservations rr JOIN ppo.assignments x ON x.id=rr.assignment_id WHERE rr.workspace_id=$1 AND rr.resource_id=$2 AND rr.active AND x.appointment_id<>$3 AND tstzrange(rr.start_at,rr.end_at,'[)') && tstzrange($4,$5,'[)') ORDER BY rr.start_at LIMIT 1",
        [p.workspace_id, resource.id, a.id, before, after],
      )
    ).rows[0];
    if (conflict)
      blocked(
        "crew",
        `${resource.name}: reserved ${conflict.start_at.toISOString()} to ${conflict.end_at.toISOString()} (UTC). Original booking retained.`,
        "ResourceConflict",
      );
    evidence.push({
      resource_id: resource.id,
      resource_version: resource.version,
      calendar_id: calendar.id,
      calendar_version: calendar.version,
      calendar_timezone: calendar.timezone,
      source_as_at: resource.source_as_at,
      skills,
      member,
      reservation_start: before,
      reservation_end: after,
    });
  }
  return {
    schema_version: 1,
    synthetic: true,
    scope_revision_id: r.id,
    scope_version: r.version,
    scope_hash: r.content_hash,
    work_order_version: w.version,
    readiness_policy_id: r.policy_version_id,
    scheduling_policy_id: pol.id,
    scheduling_policy_version: pol.version,
    site_version: site.version,
    required_skill_codes: required,
    authorisation_controls: authControls,
    booking_controls: controls.filter(
      (x) => x.criterion_code !== "CrewCompetency",
    ),
    crew: evidence,
    contact_outcome_id: lastContact?.id ?? null,
    customer_review_required: move,
    checked_by: p.actor_id,
  };
}
async function applyBooking(
  c: PoolClient,
  p: Principal,
  a: Appointment,
  w: WorkOrder,
  cmd: BookingInput,
  move: boolean,
) {
  const snapshot = await guardBooking(c, p, a, w, cmd, move);
  if (move) {
    await c.query(
      "UPDATE ppo.resource_reservations SET active=false WHERE workspace_id=$1 AND active AND assignment_id IN (SELECT id FROM ppo.assignments WHERE workspace_id=$1 AND appointment_id=$2 AND active)",
      [p.workspace_id, a.id],
    );
    await c.query(
      "UPDATE ppo.assignments SET active=false WHERE workspace_id=$1 AND appointment_id=$2 AND active",
      [p.workspace_id, a.id],
    );
  }
  for (const e of snapshot.crew) {
    const x = await insert(c, "assignments", {
      id: randomUUID(),
      workspace_id: p.workspace_id,
      company_id: a.company_id,
      site_id: a.site_id,
      appointment_id: a.id,
      ...e.member,
      assignment_version: a.assignment_version + 1,
      active: true,
      created_by: p.actor_id,
    });
    await insert(c, "resource_reservations", {
      id: randomUUID(),
      workspace_id: p.workspace_id,
      assignment_id: x.id,
      resource_id: x.resource_id,
      start_at: e.reservation_start,
      end_at: e.reservation_end,
      active: true,
    });
  }
  const hash = (
    await c.query(
      "SELECT encode(sha256(convert_to($1::jsonb::text,'UTF8')),'hex') AS hash",
      [JSON.stringify(snapshot)],
    )
  ).rows[0].hash;
  const current = await bumpAppointment(c, p, a, {
    start_at: cmd.start_at,
    end_at: cmd.end_at,
    status: "Confirmed",
    assignment_version: a.assignment_version + 1,
    schedule_version: a.schedule_version + 1,
    scheduling_policy_id: cmd.scheduling_policy_id,
    booking_snapshot: snapshot,
    booking_hash: hash,
    customer_commitment: move ? "Changed" : a.customer_commitment,
    pack_requirement: move ? "ReviewRequired" : "PreparationRequired",
    dispatch_hold: true,
  });
  const activity = await followUp(
    c,
    p,
    current,
    w,
    move ? "ChangedSchedule" : "CustomerConfirmation",
  );
  return {
    ...current,
    state: current.status,
    audit_details: {
      work_order_id: w.id,
      previous_version: a.version,
      previous_schedule_version: a.schedule_version,
      scope_revision_id: a.scope_revision_id,
      booking_hash: hash,
      pack_requirement: current.pack_requirement,
      dispatch_hold: true,
      activity_id: activity,
      actual_work_checked: true,
    },
  };
}
export async function confirmAppointment(
  p: Principal,
  id: string,
  input: unknown,
) {
  const cmd = bookingCommand(id, input, false);
  return sharedOperation(
    p,
    cmd,
    "ConfirmAppointment",
    (c) => visibleAppointment(c, p, id, "schedule.manage"),
    async (c, { a, w }) =>
      applyBooking(
        c,
        p,
        a,
        w,
        {
          ...cmd,
          start_at: a.start_at.toISOString(),
          end_at: a.end_at.toISOString(),
        },
        false,
      ),
    "Appointment",
    "AppointmentConfirmed",
  );
}
export async function moveAppointment(
  p: Principal,
  id: string,
  input: unknown,
) {
  const cmd = bookingCommand(id, input, true);
  return sharedOperation(
    p,
    cmd,
    "MoveAppointment",
    (c) => visibleAppointment(c, p, id, "schedule.manage"),
    async (c, { a, w }) =>
      applyBooking(
        c,
        p,
        a,
        w,
        { ...cmd, start_at: cmd.start_at!, end_at: cmd.end_at! },
        true,
      ),
    "Appointment",
    "AppointmentChanged",
  );
}
export async function cancelAppointment(
  p: Principal,
  id: string,
  input: unknown,
) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "expected_work_order_version",
    "expected_assignment_version",
  ]);
  const cmd = {
    ...common(r),
    appointment_id: uuid(id, "appointment_id"),
    expected_version: version(r.expected_version),
    expected_work_order_version: version(r.expected_work_order_version),
    expected_assignment_version: version(r.expected_assignment_version),
  };
  return sharedOperation(
    p,
    cmd,
    "CancelAppointment",
    (c) => visibleAppointment(c, p, id, "schedule.manage"),
    async (c, { a, w }) => {
      sameVersion(a.version, cmd.expected_version, "appointment");
      sameVersion(w.version, cmd.expected_work_order_version, "work order");
      sameVersion(
        a.assignment_version,
        cmd.expected_assignment_version,
        "crew",
      );
      if (a.actual_start_at || a.actual_end_at)
        blocked(
          "actual_work",
          "Work has already been recorded. Submit attendance for review instead of cancelling.",
          "ActualWorkRecorded",
        );
      if (a.status === "Cancelled" || a.start_at.getTime() <= Date.now())
        blocked(
          "status",
          "Only future Proposed or Confirmed attendance can be cancelled.",
        );
      await lockCrew(c, p, a, []);
      await c.query(
        "UPDATE ppo.resource_reservations SET active=false WHERE workspace_id=$1 AND active AND assignment_id IN (SELECT id FROM ppo.assignments WHERE workspace_id=$1 AND appointment_id=$2 AND active)",
        [p.workspace_id, a.id],
      );
      await c.query(
        "UPDATE ppo.assignments SET active=false WHERE workspace_id=$1 AND appointment_id=$2 AND active",
        [p.workspace_id, a.id],
      );
      const current = await bumpAppointment(c, p, a, {
        status: "Cancelled",
        cancellation_reason: cmd.reason,
        cancelled_at: new Date(),
        assignment_version: a.assignment_version + 1,
        schedule_version: a.schedule_version + 1,
        customer_commitment: "Changed",
        pack_requirement: "CancellationReviewRequired",
        dispatch_hold: true,
      });
      const activity_id = await followUp(c, p, current, w, "Cancellation");
      return {
        ...current,
        state: "Cancelled",
        audit_details: {
          actual_work_checked: true,
          actual_start_at: null,
          actual_end_at: null,
          resource_release: true,
          activity_id,
          pack_requirement: current.pack_requirement,
        },
      };
    },
    "Appointment",
    "AppointmentCancelled",
  );
}
export async function recordContact(p: Principal, id: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "id",
    "expected_version",
    "recipient_id",
    "channel",
    "outcome",
    "occurred_at",
    "notes",
  ]);
  const cmd = {
    ...common(r),
    id: uuid(r.id, "id"),
    appointment_id: uuid(id, "appointment_id"),
    expected_version: version(r.expected_version),
    recipient_id: uuid(r.recipient_id, "recipient_id"),
    channel: choice(r.channel, "channel", [
      "ManualPhone",
      "ManualEmail",
      "InPerson",
      "Simulated",
    ]),
    outcome: choice(r.outcome, "outcome", [
      "Attempted",
      "Confirmed",
      "NoResponse",
      "Failed",
    ]),
    occurred_at: instant(r.occurred_at, "occurred_at"),
    notes: narrative(r.notes, "notes", 2000),
  };
  return sharedOperation(
    p,
    cmd,
    "RecordContactOutcome",
    async (c) => {
      const context = await visibleAppointment(c, p, id, "schedule.contact");
      await visible(c, p, "Person", cmd.recipient_id);
      return context;
    },
    async (c, { a, w }) => {
      sameVersion(a.version, cmd.expected_version, "appointment");
      const site = await visible(c, p, "Site", a.site_id),
        person = await visible(c, p, "Person", cmd.recipient_id);
      if (
        !person.active ||
        site.primary_contact_id !== cmd.recipient_id ||
        !(
          await c.query(
            "SELECT 1 FROM ppo.person_company_contexts WHERE workspace_id=$1 AND company_id=$2 AND person_id=$3",
            [p.workspace_id, a.company_id, cmd.recipient_id],
          )
        ).rowCount
      )
        throw unavailable();
      if (
        Date.parse(cmd.occurred_at) > Date.now() ||
        Date.parse(cmd.occurred_at) < a.updated_at.getTime()
      )
        blocked(
          "occurred_at",
          "Record contact after the current appointment version was saved and no later than now.",
        );
      const activity_id =
        cmd.outcome === "Confirmed"
          ? null
          : await followUp(c, p, a, w, "ContactUnsuccessful");
      const result = await insert(c, "contact_outcomes", {
        ...childMeta(p, a, cmd.id),
        schedule_version: a.schedule_version,
        recipient_id: cmd.recipient_id,
        activity_id,
        channel: cmd.channel,
        outcome: cmd.outcome,
        occurred_at: cmd.occurred_at,
        notes: cmd.notes,
        start_at: a.start_at,
        end_at: a.end_at,
      });
      if (a.status !== "Cancelled")
        await bumpAppointment(c, p, a, {
          customer_commitment:
            cmd.outcome === "Confirmed"
              ? "Confirmed"
              : a.status === "Confirmed"
                ? "Changed"
                : "Proposed",
        });
      return {
        ...result,
        state: cmd.outcome,
        audit_details: {
          appointment_id: a.id,
          schedule_version: a.schedule_version,
          channel: cmd.channel,
          outcome: cmd.outcome,
          sending_performed: false,
          pack_acknowledgement: false,
          activity_id,
        },
      };
    },
    "ContactOutcome",
    "ContactOutcomeRecorded",
  );
}
export async function createChangeRequest(
  p: Principal,
  id: string,
  input: unknown,
) {
  const r = object(input, [
    ...commonKeys,
    "id",
    "expected_version",
    "source_type",
    "source_reference",
    "source_version",
    "start_at",
    "end_at",
    "crew",
  ]);
  const cmd = {
    ...common(r),
    id: uuid(r.id, "id"),
    appointment_id: uuid(id, "appointment_id"),
    expected_version: version(r.expected_version),
    source_type: choice(r.source_type, "source_type", [
      "Manual",
      "ProjectReference",
      "TechnicianRequest",
    ]),
    source_reference: narrative(r.source_reference, "source_reference", 200),
    source_version: narrative(r.source_version, "source_version", 100),
    ...interval(r.start_at, r.end_at),
    crew: crewFields(r.crew),
  };
  return sharedOperation(
    p,
    cmd,
    "CreateScheduleChangeRequest",
    async (c) => {
      const context = await visibleAppointment(c, p, id, "schedule.request");
      if (cmd.source_type === "TechnicianRequest") {
        if (
          !(
            await c.query(
              "SELECT 1 FROM ppo.assignments x JOIN ppo.resources r ON r.id=x.resource_id WHERE x.workspace_id=$1 AND x.appointment_id=$2 AND x.active AND r.user_id=$3 AND r.active",
              [p.workspace_id, id, p.actor_id],
            )
          ).rowCount
        )
          throw unavailable();
      } else if (
        !(await hasPermission(
          c,
          p,
          "schedule.manage",
          context.a.company_id,
          context.a.site_id,
        ))
      )
        throw new AppError(
          403,
          "Forbidden",
          "This identity can propose a technician change only for its current assignment.",
        );
      for (const member of cmd.crew)
        await visibleResource(c, p, member.resource_id, context.a.site_id);
      return context;
    },
    async (c, { a }) => {
      sameVersion(a.version, cmd.expected_version, "appointment");
      if (a.status !== "Confirmed")
        blocked(
          "status",
          "Change requests target a current confirmed appointment.",
        );
      const result = await insert(c, "schedule_change_requests", {
        ...childMeta(p, a, cmd.id),
        expected_version: a.version,
        expected_schedule_version: a.schedule_version,
        crew_snapshot: JSON.stringify(cmd.crew),
        source_type: cmd.source_type,
        source_reference: cmd.source_reference,
        source_version: cmd.source_version,
        reason: cmd.reason,
        proposed_start: cmd.start_at,
        proposed_end: cmd.end_at,
      });
      for (const member of cmd.crew)
        await insert(c, "schedule_request_crew", {
          workspace_id: p.workspace_id,
          request_id: cmd.id,
          ...member,
        });
      return {
        ...result,
        state: "Pending",
        audit_details: {
          appointment_id: a.id,
          source_type: cmd.source_type,
          reservations_changed: false,
        },
      };
    },
    "ScheduleChangeRequest",
    "ScheduleChangeRequested",
  );
}
export async function visibleRequest(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: Capability = "schedule.read",
) {
  await requireCapability(c, p, cap);
  const r = (
    await c.query(
      "SELECT * FROM ppo.schedule_change_requests WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "request_id")],
    )
  ).rows[0];
  if (!r) throw unavailable();
  const context = await visibleAppointment(c, p, r.appointment_id, cap);
  return { ...context, request: r };
}
export async function decideChangeRequest(
  p: Principal,
  id: string,
  input: unknown,
  action: "accept" | "reject" | "cancel",
) {
  const keys =
    action === "accept"
      ? bookingKeys.filter((k) => k !== "crew")
      : ["expected_version"];
  const r = object(input, [...commonKeys, ...keys, "expected_request_version"]);
  const base = {
    ...common(r),
    request_id: uuid(id, "request_id"),
    expected_request_version: version(r.expected_request_version),
    expected_version: version(r.expected_version),
  };
  // Crew comes only from the stored typed request; the decision may not substitute a different proposal.
  const parsed = action === "accept" ? r : null;
  const cmd = {
    ...base,
    ...(parsed
      ? {
          expected_work_order_version: version(r.expected_work_order_version),
          expected_assignment_version: version(r.expected_assignment_version),
          scope_revision_id: uuid(r.scope_revision_id, "scope_revision_id"),
          scope_version: version(r.scope_version),
          policy_version_id: uuid(r.policy_version_id, "policy_version_id"),
          scheduling_policy_id: uuid(
            r.scheduling_policy_id,
            "scheduling_policy_id",
          ),
          scheduling_policy_version: version(r.scheduling_policy_version),
        }
      : {}),
  };
  return sharedOperation(
    p,
    cmd,
    `DecideScheduleChangeRequest:${action}`,
    async (c) => {
      const context = await visibleRequest(
        c,
        p,
        id,
        action === "cancel" ? "schedule.request" : "schedule.manage",
      );
      if (
        action === "cancel" &&
        context.request.created_by !== p.actor_id &&
        !(await hasPermission(
          c,
          p,
          "schedule.manage",
          context.a.company_id,
          context.a.site_id,
        ))
      )
        throw unavailable();
      return context;
    },
    async (c, { a, w, request }) => {
      sameVersion(request.version, cmd.expected_request_version, "request");
      sameVersion(a.version, cmd.expected_version, "appointment");
      if (request.status !== "Pending")
        blocked("status", "This request already has a decision.");
      let changed: Awaited<ReturnType<typeof applyBooking>> | undefined;
      if (action === "accept") {
        if (a.schedule_version !== request.expected_schedule_version)
          throw new AppError(
            409,
            "VersionConflict",
            "The booking changed after this request. Record a new request.",
          );
        const crew = (
          await c.query(
            "SELECT resource_id,resource_version,calendar_version,crew_role,travel_before_minutes,travel_after_minutes,travel_reason FROM ppo.schedule_request_crew WHERE workspace_id=$1 AND request_id=$2 ORDER BY resource_id",
            [p.workspace_id, id],
          )
        ).rows;
        changed = await applyBooking(
          c,
          p,
          a,
          w,
          {
            ...bookingFields({ ...r, crew }),
            reason: cmd.reason,
            start_at: request.proposed_start.toISOString(),
            end_at: request.proposed_end.toISOString(),
          },
          true,
        );
      }
      const state =
        action === "accept"
          ? "Accepted"
          : action === "reject"
            ? "Rejected"
            : "Cancelled";
      const result = (
        await c.query(
          "UPDATE ppo.schedule_change_requests SET status=$3,version=version+1,updated_by=$4,updated_at=clock_timestamp(),decision_by=$4,decision_at=clock_timestamp(),decision_reason=$5 WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, id, state, p.actor_id, cmd.reason],
        )
      ).rows[0];
      return {
        ...result,
        state,
        audit_details: {
          appointment_id: a.id,
          appointment_version: changed?.version ?? a.version,
          booking_hash: changed?.audit_details.booking_hash ?? null,
          decision: state,
          reservations_changed: !!changed,
        },
      };
    },
    "ScheduleChangeRequest",
    action === "accept" ? "AppointmentChanged" : "ScheduleChangeDecided",
  );
}
async function resourceDetail(
  c: QueryClient,
  p: Principal,
  id: string,
  siteId?: string,
) {
  const r = await visibleResource(c, p, id, siteId);
  const calendar = (
    await c.query(
      "SELECT * FROM ppo.working_calendars WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, r.calendar_id],
    )
  ).rows[0];
  const intervals = (
    await c.query(
      "SELECT weekday,start_minute,end_minute FROM ppo.calendar_intervals WHERE workspace_id=$1 AND calendar_id=$2 ORDER BY weekday,start_minute",
      [p.workspace_id, r.calendar_id],
    )
  ).rows;
  const skills = (
    await c.query(
      "SELECT s.id,s.version,s.skill_code,s.status,s.active,s.valid_from,s.valid_to,s.source_as_at,s.evidence_ref,e.content_hash,e.reviewer_id,e.reviewed_at FROM ppo.skill_evidence s LEFT JOIN ppo.resource_evidence e ON e.id=s.evidence_ref WHERE s.workspace_id=$1 AND s.resource_id=$2 ORDER BY s.skill_code",
      [p.workspace_id, id],
    )
  ).rows;
  return { ...r, calendar: { ...calendar, intervals }, skills };
}
export async function listResources(p: Principal, input: unknown = {}) {
  const q = object(input, ["site_id", "resource_id"]),
    siteId = optionalId(q.site_id, "site_id"),
    resourceId = optionalId(q.resource_id, "resource_id");
  return transaction(async (c) => {
    await requireCapability(c, p, "schedule.read");
    if (siteId) {
      const s = await visible(c, p, "Site", siteId);
      if (!(await hasPermission(c, p, "schedule.read", s.company_id, s.id)))
        throw unavailable();
    }
    if (resourceId)
      await visibleResource(c, p, resourceId, siteId ?? undefined);
    const rows = (
      await c.query(
        `SELECT DISTINCT r.id FROM ppo.resources r JOIN ppo.resource_sites rs ON (rs.workspace_id,rs.resource_id)=(r.workspace_id,r.id) WHERE r.workspace_id=$1 AND ${scopeSql("r.company_id", "rs.site_id", "schedule.read")} AND ${scopeSql("r.company_id", "rs.site_id")} AND ($3::uuid IS NULL OR rs.site_id=$3) AND ($4::uuid IS NULL OR r.id=$4) ORDER BY r.id LIMIT 51`,
        [p.workspace_id, p.actor_id, siteId, resourceId],
      )
    ).rows;
    if (rows.length > 50)
      blocked("site_id", "Narrow the resource list to a site.");
    const items = [];
    for (const r of rows)
      items.push(await resourceDetail(c, p, r.id, siteId ?? undefined));
    return envelope(items);
  });
}
async function appointmentCore(c: QueryClient, p: Principal, id: string) {
  const { a, w } = await visibleAppointment(c, p, id),
    site = await visible(c, p, "Site", a.site_id),
    r = await scopeDetail(c, p, w, a.scope_revision_id);
  const assignments = (
    await c.query(
      "SELECT x.*,r.name,r.base_timezone FROM ppo.assignments x JOIN ppo.resources r ON r.id=x.resource_id WHERE x.workspace_id=$1 AND x.appointment_id=$2 ORDER BY x.assignment_version DESC,x.resource_id",
      [p.workspace_id, id],
    )
  ).rows;
  for (const x of assignments)
    await visibleResource(c, p, x.resource_id, a.site_id);
  return { a, w, site, r, assignments };
}
function appointmentHeader({
  a,
  w,
  site,
  r,
  assignments,
}: Awaited<ReturnType<typeof appointmentCore>>) {
  return {
    ...a,
    work_order_display_number: w.display_number,
    work_order_version: w.version,
    scope_summary: r.summary,
    scope_hash: r.content_hash,
    scope_revision: r.revision,
    scope_review_required:
      w.scope_revision_id !== w.authorised_scope_revision_id ||
      a.scope_revision_id !== w.authorised_scope_revision_id ||
      a.scope_version !== r.version,
    site_name: site.display_name,
    primary_contact_id: site.primary_contact_id,
    assignments,
  };
}
async function appointmentActions(
  c: QueryClient,
  p: Principal,
  a: Appointment,
) {
  return {
    can_manage: await hasPermission(
      c,
      p,
      "schedule.manage",
      a.company_id,
      a.site_id,
    ),
    can_request: await hasPermission(
      c,
      p,
      "schedule.request",
      a.company_id,
      a.site_id,
    ),
    can_contact: await hasPermission(
      c,
      p,
      "schedule.contact",
      a.company_id,
      a.site_id,
    ),
  };
}
async function appointmentDetail(c: QueryClient, p: Principal, id: string) {
  const core = await appointmentCore(c, p, id),
    { a, w, r } = core;
  const contacts = (
    await c.query(
      "SELECT * FROM ppo.contact_outcomes WHERE workspace_id=$1 AND appointment_id=$2 ORDER BY created_at DESC,id",
      [p.workspace_id, id],
    )
  ).rows;
  for (const contact of contacts) {
    const person = await visible(c, p, "Person", contact.recipient_id);
    contact.recipient_name = person.display_name;
  }
  const requests = (
    await c.query(
      "SELECT * FROM ppo.schedule_change_requests WHERE workspace_id=$1 AND appointment_id=$2 ORDER BY created_at DESC,id",
      [p.workspace_id, id],
    )
  ).rows;
  for (const req of requests)
    req.crew = (
      await c.query(
        "SELECT resource_id,resource_version,calendar_version,crew_role,travel_before_minutes,travel_after_minutes,travel_reason FROM ppo.schedule_request_crew WHERE workspace_id=$1 AND request_id=$2 ORDER BY resource_id",
        [p.workspace_id, req.id],
      )
    ).rows;
  const followups = [];
  for (const f of (
    await c.query(
      "SELECT * FROM ppo.schedule_follow_ups WHERE workspace_id=$1 AND appointment_id=$2 ORDER BY schedule_version DESC",
      [p.workspace_id, id],
    )
  ).rows) {
    try {
      const activity = await visibleActivity(c, p, f.activity_id);
      followups.push({
        ...f,
        summary: activity.summary,
        status: activity.status,
        owner_id: activity.owner_id,
        due_at: activity.due_at,
        due_needed: activity.due_needed,
      });
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    }
  }
  const policy = await schedulingPolicy(
    c,
    p,
    a.scheduling_policy_id ?? SCHEDULING_POLICY_ID,
    false,
  );
  const proposal = (
    await c.query(
      "SELECT proposal_version,snapshot,content_hash FROM ppo.appointment_proposals WHERE workspace_id=$1 AND appointment_id=$2",
      [p.workspace_id, id],
    )
  ).rows[0];
  const history = (
    await c.query(
      "SELECT version,snapshot,content_hash FROM ppo.appointment_revisions WHERE workspace_id=$1 AND appointment_id=$2 ORDER BY version DESC",
      [p.workspace_id, id],
    )
  ).rows;
  return {
    ...appointmentHeader(core),
    contacts,
    requests,
    followups,
    proposal,
    history,
    policy,
    readiness: await readiness(c, p, r, a.id),
    authorisation_blockers: await blockers(c, p, w, r),
    actions: await appointmentActions(c, p, a),
  };
}
async function appointmentSummary(c: QueryClient, p: Principal, id: string) {
  const core = await appointmentCore(c, p, id);
  // Preserve complete appointment visibility, including historical crew and
  // contact identities. The planner has no reason to load their narratives,
  // original snapshots or authorisation evidence for every card in a week.
  for (const contact of (
    await c.query(
      "SELECT DISTINCT recipient_id FROM ppo.contact_outcomes WHERE workspace_id=$1 AND appointment_id=$2",
      [p.workspace_id, id],
    )
  ).rows)
    await visible(c, p, "Person", contact.recipient_id);
  const requests = (
    await c.query(
      "SELECT id,status FROM ppo.schedule_change_requests WHERE workspace_id=$1 AND appointment_id=$2 ORDER BY created_at DESC,id",
      [p.workspace_id, id],
    )
  ).rows;
  return {
    ...appointmentHeader(core),
    projection: "ScheduleSummary" as const,
    requests,
    policy: await schedulingPolicy(
      c,
      p,
      core.a.scheduling_policy_id ?? SCHEDULING_POLICY_ID,
      false,
    ),
    actions: await appointmentActions(c, p, core.a),
  };
}
export async function readAppointment(
  p: Principal,
  id: string,
  query: unknown = {},
) {
  object(query, []);
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    return envelope([await appointmentDetail(c, p, id)]);
  });
}
export async function readSchedule(p: Principal, input: unknown) {
  const q = object(input, [
      "from",
      "to",
      "timezone",
      "site_id",
      "resource_id",
      "status",
    ]),
    period = interval(q.from, q.to),
    displayTimezone = timezone(q.timezone),
    siteId = optionalId(q.site_id, "site_id"),
    resourceId = optionalId(q.resource_id, "resource_id");
  const status = q.status
    ? choice(q.status, "status", ["Proposed", "Confirmed", "Cancelled"])
    : null;
  if (Date.parse(period.end_at) - Date.parse(period.start_at) > 8 * 86400000)
    blocked("to", "Load at most eight days at a time.");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await requireCapability(c, p, "schedule.read");
    if (siteId) {
      const site = await visible(c, p, "Site", siteId);
      if (
        !(await hasPermission(c, p, "schedule.read", site.company_id, siteId))
      )
        throw unavailable();
    }
    if (resourceId)
      await visibleResource(c, p, resourceId, siteId ?? undefined);
    const candidates = (
      await c.query(
        `SELECT a.id FROM ppo.appointments a JOIN ppo.work_orders w ON (w.workspace_id,w.id)=(a.workspace_id,a.work_order_id) WHERE a.workspace_id=$1 AND ${scopeSql("a.company_id", "a.site_id", "schedule.read")} AND ${orderVisibility("w")} AND a.start_at<$4 AND a.end_at>$3 AND ($5::uuid IS NULL OR a.site_id=$5) AND ($6::text IS NULL OR a.status=$6) AND ($7::uuid IS NULL OR EXISTS(SELECT 1 FROM ppo.assignments x WHERE x.appointment_id=a.id AND x.active AND x.resource_id=$7)) ORDER BY a.start_at,a.id LIMIT 201`,
        [
          p.workspace_id,
          p.actor_id,
          period.start_at,
          period.end_at,
          siteId,
          status,
          resourceId,
        ],
      )
    ).rows;
    if (candidates.length > 200)
      blocked("from", "Too many appointments. Narrow the date or site filter.");
    const appointments = [];
    for (const row of candidates) {
      try {
        appointments.push(await appointmentSummary(c, p, row.id));
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
    }
    const rr = (
      await c.query(
        `SELECT DISTINCT r.id FROM ppo.resources r JOIN ppo.resource_sites rs ON (rs.workspace_id,rs.resource_id)=(r.workspace_id,r.id) WHERE r.workspace_id=$1 AND ${scopeSql("r.company_id", "rs.site_id", "schedule.read")} AND ${scopeSql("r.company_id", "rs.site_id")} AND ($3::uuid IS NULL OR rs.site_id=$3) AND ($4::uuid IS NULL OR r.id=$4) ORDER BY r.id LIMIT 51`,
        [p.workspace_id, p.actor_id, siteId, resourceId],
      )
    ).rows;
    if (rr.length > 50)
      blocked("site_id", "Too many resource lanes. Filter to a site.");
    const resources = [];
    for (const row of rr) {
      const r = await resourceDetail(c, p, row.id, siteId ?? undefined);
      const blocks = (
        await c.query(
          "SELECT id,version,start_at,end_at,kind,source_as_at FROM ppo.availability_blocks WHERE workspace_id=$1 AND resource_id=$2 AND active AND start_at<$4 AND end_at>$3 ORDER BY start_at",
          [p.workspace_id, r.id, period.start_at, period.end_at],
        )
      ).rows;
      const exceptions = (
        await c.query(
          "SELECT id,start_at,end_at,kind,reason FROM ppo.calendar_exceptions WHERE workspace_id=$1 AND calendar_id=$2 AND start_at<$4 AND end_at>$3 ORDER BY start_at",
          [p.workspace_id, r.calendar_id, period.start_at, period.end_at],
        )
      ).rows;
      const busy = (
        await c.query(
          "SELECT rr.start_at,rr.end_at FROM ppo.resource_reservations rr WHERE rr.workspace_id=$1 AND rr.resource_id=$2 AND rr.active AND rr.start_at<$4 AND rr.end_at>$3 ORDER BY rr.start_at",
          [p.workspace_id, r.id, period.start_at, period.end_at],
        )
      ).rows;
      resources.push({ ...r, blocks, exceptions, busy });
    }
    return {
      ...envelope(appointments),
      resources,
      display_timezone: displayTimezone,
      from: period.start_at,
      to: period.end_at,
      synthetic: true,
    };
  });
}
