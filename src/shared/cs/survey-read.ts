import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { visibleActivity } from "../../activities/activities";
import { visible, visibility } from "../reads";
import { surveyReviewConflict } from "./survey-rules";
import type { CsRow, SurveyContent } from "./model";

export async function surveyDetails(
  c: QueryClient,
  p: Principal,
  row: CsRow,
  snapshots: {
    id: string;
    revision: number;
    kind: string;
    recorded_by: string;
    basis: {
      owner_id: string;
      content: SurveyContent;
      dependencies: Record<string, string | number>;
    };
  }[],
  dependencies: Record<string, string | number>,
) {
  const content = row.content as SurveyContent;
  const site = await visible(c, p, "Site", row.site_id!);
  const targets: {
    id: string;
    kind: "Facility" | "Asset";
    name: string;
    reference: string;
    version: unknown;
    facility_id: string | null;
  }[] = [];
  for (const [kind, ids] of [
    ["Facility", content.facility_ids],
    ["Asset", content.asset_ids],
  ] as const) {
    for (const id of ids) {
      const target = await visible(c, p, kind, id);
      targets.push({
        id,
        kind,
        name: String(
          target.name ?? target.description ?? target.display_name ?? id,
        ),
        reference: String(target.display_number ?? ""),
        version: target.version,
        facility_id: target.facility_id as string | null,
      });
    }
  }
  const followups = [];
  for (const id of [
    ...new Set(
      content.observations.flatMap((o) =>
        o.activity_id ? [o.activity_id] : [],
      ),
    ),
  ]) {
    const activity = await visibleActivity(c, p, id);
    const owner = activity.owner_id
      ? (
          await c.query<{ display_name: string }>(
            "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, activity.owner_id],
          )
        ).rows[0]
      : null;
    followups.push({
      id,
      summary: String(activity.summary),
      status: String(activity.status),
      owner_name: owner?.display_name ?? null,
      due_at: activity.due_at,
    });
  }
  const contact = content.visit?.contact_id
    ? await visible(c, p, "Person", content.visit.contact_id)
    : null;
  const people = (
    await c.query<{ id: string; display_name: string }>(
      "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND (id=$2 OR id=$3 OR id IN (SELECT recorded_by FROM ppo.cs_record_events WHERE workspace_id=$1 AND record_id=$4) OR id IN (SELECT recorded_by FROM ppo.cs_snapshots WHERE workspace_id=$1 AND record_id=$4))",
      [
        p.workspace_id,
        row.owner_id,
        content.visit?.recorder_id ?? null,
        row.id,
      ],
    )
  ).rows;
  const organisations = (
    await c.query<{ id: string; display_name: string }>(
      `SELECT DISTINCT r.id,r.display_name FROM ppo.organisations r JOIN ppo.site_parties sp ON (sp.workspace_id,sp.organisation_id)=(r.workspace_id,r.id)
 WHERE sp.workspace_id=$1 AND sp.site_id=$3 AND sp.valid_from<=clock_timestamp() AND (sp.valid_to IS NULL OR sp.valid_to>clock_timestamp()) AND ${visibility("Organisation")} ORDER BY r.display_name`,
      [p.workspace_id, p.actor_id, row.site_id],
    )
  ).rows;
  const photoFacts = (
    await c.query<{ id: string; file_name: string | null; media_type: string }>(
      "SELECT id,file_name,media_type FROM ppo.cs_survey_photos WHERE workspace_id=$1 AND survey_id=$2 ORDER BY id",
      [p.workspace_id, row.id],
    )
  ).rows;
  const captions = (
    await c.query<{
      id: string;
      photo_id: string;
      caption: string;
      predecessor_id: string | null;
      recorded_by: string;
      recorded_at: string;
    }>(
      "SELECT id,photo_id,caption,predecessor_id,recorded_by,recorded_at FROM ppo.cs_photo_captions WHERE workspace_id=$1 AND survey_id=$2 ORDER BY recorded_at,id",
      [p.workspace_id, row.id],
    )
  ).rows;
  const submission = snapshots.find(
    (s) => s.kind === "Submission" && s.revision === row.revision,
  );
  const sources = Object.entries(
    submission?.basis.dependencies ?? dependencies,
  ).map(([key, version]) => {
    const id = key.split(":")[1],
      target = targets.find((t) => t.id === id);
    return {
      key,
      id,
      name:
        target?.name ??
        (id === site.id
          ? String(site.display_name)
          : id === contact?.id
            ? String(contact.display_name)
            : "Linked follow-up"),
      version,
      current_version: dependencies[key] ?? null,
      changed: dependencies[key] !== version,
    };
  });
  return {
    site: {
      id: site.id,
      name: String(site.display_name),
      timezone: String(site.timezone),
    },
    organisations,
    followups,
    contact: contact
      ? { id: contact.id, name: String(contact.display_name) }
      : null,
    people,
    targets,
    photo_facts: photoFacts,
    captions,
    sources,
    independent_reviewer: submission
      ? !(await surveyReviewConflict(c, p, row, submission))
      : false,
  };
}
