import { createHash, randomUUID } from "node:crypto";
import { transaction } from "../platform/database";
import { isHostedDemo } from "../platform/demo-config";
import { AppError } from "../platform/errors";
import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import {
  canonical,
  lockOperation,
  type OperationReceipt,
} from "../platform/operations";
import {
  common,
  commonKeys,
  invalid,
  object,
  uuid,
} from "../shared/validation";
import { grantState, requireAccessInspection } from "./service";

function localOnly() {
  if (isHostedDemo())
    throw new AppError(
      403,
      "LocalOnly",
      "Review attestations are available only in the local synthetic prototype.",
    );
}
async function authority(c: QueryClient, p: Principal, attest = false) {
  localOnly();
  await requireAccessInspection(c, p);
  const allowed = (
    await c.query(
      `SELECT 1 FROM ppo.users u WHERE u.workspace_id=$1 AND u.id=$2
    AND u.active AND u.issuer='PPO-LocalSynthetic' AND (NOT $3::boolean OR EXISTS (
      SELECT 1 FROM ppo.permission_grants g WHERE (g.workspace_id,g.user_id)=(u.workspace_id,u.id)
      AND g.capability='admin.access.review.attest' AND g.scope_type='Workspace' AND g.scope_id=$1
      AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())))`,
      [p.workspace_id, p.actor_id, attest],
    )
  ).rowCount;
  if (!allowed)
    throw new AppError(
      403,
      "Forbidden",
      "Current local Workspace review authority is required.",
    );
}
const missing = () =>
  new AppError(
    404,
    "NotFound",
    "This local review record or basis is unavailable.",
  );
const stale = () =>
  new AppError(
    409,
    "ReviewBasisChanged",
    "The reviewed row is no longer the same current basis. Inspect it again before recording a new attestation.",
  );
const hash = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
type Snapshot = {
  team: { id: string; version: number };
  subject: { id: string; active: boolean; issuer: string };
  grant: {
    id: string;
    user_id: string;
    workspace_id: string;
    [key: string]: unknown;
  };
  row_state: string;
};
async function basis(
  c: QueryClient,
  p: Principal,
  team: string,
  grant: string,
) {
  // One statement supplies both the observed row/date state and its timestamp.
  const row = (
    await c.query<{ snapshot: Snapshot; checked_at: string }>(
      `SELECT to_char(statement_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS checked_at,
    jsonb_build_object('team',jsonb_build_object('id',t.id,'version',t.version),
      'subject',jsonb_build_object('id',u.id,'active',u.active,'issuer',u.issuer),
      'grant',to_jsonb(g),'row_state',${grantState}) AS snapshot
    FROM ppo.access_teams t JOIN ppo.access_team_members m ON (m.workspace_id,m.team_id)=(t.workspace_id,t.id)
    JOIN ppo.users u ON (u.workspace_id,u.id)=(m.workspace_id,m.user_id)
    JOIN ppo.permission_grants g ON (g.workspace_id,g.user_id)=(u.workspace_id,u.id)
    WHERE t.workspace_id=$1 AND t.id=$2 AND g.id=$3 AND u.issuer='PPO-LocalSynthetic'`,
      [p.workspace_id, team, grant],
    )
  ).rows[0];
  if (!row) throw missing();
  return { ...row, basis_hash: hash(row.snapshot) };
}
export async function accessReviewBasis(
  p: Principal,
  query: Record<string, string>,
) {
  localOnly();
  const team = uuid(query.team_id, "team_id"),
    grant = uuid(query.grant_id, "grant_id");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await authority(c, p);
    const result = await basis(c, p, team, grant);
    await authority(c, p);
    return result;
  });
}
export async function recordAccessReview(p: Principal, input: unknown) {
  localOnly();
  const b = object(input, [
    ...commonKeys,
    "attestation_id",
    "expected_version",
    "team_id",
    "grant_id",
    "basis_hash",
    "decision",
  ]);
  const command = common(b);
  if (command.reason.length < 10)
    invalid("reason", "Explain this review in 10–1000 characters.");
  if (b.expected_version !== 0)
    invalid(
      "expected_version",
      "A new attestation requires expected version 0.",
    );
  if (b.decision !== "Keep")
    invalid("decision", "Only Keep is implemented in this local increment.");
  if (typeof b.basis_hash !== "string" || !/^[a-f0-9]{64}$/.test(b.basis_hash))
    invalid("basis_hash", "Inspect the exact grant basis first.");
  const value = {
    ...command,
    attestation_id: uuid(b.attestation_id, "attestation_id"),
    expected_version: 0,
    team_id: uuid(b.team_id, "team_id"),
    grant_id: uuid(b.grant_id, "grant_id"),
    basis_hash: b.basis_hash,
    decision: "Keep",
  };
  const payloadHash = hash({ command: "RecordAttestation", ...value });
  try {
    return await transaction(async (c) => {
      await lockOperation(c, p, value.operation_id);
      await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
        p.workspace_id,
      ]);
      await c.query(
        "LOCK TABLE ppo.users,ppo.permission_grants,ppo.working_companies IN SHARE ROW EXCLUSIVE MODE",
      );
      await authority(c, p, true);
      const prior = (
        await c.query(
          "SELECT payload_hash,receipt FROM ppo.access_review_operations WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
          [p.workspace_id, p.actor_id, value.operation_id],
        )
      ).rows[0];
      if (prior) {
        if (prior.payload_hash !== payloadHash)
          throw new AppError(
            409,
            "OperationConflict",
            "This operation ID was already used for different content.",
          );
        return { receipt: prior.receipt as OperationReceipt, replayed: true };
      }
      const observed = await basis(c, p, value.team_id, value.grant_id);
      if (observed.snapshot.subject.id === p.actor_id)
        throw new AppError(
          403,
          "SelfReview",
          "A different authorised person must review this access.",
        );
      if (
        observed.snapshot.row_state !== "Current" ||
        observed.basis_hash !== value.basis_hash
      )
        throw stale();
      const row = (
        await c.query(
          `INSERT INTO ppo.access_review_attestations
        (id,workspace_id,team_id,subject_id,grant_id,actor_id,reason,basis_hash,basis_snapshot,checked_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
          [
            value.attestation_id,
            p.workspace_id,
            value.team_id,
            observed.snapshot.subject.id,
            value.grant_id,
            p.actor_id,
            value.reason,
            value.basis_hash,
            observed.snapshot,
            observed.checked_at,
          ],
        )
      ).rows[0];
      const receiptId = randomUUID(),
        auditId = randomUUID();
      const receipt: OperationReceipt = {
        receipt_id: receiptId,
        operation_id: value.operation_id,
        record_id: value.attestation_id,
        record_version: 1,
        state: "Recorded",
        accepted_at: new Date(row.created_at).toISOString(),
        warnings: [],
        task_ids: [],
      };
      const snapshot = (
        await c.query(
          "SELECT to_jsonb(r) AS value FROM ppo.access_review_attestations r WHERE id=$1",
          [value.attestation_id],
        )
      ).rows[0].value;
      await c.query(
        `INSERT INTO ppo.audit_events(id,workspace_id,actor_id,object_type,object_id,operation_id,outcome,reason,details)
        VALUES($1,$2,$3,'AccessReview',$4,$5,'Accepted',$6,$7)`,
        [
          auditId,
          p.workspace_id,
          p.actor_id,
          value.attestation_id,
          value.operation_id,
          value.reason,
          snapshot,
        ],
      );
      await c.query(
        `INSERT INTO ppo.access_review_operations(id,workspace_id,actor_id,operation_id,attestation_id,payload_hash,audit_id,snapshot,receipt)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          receiptId,
          p.workspace_id,
          p.actor_id,
          value.operation_id,
          value.attestation_id,
          payloadHash,
          auditId,
          snapshot,
          receipt,
        ],
      );
      // Locks prevent row changes, but time can still cross a grant/duty boundary.
      if (
        (await basis(c, p, value.team_id, value.grant_id)).basis_hash !==
        value.basis_hash
      )
        throw stale();
      await authority(c, p, true);
      return { receipt, replayed: false };
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505")
      throw new AppError(
        409,
        "ReviewConflict",
        "An attestation or accepted operation already exists for this exact identity.",
      );
    throw error;
  }
}
export async function recoverAccessReview(p: Principal, id: string) {
  localOnly();
  uuid(id, "operation_id");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await authority(c, p, true);
    const row = (
      await c.query(
        "SELECT receipt FROM ppo.access_review_operations WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
        [p.workspace_id, p.actor_id, id],
      )
    ).rows[0];
    if (!row) throw missing();
    await authority(c, p, true);
    return row.receipt as OperationReceipt;
  });
}
const joins = `FROM ppo.access_review_attestations r JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.subject_id)
  JOIN ppo.users a ON (a.workspace_id,a.id)=(r.workspace_id,r.actor_id)`;
