import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import { isHostedDemo } from "../platform/demo-config";
import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import {
  canonical,
  lockOperation,
  type OperationReceipt,
} from "../platform/operations";
import {
  choice,
  common,
  commonKeys,
  invalid,
  object,
  optionalId,
  period,
  uuid,
  version,
} from "../shared/validation";
import { requireAccessInspection } from "./service";
import { capabilityCatalogue, isCapability } from "./capabilities";

export const requestableCapability = (key: string) =>
  isCapability(key) && key !== "email.connect" && !key.startsWith("admin.");
type Duty =
  | "admin.access.read"
  | "admin.access.propose"
  | "admin.access.approve"
  | "admin.access.apply";
type Command = "Submit" | "Decide" | "Apply" | "Withdraw";
const commandDuty: Record<Command, Duty> = {
  Submit: "admin.access.propose",
  Decide: "admin.access.approve",
  Apply: "admin.access.apply",
  Withdraw: "admin.access.propose",
};
const notFound = () =>
  new AppError(404, "NotFound", "This access request is unavailable.");
function localOnly() {
  if (isHostedDemo())
    throw new AppError(
      403,
      "LocalOnly",
      "Access requests are available only in the local synthetic prototype.",
    );
}
async function holds(c: QueryClient, p: Principal, duty: Duty) {
  return !!(
    await c.query(
      `SELECT 1 FROM ppo.permission_grants g JOIN ppo.users u
    ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
    WHERE g.workspace_id=$1 AND g.user_id=$2 AND u.active AND u.issuer='PPO-LocalSynthetic'
    AND g.capability=$3 AND g.scope_type='Workspace' AND g.scope_id=$1
    AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())`,
      [p.workspace_id, p.actor_id, duty],
    )
  ).rowCount;
}
async function authority(c: QueryClient, p: Principal, duty?: Duty) {
  localOnly();
  await requireAccessInspection(c, p);
  if (duty && !(await holds(c, p, duty)))
    throw new AppError(
      403,
      "Forbidden",
      "The current Workspace access duty is required.",
    );
}
const columns = `r.*, CASE WHEN subject.issuer='PPO-LocalSynthetic' THEN subject.display_name ELSE 'Hosted identity (masked)' END AS subject_name,
 CASE WHEN requester.issuer='PPO-LocalSynthetic' THEN requester.display_name ELSE 'Hosted identity (masked)' END AS requester_name,
 CASE WHEN reviewer.issuer='PPO-LocalSynthetic' THEN reviewer.display_name ELSE 'Hosted identity (masked)' END AS reviewer_name, co.display_name AS company_name, co.erp_company_id,
 s.display_number AS site_number, s.display_name AS site_name`;
const joins = `FROM ppo.access_change_requests r
 JOIN ppo.users subject ON (subject.workspace_id,subject.id)=(r.workspace_id,r.subject_id)
 JOIN ppo.users requester ON (requester.workspace_id,requester.id)=(r.workspace_id,r.requester_id)
 JOIN ppo.users reviewer ON (reviewer.workspace_id,reviewer.id)=(r.workspace_id,r.reviewer_id)
 LEFT JOIN ppo.companies co ON (co.workspace_id,co.id)=(r.workspace_id,r.company_id)
 LEFT JOIN ppo.sites s ON (s.workspace_id,s.id)=(r.workspace_id,r.site_id)`;
