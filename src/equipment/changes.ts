import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { database } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import {
  hasPermission,
  scopeSql,
  type QueryClient,
} from "../platform/permissions";
import { canonical, sharedOperation } from "../platform/operations";
import { companyContext } from "../shared/authority";
import { visible } from "../shared/reads";
import { visibleWorkOrder } from "../service/work-orders";
import { visibleTicket } from "../service/tickets";
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
  uuid,
  version,
} from "../shared/validation";

import { changeKinds } from "./model";
export { changeKinds } from "./model";
export type ChangeKind = (typeof changeKinds)[number];
export type EquipmentChange = {
  id: string;
  company_id: string;
  site_id: string;
  asset_id: string;
  asset_version: number;
  version: number;
  kind: ChangeKind;
  state: "Proposed" | "Applied" | "Rejected";
  effective_at: Date;
  reason: string;
  source_reference: string;
  source_revision: string;
  basis: Impact;
  proposal: Proposal;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  review_reason: string | null;
};
type Proposal = {
  site_id: string | null;
  facility_id: string | null;
  successor_id: string | null;
  successor_version: number | null;
  configuration: string | null;
  consequences: string;
};
export const equipmentHash = (x: unknown) =>
  createHash("sha256")
    .update(canonical(JSON.parse(JSON.stringify(x))))
    .digest("hex");
