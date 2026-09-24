import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { sharedOperation } from "../platform/operations";
import { hasPermission, type QueryClient } from "../platform/permissions";
import {
  common,
  commonKeys,
  label,
  object,
  uuid,
  version,
} from "../shared/validation";
import { visible } from "../shared/reads";
import { csRecord, sourceBasis, hash, updateCs } from "../shared/cs/service";
import {
  ids,
  type PreparationBasis,
  type ReadinessContent,
} from "../shared/cs/model";
import { assessPreparation } from "../shared/cs/readiness";
import { fieldContext } from "./context";

type Context = Awaited<ReturnType<typeof fieldContext>>;
type Selection = { facility_ids: string[]; activity: string };
async function binding(c: QueryClient, p: Principal, ctx: Context) {
  const pack =
    (
      await c.query(
        "SELECT id,status,current_issue_id,needs_review FROM ppo.packs WHERE workspace_id=$1 AND appointment_id=$2",
        [p.workspace_id, ctx.a.id],
      )
    ).rows[0] ?? null;
  return {
    appointment_id: ctx.a.id,
    appointment_version: ctx.a.version,
    assignment_id: ctx.assignment.id,
    assignment_version: ctx.a.assignment_version,
    schedule_version: ctx.a.schedule_version,
    scope_revision_id: ctx.a.scope_revision_id,
    scope_version: ctx.a.scope_version,
    work_order_version: ctx.w.version,
    starts_at: ctx.a.start_at.toISOString(),
    ends_at: ctx.a.end_at.toISOString(),
    actor_id: p.actor_id,
    site_id: ctx.a.site_id,
    company_id: ctx.a.company_id,
    pack,
  };
}
async function selectedSource(
  c: QueryClient,
  p: Principal,
  ctx: Context,
  recordId: string,
  selected: Selection,
) {
  const row = await csRecord(c, p, "Readiness", recordId);
  if (row.site_id !== ctx.a.site_id || row.company_id !== ctx.a.company_id)
    throw unavailable();
  const basis = await sourceBasis(c, p, "Readiness", row);
  for (const id of selected.facility_ids) {
    const facility = await visible(c, p, "Facility", id);
    if (
      facility.site_id !== row.site_id ||
      facility.company_id !== row.company_id
    )
      throw unavailable();
    basis.dependencies[`selected-facility:${id}`] = facility.version;
  }
  const field = await binding(c, p, ctx);
  const preparation: PreparationBasis = {
    facility_ids: selected.facility_ids,
    activity: selected.activity,
    starts_at: field.starts_at,
    ends_at: field.ends_at,
    person_ids: [],
  };
  const assessment = assessPreparation(
    row.content as ReadinessContent,
    preparation,
    ctx.a.site_timezone,
    basis.reviews.map((r) => r.details.evidence_hash),
  );
  const source_hash = hash(basis);
  const presented_hash = hash({ source_hash, field, preparation });
  return {
    row,
    basis,
    field,
    preparation,
    assessment,
    source_hash,
    presented_hash,
  };
}

