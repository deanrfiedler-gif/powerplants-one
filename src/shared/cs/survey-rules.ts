import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { unavailable } from "../../platform/errors";
import { visible } from "../reads";
import type { CsRow, SurveyContent } from "./model";

// The site's primary contact and current contacts of its recorded parties.
export const surveyContactSql = `(r.id=s.primary_contact_id OR EXISTS (
  SELECT 1 FROM ppo.relationships rel JOIN ppo.site_parties sp
  ON (sp.workspace_id,sp.organisation_id)=(rel.workspace_id,rel.organisation_id)
  WHERE rel.workspace_id=r.workspace_id AND rel.person_id=r.id AND sp.site_id=s.id
  AND rel.valid_from<=CURRENT_DATE AND (rel.valid_to IS NULL OR rel.valid_to>CURRENT_DATE)
  AND sp.valid_from<=clock_timestamp() AND (sp.valid_to IS NULL OR sp.valid_to>clock_timestamp())))`;

export async function validateSurveyVisit(
  c: QueryClient,
  p: Principal,
  row: CsRow,
  content: SurveyContent,
) {
  if (content.visit?.contact_id) {
    await visible(c, p, "Person", content.visit.contact_id);
    const contact = await c.query(
      `SELECT r.id FROM ppo.people r JOIN ppo.sites s ON s.workspace_id=r.workspace_id
      WHERE s.workspace_id=$1 AND s.id=$2 AND r.id=$3 AND ${surveyContactSql}`,
      [p.workspace_id, row.site_id, content.visit.contact_id],
    );
    if (!contact.rowCount) throw unavailable();
  }
  if (
    content.visit?.recorder_id &&
    !(
      await c.query("SELECT 1 FROM ppo.users WHERE workspace_id=$1 AND id=$2", [
        p.workspace_id,
        content.visit.recorder_id,
      ])
    ).rowCount
  )
    throw unavailable();
}

export async function surveyReviewConflict(
  c: QueryClient,
  p: Principal,
  row: CsRow,
  snapshot: {
    recorded_by: string;
    basis: {
      owner_id: string;
      content: SurveyContent;
      photos?: { recorded_by: string }[];
    };
  },
) {
  if (
    [
      row.owner_id,
      snapshot.basis.owner_id,
      snapshot.recorded_by,
      snapshot.basis.content.visit?.recorder_id,
    ].includes(p.actor_id)
  )
    return true;
  if (snapshot.basis.photos?.some((photo) => photo.recorded_by === p.actor_id))
    return true;
  // Legacy observations did not have an actor ID. The retained capture author is
  // still evidence of who recorded them; never infer that from a display name.
  for (const observation of snapshot.basis.content.observations) {
    const capture = await c.query<{ recorded_by: string }>(
      "SELECT recorded_by FROM ppo.cs_record_revisions WHERE workspace_id=$1 AND record_id=$2 AND content->'content'->'observations' @> $3::jsonb ORDER BY version LIMIT 1",
      [p.workspace_id, row.id, JSON.stringify([observation])],
    );
    if (capture.rows[0]?.recorded_by === p.actor_id) return true;
  }
  return false;
}
