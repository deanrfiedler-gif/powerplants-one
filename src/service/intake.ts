import { database } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import {
  hasPermission,
  requireCapability,
  type QueryClient,
} from "../platform/permissions";
import {
  authoriseActivityInput,
  dueFields,
  insertActivity,
  readActivity,
  visibleActivity,
  type ActivityInput,
} from "../activities/activities";
import { companyContext, scopedOwner } from "../shared/authority";
import { envelope, page, readShared, visible } from "../shared/reads";
import {
  choice,
  common,
  commonKeys,
  instant,
  invalid,
  label,
  narrative,
  object,
  optionalId,
  optionalNarrative,
  uuid,
  version,
} from "../shared/validation";
import { ticketVisibility, visibleTicket } from "./tickets";
const intakeKeys = [
  "received_at",
  "channel",
  "requester_id",
  "requester_description",
  "site_id",
  "site_identification_needed",
  "asset_id",
  "summary",
  "symptom",
  "impact",
  "priority",
  "priority_reason",
  "triage_owner_id",
  "next_action",
];
export function intakeFields(r: Record<string, unknown>) {
  const requester_id = optionalId(r.requester_id, "requester_id"),
    site_id = optionalId(r.site_id, "site_id"),
    asset_id = optionalId(r.asset_id, "asset_id");
  if (
    typeof r.site_identification_needed !== "boolean" ||
    (site_id === null) !== r.site_identification_needed
  )
    invalid(
      "site_id",
      "Choose a known site or explicitly mark site identification as needed.",
    );
  const requester_description =
    optionalNarrative(r.requester_description, "requester_description", 2000) ??
    "";
  if (!requester_id && !requester_description)
    invalid(
      "requester_description",
      "Describe the requester and what must be clarified when their identity is unknown.",
    );
  if (asset_id && !site_id)
    invalid("asset_id", "Choose the equipment's site first.");
  const received_at = instant(r.received_at, "received_at");
  if (Date.parse(received_at) > Date.now() + 300000)
    invalid(
      "received_at",
      "Received time cannot be in the future (five-minute clock tolerance).",
    );
  return {
    received_at,
    channel: choice(r.channel, "channel", [
      "Phone",
      "Email",
      "Manual",
      "PlannedMaintenance",
      "Other",
    ]),
    requester_id,
    requester_description,
    site_id,
    site_identification_needed: r.site_identification_needed,
    asset_id,
    summary: label(r.summary, "summary", 200),
    symptom: narrative(r.symptom, "symptom"),
    impact: optionalNarrative(r.impact, "impact", 2000),
    priority: choice(r.priority, "priority", [
      "Low",
      "Normal",
      "High",
      "Urgent",
    ]),
    priority_reason: optionalNarrative(
      r.priority_reason,
      "priority_reason",
      2000,
    ),
    triage_owner_id: uuid(r.triage_owner_id, "triage_owner_id"),
    next_action: narrative(r.next_action, "next_action", 2000),
  };
}
async function context(
  c: QueryClient,
  p: Principal,
  company_id: string,
  fields: ReturnType<typeof intakeFields>,
) {
  await requireCapability(c, p, "service.ticket.edit");
  await companyContext(c, p, company_id, fields.site_id, "service.ticket.edit");
  if (
    !(await hasPermission(
      c,
      p,
      "service.ticket.read",
      company_id,
      fields.site_id ?? undefined,
    ))
  )
    throw unavailable();
  const owner = await scopedOwner(
    c,
    p,
    fields.triage_owner_id,
    company_id,
    fields.site_id ?? undefined,
    "service.ticket.edit",
  );
  if (
    !(await hasPermission(
      c,
      owner,
      "service.ticket.read",
      company_id,
      fields.site_id ?? undefined,
    ))
  )
    throw unavailable();
  for (const actor of [p, owner]) {
    if (fields.requester_id) {
      await visible(c, actor, "Person", fields.requester_id);
      if (
        !(
          await c.query(
            "SELECT 1 FROM ppo.person_company_contexts WHERE workspace_id=$1 AND company_id=$2 AND person_id=$3",
            [p.workspace_id, company_id, fields.requester_id],
          )
        ).rowCount
      )
        throw unavailable();
    }
    if (fields.asset_id) {
      const a = await visible(c, actor, "Asset", fields.asset_id);
      if (a.company_id !== company_id || a.site_id !== fields.site_id)
        throw unavailable();
    }
  }
}
export async function createTicket(p: Principal, input: unknown) {
  const r = object(input, [...commonKeys, "id", "company_id", ...intakeKeys]);
  const command = {
    ...common(r),
    id: uuid(r.id, "id"),
    company_id: uuid(r.company_id, "company_id"),
    ...intakeFields(r),
  };
  return sharedOperation(
    p,
    command,
    "CreateTicket",
    (c) => context(c, p, command.company_id, command),
    async (c) => {
      const {
        operation_id: _o,
        schema_version: _s,
        reason: _r,
        ...fields
      } = command;
      void _o;
      void _s;
      void _r;
      const entries = Object.entries({
        ...fields,
        workspace_id: p.workspace_id,
        created_by: p.actor_id,
        updated_by: p.actor_id,
        status: "New",
        intake_schema_version: 2,
        received_time_basis: "UserReported",
      });
      return (
        await c.query(
          `INSERT INTO ppo.tickets(${entries.map(([k]) => k).join(",")}) VALUES(${entries.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *,status AS state`,
          entries.map(([, v]) => v),
        )
      ).rows[0];
    },
    "Ticket",
    "TicketCreated",
  );
}
export async function saveIntake(p: Principal, id: string, input: unknown) {
  const r = object(input, [...commonKeys, "expected_version", ...intakeKeys]);
  const command = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    ...intakeFields(r),
  };
  return sharedOperation(
    p,
    command,
    "SaveTicketIntake",
    async (c) => {
      const t = await visibleTicket(c, p, id, true);
      if (
        !(await hasPermission(
          c,
          p,
          "service.ticket.edit",
          t.company_id,
          t.site_id ?? undefined,
        ))
      )
        throw new AppError(
          403,
          "Forbidden",
          "This identity cannot edit this intake.",
        );
      await context(c, p, t.company_id, command);
      return t;
    },
    async (c, t) => {
      checkVersion(t.version, command.expected_version);
      if (!["New", "NeedsInformation"].includes(t.status))
        throw new AppError(
          422,
          "TICKET_STATE_INVALID",
          "Only New or Needs information intake can be edited. Triage is a separate action.",
        );
      const {
        operation_id: _o,
        schema_version: _s,
        reason: _r,
        id: _i,
        expected_version: _v,
        ...fields
      } = command;
      void _o;
      void _s;
      void _r;
      void _i;
      void _v;
      const entries = Object.entries({
        ...fields,
        intake_schema_version: 2,
        received_time_basis: "UserReported",
      });
      const row = (
        await c.query(
          `UPDATE ppo.tickets SET ${entries.map(([k], i) => `${k}=$${i + 1}`).join(",")},version=version+1,updated_at=clock_timestamp(),updated_by=$${entries.length + 1} WHERE workspace_id=$${entries.length + 2} AND id=$${entries.length + 3} RETURNING *,status AS state`,
          [...entries.map(([, v]) => v), p.actor_id, p.workspace_id, id],
        )
      ).rows[0];
      return {
        ...row,
        audit_details: {
          previous_version: t.version,
          before: Object.fromEntries(intakeKeys.map((k) => [k, t[k]])),
          after: fields,
        },
      };
    },
    "Ticket",
    "TicketIntakeSaved",
  );
}
function checkVersion(actual: number, expected: number) {
  if (actual !== expected)
    throw new AppError(
      409,
      "VersionConflict",
      "This request changed. Keep your entries and compare the current version before submitting a new operation.",
    );
}
export async function requestInformation(
  p: Principal,
  id: string,
  input: unknown,
) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "open_questions",
    "next_action",
    "follow_up",
  ]);
  const f = object(r.follow_up, ["id", "owner_id", "due_at", "due_needed"]);
  const command = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    open_questions: narrative(r.open_questions, "open_questions", 4000),
    next_action: narrative(r.next_action, "next_action", 2000),
    follow_up: {
      id: uuid(f.id, "id"),
      owner_id: uuid(f.owner_id, "owner_id"),
      ...dueFields(f),
    },
  };
  return sharedOperation(
    p,
    command,
    "RequestTicketInformation",
    async (c) => {
      const t = await visibleTicket(c, p, id, true);
      if (
        !(await hasPermission(
          c,
          p,
          "service.ticket.edit",
          t.company_id,
          t.site_id ?? undefined,
        ))
      )
        throw new AppError(
          403,
          "Forbidden",
          "This identity cannot request intake clarification.",
        );
      const follow: ActivityInput = {
        ...command.follow_up,
        company_id: t.company_id,
        site_id: t.site_id,
        kind: "CustomerContact",
        summary: command.next_action,
        access_class: "RestrictedService",
        links: [{ object_type: "Ticket", object_id: id }],
      };
      await authoriseActivityInput(c, p, follow);
      const triageOwner = await scopedOwner(
        c,
        p,
        t.triage_owner_id,
        t.company_id,
        t.site_id ?? undefined,
        "service.ticket.edit",
      );
      await visibleTicket(c, triageOwner, t.id);
      return { t, follow };
    },
    async (c, { t, follow }) => {
      checkVersion(t.version, command.expected_version);
      if (t.status !== "New")
        throw new AppError(
          422,
          "TICKET_STATE_INVALID",
          "Request information is available only for a New request. Update the existing follow-up for a request already needing information.",
        );
      await insertActivity(c, p, follow);
      const row = (
        await c.query(
          "UPDATE ppo.tickets SET status='NeedsInformation',open_questions=$1,next_action=$2,clarification_activity_id=$3,version=version+1,updated_at=clock_timestamp(),updated_by=$4 WHERE workspace_id=$5 AND id=$6 RETURNING *,status AS state",
          [
            command.open_questions,
            command.next_action,
            follow.id,
            p.actor_id,
            p.workspace_id,
            id,
          ],
        )
      ).rows[0];
      return {
        ...row,
        audit_details: {
          previous_version: t.version,
          open_questions: command.open_questions,
          next_action: command.next_action,
          created_activity: follow,
        },
      };
    },
    "Ticket",
    "TicketInformationRequested",
  );
}
export type IntakeGate = {
  site_id: string | null;
  requester_id: string | null;
  symptom: string;
  impact: string | null;
  priority_reason: string | null;
  next_action: string | null;
  received_time_basis: string;
  status: string;
  clarification_activity_id: string | null;
};
export function triageBlockers(t: IntakeGate, clarificationComplete = false) {
  const blockers: { field: string; message: string }[] = [];
  for (const [field, value, message] of [
    [
      "site_id",
      t.site_id,
      "Identify the service site; diagnostic scope approval belongs to P04.",
    ],
    [
      "requester_id",
      t.requester_id,
      "Identify a permitted requester contact before completing triage.",
    ],
    ["symptom", t.symptom, "Record the reported symptoms."],
    ["impact", t.impact, "Describe the operational impact."],
    [
      "priority_reason",
      t.priority_reason,
      "Explain the chosen priority, including urgent requests.",
    ],
    [
      "next_action",
      t.next_action,
      "Record the next action owned by the triage owner.",
    ],
    [
      "received_at",
      t.received_time_basis === "UserReported",
      "Confirm the received time; the retained legacy timestamp is unverified.",
    ],
  ] as const)
    if (!value) blockers.push({ field, message });
  if (t.status === "NeedsInformation" && !clarificationComplete)
    blockers.push({
      field: "clarification_activity_id",
      message:
        "Complete the owned clarification activity with an outcome before triage.",
    });
  return blockers;
}
export async function triageTicket(p: Principal, id: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "clarification_outcome",
  ]);
  const command = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    clarification_outcome: optionalNarrative(
      r.clarification_outcome,
      "clarification_outcome",
      4000,
    ),
  };
  return sharedOperation(
    p,
    command,
    "TriageTicket",
    async (c) => {
      const t = await visibleTicket(c, p, id, true);
      if (
        !(await hasPermission(
          c,
          p,
          "service.ticket.edit",
          t.company_id,
          t.site_id ?? undefined,
        ))
      )
        throw new AppError(
          403,
          "Forbidden",
          "This identity cannot triage service requests.",
        );
      const triageOwner = await scopedOwner(
        c,
        p,
        t.triage_owner_id,
        t.company_id,
        t.site_id ?? undefined,
        "service.ticket.edit",
      );
      await visibleTicket(c, triageOwner, t.id);
      const activity = t.clarification_activity_id
        ? await visibleActivity(c, p, t.clarification_activity_id)
        : null;
      return { t, activity };
    },
    async (c, { t, activity }) => {
      checkVersion(t.version, command.expected_version);
      if (!["New", "NeedsInformation"].includes(t.status))
        throw new AppError(
          422,
          "TICKET_STATE_INVALID",
          "This request is already triaged or outside the P03 intake lifecycle.",
        );
      const blockers = triageBlockers(t, activity?.status === "Completed");
      if (t.status === "NeedsInformation" && !command.clarification_outcome)
        blockers.push({
          field: "clarification_outcome",
          message: "Record how the clarification questions were resolved.",
        });
      if (blockers.length)
        throw new AppError(
          422,
          "TICKET_TRIAGE_BLOCKED",
          "Complete the listed intake requirements before triage. Urgent priority does not bypass these checks.",
          blockers,
        );
      const row = (
        await c.query(
          "UPDATE ppo.tickets SET status='Triaged',clarification_outcome=$1,version=version+1,updated_at=clock_timestamp(),updated_by=$2 WHERE workspace_id=$3 AND id=$4 RETURNING *,status AS state",
          [command.clarification_outcome, p.actor_id, p.workspace_id, id],
        )
      ).rows[0];
      return {
        ...row,
        audit_details: {
          previous_version: t.version,
          clarification_outcome: command.clarification_outcome,
          clarification_activity_id: t.clarification_activity_id,
          authority: "Intake triage only; no work authorisation",
        },
      };
    },
    "Ticket",
    "TicketTriaged",
  );
}
export async function readIntake(p: Principal, id: string) {
  const c = database(),
    t = await visibleTicket(c, p, uuid(id, "id"));
  const owner = (
    await c.query(
      "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, t.triage_owner_id],
    )
  ).rows[0];
  let clarification = null;
  if (t.clarification_activity_id) {
    try {
      clarification = await readActivity(p, t.clarification_activity_id);
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    }
  }
  const editable = await hasPermission(
    c,
    p,
    "service.ticket.edit",
    t.company_id,
    t.site_id ?? undefined,
  );
  return {
    id: t.id,
    company_id: t.company_id,
    display_number: t.display_number,
    version: t.version,
    status: t.status,
    synthetic: true,
    updated_at: t.updated_at.toISOString(),
    received_at: t.received_at.toISOString(),
    received_time_basis: t.received_time_basis,
    channel: t.channel,
    requester_id: t.requester_id,
    requester_description: t.requester_description,
    site_id: t.site_id,
    site_identification_needed: t.site_identification_needed,
    asset_id: t.asset_id,
    summary: t.summary,
    symptom: t.symptom,
    impact: t.impact,
    priority: t.priority,
    priority_reason: t.priority_reason,
    triage_owner_id: t.triage_owner_id,
    owner_name: owner.display_name,
    next_action: t.next_action,
    // Clarification content shares its activity access boundary, including direct ticket reads.
    open_questions: clarification ? t.open_questions : null,
    clarification_outcome: clarification ? t.clarification_outcome : null,
    clarification_activity: clarification,
    clarification_unavailable: !!t.clarification_activity_id && !clarification,
    requester: t.requester_id
      ? await readShared(p, "Person", t.requester_id)
      : null,
    site: t.site_id ? await readShared(p, "Site", t.site_id) : null,
    asset: t.asset_id ? await readShared(p, "Asset", t.asset_id) : null,
    can_edit: t.status === "New" && editable,
    can_edit_intake: ["New", "NeedsInformation"].includes(t.status) && editable,
    triage_blockers: triageBlockers(t, clarification?.status === "Completed"),
  };
}
export async function listTickets(p: Principal, input: unknown = {}) {
  const c = database();
  await requireCapability(c, p, "service.ticket.read");
  const r = object(input, [
    "limit",
    "cursor",
    "q",
    "company_id",
    "site_id",
    "status",
    "owner_id",
  ]);
  const status =
      r.status === undefined
        ? null
        : choice(r.status, "status", ["New", "NeedsInformation", "Triaged"]),
    owner = optionalId(r.owner_id, "owner_id");
  const pg = page(
    Object.fromEntries(
      Object.entries(r).filter(([k]) => !["status", "owner_id"].includes(k)),
    ),
    {
      workspace: p.workspace_id,
      actor: p.actor_id,
      kind: "Ticket",
      status,
      owner,
    },
  );
  const rows = (
    await c.query(
      `SELECT t.id,t.display_number,t.summary,t.status,t.priority,t.version,t.triage_owner_id,t.site_id,t.site_identification_needed,t.received_time_basis FROM ppo.tickets t WHERE t.workspace_id=$1 AND ${ticketVisibility()}
    AND ($3::uuid IS NULL OR t.company_id=$3) AND ($4::uuid IS NULL OR t.site_id=$4) AND ($5::uuid IS NULL OR t.id>$5) AND position(lower($6) in lower(t.summary||' '||t.display_number))>0
    AND ($7::text IS NULL OR t.status=$7) AND ($8::uuid IS NULL OR t.triage_owner_id=$8) ORDER BY t.id LIMIT $9`,
      [
        p.workspace_id,
        p.actor_id,
        pg.company_id,
        pg.site_id,
        pg.after,
        pg.q,
        status,
        owner,
        pg.limit + 1,
      ],
    )
  ).rows;
  return envelope(
    rows.slice(0, pg.limit),
    rows.length > pg.limit ? pg.cursor(rows[pg.limit - 1].id) : null,
  );
}