export async function readFieldReadiness(
  p: Principal,
  appointmentId: string,
  query: Record<string, string> = {},
) {
  object(query, ["record_id", "facility_ids", "activity"]);
  const selected: Selection = {
    facility_ids: query.facility_ids
      ? ids(query.facility_ids.split(","), "facility_ids")
      : [],
    activity: query.activity ? label(query.activity, "activity", 100) : "",
  };
  return transaction(async (c) => {
    const ctx = await fieldContext(c, p, uuid(appointmentId, "appointment_id"));
    const site = await visible(c, p, "Site", ctx.a.site_id);
    const sources = (
      await c.query<{ id: string; name: string }>(
        "SELECT id,name FROM ppo.site_readiness WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3 ORDER BY name,id LIMIT 41",
        [p.workspace_id, ctx.a.company_id, ctx.a.site_id],
      )
    ).rows;
    if (sources.length > 40)
      throw new AppError(
        422,
        "ReadinessSelectionRequired",
        "Ask the Site owner to reconcile the readiness sources before field review.",
      );
    const recordId = query.record_id
      ? uuid(query.record_id, "record_id")
      : sources[0]?.id;
    const source = recordId
      ? await selectedSource(c, p, ctx, recordId, selected)
      : null;
    const facilities = (
      await c.query<{
        id: string;
        display_name: string;
        facility_type: string;
      }>(
        "SELECT id,name AS display_name,COALESCE(structure_type,'Not established') AS facility_type FROM ppo.facilities WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3 ORDER BY name,id LIMIT 101",
        [p.workspace_id, ctx.a.company_id, ctx.a.site_id],
      )
    ).rows;
    const acknowledgements = source
      ? (
          await c.query<{
            id: string;
            recorded_at: Date;
            details: {
              reason: string;
              presented_hash: string;
              blockers: string[];
            };
            preparation: PreparationBasis;
            content_hash: string;
          }>(
            `SELECT e.id,e.recorded_at,e.details,s.basis->'preparation' AS preparation,s.content_hash
      FROM ppo.cs_record_events e JOIN ppo.cs_snapshots s ON (s.workspace_id,s.id)=(e.workspace_id,e.snapshot_id)
      WHERE e.workspace_id=$1 AND e.record_id=$2 AND e.recorded_by=$3 AND e.kind='Acknowledged'
        AND e.details->>'purpose'='FieldReadinessReview' AND e.details->>'appointment_id'=$4
      ORDER BY e.recorded_at DESC,e.id LIMIT 50`,
            [p.workspace_id, source.row.id, p.actor_id, ctx.a.id],
          )
        ).rows
      : [];
    const owner = source
      ? (
          await c.query<{ display_name: string }>(
            "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, source.row.owner_id],
          )
        ).rows[0]?.display_name
      : null;
    const evidenceReviewTimes = source
      ? (
          await c.query<{
            details: { evidence_hash: string };
            recorded_at: Date;
          }>(
            "SELECT details,recorded_at FROM ppo.cs_record_events WHERE workspace_id=$1 AND record_id=$2 AND kind='EvidenceReviewed' ORDER BY recorded_at DESC,id",
            [p.workspace_id, source.row.id],
          )
        ).rows
      : [];
    const dateAtSite = (d: Date) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: ctx.a.site_timezone,
      }).format(d);
    const evidenceStatus = Object.fromEntries(
      (
        (source?.row.content as ReadinessContent | undefined)?.evidence ?? []
      ).map((e) => {
        const requirement = (
          source!.row.content as ReadinessContent
        ).requirements.find((r) => r.id === e.requirement_id);
        const review = evidenceReviewTimes.find(
          (r) => r.details.evidence_hash === hash(e),
        );
        const status =
          !requirement || requirement.revision !== e.requirement_revision
            ? "Superseded requirement"
            : e.facility_id !== requirement.facility_id
              ? "Different location"
              : e.activity !== "*" && e.activity !== selected.activity
                ? "Different activity"
                : e.captured_on > dateAtSite(ctx.a.start_at)
                  ? "Not yet effective for this visit"
                  : e.expires_on < dateAtSite(ctx.a.end_at)
                    ? "Expired for this visit"
                    : !review
                      ? "Captured; independent review required"
                      : requirement.kind === "Induction"
                        ? "Reviewed source; personal applicability unverified"
                        : "Reviewed evidence covers this visit";
        return [
          e.id,
          { status, reviewed_at: review?.recorded_at.toISOString() ?? null },
        ];
      }),
    );
    return {
      observed_at: new Date().toISOString(),
      actor_id: p.actor_id,
      job: {
        id: ctx.a.id,
        reference: ctx.a.display_number,
        status: ctx.a.status,
        assignment_id: ctx.assignment.id,
        work_order_id: ctx.w.id,
        work_order_reference: ctx.w.display_number,
        scope_summary: ctx.r.summary,
        starts_at: ctx.a.start_at.toISOString(),
        ends_at: ctx.a.end_at.toISOString(),
        timezone: ctx.a.site_timezone,
      },
      site: {
        id: site.id,
        name: site.display_name,
        location: site.location_description,
        access: site.access_instructions,
        biosecurity: site.biosecurity_notes,
      },
      sources,
      facilities: facilities.slice(0, 100),
      facilities_truncated: facilities.length > 100,
      source: source
        ? {
            id: source.row.id,
            name: source.row.name,
            version: source.row.version,
            revision: source.row.revision,
            owner: owner ?? "Unknown",
            updated_at: source.row.updated_at.toISOString(),
            content: source.row.content as ReadinessContent,
            evidence_reviews: source.basis.reviews,
            evidence_status: evidenceStatus,
            presented_hash: source.presented_hash,
            preparation: source.preparation,
            assessment: source.assessment,
          }
        : null,
      acknowledgements: acknowledgements.map((a) => ({
        id: a.id,
        recorded_at: a.recorded_at.toISOString(),
        reason: a.details.reason,
        blockers: a.details.blockers,
        preparation: a.preparation,
        current_selection: a.details.presented_hash === source?.presented_hash,
      })),
      personal_induction:
        "Not verified: your sign-in is not linked to an individual visitor record. Ask the Site owner to verify your induction evidence.",
      can_acknowledge:
        ["Confirmed", "InProgress"].includes(ctx.a.status) &&
        (await hasPermission(
          c,
          p,
          "field.capture.own",
          ctx.a.company_id,
          ctx.a.site_id,
        )),
      work_authority: "Not granted",
    };
  });
}

