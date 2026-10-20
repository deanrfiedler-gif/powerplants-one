import { createHash, randomUUID } from "node:crypto";
import { canonical } from "../../platform/operations";
import type { QueryClient } from "../../platform/permissions";
import type { Principal } from "../../platform/identity";
import { AppError } from "../../platform/errors";
import {
  parseContent,
  type CsRow,
  type ReadinessContent,
  type Requirement,
} from "./model";

const fingerprint = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
export type RequirementsDraft = {
  id: string;
  revision: number;
  recorded_by: string;
  recorded_at: Date;
  state: "Pending" | "Reviewed" | "Returned";
  basis: {
    purpose: "ReadinessRequirements";
    draft_id: string;
    base_requirements_hash: string;
    contributors: string[];
    requirements: Requirement[];
    content: ReadinessContent;
  };
};

/** A row version serialises each draft save; events never mutate an issued snapshot. */
export async function latestRequirementsDraft(
  c: QueryClient,
  p: Principal,
  row: CsRow,
) {
  return (
    (
      await c.query<RequirementsDraft>(
        `SELECT s.id,s.revision,s.recorded_by,s.recorded_at,s.basis,
      COALESCE((SELECT e.kind FROM ppo.cs_record_events e
        WHERE e.workspace_id=s.workspace_id AND e.snapshot_id=s.id
          AND e.kind IN ('Reviewed','Returned') ORDER BY e.recorded_at DESC,e.id DESC LIMIT 1),'Pending') AS state
     FROM ppo.cs_snapshots s WHERE s.workspace_id=$1 AND s.record_id=$2
       AND s.kind='Submission' AND s.basis->>'purpose'='ReadinessRequirements'
     ORDER BY s.record_version DESC,s.recorded_at DESC,s.id DESC LIMIT 1`,
        [p.workspace_id, row.id],
      )
    ).rows[0] ?? null
  );
}

export function parseRequirementsDraft(row: CsRow, requirements: unknown) {
  return (
    parseContent(
      "Readiness",
      {
        schema_version: 1,
        requirements,
        evidence: [],
        windows: [],
      },
      row.content,
    ) as ReadinessContent
  ).requirements;
}

export async function retainRequirementsDraft(
  c: QueryClient,
  p: Principal,
  row: CsRow,
  requirements: Requirement[],
) {
  const prior = await latestRequirementsDraft(c, p, row);
  const active = row.content as ReadinessContent;
  const pending = prior && prior.state !== "Reviewed" ? prior : null;
  // A retired identifier must never make old reviewed evidence current again.
  const addedIds = requirements
    .filter((r) => !active.requirements.some((a) => a.id === r.id))
    .map((r) => r.id);
  if (
    addedIds.length &&
    (
      await c.query(
        `SELECT 1 FROM ppo.cs_record_revisions r,
       jsonb_array_elements(r.content->'content'->'requirements') requirement
     WHERE r.workspace_id=$1 AND r.record_id=$2 AND requirement->>'id'=ANY($3::text[]) LIMIT 1`,
        [p.workspace_id, row.id, addedIds],
      )
    ).rowCount
  )
    throw new AppError(
      409,
      "RetiredRequirement",
      "A retired requirement ID cannot be reused. Add a new requirement so old evidence cannot clear it.",
    );
  const basis: RequirementsDraft["basis"] = {
    purpose: "ReadinessRequirements",
    draft_id: pending?.basis.draft_id ?? randomUUID(),
    base_requirements_hash: fingerprint(active.requirements),
    contributors: [
      ...new Set([...(pending?.basis.contributors ?? []), p.actor_id]),
    ],
    requirements,
    // Retain the proposed source for authority checks, without copying live evidence into the draft.
    content: { schema_version: 1, requirements, evidence: [], windows: [] },
  };
  await c.query(
    `INSERT INTO ppo.cs_snapshots(id,workspace_id,record_id,record_version,revision,kind,basis,content_hash,recorded_by)
     VALUES($1,$2,$3,$4,$5,'Submission',$6,$7,$8)`,
    [
      randomUUID(),
      p.workspace_id,
      row.id,
      row.version,
      row.revision + 1,
      basis,
      fingerprint(basis),
      p.actor_id,
    ],
  );
}

export async function reviewRequirementsDraft(
  c: QueryClient,
  p: Principal,
  row: CsRow,
  snapshotId: string | null,
  reason: string,
  returnDraft: boolean,
) {
  const draft = await latestRequirementsDraft(c, p, row);
  if (
    !draft ||
    draft.id !== snapshotId ||
    draft.state !== "Pending" ||
    draft.basis.base_requirements_hash !==
      fingerprint((row.content as ReadinessContent).requirements)
  )
    throw new AppError(
      409,
      "SourceChanged",
      "This requirements draft is no longer current. Reload the latest revision; nothing was published.",
    );
  if (draft.basis.contributors.includes(p.actor_id))
    throw new AppError(
      409,
      "IndependentReviewRequired",
      "Another permitted editor must review this requirements revision.",
    );
  await c.query(
    `INSERT INTO ppo.cs_record_events(id,workspace_id,record_id,snapshot_id,kind,details,recorded_by)
     VALUES($1,$2,$3,$4,$5,$6,$7)`,
    [
      randomUUID(),
      p.workspace_id,
      row.id,
      draft.id,
      returnDraft ? "Returned" : "Reviewed",
      {
        purpose: "ReadinessRequirements",
        reason,
        revision: draft.revision,
        work_authority: "Not granted",
      },
      p.actor_id,
    ],
  );
  return draft;
}
