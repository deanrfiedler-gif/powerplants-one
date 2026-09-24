import { backupProgress } from "./model";
import { database } from "../platform/database";
import { AppError } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { hasPermission, requireCapability } from "../platform/permissions";
import type { ReviewTask } from "../reviews/model";
import { readEquipmentChange } from "./changes";
import { equipmentEvidence } from "./evidence";

// SH coordinates; every review remains on its exact source and owning command.
export async function equipmentReviewTasks(
  p: Principal,
  company: string | null,
) {
  const c = database();
  await requireCapability(c, p, "shared.read");
  const items: ReviewTask[] = [];
  const candidates = (
    await c.query<{ id: string }>(
      "SELECT id FROM ppo.equipment_changes WHERE workspace_id=$1 AND ($2::uuid IS NULL OR company_id=$2) ORDER BY created_at DESC,id LIMIT 201",
      [p.workspace_id, company],
    )
  ).rows;
  const task = (
    source: ReviewTask["source"],
    id: string,
    company_id: string,
    reference: string,
    version: number,
    author_id: string,
    status: string,
    href: string,
  ): ReviewTask => ({
    id: `${source}:${id}`,
    source,
    module: "Equipment",
    record_id: id,
    company_id,
    reference,
    revision: `v${version}`,
    version,
    kind: "Review",
    title: "Equipment evidence review",
    context: reference,
    submitted_at: null,
    due: null,
    owner_id: null,
    owner_name: null,
    author_id,
    status,
    returned: false,
    return_reason: null,
    current: true,
    actionable: false,
    href,
  });
  for (const r of candidates.slice(0, 200)) {
    try {
      const row = await readEquipmentChange(c, p, r.id);
      items.push({
        ...task(
          "EquipmentChange",
          row.id,
          row.company_id,
          row.source_reference,
          row.version,
          row.created_by,
          row.state,
          `/equipment/${row.asset_id}?view=${row.kind === "Configuration" ? "configuration" : "lifecycle"}`,
        ),
        title: `${row.kind} review`,
        submitted_at: new Date(row.created_at).toISOString(),
        current: row.state === "Proposed",
        actionable:
          row.state === "Proposed" &&
          (await hasPermission(
            c,
            p,
            "shared.edit",
            row.company_id,
            row.site_id,
          )),
      });
    } catch (e) {
      if (!(e instanceof AppError && [403, 404].includes(e.status))) throw e;
    }
  }
  const backups = await equipmentEvidence(p, "backups"),
    bulletins = await equipmentEvidence(p, "bulletins");
  for (const row of backups.items) {
    if (company && row.company_id !== company) continue;
    const reviews = row.reviews as { step: string; result: string }[],
      verified = backupProgress(reviews).RecoveryVerified?.result === "Passed";
    items.push({
      ...task(
        "EquipmentBackup",
        row.id,
        row.company_id,
        row.reference,
        row.review_version,
        row.created_by,
        verified && row.current_configuration
          ? "VerifiedCurrent"
          : !row.current_configuration
            ? "HistoricalBasis"
            : "EvidenceReviewRequired",
        `/equipment/backups?asset_id=${row.asset_id}`,
      ),
      title: "Backup and recovery evidence",
      submitted_at: new Date(row.created_at).toISOString(),
      current: !verified || !row.current_configuration,
      actionable: row.can_edit && row.current_configuration && !verified,
    });
  }
  for (const row of bulletins.items) {
    if (company && row.company_id !== company) continue;
    const count = (
      await c.query<{ count: number }>(
        "SELECT count(*)::int AS count FROM ppo.equipment_bulletin_reviews WHERE workspace_id=$1 AND bulletin_id=$2",
        [p.workspace_id, row.id],
      )
    ).rows[0].count;
    items.push({
      ...task(
        "EquipmentBulletin",
        row.id,
        row.company_id,
        row.reference,
        row.version + count,
        row.created_by,
        row.state,
        "/equipment/bulletins",
      ),
      title: `Bulletin ${row.revision} applicability`,
      submitted_at: new Date(row.created_at).toISOString(),
      current: row.state === "Open",
      actionable: row.can_edit && row.state === "Open",
    });
  }
  return {
    items,
    bounded: candidates.length > 200 || backups.partial || bulletins.partial,
  };
}
