import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { database } from "../../platform/database";
import { AppError, unavailable } from "../../platform/errors";
import {
  hasPermission,
  requireCapability,
  scopeSql,
  type QueryClient,
} from "../../platform/permissions";
import { canonical, sharedOperation } from "../../platform/operations";
import { activityLinks, visibleActivity } from "../../activities/activities";
import { companyContext, scopedOwner } from "../authority";
import { visible, visibility } from "../reads";
import {
  choice,
  common,
  commonKeys,
  instant,
  invalid,
  label,
  object,
  optionalId,
  uuid,
  version,
} from "../validation";
import { currentVersion } from "../contacts/commands";
import {
  emptyContent,
  ids,
  kinds,
  parseContent,
  tables,
  types,
  type CsKind,
  type CsRow,
  type CsContent,
  type ReadinessContent,
  type SurveyContent,
  type PlanContent,
  type PreparationBasis,
} from "./model";
import { assessPreparation } from "./readiness";

export const hash = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
export async function csRecord(
  c: QueryClient,
  p: Principal,
  kind: CsKind,
  id: string,
  edit = false,
): Promise<CsRow> {
  const row = (
    await c.query<CsRow>(
      `SELECT * FROM ppo.${tables[kind]} WHERE workspace_id=$1 AND id=$2`,
      [p.workspace_id, uuid(id, "id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  await companyContext(
    c,
    p,
    row.company_id,
    row.site_id,
    edit ? "shared.edit" : "shared.read",
  );
  await visible(
    c,
    p,
    kind === "AccountPlan" ? "Organisation" : "Site",
    row.organisation_id ?? row.site_id!,
  );
  return row;
}
async function visitorContext(
  c: QueryClient,
  p: Principal,
  row: CsRow,
  id: string,
) {
  const person = await visible(c, p, "Person", id);
  if (
    !person.active ||
    !(
      await c.query(
        "SELECT 1 FROM ppo.person_company_contexts WHERE workspace_id=$1 AND company_id=$2 AND person_id=$3",
        [p.workspace_id, row.company_id, id],
      )
    ).rowCount
  )
    throw unavailable();
  return person;
}
async function exactActivity(
  c: QueryClient,
  p: Principal,
  row: CsRow,
  id: string,
  open = false,
) {
  const activity = await visibleActivity(c, p, id),
    links = await activityLinks(c, p, id);
  if (
    activity.company_id !== row.company_id ||
    !links.some(
      (l) =>
        l.object_type === (row.site_id ? "Site" : "Organisation") &&
        l.object_id === (row.site_id ?? row.organisation_id),
    )
  )
    throw unavailable();
  if (
    open &&
    (!["Open", "InProgress"].includes(activity.status) ||
      !activity.owner_id ||
      !activity.due_at)
  )
    invalid(
      "activity_id",
      "Each significant gap needs an open owned Activity with a recorded due date, linked to this Site.",
    );
  return activity;
}
export async function contentAuthority(
  c: QueryClient,
  p: Principal,
  kind: CsKind,
  row: CsRow,
  content: CsContent,
  submitting = false,
) {
  const facilityIds = new Set<string>(),
    assetIds = new Set<string>(),
    personIds = new Set<string>(),
    activityIds = new Set<string>();
  if (kind === "Readiness") {
    const x = content as ReadinessContent;
    for (const item of [...x.requirements, ...x.evidence, ...x.windows])
      if (item.facility_id) facilityIds.add(item.facility_id);
    for (const item of x.evidence)
      if (item.person_id) personIds.add(item.person_id);
  } else if (kind === "Survey") {
    const x = content as SurveyContent;
    for (const id of x.facility_ids) facilityIds.add(id);
    for (const id of x.asset_ids) assetIds.add(id);
    for (const o of x.observations) {
      if (o.facility_id && !facilityIds.has(o.facility_id))
        invalid(
          "facility_id",
          "The observation target must be in this exact survey scope.",
        );
      if (o.asset_id && !assetIds.has(o.asset_id))
        invalid(
          "asset_id",
          "The equipment target must be in this exact survey scope.",
        );
      if (o.activity_id) activityIds.add(o.activity_id);
      if (
        submitting &&
        o.significant &&
        ["Assumption", "Unknown"].includes(o.kind)
      ) {
        if (!o.activity_id)
          invalid(
            "activity_id",
            "Assign an owned follow-up to each significant Unknown or Assumption before submission.",
          );
        await exactActivity(c, p, row, o.activity_id!, true);
      }
    }
    if (submitting && !x.observations.length)
      invalid("observations", "Record observations before submission.");
  } else {
    const x = content as PlanContent;
    for (const id of x.activity_ids) activityIds.add(id);
    for (const visit of x.visits) {
      if (visit.activity_id) activityIds.add(visit.activity_id);
      if (visit.site_id) {
        const s = await visible(c, p, "Site", visit.site_id);
        if (
          s.company_id !== row.company_id ||
          !(
            await c.query(
              "SELECT 1 FROM ppo.site_parties WHERE workspace_id=$1 AND site_id=$2 AND organisation_id=$3 AND valid_from<=clock_timestamp() AND (valid_to IS NULL OR valid_to>clock_timestamp())",
              [p.workspace_id, s.id, row.organisation_id],
            )
          ).rowCount
        )
          throw unavailable();
      }
    }
  }
  const dependencies: Record<string, number> = {};
  const parent = await visible(
    c,
    p,
    row.site_id ? "Site" : "Organisation",
    row.site_id ?? row.organisation_id!,
  );
  dependencies[`context:${parent.id}`] = parent.version;
  for (const id of facilityIds) {
    const f = await visible(c, p, "Facility", id);
    if (f.site_id !== row.site_id || f.company_id !== row.company_id)
      throw unavailable();
    dependencies[`facility:${id}`] = f.version;
  }
  for (const id of assetIds) {
    const a = await visible(c, p, "Asset", id);
    if (
      kind === "Survey" &&
      (content as SurveyContent).observations.some(
        (o) =>
          o.asset_id === id &&
          o.facility_id !== null &&
          o.facility_id !== a.facility_id,
      )
    )
      invalid(
        "facility_id",
        "The observation's equipment and Facility targets must match the canonical installed location.",
      );
    if (a.site_id !== row.site_id || a.company_id !== row.company_id)
      throw unavailable();
    if (a.facility_id && !facilityIds.has(a.facility_id))
      invalid(
        "facility_ids",
        "Include the equipment's installed Facility in the survey scope.",
      );
    dependencies[`asset:${id}`] = a.version;
  }
  for (const id of personIds) {
    const person = await visible(c, p, "Person", id);
    if (
      !(
        await c.query(
          "SELECT 1 FROM ppo.person_company_contexts WHERE workspace_id=$1 AND company_id=$2 AND person_id=$3",
          [p.workspace_id, row.company_id, id],
        )
      ).rowCount
    )
      throw unavailable();
    dependencies[`person:${id}`] = person.version;
  }
  for (const id of activityIds) {
    const a = await exactActivity(c, p, row, id);
    dependencies[`activity:${id}`] = a.version;
  }
  return dependencies;
}
async function retain(c: PoolClient, p: Principal, row: CsRow, reason: string) {
  await c.query(
    "INSERT INTO ppo.cs_record_revisions(id,workspace_id,record_id,version,revision,content,content_hash,state,recorded_by,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
    [
      randomUUID(),
      p.workspace_id,
      row.id,
      row.version,
      row.revision,
      { name: row.name, owner_id: row.owner_id, content: row.content },
      hash({ name: row.name, owner_id: row.owner_id, content: row.content }),
      row.state,
      p.actor_id,
      reason,
    ],
  );
}
async function update(
  c: PoolClient,
  p: Principal,
  kind: CsKind,
  row: CsRow,
  reason: string,
  values: Partial<
    Pick<CsRow, "content" | "state" | "revision" | "name" | "owner_id">
  > = {},
) {
  const next = { ...row, ...values };
  const saved = (
    await c.query<CsRow>(
      `UPDATE ppo.${tables[kind]} SET content=$3,state=$4,revision=$5,name=$6,owner_id=$7,version=version+1,updated_at=clock_timestamp(),updated_by=$8 WHERE workspace_id=$1 AND id=$2 RETURNING *`,
      [
        p.workspace_id,
        row.id,
        next.content,
        next.state,
        next.revision,
        next.name,
        next.owner_id,
        p.actor_id,
      ],
    )
  ).rows[0];
  await retain(c, p, saved, reason);
  return {
    ...saved,
    audit_details: {
      previous_version: row.version,
      before: {
        name: row.name,
        owner_id: row.owner_id,
        state: row.state,
        revision: row.revision,
        content_hash: hash(row.content),
      },
      after: {
        name: saved.name,
        owner_id: saved.owner_id,
        state: saved.state,
        revision: saved.revision,
        content_hash: hash(saved.content),
      },
    },
  };
}
export async function createCs(p: Principal, kind: CsKind, input: unknown) {
  const r = object(input, [
      ...commonKeys,
      "id",
      "context_id",
      "name",
      "owner_id",
    ]),
    command = {
      ...common(r),
      id: uuid(r.id, "id"),
      context_id: uuid(r.context_id, "context_id"),
      name: label(r.name, "name", 200),
      owner_id: uuid(r.owner_id, "owner_id"),
      kind,
    };
  return sharedOperation(
    p,
    command,
    `CsCreate:${kind}`,
    async (c) => {
      const context = await visible(
        c,
        p,
        kind === "AccountPlan" ? "Organisation" : "Site",
        command.context_id,
      );
      await companyContext(
        c,
        p,
        context.company_id,
        kind === "AccountPlan" ? null : context.id,
        "shared.create",
      );
      await scopedOwner(
        c,
        p,
        command.owner_id,
        context.company_id,
        kind === "AccountPlan" ? undefined : context.id,
        "shared.edit",
      );
      return context;
    },
    async (c, context) => {
      const row = (
        await c.query<CsRow>(
          `INSERT INTO ppo.${tables[kind]}(id,workspace_id,company_id,site_id,organisation_id,name,owner_id,content,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9) RETURNING *`,
          [
            command.id,
            p.workspace_id,
            context.company_id,
            kind === "AccountPlan" ? null : context.id,
            kind === "AccountPlan" ? context.id : null,
            command.name,
            command.owner_id,
            emptyContent(kind),
            p.actor_id,
          ],
        )
      ).rows[0];
      await retain(c, p, row, command.reason);
      return row;
    },
    types[kind],
    "SharedRecordCreated",
  );
}
export async function saveCs(
  p: Principal,
  kind: CsKind,
  id: string,
  input: unknown,
) {
  const r = object(input, [
      ...commonKeys,
      "expected_version",
      "name",
      "owner_id",
      "content",
    ]),
    command = {
      ...common(r),
      id: uuid(id, "id"),
      kind,
      expected_version: version(r.expected_version),
      name: label(r.name, "name", 200),
      owner_id: uuid(r.owner_id, "owner_id"),
      content: r.content,
    };
  return sharedOperation(
    p,
    command,
    `CsSave:${kind}`,
    (c) => csRecord(c, p, kind, id, true),
    async (c, row) => {
      currentVersion(row.version, command.expected_version);
      if (row.state !== "Draft")
        throw new AppError(
          409,
          "StateConflict",
          "Start a new draft revision before changing this reviewed or submitted content.",
        );
      const content = parseContent(kind, command.content, row.content);
      await contentAuthority(c, p, kind, row, content);
      await scopedOwner(
        c,
        p,
        command.owner_id,
        row.company_id,
        row.site_id ?? undefined,
        "shared.edit",
      );
      if (kind === "Survey") {
        const x = content as SurveyContent;
        const photos = (
          await c.query(
            "SELECT facility_id,asset_id FROM ppo.cs_survey_photos WHERE workspace_id=$1 AND survey_id=$2",
            [p.workspace_id, id],
          )
        ).rows;
        for (const photo of photos)
          if (
            (photo.facility_id &&
              !x.facility_ids.includes(photo.facility_id)) ||
            (photo.asset_id && !x.asset_ids.includes(photo.asset_id))
          )
            invalid(
              "scope",
              "A scope change must retain every original photo target.",
            );
      }
      return update(c, p, kind, row, command.reason, {
        content,
        name: command.name,
        owner_id: command.owner_id,
        ...(kind === "Survey" ? {} : { revision: row.revision + 1 }),
      });
    },
    types[kind],
    "SharedRecordUpdated",
  );
}
async function event(
  c: QueryClient,
  p: Principal,
  row: CsRow,
  kind: string,
  details: unknown,
  snapshotId: string | null = null,
) {
  await c.query(
    "INSERT INTO ppo.cs_record_events(id,workspace_id,record_id,snapshot_id,kind,details,recorded_by) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [
      randomUUID(),
      p.workspace_id,
      row.id,
      snapshotId,
      kind,
      details,
      p.actor_id,
    ],
  );
}
export async function sourceBasis(
  c: QueryClient,
  p: Principal,
  kind: CsKind,
  row: CsRow,
) {
  const dependencies = await contentAuthority(c, p, kind, row, row.content);
  const reviews = (
    await c.query(
      "SELECT id,details,recorded_by FROM ppo.cs_record_events WHERE workspace_id=$1 AND record_id=$2 AND kind='EvidenceReviewed' ORDER BY recorded_at,id",
      [p.workspace_id, row.id],
    )
  ).rows;
  const photos =
    kind === "Survey"
      ? (
          await c.query(
            `SELECT p.id,p.facility_id,p.asset_id,p.observer,p.captured_on::text,p.method_source,p.content_hash,p.byte_count,p.recorded_by,p.recorded_at,
    (SELECT jsonb_build_object('id',c.id,'caption',c.caption) FROM ppo.cs_photo_captions c WHERE c.workspace_id=p.workspace_id AND c.photo_id=p.id ORDER BY c.recorded_at DESC,c.id LIMIT 1) AS caption
    FROM ppo.cs_survey_photos p WHERE p.workspace_id=$1 AND p.survey_id=$2 ORDER BY p.id`,
            [p.workspace_id, row.id],
          )
        ).rows
      : [];
  return {
    name: row.name,
    owner_id: row.owner_id,
    revision: row.revision,
    content: row.content,
    dependencies,
    reviews,
    photos,
  };
}
export async function csAction(
  p: Principal,
  kind: CsKind,
  id: string,
  input: unknown,
) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "action",
    "snapshot_id",
    "evidence_id",
    "preparation",
    "destination",
    "receiving_owner_id",
  ]);
  const command = {
    ...common(r),
    id: uuid(id, "id"),
    kind,
    expected_version: version(r.expected_version),
    action: choice(r.action, "action", [
      "prepare",
      "acknowledge",
      "review_evidence",
      "submit",
      "return",
      "review",
      "revise",
      "handover",
      "review_plan",
    ] as const),
    snapshot_id: optionalId(r.snapshot_id, "snapshot_id"),
    evidence_id: optionalId(r.evidence_id, "evidence_id"),
    preparation: r.preparation ?? null,
    destination: r.destination ?? null,
    receiving_owner_id: optionalId(r.receiving_owner_id, "receiving_owner_id"),
  };
  return sharedOperation(
    p,
    command,
    `CsAction:${kind}:${command.action}`,
    (c) => csRecord(c, p, kind, id, true),
    async (c, row) => {
      currentVersion(row.version, command.expected_version);
      const basis = await sourceBasis(c, p, kind, row);
      const snapshot = command.snapshot_id
        ? (
            await c.query(
              "SELECT * FROM ppo.cs_snapshots WHERE workspace_id=$1 AND record_id=$2 AND id=$3",
              [p.workspace_id, row.id, command.snapshot_id],
            )
          ).rows[0]
        : null;
      const snapshotCurrent = () => {
        if (
          !snapshot ||
          snapshot.revision !== row.revision ||
          snapshot.content_hash !== hash(basis)
        )
          throw new AppError(
            409,
            "SourceChanged",
            "The exact source has changed. Recheck or submit a successor revision; retained snapshots remain unchanged.",
          );
      };
      const addSnapshot = async (snapshotKind: string, data: unknown) => {
        const snapshotId = randomUUID();
        await c.query(
          "INSERT INTO ppo.cs_snapshots(id,workspace_id,record_id,record_version,revision,kind,basis,content_hash,recorded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
          [
            snapshotId,
            p.workspace_id,
            row.id,
            row.version,
            row.revision,
            snapshotKind,
            data,
            hash(basis),
            p.actor_id,
          ],
        );
        return snapshotId;
      };
      if (kind === "Readiness") {
        if (command.action === "review_evidence") {
          const evidence = (row.content as ReadinessContent).evidence.find(
            (e) => e.id === command.evidence_id,
          );
          if (!evidence) throw unavailable();
          const captures = (
            await c.query(
              "SELECT recorded_by FROM ppo.cs_record_revisions WHERE workspace_id=$1 AND record_id=$2 AND content->'content'->'evidence' @> $3::jsonb ORDER BY version LIMIT 1",
              [p.workspace_id, id, JSON.stringify([evidence])],
            )
          ).rows;
          if (captures[0]?.recorded_by === p.actor_id)
            throw new AppError(
              409,
              "IndependentReviewRequired",
              "Another permitted editor must review this captured evidence.",
            );
          await event(c, p, row, "EvidenceReviewed", {
            evidence_id: evidence.id,
            evidence_hash: hash(evidence),
            reason: command.reason,
          });
        } else if (command.action === "prepare") {
          const x = object(command.preparation, [
              "facility_ids",
              "activity",
              "starts_at",
              "ends_at",
              "person_ids",
            ]),
            preparation: PreparationBasis = {
              facility_ids: ids(x.facility_ids, "facility_ids"),
              activity: label(x.activity, "activity", 100),
              starts_at: instant(x.starts_at, "starts_at"),
              ends_at: instant(x.ends_at, "ends_at"),
              person_ids: ids(x.person_ids, "person_ids"),
            };
          if (preparation.ends_at <= preparation.starts_at)
            invalid(
              "ends_at",
              "The whole attendance interval must end after it starts.",
            );
          for (const f of preparation.facility_ids) {
            const facility = await visible(c, p, "Facility", f);
            if (facility.site_id !== row.site_id) throw unavailable();
            basis.dependencies[`selected-facility:${f}`] = facility.version;
          }
          for (const personId of preparation.person_ids) {
            const person = await visible(c, p, "Person", personId);
            if (
              !person.active ||
              !(
                await c.query(
                  "SELECT 1 FROM ppo.person_company_contexts WHERE workspace_id=$1 AND company_id=$2 AND person_id=$3",
                  [p.workspace_id, row.company_id, personId],
                )
              ).rowCount
            )
              throw unavailable();
            basis.dependencies[`visitor:${personId}`] = person.version;
          }
          const site = await visible(c, p, "Site", row.site_id!);
          const assessment = assessPreparation(
            row.content as ReadinessContent,
            preparation,
            String(site.timezone),
            basis.reviews.map((r) => r.details.evidence_hash),
          );
          await addSnapshot("Preparation", {
            ...basis,
            preparation,
            assessment,
          });
        } else if (command.action === "acknowledge") {
          if (!snapshot || snapshot.kind !== "Preparation") throw unavailable();
          // Recompute selected-context versions, not only source requirement fields.
          for (const f of snapshot.basis.preparation.facility_ids) {
            const facility = await visible(c, p, "Facility", f);
            if (facility.site_id !== row.site_id) throw unavailable();
            basis.dependencies[`selected-facility:${f}`] = facility.version;
          }
          for (const visitor of snapshot.basis.preparation.person_ids) {
            const person = await visitorContext(c, p, row, visitor);
            basis.dependencies[`visitor:${visitor}`] = person.version;
          }
          snapshotCurrent();
          await event(
            c,
            p,
            row,
            "Acknowledged",
            {
              reason: command.reason,
              work_authority: "Not granted",
              blockers: snapshot.basis.assessment.blockers,
            },
            snapshot.id,
          );
        } else
          invalid(
            "action",
            "Choose a readiness preparation, evidence review or acknowledgement action.",
          );
        return update(c, p, kind, row, command.reason);
      }
      if (kind === "AccountPlan") {
        if (command.action !== "review_plan")
          invalid("action", "Use the account-plan review action.");
        const sid = await addSnapshot("PlanReview", basis);
        await event(c, p, row, "PlanReviewed", { reason: command.reason }, sid);
        return update(c, p, kind, row, command.reason);
      }
      if (command.action === "submit") {
        if (row.state !== "Draft")
          throw new AppError(
            409,
            "StateConflict",
            "Only a Draft survey can be submitted.",
          );
        await contentAuthority(c, p, kind, row, row.content, true);
        await addSnapshot("Submission", basis);
        return update(c, p, kind, row, command.reason, { state: "Submitted" });
      }
      if (command.action === "revise") {
        if (!["Returned", "Reviewed"].includes(row.state))
          throw new AppError(
            409,
            "StateConflict",
            "A successor draft starts from a Returned or Reviewed survey.",
          );
        return update(c, p, kind, row, command.reason, {
          state: "Draft",
          revision: row.revision + 1,
        });
      }
      if (command.action === "return" || command.action === "review") {
        if (
          row.state !== "Submitted" ||
          !snapshot ||
          snapshot.kind !== "Submission" ||
          snapshot.revision !== row.revision
        )
          throw new AppError(
            409,
            "StateConflict",
            "Select the exact current Submitted survey.",
          );
        if (command.action === "review") snapshotCurrent();
        if (snapshot.recorded_by === p.actor_id)
          throw new AppError(
            409,
            "IndependentReviewRequired",
            "Another permitted editor must review or return this submission.",
          );
        const state = command.action === "return" ? "Returned" : "Reviewed";
        await event(
          c,
          p,
          row,
          state,
          {
            reason: command.reason,
            certification: "No design, safety, capacity or work certification",
          },
          snapshot.id,
        );
        return update(c, p, kind, row, command.reason, { state });
      }
      if (command.action === "handover") {
        if (
          !snapshot ||
          snapshot.kind !== "Submission" ||
          !(
            await c.query(
              "SELECT 1 FROM ppo.cs_record_events WHERE workspace_id=$1 AND record_id=$2 AND snapshot_id=$3 AND kind='Reviewed'",
              [p.workspace_id, id, snapshot.id],
            )
          ).rowCount
        )
          invalid("snapshot_id", "Choose an exact Reviewed survey snapshot.");
        snapshotCurrent();
        const destination = choice(command.destination, "destination", [
          "Estimating",
          "Engineering",
        ] as const);
        if (!command.receiving_owner_id)
          invalid(
            "receiving_owner_id",
            "Choose the accountable receiving owner.",
          );
        await scopedOwner(
          c,
          p,
          command.receiving_owner_id!,
          row.company_id,
          row.site_id!,
          destination === "Estimating" ? "estimating.edit" : "engineering.edit",
        );
        await event(
          c,
          p,
          row,
          "Handover",
          {
            destination,
            receiving_owner_id: command.receiving_owner_id,
            source_hash: snapshot.content_hash,
            source_revision: snapshot.revision,
            reason: command.reason,
            receiving_decision:
              "Not recorded; no Estimate or Engineering basis changed",
          },
          snapshot.id,
        );
        return update(c, p, kind, row, command.reason);
      }
      invalid("action", "Choose a supported survey lifecycle action.");
    },
    types[kind],
    "SharedRecordUpdated",
  );
}
export async function listCs(
  p: Principal,
  kind: CsKind,
  query: Record<string, string>,
) {
  const q = object(query, ["context_id", "q", "cursor", "limit"]),
    contextId = optionalId(q.context_id, "context_id"),
    c = database();
  await requireCapability(c, p, "shared.read");
  const limit = Number(q.limit ?? 100),
    cursor = optionalId(q.cursor, "cursor"),
    term = String(q.q ?? "").trim();
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || term.length > 200)
    invalid(
      "filters",
      "Use a search of up to 200 characters and a page of up to 100 records.",
    );
  if (contextId)
    await visible(
      c,
      p,
      kind === "AccountPlan" ? "Organisation" : "Site",
      contextId,
    );
  const rows = (
    await c.query(
      `SELECT r.id,r.name,r.state,r.version,r.revision,r.site_id,r.organisation_id,r.company_id,r.owner_id,u.display_name AS owner_name
    FROM ppo.${tables[kind]} r JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.owner_id)
    JOIN ppo.${kind === "AccountPlan" ? "organisations" : "sites"} context ON (context.workspace_id,context.id)=(r.workspace_id,r.${kind === "AccountPlan" ? "organisation_id" : "site_id"})
    WHERE r.workspace_id=$1 AND ${visibility(kind === "AccountPlan" ? "Organisation" : "Site", "context")} AND ${scopeSql("r.company_id", "r.site_id")} AND ($3::uuid IS NULL OR context.id=$3) AND ($4::uuid IS NULL OR r.id>$4) AND strpos(lower(r.name),lower($5))>0 ORDER BY r.id LIMIT $6`,
      [p.workspace_id, p.actor_id, contextId, cursor, term, limit + 1],
    )
  ).rows;
  const permitted = [];
  for (const row of rows.slice(0, limit)) {
    try {
      await csRecord(c, p, kind, row.id);
      permitted.push(row);
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    }
  }
  return {
    items: permitted,
    next_cursor: rows.length > limit ? (rows[limit - 1].id as string) : null,
    completeness: "Bounded permitted view",
    observed_at: new Date().toISOString(),
    actor_id: p.actor_id,
  };
}
export async function readCs(p: Principal, kind: CsKind, id: string) {
  const c = database(),
    row = await csRecord(c, p, kind, id),
    basis = await sourceBasis(c, p, kind, row);
  const snapshots = (
    await c.query(
      "SELECT * FROM ppo.cs_snapshots WHERE workspace_id=$1 AND record_id=$2 ORDER BY recorded_at DESC,id LIMIT 101",
      [p.workspace_id, id],
    )
  ).rows;
  const permittedSnapshots = [];
  for (const snapshot of snapshots.slice(0, 100)) {
    try {
      await contentAuthority(c, p, kind, row, snapshot.basis.content);
      let currentBasis = basis;
      if (snapshot.kind === "Preparation") {
        currentBasis = structuredClone(basis);
        for (const f of snapshot.basis.preparation.facility_ids) {
          const facility = await visible(c, p, "Facility", f);
          if (facility.site_id !== row.site_id) throw unavailable();
          currentBasis.dependencies[`selected-facility:${f}`] =
            facility.version;
        }
        for (const person of snapshot.basis.preparation.person_ids) {
          const visitor = await visitorContext(c, p, row, person);
          currentBasis.dependencies[`visitor:${person}`] = visitor.version;
        }
      }
      permittedSnapshots.push({
        ...snapshot,
        recheck_required: snapshot.content_hash !== hash(currentBasis),
      });
    } catch (error) {
      if (!(error instanceof AppError) || ![403, 404].includes(error.status))
        throw error;
    }
  }
  const allowed = new Set(permittedSnapshots.map((s) => s.id));
  const events = (
    await c.query(
      "SELECT id,snapshot_id,kind,details,recorded_by,recorded_at FROM ppo.cs_record_events WHERE workspace_id=$1 AND record_id=$2 ORDER BY recorded_at DESC,id LIMIT 200",
      [p.workspace_id, id],
    )
  ).rows.filter((e) => !e.snapshot_id || allowed.has(e.snapshot_id));
  const history = (
    await c.query(
      "SELECT id,version,revision,state,content_hash,recorded_by,recorded_at,reason FROM ppo.cs_record_revisions WHERE workspace_id=$1 AND record_id=$2 ORDER BY version DESC LIMIT 100",
      [p.workspace_id, id],
    )
  ).rows;
  return {
    record: row,
    kind,
    can_edit: await hasPermission(
      c,
      p,
      "shared.edit",
      row.company_id,
      row.site_id ?? undefined,
    ),
    actor_id: p.actor_id,
    photos: basis.photos,
    reviews: basis.reviews,
    evidence_status:
      kind === "Readiness"
        ? Object.fromEntries(
            (row.content as ReadinessContent).evidence.map((e) => [
              e.id,
              basis.reviews.some((r) => r.details.evidence_hash === hash(e))
                ? "Reviewed exact capture; check current source and validity"
                : "Captured; independent review required",
            ]),
          )
        : {},
    snapshots: permittedSnapshots,
    events,
    history,
    history_scope:
      "Latest permitted retained records; other snapshots may be restricted.",
    observed_at: new Date().toISOString(),
  };
}
export function parseKind(value: unknown) {
  return choice(value, "kind", kinds);
}
export { update as updateCs, retain as retainCs };
