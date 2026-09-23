import { backupProgress } from "./model";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { database } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import {
  hasPermission,
  requireCapability,
  scopeSql,
  type QueryClient,
} from "../platform/permissions";
import { sharedOperation } from "../platform/operations";
import {
  authoriseActivityInput,
  insertActivity,
  visibleActivity,
  type ActivityInput,
} from "../activities/activities";
import { companyContext } from "../shared/authority";
import { visible, visibility } from "../shared/reads";
import {
  choice,
  common,
  commonKeys,
  dateOnly,
  instant,
  invalid,
  object,
  optionalId,
  uuid,
  version,
} from "../shared/validation";
import { assessInstrument, type Calibration } from "../inspections/model";
import { equipmentInspectionHost } from "./inspection-context";
import {
  localDate,
  calibrationOf,
  type InstrumentUseRow,
  type AttemptRow,
  type ResultRow,
} from "../inspections/service";
import { currentConfiguration, safeEvidence } from "./changes";
export const evidenceKinds = ["backups", "bulletins", "support"] as const;
export type EvidenceKind = (typeof evidenceKinds)[number];
const tables = {
  backups: "equipment_backups",
  bulletins: "equipment_bulletins",
  support: "equipment_support",
};
export const evidenceTypes = {
  backups: "EquipmentBackup",
  bulletins: "EquipmentBulletin",
  support: "EquipmentSupport",
};
const checkVersion = (actual: number, expected: number) => {
  if (actual !== expected)
    throw new AppError(
      409,
      "VersionConflict",
      "The record or evidence basis changed. Refresh before saving another decision.",
    );
};
async function insert(
  c: PoolClient,
  p: Principal,
  table: string,
  fields: Record<string, unknown>,
) {
  const entries = Object.entries({
    ...fields,
    workspace_id: p.workspace_id,
    created_by: p.actor_id,
    updated_by: p.actor_id,
  });
  return (
    await c.query(
      `INSERT INTO ppo.${table}(${entries.map(([key]) => key).join(",")}) VALUES(${entries.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`,
      entries.map(([, value]) => value),
    )
  ).rows[0];
}
export async function equipmentEvidenceRecord(
  c: QueryClient,
  p: Principal,
  kind: EvidenceKind,
  id: string,
  edit = false,
) {
  const row = (
    await c.query(
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
  if (row.asset_id) await visible(c, p, "Asset", row.asset_id);
  return row;
}
export async function createEquipmentEvidence(
  p: Principal,
  kind: EvidenceKind,
  input: unknown,
) {
  const allowed = {
    backups: [
      "asset_id",
      "expected_asset_version",
      "configuration_id",
      "reference",
      "captured_at",
      "captured_by",
      "custodian",
      "compatibility",
      "procedure_reference",
      "procedure_revision",
      "relationship",
      "predecessor_id",
    ],
    bulletins: [
      "company_id",
      "reference",
      "revision",
      "title",
      "published_on",
      "manufacturer",
      "model",
      "serial",
      "configuration_id",
    ],
    support: [
      "asset_id",
      "expected_asset_version",
      "source_date",
      "conclusion",
      "support_end",
      "software_support_end",
      "component",
      "replacement_recommendation",
      "uncertainty",
      "predecessor_id",
    ],
  };
  const b = object(input, [
    ...commonKeys,
    "id",
    "source_reference",
    "source_revision",
    ...allowed[kind],
  ]);
  const base = {
    ...common(b),
    id: uuid(b.id, "id"),
    source_reference: safeEvidence(b.source_reference, "source_reference"),
    source_revision: safeEvidence(
      b.source_revision ?? b.revision,
      "source_revision",
      80,
    ),
  };
  const text = (k: string, max = 2000) => safeEvidence(b[k], k, max),
    optional = (k: string) => (b[k] == null || b[k] === "" ? null : text(k)),
    day = (k: string) =>
      b[k] == null || b[k] === "" ? null : dateOnly(b[k], k);
  const assetId = kind === "bulletins" ? null : uuid(b.asset_id, "asset_id"),
    expectedAsset = assetId ? version(b.expected_asset_version) : null;
  let fields: Record<string, unknown>;
  if (kind === "backups")
    fields = {
      asset_id: assetId,
      configuration_id: uuid(b.configuration_id, "configuration_id"),
      reference: text("reference", 120),
      captured_at: instant(b.captured_at, "captured_at"),
      captured_by: text("captured_by", 200),
      custodian: text("custodian", 200),
      source_reference: base.source_reference,
      source_revision: base.source_revision,
      compatibility: text("compatibility"),
      procedure_reference: text("procedure_reference"),
      procedure_revision: text("procedure_revision", 80),
      relationship: choice(b.relationship, "relationship", [
        "Baseline",
        "PreChange",
        "PostChange",
      ]),
      predecessor_id: optionalId(b.predecessor_id, "predecessor_id"),
    };
  else if (kind === "bulletins")
    fields = {
      reference: text("reference", 120),
      revision: text("revision", 80),
      title: text("title", 200),
      source_reference: base.source_reference,
      published_on: dateOnly(b.published_on, "published_on"),
      manufacturer: optional("manufacturer"),
      model: optional("model"),
      serial: optional("serial"),
      configuration_id: optionalId(b.configuration_id, "configuration_id"),
    };
  else
    fields = {
      asset_id: assetId,
      source_reference: base.source_reference,
      source_revision: base.source_revision,
      source_date: dateOnly(b.source_date, "source_date"),
      conclusion: choice(b.conclusion, "conclusion", [
        "Unknown",
        "Supported",
        "SupportEnding",
        "Discontinued",
      ]),
      support_end: day("support_end"),
      software_support_end: day("software_support_end"),
      component: optional("component"),
      replacement_recommendation: optional("replacement_recommendation"),
      uncertainty: text("uncertainty"),
      predecessor_id: optionalId(b.predecessor_id, "predecessor_id"),
    };
  const cmd = {
    ...base,
    kind,
    asset_id: assetId,
    expected_asset_version: expectedAsset,
    company_id: kind === "bulletins" ? uuid(b.company_id, "company_id") : null,
    fields,
  };
  return sharedOperation(
    p,
    cmd,
    `CreateEquipment${kind}`,
    async (c) => {
      if (assetId) {
        const a = await visible(c, p, "Asset", assetId);
        await companyContext(c, p, a.company_id, a.site_id, "shared.edit");
        return a;
      }
      await companyContext(c, p, cmd.company_id!, null, "shared.edit");
      return { company_id: cmd.company_id, site_id: null, version: 0 };
    },
    async (c, a) => {
      if (assetId) checkVersion(a.version, expectedAsset!);
      if (fields.configuration_id) {
        const cfg = (
          await c.query(
            "SELECT * FROM ppo.asset_configurations WHERE workspace_id=$1 AND company_id=$2 AND id=$3",
            [p.workspace_id, a.company_id, fields.configuration_id],
          )
        ).rows[0];
        if (!cfg || (assetId && cfg.asset_id !== assetId))
          invalid(
            "configuration_id",
            "Select an exact configuration of this Asset and company.",
          );
        await visible(c, p, "Asset", cfg.asset_id);
        if (
          kind === "backups" &&
          (await currentConfiguration(c, p.workspace_id, assetId!))?.id !==
            cfg.id
        )
          throw new AppError(
            409,
            "StaleSource",
            "A new backup must name the current configuration. Historical backups remain retained separately.",
          );
      }
      if (fields.predecessor_id) {
        const old = await equipmentEvidenceRecord(
          c,
          p,
          kind,
          String(fields.predecessor_id),
        );
        if (old.asset_id !== assetId)
          invalid(
            "predecessor_id",
            "The predecessor must belong to this Asset.",
          );
      }
      if (
        kind === "backups" &&
        Date.parse(String(fields.captured_at)) > Date.now()
      )
        invalid("captured_at", "Record when the backup was actually captured.");
      if (
        kind === "support" &&
        fields.conclusion !== "Unknown" &&
        /^(unknown|not available|not recorded)$/i.test(base.source_reference)
      )
        invalid(
          "source_reference",
          "A support conclusion needs an actual source; otherwise retain Unknown.",
        );
      const row = await insert(c, p, tables[kind], {
        id: base.id,
        company_id: a.company_id,
        site_id: a.site_id,
        ...fields,
      });
      return {
        ...row,
        state:
          kind === "backups"
            ? "BackupRecorded"
            : kind === "support"
              ? fields.conclusion
              : "Open",
      };
    },
    evidenceTypes[kind],
    "SharedRecordCreated",
  );
}
export async function reviewBackup(p: Principal, id: string, input: unknown) {
  const b = object(input, [
      ...commonKeys,
      "expected_review_version",
      "expected_asset_version",
      "configuration_id",
      "step",
      "result",
      "evidence_reference",
      "evidence_revision",
      "occurred_at",
    ]),
    cmd = {
      ...common(b),
      id: uuid(id, "id"),
      expected_review_version: version(b.expected_review_version),
      expected_asset_version: version(b.expected_asset_version),
      configuration_id: uuid(b.configuration_id, "configuration_id"),
      step: choice(b.step, "step", [
        "BackupReviewed",
        "ProcedureReviewed",
        "RecoveryTested",
        "RecoveryVerified",
      ]),
      result: choice(b.result, "result", ["Passed", "Failed", "Unknown"]),
      evidence_reference: safeEvidence(
        b.evidence_reference,
        "evidence_reference",
      ),
      evidence_revision: safeEvidence(
        b.evidence_revision,
        "evidence_revision",
        80,
      ),
      occurred_at: instant(b.occurred_at, "occurred_at"),
    };
  return sharedOperation(
    p,
    cmd,
    "ReviewEquipmentBackup",
    (c) => equipmentEvidenceRecord(c, p, "backups", id, true),
    async (c, row) => {
      const a = await visible(c, p, "Asset", row.asset_id);
      checkVersion(a.version, cmd.expected_asset_version);
      const reviews = (
        await c.query(
          "SELECT * FROM ppo.equipment_backup_reviews WHERE workspace_id=$1 AND backup_id=$2 ORDER BY recorded_at,id",
          [p.workspace_id, id],
        )
      ).rows;
      checkVersion(reviews.length + 1, cmd.expected_review_version);
      if (
        cmd.configuration_id !== row.configuration_id ||
        (await currentConfiguration(c, p.workspace_id, row.asset_id))?.id !==
          row.configuration_id
      )
        throw new AppError(
          409,
          "StaleSource",
          "This backup is not the current configuration basis. Record a successor backup; prior recovery evidence remains historical.",
        );
      if (
        Date.parse(cmd.occurred_at) > Date.now() ||
        Date.parse(cmd.occurred_at) < new Date(row.captured_at).getTime()
      )
        invalid(
          "occurred_at",
          "The review must follow capture and must have occurred.",
        );
      const progress = backupProgress(reviews);
      const latest = (step: string) => progress[step];
      const prerequisites =
        cmd.step === "ProcedureReviewed"
          ? ["BackupReviewed"]
          : cmd.step === "RecoveryTested"
            ? ["BackupReviewed", "ProcedureReviewed"]
            : cmd.step === "RecoveryVerified"
              ? ["BackupReviewed", "ProcedureReviewed", "RecoveryTested"]
              : [];
      if (prerequisites.some((step) => latest(step)?.result !== "Passed"))
        invalid(
          "step",
          "Complete the preceding review and successful test evidence first.",
        );
      if (
        cmd.step === "RecoveryVerified" &&
        cmd.result === "Passed" &&
        latest("RecoveryTested")?.recorded_by === p.actor_id
      )
        invalid(
          "step",
          "A different permitted reviewer must verify the recovery test evidence.",
        );
      await c.query(
        "INSERT INTO ppo.equipment_backup_reviews(id,workspace_id,backup_id,step,result,configuration_id,evidence_reference,evidence_revision,reason,occurred_at,recorded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [
          randomUUID(),
          p.workspace_id,
          id,
          cmd.step,
          cmd.result,
          cmd.configuration_id,
          cmd.evidence_reference,
          cmd.evidence_revision,
          cmd.reason,
          cmd.occurred_at,
          p.actor_id,
        ],
      );
      return {
        id,
        version: reviews.length + 2,
        state: `${cmd.step}:${cmd.result}`,
        updated_at: new Date(),
      };
    },
    "EquipmentBackup",
    "SharedRecordUpdated",
  );
}
async function bulletinCandidates(
  c: QueryClient,
  p: Principal,
  row: Record<string, unknown>,
) {
  return (
    await c.query<{
      id: string;
      version: number;
      display_number: string;
      description: string;
      site_id: string;
      manufacturer: string | null;
      model: string | null;
      serial: string | null;
    }>(
      `SELECT a.id,a.version,a.display_number,a.description,a.site_id,a.manufacturer,a.model,a.serial FROM ppo.assets a WHERE a.workspace_id=$1 AND a.company_id=$3 AND ${visibility("Asset", "a")}
    AND ($4::text IS NULL OR a.manufacturer IS NULL OR lower(a.manufacturer)=lower($4)) AND ($5::text IS NULL OR a.model IS NULL OR lower(a.model)=lower($5)) AND ($6::text IS NULL OR a.serial IS NULL OR a.serial=$6)
    AND ($7::uuid IS NULL OR EXISTS(SELECT 1 FROM ppo.asset_configurations ac WHERE ac.workspace_id=a.workspace_id AND ac.asset_id=a.id AND ac.id=$7)) ORDER BY a.display_number`,
      [
        p.workspace_id,
        p.actor_id,
        row.company_id,
        row.manufacturer,
        row.model,
        row.serial,
        row.configuration_id,
      ],
    )
  ).rows;
}
export async function bulletinWorkspace(p: Principal, id: string) {
  const c = database(),
    record = await equipmentEvidenceRecord(c, p, "bulletins", id);
  const candidates = await bulletinCandidates(c, p, record);
  const reviews = (
    await c.query(
      `SELECT r.*,a.display_number FROM ppo.equipment_bulletin_reviews r JOIN ppo.assets a ON (a.workspace_id,a.id)=(r.workspace_id,r.asset_id) WHERE r.workspace_id=$1 AND r.bulletin_id=$3 AND ${visibility("Asset", "a")} ORDER BY r.recorded_at,r.id`,
      [p.workspace_id, p.actor_id, id],
    )
  ).rows;
  return {
    record,
    candidates: candidates.map((a) => ({
      ...a,
      match: "Candidate only — applicability requires review",
    })),
    reviews,
    can_edit: await hasPermission(
      c,
      p,
      "shared.edit",
      record.company_id,
      record.site_id ?? undefined,
    ),
  };
}
export async function reviewBulletin(p: Principal, id: string, input: unknown) {
  const b = object(input, [
      ...commonKeys,
      "expected_version",
      "asset_id",
      "expected_asset_version",
      "expected_review_version",
      "disposition",
      "evidence_reference",
      "evidence_revision",
      "activity_id",
      "owner_id",
      "due_at",
    ]),
    cmd = {
      ...common(b),
      id: uuid(id, "id"),
      expected_version: version(b.expected_version),
      asset_id: uuid(b.asset_id, "asset_id"),
      expected_asset_version: version(b.expected_asset_version),
      expected_review_version: version(b.expected_review_version),
      disposition: choice(b.disposition, "disposition", [
        "Affected",
        "PotentiallyAffected",
        "NotApplicable",
        "Unknown",
      ]),
      evidence_reference: safeEvidence(
        b.evidence_reference,
        "evidence_reference",
      ),
      evidence_revision: safeEvidence(
        b.evidence_revision,
        "evidence_revision",
        80,
      ),
      activity_id: optionalId(b.activity_id, "activity_id"),
      owner_id: optionalId(b.owner_id, "owner_id"),
      due_at: b.due_at ? instant(b.due_at, "due_at") : null,
    };
  return sharedOperation(
    p,
    cmd,
    "ReviewEquipmentBulletin",
    async (c) => {
      const row = await equipmentEvidenceRecord(c, p, "bulletins", id, true);
      const a = await visible(c, p, "Asset", cmd.asset_id);
      await companyContext(c, p, a.company_id, a.site_id, "shared.edit");
      if (a.company_id !== row.company_id) throw unavailable();
      return { row, a };
    },
    async (c, { row, a }) => {
      checkVersion(row.version, cmd.expected_version);
      checkVersion(a.version, cmd.expected_asset_version);
      if (row.state !== "Open")
        invalid("state", "This bulletin revision is closed.");
      const count = (
        await c.query<{ count: number }>(
          "SELECT count(*)::int AS count FROM ppo.equipment_bulletin_reviews WHERE workspace_id=$1 AND bulletin_id=$2 AND asset_id=$3",
          [p.workspace_id, id, a.id],
        )
      ).rows[0].count;
      checkVersion(count + 1, cmd.expected_review_version);
      let activity = cmd.activity_id;
      if (cmd.disposition !== "NotApplicable") {
        if (activity) {
          const task = await visibleActivity(c, p, activity);
          const link = await c.query(
            "SELECT 1 FROM ppo.activity_links WHERE workspace_id=$1 AND activity_id=$2 AND asset_id=$3",
            [p.workspace_id, activity, a.id],
          );
          if (
            !link.rowCount ||
            task.company_id !== a.company_id ||
            !task.owner_id ||
            !task.due_at
          )
            invalid(
              "activity_id",
              "Use an owned Activity with a due date linked to this Asset.",
            );
        } else {
          if (!cmd.owner_id || !cmd.due_at)
            invalid(
              "owner_id",
              "Name an owner and due date for applicability follow-up.",
            );
          activity = randomUUID();
          const task: ActivityInput = {
            id: activity,
            company_id: a.company_id,
            site_id: a.site_id,
            kind: "TechnicalFollowUp",
            owner_id: cmd.owner_id!,
            summary: `Review ${row.reference} ${row.revision} for ${a.display_number}`,
            due_at: cmd.due_at,
            due_needed: false,
            access_class: "RestrictedService",
            links: [{ object_type: "Asset", object_id: a.id }],
          };
          await authoriseActivityInput(c, p, task);
          const saved = await insertActivity(c, p, task);
          await c.query(
            "INSERT INTO ppo.audit_events(id,workspace_id,actor_id,object_type,object_id,outcome,reason,details) VALUES($1,$2,$3,'Activity',$4,'Accepted',$5,$6)",
            [
              randomUUID(),
              p.workspace_id,
              p.actor_id,
              activity,
              cmd.reason,
              {
                command: "EquipmentBulletinFollowUp",
                record_version: saved.version,
                bulletin_id: id,
              },
            ],
          );
        }
      }
      await c.query(
        "INSERT INTO ppo.equipment_bulletin_reviews(id,workspace_id,company_id,bulletin_id,asset_id,asset_version,disposition,evidence_reference,evidence_revision,reason,activity_id,recorded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
        [
          randomUUID(),
          p.workspace_id,
          a.company_id,
          id,
          a.id,
          a.version,
          cmd.disposition,
          cmd.evidence_reference,
          cmd.evidence_revision,
          cmd.reason,
          activity,
          p.actor_id,
        ],
      );
      return {
        ...row,
        state: cmd.disposition,
        updated_at: new Date(),
        audit_details: { asset_id: a.id, activity_id: activity },
      };
    },
    "EquipmentBulletin",
    "SharedRecordUpdated",
  );
}
export async function closeBulletin(p: Principal, id: string, input: unknown) {
  const b = object(input, [...commonKeys, "expected_version"]),
    cmd = {
      ...common(b),
      id: uuid(id, "id"),
      expected_version: version(b.expected_version),
    };
  return sharedOperation(
    p,
    cmd,
    "CloseEquipmentBulletin",
    async (c) => {
      const row = await equipmentEvidenceRecord(c, p, "bulletins", id, true);
      await companyContext(c, p, row.company_id, null, "shared.edit");
      return row;
    },
    async (c, row) => {
      checkVersion(row.version, cmd.expected_version);
      if (row.state !== "Open")
        invalid("state", "The bulletin is already closed.");
      const candidates = await bulletinCandidates(c, p, row),
        reviews = (
          await c.query(
            "SELECT DISTINCT ON(asset_id) * FROM ppo.equipment_bulletin_reviews WHERE workspace_id=$1 AND bulletin_id=$2 ORDER BY asset_id,recorded_at DESC,id DESC",
            [p.workspace_id, id],
          )
        ).rows;
      const assets = new Set([
        ...candidates.map((a) => a.id),
        ...reviews.map((r) => r.asset_id),
      ]);
      if (!assets.size)
        invalid("disposition", "No reviewed scope exists for closure.");
      for (const asset of assets) {
        const review = reviews.find((r) => r.asset_id === asset),
          a = await visible(c, p, "Asset", asset);
        if (
          !review ||
          review.asset_version !== a.version ||
          !["Affected", "NotApplicable"].includes(review.disposition)
        )
          invalid(
            "disposition",
            "Every candidate and previously reviewed Asset needs a current definitive disposition.",
          );
        if (review.disposition === "Affected") {
          if (!review.activity_id)
            invalid(
              "activity_id",
              "Affected equipment needs owned follow-up evidence.",
            );
          const activity = await visibleActivity(c, p, review.activity_id);
          if (activity.status !== "Completed" || !activity.outcome)
            invalid(
              "activity_id",
              "Complete each affected Asset's owned follow-up with its outcome before bulletin closure.",
            );
        }
      }
      return (
        await c.query(
          "UPDATE ppo.equipment_bulletins SET state='Closed',version=version+1,closed_at=clock_timestamp(),closed_by=$3,close_reason=$4,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, id, p.actor_id, cmd.reason],
        )
      ).rows[0];
    },
    "EquipmentBulletin",
    "SharedRecordUpdated",
  );
}
export async function equipmentEvidence(
  p: Principal,
  kind: EvidenceKind,
  input: unknown = {},
) {
  const q = object(input, ["asset_id"]),
    asset = optionalId(q.asset_id, "asset_id"),
    c = database();
  await requireCapability(c, p, "shared.read");
  if (asset) await visible(c, p, "Asset", asset);
  const rows = (
    await c.query(
      `SELECT e.*,u.display_name AS actor${kind !== "bulletins" ? ",a.display_number,a.description,a.version AS asset_version" : ""} FROM ppo.${tables[kind]} e JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.created_by) ${kind !== "bulletins" ? "JOIN ppo.assets a ON (a.workspace_id,a.id)=(e.workspace_id,e.asset_id)" : ""} WHERE e.workspace_id=$1 AND ${scopeSql("e.company_id", "e.site_id")} ${kind !== "bulletins" ? `AND ${visibility("Asset", "a")} AND ($3::uuid IS NULL OR e.asset_id=$3)` : "AND ($3::uuid IS NULL OR EXISTS(SELECT 1 FROM ppo.assets a WHERE a.workspace_id=e.workspace_id AND a.company_id=e.company_id AND a.id=$3))"} ORDER BY e.created_at DESC,e.id LIMIT 201`,
      [p.workspace_id, p.actor_id, asset],
    )
  ).rows;
  const items = [];
  for (const row of rows.slice(0, 200)) {
    const can_edit = await hasPermission(
      c,
      p,
      "shared.edit",
      row.company_id,
      row.site_id ?? undefined,
    );
    if (kind === "backups") {
      const reviews = (
        await c.query(
          "SELECT r.*,u.display_name AS reviewer FROM ppo.equipment_backup_reviews r JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.recorded_by) WHERE r.workspace_id=$1 AND r.backup_id=$2 ORDER BY r.recorded_at,r.id",
          [p.workspace_id, row.id],
        )
      ).rows;
      items.push({
        ...row,
        can_edit,
        reviews,
        review_version: reviews.length + 1,
        current_configuration:
          (await currentConfiguration(c, p.workspace_id, row.asset_id))?.id ===
          row.configuration_id,
      });
    } else items.push({ ...row, can_edit });
  }
  return { items, partial: rows.length > 200, source: "Synthetic" };
}

export async function calibrationAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  edit = false,
) {
  const row = (
    await c.query(
      "SELECT * FROM ppo.equipment_calibration_events WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, id],
    )
  ).rows[0];
  if (!row) throw unavailable();
  await companyContext(
    c,
    p,
    row.company_id,
    null,
    edit ? "shared.edit" : "shared.read",
  );
  return row;
}
export async function recordCalibration(p: Principal, input: unknown) {
  const b = object(input, [
    ...commonKeys,
    "id",
    "company_id",
    "instrument_id",
    "predecessor_id",
    "expected_version",
    "reference",
    "description",
    "calibration_reference",
    "calibration_version",
    "valid_from",
    "valid_to",
    "measurement_type",
    "measurement_range",
    "measurement_unit",
    "certificate_reference",
    "certificate_revision",
    "withdrawn_effective_from",
  ]);
  const withdrawal = !!b.withdrawn_effective_from,
    fields: Record<string, unknown> = {};
  const cmd = {
    ...common(b),
    id: uuid(b.id, "id"),
    company_id: uuid(b.company_id, "company_id"),
    instrument_id: uuid(b.instrument_id, "instrument_id"),
    predecessor_id: optionalId(b.predecessor_id, "predecessor_id"),
    expected_version:
      b.expected_version == null ? null : version(b.expected_version),
    withdrawn_effective_from: withdrawal
      ? dateOnly(b.withdrawn_effective_from, "withdrawn_effective_from")
      : null,
    fields,
  };
  if (!withdrawal) {
    for (const k of [
      "reference",
      "description",
      "calibration_reference",
      "calibration_version",
      "measurement_type",
      "measurement_range",
      "measurement_unit",
      "certificate_reference",
      "certificate_revision",
    ])
      fields[k] = safeEvidence(
        b[k],
        k,
        k === "calibration_version"
          ? 20
          : k === "reference"
            ? 60
            : k === "calibration_reference"
              ? 80
              : 200,
      );
    fields.valid_from = dateOnly(b.valid_from, "valid_from");
    fields.valid_to = dateOnly(b.valid_to, "valid_to");
    if (String(fields.valid_to) < String(fields.valid_from))
      invalid("valid_to", "Calibration end must follow its start.");
  }
  return sharedOperation(
    p,
    cmd,
    "RecordEquipmentCalibration",
    (c) => companyContext(c, p, cmd.company_id, null, "shared.edit"),
    async (c) => {
      if (withdrawal) {
        const old = (
          await c.query(
            "SELECT * FROM ppo.inspection_instruments WHERE workspace_id=$1 AND company_id=$2 AND id=$3",
            [p.workspace_id, cmd.company_id, cmd.instrument_id],
          )
        ).rows[0];
        if (!old) throw unavailable();
        if (cmd.expected_version == null)
          invalid(
            "expected_version",
            "Retain the current calibration version.",
          );
        checkVersion(old.version, cmd.expected_version!);
        await c.query(
          "UPDATE ppo.inspection_instruments SET version=version+1,withdrawn_effective_from=$4,withdrawn_reason=$5,withdrawn_recorded_at=clock_timestamp() WHERE workspace_id=$1 AND company_id=$2 AND id=$3",
          [
            p.workspace_id,
            cmd.company_id,
            cmd.instrument_id,
            cmd.withdrawn_effective_from,
            cmd.reason,
          ],
        );
      } else {
        if (cmd.predecessor_id) {
          const old = (
            await c.query(
              "SELECT * FROM ppo.inspection_instruments WHERE workspace_id=$1 AND company_id=$2 AND id=$3",
              [p.workspace_id, cmd.company_id, cmd.predecessor_id],
            )
          ).rows[0];
          if (!old || old.reference !== fields.reference)
            invalid(
              "predecessor_id",
              "Renew the same canonical instrument reference in this company.",
            );
          if (cmd.expected_version == null)
            invalid("expected_version", "Retain the predecessor version.");
          checkVersion(old.version, cmd.expected_version!);
        }
        const entries = Object.entries({
          id: cmd.instrument_id,
          workspace_id: p.workspace_id,
          company_id: cmd.company_id,
          predecessor_id: cmd.predecessor_id,
          ...fields,
        });
        await c.query(
          `INSERT INTO ppo.inspection_instruments(${entries.map(([k]) => k).join(",")}) VALUES(${entries.map((_, i) => `$${i + 1}`).join(",")})`,
          entries.map(([, v]) => v),
        );
      }
      return {
        ...(await insert(c, p, "equipment_calibration_events", {
          id: cmd.id,
          company_id: cmd.company_id,
          site_id: null,
          instrument_id: cmd.instrument_id,
          kind: withdrawal
            ? "Withdrawn"
            : cmd.predecessor_id
              ? "Renewed"
              : "Recorded",
          reason: cmd.reason,
        })),
        state: withdrawal ? "Withdrawn" : "Recorded",
      };
    },
    "CalibrationEvidence",
    "SharedRecordUpdated",
  );
}
type EquipmentInstrument = import("../inspections/service").InstrumentRow & {
  company_id: string;
  version: number;
  predecessor_id: string | null;
};
export async function equipmentInstruments(p: Principal) {
  const c = database();
  await requireCapability(c, p, "shared.read");
  const rows = (
    await c.query<EquipmentInstrument>(
      `SELECT i.*,i.valid_from::text,i.valid_to::text,i.withdrawn_effective_from::text FROM ppo.inspection_instruments i WHERE i.workspace_id=$1 AND ${scopeSql("i.company_id")} ORDER BY i.reference,i.valid_from DESC LIMIT 201`,
      [p.workspace_id, p.actor_id],
    )
  ).rows;
  const items = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const row of rows.slice(0, 200)) {
    const calibration: Calibration = {
      reference: row.calibration_reference,
      version: row.calibration_version,
      valid_from: row.valid_from,
      valid_to: row.valid_to,
      withdrawn_effective_from: row.withdrawn_effective_from,
      withdrawn_reason: row.withdrawn_reason,
    };
    // Usage requires its owning host authority, not merely instrument/company access.
    const candidates = (
      await c.query<
        Pick<
          AttemptRow,
          | "id"
          | "host_type"
          | "host_id"
          | "configuration_reference"
          | "occurred_at"
          | "timezone"
          | "state"
        > & { snapshot: InstrumentUseRow["snapshot"] }
      >(
        `SELECT u.snapshot,a.id,a.host_type,a.host_id,a.configuration_reference,a.occurred_at,a.timezone,a.state FROM ppo.inspection_instrument_uses u JOIN ppo.inspection_attempts a ON (a.workspace_id,a.id)=(u.workspace_id,u.attempt_id) WHERE u.workspace_id=$1 AND u.instrument_id=$2 ORDER BY a.occurred_at DESC,a.id LIMIT 201`,
        [p.workspace_id, row.id],
      )
    ).rows;
    const uses = [];
    for (const u of candidates.slice(0, 200)) {
      const host = await equipmentInspectionHost(c, p, u);
      if (!host) continue;
      const at = u.occurred_at ? localDate(u.occurred_at, u.timezone) : null;
      const readings = (
        await c.query<ResultRow>(
          "SELECT * FROM ppo.inspection_results WHERE workspace_id=$1 AND attempt_id=$2 ORDER BY check_key",
          [p.workspace_id, u.id],
        )
      ).rows;
      uses.push({
        ...u,
        ...host,
        attempt_id: u.id,
        readings,
        at_use: at
          ? assessInstrument(calibrationOf(u.snapshot), at)
          : { assessment: "Unknown", reason: "No occurrence time" },
        current_assessment_of_use: at
          ? assessInstrument(calibration, at)
          : { assessment: "Unknown", reason: "No occurrence time" },
      });
    }
    items.push({
      ...row,
      can_edit: await hasPermission(c, p, "shared.edit", row.company_id),
      current: assessInstrument(calibration, today),
      uses,
      usage_partial: candidates.length > 200,
      usage_scope:
        "Permitted source-owned Inspection uses; each host is checked independently.",
    });
  }
  return { items, partial: rows.length > 200, today };
}