const names = `CASE WHEN u.issuer='PPO-LocalSynthetic' THEN u.display_name ELSE 'Hosted identity (masked)' END AS subject_name,
  CASE WHEN a.issuer='PPO-LocalSynthetic' THEN a.display_name ELSE 'Hosted identity (masked)' END AS actor_name`;
export async function accessReviews(
  p: Principal,
  query: Record<string, string> = {},
) {
  localOnly();
  const offset = Number(query.offset ?? 0);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000)
    invalid("offset", "Choose a valid page.");
  const team = query.team_id ? uuid(query.team_id, "team_id") : null;
  const subject = query.subject_id
    ? uuid(query.subject_id, "subject_id")
    : null;
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await authority(c, p);
    const items = (
      await c.query(
        `SELECT r.id,r.team_id,r.subject_id,r.actor_id,r.decision,r.state,r.version,r.created_at,${names} ${joins}
      WHERE r.workspace_id=$1 AND ($2::uuid IS NULL OR r.team_id=$2) AND ($3::uuid IS NULL OR r.subject_id=$3)
      ORDER BY r.created_at DESC,r.id LIMIT 51 OFFSET $4`,
        [p.workspace_id, team, subject, offset],
      )
    ).rows;
    await authority(c, p);
    return { items: items.slice(0, 50), has_more: items.length > 50 };
  });
}
export async function accessReview(p: Principal, id: string) {
  localOnly();
  uuid(id, "attestation_id");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await authority(c, p);
    // Withhold historical grant data and free text if either identity becomes hosted.
    const row = (
      await c.query(
        `SELECT r.id,r.team_id,r.subject_id,r.actor_id,r.decision,r.state,r.version,r.created_at,${names},
      u.issuer<>'PPO-LocalSynthetic' OR a.issuer<>'PPO-LocalSynthetic' AS masked,
      CASE WHEN u.issuer='PPO-LocalSynthetic' AND a.issuer='PPO-LocalSynthetic' THEN r.reason ELSE NULL END AS reason,
      CASE WHEN u.issuer='PPO-LocalSynthetic' AND a.issuer='PPO-LocalSynthetic' THEN r.basis_snapshot ELSE NULL END AS basis_snapshot,
      to_char(r.checked_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS checked_at,
      o.operation_id,o.audit_id ${joins} JOIN ppo.access_review_operations o ON o.attestation_id=r.id
      WHERE r.workspace_id=$1 AND r.id=$2`,
        [p.workspace_id, id],
      )
    ).rows[0];
    if (!row) throw missing();
    await authority(c, p);
    return row;
  });
}