export function safeEvidence(value: unknown, field: string, max = 2000) {
  const text = narrative(value, field, max);
  if (
    /(?:password|passwd|pwd|api[_ -]?key|client[_ -]?secret|access[_ -]?token|private[_ -]?key|connection[_ -]?string)\s*[:=]|-----BEGIN|(?:postgres(?:ql)?|mssql|mysql):\/\/|[?&](?:sig|token|key)=|https?:\/\/[^/\s]+:[^/\s]+@/i.test(
      text,
    )
  )
    invalid(
      field,
      "Use a protected evidence reference, never credentials, keys or connection strings.",
    );
  return text;
}
export async function currentConfiguration(
  c: QueryClient,
  workspace: string,
  asset: string,
) {
  return (
    (
      await c.query<{
        id: string;
        revision: number;
        description: string;
        valid_from: Date;
      }>(
        `SELECT ac.id,ac.revision,ac.description,ac.valid_from FROM ppo.asset_configurations ac
    WHERE ac.workspace_id=$1 AND ac.asset_id=$2 AND ac.valid_from<=clock_timestamp() AND (ac.valid_to IS NULL OR ac.valid_to>clock_timestamp())
    AND NOT EXISTS(SELECT 1 FROM ppo.asset_configuration_successions s WHERE s.workspace_id=ac.workspace_id AND s.predecessor_id=ac.id AND s.effective_at<=clock_timestamp()) ORDER BY revision DESC LIMIT 1`,
        [workspace, asset],
      )
    ).rows[0] ?? null
  );
}
export async function equipmentImpact(
  c: QueryClient,
  p: Principal,
  id: string,
) {
  const a = await visible(c, p, "Asset", id);
  const configuration = await currentConfiguration(c, p.workspace_id, id);
  const children = (
    await c.query<{ id: string; version: number; display_number: string }>(
      "SELECT id,version,display_number FROM ppo.assets WHERE workspace_id=$1 AND parent_asset_id=$2 ORDER BY id",
      [p.workspace_id, id],
    )
  ).rows;
  const served = (
    await c.query<{ id: string; facility_id: string; source_id: string }>(
      "SELECT id,facility_id,source_id FROM ppo.asset_served_facilities WHERE workspace_id=$1 AND asset_id=$2 AND ended_at IS NULL ORDER BY id",
      [p.workspace_id, id],
    )
  ).rows;
  const work = (
    await c.query<{
      id: string;
      version: number;
      display_number: string;
      status: string;
      permitted: boolean;
    }>(
      `SELECT DISTINCT w.id,w.version,w.display_number,w.status,${scopeSql("w.company_id", "w.site_id", "service.work_order.read")} AS permitted FROM ppo.work_orders w JOIN ppo.scope_assets sa ON (sa.workspace_id,sa.scope_revision_id)=(w.workspace_id,w.scope_revision_id) WHERE w.workspace_id=$1 AND sa.asset_id=$3 AND w.status NOT IN ('Closed','Cancelled') ORDER BY w.id`,
      [p.workspace_id, p.actor_id, id],
    )
  ).rows;
  const tickets = (
    await c.query<{ id: string; version: number; permitted: boolean }>(
      `SELECT t.id,t.version,${scopeSql("t.company_id", "t.site_id", "service.ticket.read")} AS permitted FROM ppo.tickets t WHERE t.workspace_id=$1 AND t.asset_id=$3 AND t.status NOT IN ('Closed','Cancelled') ORDER BY t.id`,
      [p.workspace_id, p.actor_id, id],
    )
  ).rows;
  // A reviewer without source access cannot approve consequences using a partial preview.
  if (work.some((w) => !w.permitted) || tickets.some((t) => !t.permitted))
    throw new AppError(
      409,
      "ImpactUnavailable",
      "An owning Service source requires additional access before Equipment change review.",
    );
  try {
    for (const w of work) await visibleWorkOrder(c, p, w.id);
    for (const t of tickets) await visibleTicket(c, p, t.id);
  } catch (e) {
    if (e instanceof AppError && [403, 404].includes(e.status))
      throw new AppError(
        409,
        "ImpactUnavailable",
        "An owning Service source cannot be reviewed in your current context.",
      );
    throw e;
  }
  return {
    asset_version: a.version as number,
    site_id: a.site_id as string,
    facility_id: a.facility_id as string | null,
    parent_asset_id: a.parent_asset_id as string | null,
    lifecycle_status: a.lifecycle_status as string,
    configuration,
    children,
    served,
    work,
    tickets,
    warranty: {
      start: a.warranty_start as string | null,
      end: a.warranty_end as string | null,
    },
    maintenance:
      "No canonical maintenance contract is available; no status transfers.",
    documents:
      "Existing documents and configurations remain attached to their original identity and revision.",
  };
}
export type Impact = Awaited<ReturnType<typeof equipmentImpact>>;
async function editAsset(c: QueryClient, p: Principal, id: string) {
  const a = await visible(c, p, "Asset", id);
  await companyContext(c, p, a.company_id, a.site_id, "shared.edit");
  return a;
}
function expected(actual: number, wanted: number) {
  if (actual !== wanted)
    throw new AppError(
      409,
      "VersionConflict",
      "The Equipment context changed. Refresh and review the exact current basis before trying again.",
    );
}
export async function readEquipmentChange(
  c: QueryClient,
  p: Principal,
  id: string,
  edit = false,
) {
  const row = (
    await c.query<EquipmentChange>(
      "SELECT * FROM ppo.equipment_changes WHERE workspace_id=$1 AND id=$2",
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
  await visible(c, p, "Asset", row.asset_id);
  if (row.proposal.site_id)
    await companyContext(
      c,
      p,
      row.company_id,
      row.proposal.site_id,
      edit ? "shared.edit" : "shared.read",
    );
  if (row.proposal.successor_id)
    await visible(c, p, "Asset", row.proposal.successor_id);
  for (const w of row.basis.work) await visibleWorkOrder(c, p, w.id);
  for (const t of row.basis.tickets) await visibleTicket(c, p, t.id);
  return row;
}
export async function previewEquipmentChange(p: Principal, id: string) {
  const c = database();
  await editAsset(c, p, uuid(id, "id"));
  const impact = await equipmentImpact(c, p, id);
  return { impact, basis_hash: equipmentHash(impact) };
}
export async function proposeEquipmentChange(
  p: Principal,
  id: string,
  input: unknown,
) {
  const b = object(input, [
    ...commonKeys,
    "id",
    "expected_version",
    "kind",
    "effective_at",
    "source_reference",
    "source_revision",
    "basis_hash",
    "site_id",
    "facility_id",
    "successor_id",
    "successor_version",
    "configuration",
    "consequences",
  ]);
  const kind = choice(b.kind, "kind", changeKinds);
  const proposal: Proposal = {
    site_id: optionalId(b.site_id, "site_id"),
    facility_id: optionalId(b.facility_id, "facility_id"),
    successor_id: optionalId(b.successor_id, "successor_id"),
    successor_version:
      b.successor_version == null ? null : version(b.successor_version),
    configuration:
      b.configuration == null
        ? null
        : safeEvidence(b.configuration, "configuration", 10000),
    consequences: safeEvidence(b.consequences, "consequences"),
  };
  if (
    (kind === "Configuration") !== !!proposal.configuration ||
    ["Relocate", "CorrectLocation"].includes(kind) !== !!proposal.site_id ||
    (kind === "Replace") !== !!proposal.successor_id ||
    !!proposal.successor_id !== !!proposal.successor_version ||
    (proposal.facility_id && !proposal.site_id)
  )
    invalid(
      "kind",
      "Provide only the configuration, destination or successor required by this change kind.",
    );
  const cmd = {
    ...common(b),
    id: uuid(b.id, "id"),
    asset_id: uuid(id, "asset_id"),
    expected_version: version(b.expected_version),
    kind,
    effective_at: instant(b.effective_at, "effective_at"),
    source_reference: safeEvidence(b.source_reference, "source_reference"),
    source_revision: safeEvidence(b.source_revision, "source_revision", 80),
    basis_hash: label(b.basis_hash, "basis_hash", 64),
    proposal,
  };
  return sharedOperation(
    p,
    cmd,
    "ProposeEquipmentChange",
    (c) => editAsset(c, p, cmd.asset_id),
    async (c, a) => {
      expected(a.version, cmd.expected_version);
      const basis = await equipmentImpact(c, p, id);
      if (equipmentHash(basis) !== cmd.basis_hash)
        throw new AppError(
          409,
          "StaleSource",
          "The impact preview changed. Refresh it before recording the proposal.",
        );
      await destination(c, p, a.company_id, proposal);
      if (Date.parse(cmd.effective_at) > Date.now())
        invalid(
          "effective_at",
          "Record an actual effective time; future physical changes remain proposals outside this command.",
        );
      return (
        await c.query(
          `INSERT INTO ppo.equipment_changes(id,workspace_id,company_id,site_id,asset_id,asset_version,kind,effective_at,reason,source_reference,source_revision,basis,proposal,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14) RETURNING *,state`,
          [
            cmd.id,
            p.workspace_id,
            a.company_id,
            a.site_id,
            id,
            cmd.expected_version,
            kind,
            cmd.effective_at,
            cmd.reason,
            cmd.source_reference,
            cmd.source_revision,
            JSON.stringify(basis),
            JSON.stringify(proposal),
            p.actor_id,
          ],
        )
      ).rows[0];
    },
    "EquipmentChange",
    "SharedRecordCreated",
  );
}
async function destination(
  c: QueryClient,
  p: Principal,
  company: string,
  proposal: Proposal,
) {
  if (proposal.site_id) {
    const s = await visible(c, p, "Site", proposal.site_id);
    if (s.company_id !== company) throw unavailable();
    await companyContext(c, p, company, s.id, "shared.edit");
    if (proposal.facility_id) {
      const f = await visible(c, p, "Facility", proposal.facility_id);
      if (f.site_id !== s.id || f.company_id !== company)
        invalid(
          "facility_id",
          "The destination Facility must belong to the selected Site.",
        );
    }
  }
  if (proposal.successor_id) {
    const a = await editAsset(c, p, proposal.successor_id);
    if (a.company_id !== company) throw unavailable();
  }
}
export async function reviewEquipmentChange(
  p: Principal,
  id: string,
  input: unknown,
) {
  const b = object(input, [...commonKeys, "expected_version", "decision"]),
    cmd = {
      ...common(b),
      id: uuid(id, "id"),
      expected_version: version(b.expected_version),
      decision: choice(b.decision, "decision", ["Apply", "Reject"]),
    };
  return sharedOperation(
    p,
    cmd,
    "ReviewEquipmentChange",
    (c) => readEquipmentChange(c, p, id, true),
    async (c, row) => {
      expected(row.version, cmd.expected_version);
      if (row.state !== "Proposed")
        invalid("decision", "This proposal has already been reviewed.");
      if (cmd.decision === "Apply") {
        const a = await editAsset(c, p, row.asset_id);
        expected(a.version, row.asset_version);
        const impact = await equipmentImpact(c, p, row.asset_id);
        if (equipmentHash(impact) !== equipmentHash(row.basis))
          throw new AppError(
            409,
            "StaleSource",
            "Source consequences changed after this proposal. Record a fresh proposal.",
          );
        if (a.lifecycle_status !== "Active")
          invalid(
            "asset_id",
            "Only active equipment accepts a new configuration or physical lifecycle change.",
          );
        await destination(c, p, row.company_id, row.proposal);
        if (
          row.kind !== "Configuration" &&
          (impact.parent_asset_id ||
            impact.children.length ||
            impact.served.length)
        )
          invalid(
            "consequences",
            "Resolve parent/components and explicitly end served-area links through their owning workflow before applying this physical change.",
          );
        if (
          row.kind !== "Configuration" &&
          (impact.work.length || impact.tickets.length)
        )
          invalid(
            "consequences",
            "Open Service work or requests must be resolved by Service before a physical change can be applied.",
          );
        if (row.kind === "Replace") {
          const successor = await editAsset(c, p, row.proposal.successor_id!);
          expected(successor.version, row.proposal.successor_version!);
          if (
            successor.id === a.id ||
            successor.predecessor_asset_id ||
            successor.lifecycle_status !== "Active" ||
            successor.parent_asset_id ||
            successor.site_id !== a.site_id
          )
            invalid(
              "successor_id",
              "Use a distinct active successor at this Site with no existing predecessor or parent.",
            );
        }
      }
      const saved = (
        await c.query(
          "UPDATE ppo.equipment_changes SET state=$3,version=version+1,updated_at=clock_timestamp(),updated_by=$4,reviewed_by=$4,reviewed_at=clock_timestamp(),review_reason=$5 WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [
            p.workspace_id,
            id,
            cmd.decision === "Apply" ? "Applied" : "Rejected",
            p.actor_id,
            cmd.reason,
          ],
        )
      ).rows[0];
      if (cmd.decision === "Apply") await applyChange(c, p, row);
      return saved;
    },
    "EquipmentChange",
    "SharedRecordUpdated",
  );
}
async function applyChange(c: PoolClient, p: Principal, row: EquipmentChange) {
  const a = await visible(c, p, "Asset", row.asset_id),
    proposal = row.proposal;
  if (row.kind === "Configuration") {
    const predecessor = await currentConfiguration(c, p.workspace_id, a.id),
      next = randomUUID();
    if (predecessor && row.effective_at <= predecessor.valid_from)
      invalid(
        "effective_at",
        "The successor must take effect after its predecessor.",
      );
    if (predecessor)
      await c.query(
        "INSERT INTO ppo.asset_configuration_successions(workspace_id,asset_id,predecessor_id,successor_id,change_id,effective_at) VALUES($1,$2,$3,$4,$5,$6)",
        [p.workspace_id, a.id, predecessor.id, next, row.id, row.effective_at],
      );
    await c.query(
      "INSERT INTO ppo.asset_configurations(id,workspace_id,company_id,asset_id,revision,description,valid_from,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8)",
      [
        next,
        p.workspace_id,
        a.company_id,
        a.id,
        (predecessor?.revision ?? 0) + 1,
        proposal.configuration,
        row.effective_at,
        p.actor_id,
      ],
    );
    await c.query(
      "UPDATE ppo.assets SET version=version+1,updated_at=clock_timestamp(),updated_by=$3 WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, a.id, p.actor_id],
    );
    return;
  }
  if (["Relocate", "CorrectLocation"].includes(row.kind)) {
    const last = (
      await c.query<{ effective_at: Date }>(
        "SELECT effective_at FROM ppo.asset_location_events WHERE workspace_id=$1 AND asset_id=$2 ORDER BY effective_at DESC LIMIT 1",
        [p.workspace_id, a.id],
      )
    ).rows[0];
    if (last && row.effective_at <= last.effective_at)
      invalid(
        "effective_at",
        "The event must follow the latest recorded location event; history is never rewritten.",
      );
    await c.query(
      "INSERT INTO ppo.asset_location_events(id,workspace_id,company_id,asset_id,from_site_id,to_site_id,effective_at,reason,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)",
      [
        randomUUID(),
        p.workspace_id,
        a.company_id,
        a.id,
        a.site_id,
        proposal.site_id,
        row.effective_at,
        `${row.kind}: ${row.reason}`,
        p.actor_id,
      ],
    );
    await c.query(
      "UPDATE ppo.assets SET site_id=$3,facility_id=$4,version=version+1,updated_at=clock_timestamp(),updated_by=$5 WHERE workspace_id=$1 AND id=$2",
      [
        p.workspace_id,
        a.id,
        proposal.site_id,
        proposal.facility_id,
        p.actor_id,
      ],
    );
  } else {
    await c.query(
      "UPDATE ppo.assets SET lifecycle_status=$3,version=version+1,updated_at=clock_timestamp(),updated_by=$4 WHERE workspace_id=$1 AND id=$2",
      [
        p.workspace_id,
        a.id,
        row.kind === "Retire" ? "Decommissioned" : "Removed",
        p.actor_id,
      ],
    );
    if (row.kind === "Replace")
      await c.query(
        "UPDATE ppo.assets SET predecessor_asset_id=$3,version=version+1,updated_at=clock_timestamp(),updated_by=$4 WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, proposal.successor_id, a.id, p.actor_id],
      );
  }
}
export async function equipmentChanges(p: Principal, id: string) {
  await visible(database(), p, "Asset", uuid(id, "id"));
  const rows = (
    await database().query<{ id: string }>(
      "SELECT id FROM ppo.equipment_changes WHERE workspace_id=$1 AND asset_id=$2 ORDER BY created_at DESC,id LIMIT 200",
      [p.workspace_id, id],
    )
  ).rows;
  const items: EquipmentChange[] = [];
  for (const r of rows) {
    try {
      items.push(await readEquipmentChange(database(), p, r.id));
    } catch (e) {
      if (!(e instanceof AppError && e.status === 404)) throw e;
    }
  }
  return {
    items,
    can_edit: await hasPermission(
      database(),
      p,
      "shared.edit",
      (await visible(database(), p, "Asset", id)).company_id,
      (await visible(database(), p, "Asset", id)).site_id,
    ),
  };
}
