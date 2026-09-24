import { database } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import {
  hasPermission,
  requireCapability,
  scopeSql,
  type QueryClient,
} from "../platform/permissions";
import {
  activityVisibility,
  authoriseActivityInput,
  dueFields,
  insertActivity,
  readActivity,
  visibleActivity,
  type ActivityInput,
} from "../activities/activities";
import { crmAvailable } from "../crm/context";
import { leadsAvailable } from "../crm/leads/context";
import { projectsAvailable } from "../projects/visibility";
import { orderVisibility } from "./work-orders";
import { companyContext, scopedOwner } from "../shared/authority";
import { envelope, page, readShared, visibility, visible } from "../shared/reads";
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
      "Identify the service site before completing triage.",
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
          "This request is already triaged or outside the editable intake states.",
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
const priorityRank = (alias: string) =>
  `CASE ${alias}.priority WHEN 'Urgent' THEN 0 WHEN 'High' THEN 1 WHEN 'Normal' THEN 2 ELSE 3 END`;
// Filters shared by the register list and its queue counts; $1 workspace, $2 actor, then $3-$6.
const registerFilters = `t.workspace_id=$1 AND ${ticketVisibility()}
    AND ($3::uuid IS NULL OR t.company_id=$3) AND ($4::uuid IS NULL OR t.site_id=$4)
    AND position(lower($5) in lower(t.summary||' '||t.display_number))>0 AND ($6::uuid IS NULL OR t.triage_owner_id=$6)`;
// Queue predicates shared by the register list (queue filter, SV-01 I2) and its counts (ticketQueues), so a
// toggle never disagrees with its badge. Keys are validated before use; `ca` is the clarification join.
const queuePredicates = {
  all_open: "t.status NOT IN ('Closed','Cancelled')",
  new: "t.status='New'",
  needs_information: "t.status='NeedsInformation'",
  triaged: "t.status='Triaged'",
  urgent: "t.status NOT IN ('Closed','Cancelled') AND t.priority='Urgent'",
  overdue_clarifications:
    "t.status='NeedsInformation' AND ca.status IN ('Open','InProgress') AND ca.due_at<clock_timestamp()",
} as const;
type Queue = keyof typeof queuePredicates;
async function activityFlags(c: QueryClient) {
  return [await crmAvailable(c), await leadsAvailable(c), await projectsAvailable(c)] as const;
}
const clarificationJoin = (flags: readonly [boolean, boolean, boolean]) =>
  `LEFT JOIN ppo.activities ca ON (ca.workspace_id,ca.id)=(t.workspace_id,t.clarification_activity_id) AND ${activityVisibility("ca", ...flags)}`;
// P1 (build plan): the site's current Operator party when visible (the schema allows one at a time), else the
// requester's single current visible relationship organisation; never a choice between candidates. The company
// context is not a customer.
const customerSql = `COALESCE(
    (SELECT CASE WHEN count(DISTINCT o.id)=1 THEN (array_agg(jsonb_build_object('id',o.id,'display_name',o.display_name,'basis','SiteOperator')))[1] END
       FROM ppo.site_parties sp JOIN ppo.organisations o ON (o.workspace_id,o.id)=(sp.workspace_id,sp.organisation_id)
      WHERE sp.workspace_id=t.workspace_id AND sp.site_id=t.site_id AND sp.role='Operator'
        AND sp.valid_from<=clock_timestamp() AND (sp.valid_to IS NULL OR sp.valid_to>clock_timestamp()) AND ${visibility("Organisation", "o")}),
    (SELECT CASE WHEN count(DISTINCT o.id)=1 THEN (array_agg(jsonb_build_object('id',o.id,'display_name',o.display_name,'basis','RequesterRelationship')))[1] END
       FROM ppo.relationships rel JOIN ppo.organisations o ON (o.workspace_id,o.id)=(rel.workspace_id,rel.organisation_id)
      WHERE rel.workspace_id=t.workspace_id AND rel.person_id=t.requester_id
        AND rel.valid_from<=current_date AND (rel.valid_to IS NULL OR rel.valid_to>current_date)
        AND ${scopeSql("rel.company_id")} AND ${visibility("Organisation", "o")}))`;