export async function acknowledgeFieldReadiness(
  p: Principal,
  appointmentId: string,
  input: unknown,
) {
  const r = object(input, [
    ...commonKeys,
    "record_id",
    "expected_version",
    "presented_hash",
    "facility_ids",
    "activity",
  ]);
  const command = {
    ...common(r),
    appointment_id: uuid(appointmentId, "appointment_id"),
    record_id: uuid(r.record_id, "record_id"),
    expected_version: version(r.expected_version),
    presented_hash: label(r.presented_hash, "presented_hash", 64),
    facility_ids: ids(r.facility_ids, "facility_ids"),
    activity: label(r.activity, "activity", 100),
  };
  return sharedOperation(
    p,
    command,
    "FieldReadinessAcknowledge",
    async (c) => {
      const ctx = await fieldContext(
        c,
        p,
        command.appointment_id,
        "field.capture.own",
      );
      const source = await selectedSource(
        c,
        p,
        ctx,
        command.record_id,
        command,
      );
      return { ctx, source };
    },
    async (c, { ctx, source }) => {
      if (!["Confirmed", "InProgress"].includes(ctx.a.status))
        throw new AppError(
          409,
          "VisitChanged",
          "This visit is no longer available for a new field review.",
        );
      if (
        source.row.version !== command.expected_version ||
        source.presented_hash !== command.presented_hash
      )
        throw new AppError(
          409,
          "SourceChanged",
          "The visit or readiness source has changed. Refresh and review it before recording a new acknowledgement. Your previous review is retained.",
        );
      const snapshotId = randomUUID();
      await c.query(
        `INSERT INTO ppo.cs_snapshots(id,workspace_id,record_id,record_version,revision,kind,basis,content_hash,recorded_by)
      VALUES($1,$2,$3,$4,$5,'Preparation',$6,$7,$8)`,
        [
          snapshotId,
          p.workspace_id,
          source.row.id,
          source.row.version,
          source.row.revision,
          {
            ...source.basis,
            preparation: source.preparation,
            assessment: source.assessment,
            field_context: source.field,
          },
          source.source_hash,
          p.actor_id,
        ],
      );
      await c.query(
        `INSERT INTO ppo.cs_record_events(id,workspace_id,record_id,snapshot_id,kind,details,recorded_by)
      VALUES($1,$2,$3,$4,'Acknowledged',$5,$6)`,
        [
          randomUUID(),
          p.workspace_id,
          source.row.id,
          snapshotId,
          {
            purpose: "FieldReadinessReview",
            appointment_id: command.appointment_id,
            operation_id: command.operation_id,
            presented_hash: source.presented_hash,
            reason: command.reason,
            blockers: source.assessment.blockers,
            work_authority: "Not granted",
          },
          p.actor_id,
        ],
      );
      return updateCs(c, p, "Readiness", source.row, command.reason);
    },
    "SiteReadiness",
    "SharedRecordUpdated",
  );
}

export async function fieldReadinessReceiptAuthority(
  c: QueryClient,
  p: Principal,
  recordId: string,
  operationId: string,
) {
  const event = (
    await c.query(
      "SELECT details->>'appointment_id' AS appointment_id FROM ppo.cs_record_events WHERE workspace_id=$1 AND record_id=$2 AND recorded_by=$3 AND details->>'operation_id'=$4 AND details->>'purpose'='FieldReadinessReview'",
      [p.workspace_id, recordId, p.actor_id, operationId],
    )
  ).rows[0];
  if (!event) throw unavailable();
  await fieldContext(c, p, event.appointment_id, "field.capture.own");
  await csRecord(c, p, "Readiness", recordId);
}