export async function accessRequests(
  p: Principal,
  query: Record<string, string>,
) {
  localOnly();
  const state = query.state
    ? choice(query.state, "state", [
        "Submitted",
        "Approved",
        "Returned",
        "Applied",
        "Withdrawn",
      ])
    : null;
  const offset = Number(query.offset ?? 0);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000)
    invalid("offset", "Choose a valid page.");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await authority(c, p);
    const items = (
      await c.query(
        `SELECT ${columns} ${joins} WHERE r.workspace_id=$1
      AND ($2::text IS NULL OR r.state=$2) ORDER BY r.created_at DESC,r.id LIMIT 51 OFFSET $3`,
        [p.workspace_id, state, offset],
      )
    ).rows;
    await authority(c, p);
    return { items: items.slice(0, 50), has_more: items.length > 50 };
  });
}
export async function accessRequestContext(p: Principal) {
  localOnly();
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await authority(c, p);
    const people = (
      await c.query(
        "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND active AND issuer='PPO-LocalSynthetic' ORDER BY display_name,id",
        [p.workspace_id],
      )
    ).rows;
    const reviewers = [];
    for (const person of people) {
      const candidate = { ...p, actor_id: person.id };
      if (await holds(c, candidate, "admin.access.approve")) {
        const read = (
          await c.query(
            `SELECT 1 FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2
          AND capability='admin.access.read' AND scope_type='Workspace' AND scope_id=$1
          AND valid_from<=clock_timestamp() AND (valid_to IS NULL OR valid_to>clock_timestamp())`,
            [p.workspace_id, person.id],
          )
        ).rowCount;
        if (read) reviewers.push(person);
      }
    }
    const companies = (
      await c.query(
        "SELECT id,display_name,erp_company_id FROM ppo.companies WHERE workspace_id=$1 ORDER BY erp_company_id,id",
        [p.workspace_id],
      )
    ).rows;
    const sites = (
      await c.query(
        "SELECT id,company_id,display_number,display_name FROM ppo.sites WHERE workspace_id=$1 ORDER BY display_number,id",
        [p.workspace_id],
      )
    ).rows;
    const can_submit = await holds(c, p, "admin.access.propose");
    await authority(c, p);
    return {
      actor: p,
      people,
      reviewers,
      companies,
      sites,
      capabilities: capabilityCatalogue.filter((c) =>
        requestableCapability(c.key),
      ),
      can_submit,
    };
  });
}
export async function accessRequest(p: Principal, id: string) {
  localOnly();
  uuid(id, "request_id");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await authority(c, p);
    const row = (
      await c.query(
        `SELECT ${columns} ${joins} WHERE r.workspace_id=$1 AND r.id=$2`,
        [p.workspace_id, id],
      )
    ).rows[0];
    if (!row) throw notFound();
    const history = (
      await c.query(
        `SELECT o.command,o.request_version,o.operation_id,o.receipt,a.reason,a.occurred_at,
      a.actor_id,CASE WHEN u.issuer='PPO-LocalSynthetic' THEN u.display_name ELSE 'Hosted identity (masked)' END AS actor_name FROM ppo.access_change_operations o
      JOIN ppo.audit_events a ON a.id=o.audit_id JOIN ppo.users u ON (u.workspace_id,u.id)=(a.workspace_id,a.actor_id)
      WHERE o.workspace_id=$1 AND o.request_id=$2 ORDER BY o.request_version`,
        [p.workspace_id, id],
      )
    ).rows;
    const can_decide =
      row.state === "Submitted" &&
      row.reviewer_id === p.actor_id &&
      (await holds(c, p, "admin.access.approve"));
    const can_apply =
      row.state === "Approved" &&
      row.subject_id !== p.actor_id &&
      row.reviewer_id !== p.actor_id &&
      (await holds(c, p, "admin.access.apply"));
    const can_withdraw =
      ["Submitted", "Approved"].includes(row.state) &&
      row.requester_id === p.actor_id &&
      (await holds(c, p, "admin.access.propose"));
    await authority(c, p);
    return {
      actor: p,
      request: row,
      history,
      can_decide,
      can_apply,
      can_withdraw,
    };
  });
}
function commandCommon(b: Record<string, unknown>) {
  const input = common(b);
  if (input.reason.length < 10)
    invalid("reason", "Give a reason of 10–1000 characters.");
  return input;
}
async function validProposal(
  c: QueryClient,
  p: Principal,
  b: {
    subject_id: string;
    capability: string;
    scope_type: string;
    scope_id: string;
    company_id: string | null;
    site_id: string | null;
    valid_from: string | Date;
    valid_to: string | Date | null;
  },
) {
  if (!requestableCapability(b.capability))
    invalid(
      "capability",
      "Choose a local business capability; administrative changes and email.connect are outside this increment.",
    );
  const person = (
    await c.query(
      "SELECT 1 FROM ppo.users WHERE workspace_id=$1 AND id=$2 AND active AND issuer='PPO-LocalSynthetic'",
      [p.workspace_id, b.subject_id],
    )
  ).rowCount;
  if (!person)
    invalid("subject_id", "Choose an active local synthetic person.");
  if (b.capability.startsWith("cpq.") && b.scope_type === "Site")
    invalid("scope_type", "CPQ duties require Company or Workspace scope.");
  if (b.scope_type === "Workspace") {
    if (b.scope_id !== p.workspace_id || b.company_id || b.site_id)
      invalid("scope_type", "Workspace scope has no company or site.");
  } else {
    if (
      !b.company_id ||
      !(
        await c.query(
          "SELECT 1 FROM ppo.companies WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, b.company_id],
        )
      ).rowCount
    )
      invalid("company_id", "Choose a company in this workspace.");
    if (
      b.scope_type === "Company" &&
      (b.site_id || b.scope_id !== b.company_id)
    )
      invalid("scope_type", "Company scope has no site.");
    if (
      b.scope_type === "Site" &&
      (!b.site_id ||
        b.scope_id !== b.site_id ||
        !(
          await c.query(
            "SELECT 1 FROM ppo.sites WHERE workspace_id=$1 AND company_id=$2 AND id=$3",
            [p.workspace_id, b.company_id, b.site_id],
          )
        ).rowCount)
    )
      invalid("site_id", "Choose a site belonging to the selected company.");
  }
  await futureStart(c, b.valid_from);
  if (
    (
      await c.query(
        "SELECT 1 FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability=$3 AND scope_type=$4 AND scope_id=$5",
        [p.workspace_id, b.subject_id, b.capability, b.scope_type, b.scope_id],
      )
    ).rowCount
  )
    throw new AppError(
      409,
      "ExistingGrant",
      "A grant already exists at this exact scope, including scheduled or expired grants.",
    );
}
async function futureStart(c: QueryClient, start: string | Date) {
  if (
    !(
      await c.query("SELECT $1::timestamptz>clock_timestamp() AS future", [
        start,
      ])
    ).rows[0].future
  )
    invalid(
      "valid_from",
      "The proposed start must still be in the future. An Approved request cannot be backdated or replaced here.",
    );
}
async function applicationParticipants(
  c: QueryClient,
  p: Principal,
  row: Record<string, unknown>,
) {
  if (p.actor_id === row.subject_id || p.actor_id === row.reviewer_id)
    throw new AppError(
      403,
      "IndependentExecutorRequired",
      "The executor must differ from the affected person and the reviewer.",
    );
  for (const [actor, duty] of [
    [row.requester_id, "admin.access.propose"],
    [row.reviewer_id, "admin.access.approve"],
  ] as const) {
    const candidate = { ...p, actor_id: String(actor) };
    if (
      !(await holds(c, candidate, "admin.access.read")) ||
      !(await holds(c, candidate, duty))
    )
      throw new AppError(
        409,
        "AccessAuthorityChanged",
        "The requester and reviewer must retain their current local Workspace duties before application.",
      );
  }
}
async function eligibleReviewer(
  c: QueryClient,
  p: Principal,
  reviewer: string,
  subject: string,
) {
  if (reviewer === p.actor_id || reviewer === subject || subject === p.actor_id)
    invalid(
      "reviewer_id",
      "Requester, reviewer and affected person must be three different people.",
    );
  const candidate = { ...p, actor_id: reviewer };
  if (!(await holds(c, candidate, "admin.access.approve")))
    invalid("reviewer_id", "Choose a current local Workspace access approver.");
  // Saved working company is relevant when acting, not when nominated.
  const read = (
    await c.query(
      `SELECT 1 FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2
    AND capability='admin.access.read' AND scope_type='Workspace' AND scope_id=$1
    AND valid_from<=clock_timestamp() AND (valid_to IS NULL OR valid_to>clock_timestamp())`,
      [p.workspace_id, reviewer],
    )
  ).rowCount;
  if (!read)
    invalid(
      "reviewer_id",
      "The reviewer also needs current Workspace access inspection.",
    );
}
async function operation(
  p: Principal,
  input: ReturnType<typeof commandCommon> & Record<string, unknown>,
  command: Command,
  mutate: (c: PoolClient) => Promise<Record<string, unknown>>,
  revalidate?: (c: PoolClient, row: Record<string, unknown>) => Promise<void>,
) {
  const hash = createHash("sha256")
    .update(canonical({ command, ...input }))
    .digest("hex");
  try {
    return await transaction(async (c) => {
      await lockOperation(c, p, input.operation_id);
      await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
        p.workspace_id,
      ]);
      // All authority/scope writers are serialized for this bounded local application.
      // Locks include absent grants/working-company rows, so inserts cannot race validation.
      if (command === "Apply")
        await c.query(
          "LOCK TABLE ppo.users, ppo.permission_grants, ppo.working_companies, ppo.companies, ppo.sites IN SHARE ROW EXCLUSIVE MODE",
        );
      else if (command === "Withdraw")
        await c.query(
          "LOCK TABLE ppo.users, ppo.permission_grants, ppo.working_companies IN SHARE ROW EXCLUSIVE MODE",
        );
      await authority(c, p, commandDuty[command]);
      const prior = (
        await c.query(
          "SELECT payload_hash,receipt FROM ppo.access_change_operations WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
          [p.workspace_id, p.actor_id, input.operation_id],
        )
      ).rows[0];
      if (prior) {
        if (prior.payload_hash !== hash)
          throw new AppError(
            409,
            "OperationConflict",
            "This operation ID was already used for different content.",
          );
        return { receipt: prior.receipt as OperationReceipt, replayed: true };
      }
      const row = await mutate(c),
        receipt_id = randomUUID(),
        audit_id = randomUUID();
      const receipt: OperationReceipt = {
        operation_id: input.operation_id,
        record_id: String(row.id),
        record_version: Number(row.version),
        state: String(row.state),
        accepted_at: new Date(
          (row.withdrawn_at ??
            row.applied_at ??
            row.decided_at ??
            row.created_at) as string,
        ).toISOString(),
        receipt_id,
        warnings: [],
        task_ids: [],
      };
      // PostgreSQL's exact row JSON retains its microsecond timestamps for evidence.
      const snapshot = (
        await c.query(
          "SELECT to_jsonb(r) AS value FROM ppo.access_change_requests r WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, row.id],
        )
      ).rows[0].value;
      await c.query(
        `INSERT INTO ppo.audit_events(id,workspace_id,actor_id,object_type,object_id,operation_id,outcome,reason,details)
      VALUES($1,$2,$3,'AccessChangeRequest',$4,$5,'Accepted',$6,$7)`,
        [
          audit_id,
          p.workspace_id,
          p.actor_id,
          row.id,
          input.operation_id,
          input.reason,
          snapshot,
        ],
      );
      await c.query(
        `INSERT INTO ppo.access_change_operations(id,workspace_id,actor_id,operation_id,request_id,request_version,command,payload_hash,audit_id,snapshot,receipt)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          receipt_id,
          p.workspace_id,
          p.actor_id,
          input.operation_id,
          row.id,
          row.version,
          command,
          hash,
          audit_id,
          snapshot,
          receipt,
        ],
      );
      await authority(c, p, commandDuty[command]);
      if (revalidate) await revalidate(c, row);
      return { receipt, replayed: false };
    });
  } catch (e) {
    if ((e as { code?: string }).code === "23505")
      throw new AppError(
        409,
        "RequestConflict",
        "A pending request or accepted operation already exists for this exact identity or grant.",
      );
    throw e;
  }
}
export async function submitAccessRequest(p: Principal, input: unknown) {
  localOnly();
  const b = object(input, [
    ...commonKeys,
    "request_id",
    "subject_id",
    "reviewer_id",
    "capability",
    "scope_type",
    "company_id",
    "site_id",
    "valid_from",
    "valid_to",
  ]);
  const scope_type = choice(b.scope_type, "scope_type", [
      "Workspace",
      "Company",
      "Site",
    ]),
    company_id = optionalId(b.company_id, "company_id"),
    site_id = optionalId(b.site_id, "site_id");
  if (typeof b.capability !== "string")
    invalid("capability", "Choose a capability.");
  const value = {
    ...commandCommon(b),
    request_id: uuid(b.request_id, "request_id"),
    subject_id: uuid(b.subject_id, "subject_id"),
    reviewer_id: uuid(b.reviewer_id, "reviewer_id"),
    capability: b.capability,
    scope_type,
    company_id,
    site_id,
    scope_id:
      scope_type === "Workspace"
        ? p.workspace_id
        : scope_type === "Company"
          ? (company_id ?? "")
          : (site_id ?? ""),
    ...period(b),
  };
  return operation(p, value, "Submit", async (c) => {
    await eligibleReviewer(c, p, value.reviewer_id, value.subject_id);
    await validProposal(c, p, value);
    return (
      await c.query(
        `INSERT INTO ppo.access_change_requests(id,workspace_id,subject_id,requester_id,reviewer_id,capability,scope_type,scope_id,company_id,site_id,valid_from,valid_to,reason)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [
          value.request_id,
          p.workspace_id,
          value.subject_id,
          p.actor_id,
          value.reviewer_id,
          value.capability,
          value.scope_type,
          value.scope_id,
          value.company_id,
          value.site_id,
          value.valid_from,
          value.valid_to,
          value.reason,
        ],
      )
    ).rows[0];
  });
}
export async function decideAccessRequest(
  p: Principal,
  id: string,
  input: unknown,
) {
  localOnly();
  const b = object(input, [...commonKeys, "expected_version", "decision"]);
  const value = {
    ...commandCommon(b),
    request_id: uuid(id, "request_id"),
    expected_version: version(b.expected_version),
    decision: choice(b.decision, "decision", ["Approved", "Returned"]),
  };
  return operation(p, value, "Decide", async (c) => {
    const row = (
      await c.query(
        "SELECT * FROM ppo.access_change_requests WHERE workspace_id=$1 AND id=$2 FOR UPDATE",
        [p.workspace_id, id],
      )
    ).rows[0];
    if (!row) throw notFound();
    if (
      row.reviewer_id !== p.actor_id ||
      row.requester_id === p.actor_id ||
      row.subject_id === p.actor_id
    )
      throw new AppError(
        403,
        "IndependentReviewerRequired",
        "Only the named independent reviewer can decide this request.",
      );
    if (row.version !== value.expected_version || row.state !== "Submitted")
      throw new AppError(
        409,
        "VersionConflict",
        "This request has changed or already been decided. Reload the saved record.",
      );
    if (value.decision === "Approved") await validProposal(c, p, row);
    return (
      await c.query(
        "UPDATE ppo.access_change_requests SET state=$3,version=2,decided_at=clock_timestamp(),decision_reason=$4 WHERE workspace_id=$1 AND id=$2 RETURNING *",
        [p.workspace_id, id, value.decision, value.reason],
      )
    ).rows[0];
  });
}
export async function applyAccessRequest(
  p: Principal,
  id: string,
  input: unknown,
) {
  localOnly();
  const b = object(input, [...commonKeys, "expected_version"]);
  const value = {
    ...commandCommon(b),
    request_id: uuid(id, "request_id"),
    expected_version: version(b.expected_version),
  };
  return operation(
    p,
    value,
    "Apply",
    async (c) => {
      const row = (
        await c.query(
          "SELECT * FROM ppo.access_change_requests WHERE workspace_id=$1 AND id=$2 FOR UPDATE",
          [p.workspace_id, id],
        )
      ).rows[0];
      if (!row) throw notFound();
      await applicationParticipants(c, p, row);
      if (row.version !== value.expected_version || row.state !== "Approved")
        throw new AppError(
          409,
          "VersionConflict",
          "Only the exact Approved version can be applied. Reload the saved request and history.",
        );
      await validProposal(c, p, row);
      const grant_id = randomUUID();
      // Copy dates and scope in PostgreSQL; never reconstitute approved microseconds in JS.
      await c.query(
        `INSERT INTO ppo.permission_grants(id,workspace_id,user_id,capability,scope_type,scope_id,company_id,site_id,valid_from,valid_to)
      SELECT $3,workspace_id,subject_id,capability,scope_type,scope_id,company_id,site_id,valid_from,valid_to
      FROM ppo.access_change_requests WHERE workspace_id=$1 AND id=$2`,
        [p.workspace_id, id, grant_id],
      );
      return (
        await c.query(
          `UPDATE ppo.access_change_requests SET state='Applied',version=3,applied_by=$3,
      applied_at=clock_timestamp(),application_reason=$4,grant_id=$5,
      grant_snapshot=(SELECT to_jsonb(g) FROM ppo.permission_grants g WHERE g.id=$5)
      WHERE workspace_id=$1 AND id=$2 RETURNING *`,
          [p.workspace_id, id, p.actor_id, value.reason, grant_id],
        )
      ).rows[0];
    },
    async (c, row) => {
      await applicationParticipants(c, p, row);
      await futureStart(c, row.valid_from as Date);
    },
  );
}
export async function withdrawAccessRequest(
  p: Principal,
  id: string,
  input: unknown,
) {
  localOnly();
  const b = object(input, [...commonKeys, "expected_version"]);
  const value = {
    ...commandCommon(b),
    request_id: uuid(id, "request_id"),
    expected_version: version(b.expected_version),
  };
  return operation(p, value, "Withdraw", async (c) => {
    const row = (
      await c.query(
        "SELECT * FROM ppo.access_change_requests WHERE workspace_id=$1 AND id=$2 FOR UPDATE",
        [p.workspace_id, id],
      )
    ).rows[0];
    if (!row) throw notFound();
    if (row.requester_id !== p.actor_id)
      throw new AppError(
        403,
        "RequesterRequired",
        "Only the original requester can withdraw this request.",
      );
    if (
      row.version !== value.expected_version ||
      !["Submitted", "Approved"].includes(row.state)
    )
      throw new AppError(
        409,
        "VersionConflict",
        "Only the exact un-applied Submitted or Approved version can be withdrawn. Reload the saved record.",
      );
    return (
      await c.query(
        `UPDATE ppo.access_change_requests SET state='Withdrawn',version=version+1,
       withdrawn_at=clock_timestamp(),withdrawal_reason=$3 WHERE workspace_id=$1 AND id=$2 RETURNING *`,
        [p.workspace_id, id, value.reason],
      )
    ).rows[0];
  });
}
export async function accessRequestReceipt(p: Principal, id: string) {
  localOnly();
  uuid(id, "operation_id");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await authority(c, p);
    const row = (
      await c.query(
        "SELECT command,receipt FROM ppo.access_change_operations WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
        [p.workspace_id, p.actor_id, id],
      )
    ).rows[0];
    if (!row) throw notFound();
    await authority(c, p, commandDuty[row.command as Command]);
    return row.receipt as OperationReceipt;
  });
}