const workOrdersSql = `COALESCE((SELECT jsonb_agg(jsonb_build_object('id',w.id,'display_number',w.display_number,'status',w.status) ORDER BY w.display_number)
    FROM ppo.work_order_tickets wl JOIN ppo.work_orders w ON (w.workspace_id,w.id)=(wl.workspace_id,wl.work_order_id)
   WHERE wl.workspace_id=t.workspace_id AND wl.ticket_id=t.id AND ${orderVisibility("w")}),'[]'::jsonb)`;
type RegisterRow = IntakeGate & {
  id: string;
  display_number: string;
  summary: string;
  priority: string;
  version: number;
  triage_owner_id: string;
  triage_owner_name: string;
  site_identification_needed: boolean;
  received_at: Date;
  channel: string;
  asset_id: string | null;
  site_number: string | null;
  site_name: string | null;
  asset_number: string | null;
  asset_description: string | null;
  customer: { id: string; display_name: string; basis: "SiteOperator" | "RequesterRelationship" } | null;
  clarification_id: string | null;
  clarification_summary: string | null;
  clarification_status: string | null;
  clarification_due_at: Date | null;
  clarification_due_needed: boolean | null;
  clarification_owner_name: string | null;
  work_orders: { id: string; display_number: string; status: string }[];
  can_edit_intake: boolean;
};
function registerRow(t: RegisterRow) {
  const clarification = t.clarification_id
    ? {
        id: t.clarification_id,
        summary: t.clarification_summary,
        owner_name: t.clarification_owner_name,
        due_at: t.clarification_due_at?.toISOString() ?? null,
        due_needed: t.clarification_due_needed,
        status: t.clarification_status,
      }
    : null;
  return {
    id: t.id,
    display_number: t.display_number,
    summary: t.summary,
    status: t.status,
    priority: t.priority,
    version: t.version,
    triage_owner_id: t.triage_owner_id,
    triage_owner_name: t.triage_owner_name,
    site_id: t.site_id,
    site_identification_needed: t.site_identification_needed,
    received_time_basis: t.received_time_basis,
    received_at: t.received_at.toISOString(),
    channel: t.channel,
    next_action: t.next_action,
    site: t.site_id ? { id: t.site_id, display_number: t.site_number, display_name: t.site_name } : null,
    asset: t.asset_id ? { id: t.asset_id, display_number: t.asset_number, description: t.asset_description } : null,
    customer: t.customer,
    clarification,
    clarification_unavailable: !!t.clarification_activity_id && !clarification,
    triage_blocker_count: ["New", "NeedsInformation"].includes(t.status)
      ? triageBlockers(t, clarification?.status === "Completed").length
      : null,
    work_orders: t.work_orders,
    // Same rule as readIntake's can_edit_intake: the triage and request-information commands stay the authority.
    can_edit_intake: t.can_edit_intake,
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
    "sort",
    "queue",
  ]);
  const status =
      r.status === undefined
        ? null
        : choice(r.status, "status", ["New", "NeedsInformation", "Triaged"]),
    owner = optionalId(r.owner_id, "owner_id"),
    sort = r.sort === undefined ? "id" : choice(r.sort, "sort", ["urgency"]),
    queue =
      r.queue === undefined
        ? null
        : (choice(r.queue, "queue", Object.keys(queuePredicates)) as Queue);
  const pg = page(
    Object.fromEntries(
      Object.entries(r).filter(([k]) => !["status", "owner_id", "sort", "queue"].includes(k)),
    ),
    {
      workspace: p.workspace_id,
      actor: p.actor_id,
      kind: "Ticket",
      status,
      owner,
      // The original binding had no sort or queue; keep its fingerprint so existing cursors stay valid.
      ...(sort === "urgency" ? { sort } : {}),
      ...(queue ? { queue } : {}),
    },
  );
  const flags = await activityFlags(c);
  const keyset =
    sort === "urgency"
      ? `($7::uuid IS NULL OR (${priorityRank("t")},t.received_at,t.display_number,t.id) >
          (SELECT ${priorityRank("k")},k.received_at,k.display_number,k.id FROM ppo.tickets k WHERE k.workspace_id=$1 AND k.id=$7))`
      : "($7::uuid IS NULL OR t.id>$7)";
  const order = sort === "urgency" ? `${priorityRank("t")},t.received_at,t.display_number,t.id` : "t.id";
  const rows = (
    await c.query<RegisterRow>(
      `SELECT t.id,t.display_number,t.summary,t.status,t.priority,t.version,t.triage_owner_id,t.site_id,t.site_identification_needed,t.received_time_basis,
        t.received_at,t.channel,t.next_action,t.requester_id,t.asset_id,t.symptom,t.impact,t.priority_reason,t.clarification_activity_id,
        u.display_name AS triage_owner_name,s.display_number AS site_number,s.display_name AS site_name,a.display_number AS asset_number,a.description AS asset_description,
        ca.id AS clarification_id,ca.summary AS clarification_summary,ca.status AS clarification_status,ca.due_at AS clarification_due_at,ca.due_needed AS clarification_due_needed,
        cu.display_name AS clarification_owner_name,${customerSql} AS customer,${workOrdersSql} AS work_orders,
        (t.status IN ('New','NeedsInformation') AND ${scopeSql("t.company_id", "t.site_id", "service.ticket.edit")}) AS can_edit_intake
      FROM ppo.tickets t
      JOIN ppo.users u ON (u.workspace_id,u.id)=(t.workspace_id,t.triage_owner_id)
      LEFT JOIN ppo.sites s ON (s.workspace_id,s.id)=(t.workspace_id,t.site_id)
      LEFT JOIN ppo.assets a ON (a.workspace_id,a.id)=(t.workspace_id,t.asset_id)
      ${clarificationJoin(flags)}
      LEFT JOIN ppo.users cu ON (cu.workspace_id,cu.id)=(ca.workspace_id,ca.owner_id)
      WHERE ${registerFilters} AND ${keyset} AND ($8::text IS NULL OR t.status=$8) AND ${queue ? queuePredicates[queue] : "TRUE"}
      ORDER BY ${order} LIMIT $9`,
      [
        p.workspace_id,
        p.actor_id,
        pg.company_id,
        pg.site_id,
        pg.q,
        owner,
        pg.after,
        status,
        pg.limit + 1,
      ],
    )
  ).rows;
  return envelope(
    rows.slice(0, pg.limit).map(registerRow),
    rows.length > pg.limit ? pg.cursor(rows[pg.limit - 1].id) : null,
  );
}
// Queue counts for the register (API-R03 amendment, SV-01 I1): the list's filters except status and paging.
export async function ticketQueues(p: Principal, input: unknown = {}) {
  const c = database();
  await requireCapability(c, p, "service.ticket.read");
  const r = object(input, ["q", "company_id", "site_id", "owner_id"]);
  const owner = optionalId(r.owner_id, "owner_id");
  const pg = page(
    Object.fromEntries(Object.entries(r).filter(([k]) => k !== "owner_id")),
    { workspace: p.workspace_id, actor: p.actor_id, kind: "TicketQueues" },
  );
  const flags = await activityFlags(c);
  const counts = (
    await c.query<Record<string, string | Date>>(
      `SELECT clock_timestamp() AS as_at,
        ${Object.entries(queuePredicates).map(([key, predicate]) => `count(*) FILTER (WHERE ${predicate}) AS ${key}`).join(",\n        ")}
      FROM ppo.tickets t ${clarificationJoin(flags)} WHERE ${registerFilters}`,
      [p.workspace_id, p.actor_id, pg.company_id, pg.site_id, pg.q, owner],
    )
  ).rows[0];
  const n = (key: string) => Number(counts[key]);
  return {
    as_at: (counts.as_at as Date).toISOString(),
    all_open: n("all_open"),
    new: n("new"),
    needs_information: n("needs_information"),
    triaged: n("triaged"),
    urgent: n("urgent"),
    overdue_clarifications: n("overdue_clarifications"),
    source: "Synthetic",
  };
}
