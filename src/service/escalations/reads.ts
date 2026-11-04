import { transaction } from "../../platform/database";
import { AppError } from "../../platform/errors";
import type { Principal } from "../../platform/identity";
import {
  requireCapability,
  scopeSql,
  type QueryClient,
} from "../../platform/permissions";
import { choice, invalid, object, uuid } from "../../shared/validation";
import {
  caseContext,
  caseCapability,
  findingEquipment,
  supportRoute,
} from "./context";
import { sourceContext } from "../findings/next-action";
import { caseActions, allowedAction, hashBytes } from "./model";
import { currentConfiguration } from "../../equipment/changes";
import { activityVisibility } from "../../activities/activities";
import { visibility } from "../../shared/reads";
import { orderVisibility } from "../work-orders";
const denied = (e: unknown) =>
  e instanceof AppError && [403, 404].includes(e.status);
// Keep the case DTO independent of Equipment's private notes and commercial fields.
function equipmentView(asset: Record<string, unknown>) {
  const text = (key: string) =>
    typeof asset[key] === "string" ? (asset[key] as string) : null;
  const end = asset.warranty_end;
  const warranty_end =
    end instanceof Date
      ? `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`
      : text("warranty_end");
  return {
    id: String(asset.id),
    company_id: String(asset.company_id),
    site_id: String(asset.site_id),
    version: Number(asset.version),
    display_number: String(asset.display_number),
    description: String(asset.description),
    manufacturer: text("manufacturer"),
    model: text("model"),
    serial: text("serial"),
    warranty_end,
  };
}
export async function owners(
  c: QueryClient,
  p: Principal,
  key: string,
  assetId: string,
) {
  const { finding } = await findingEquipment(c, p, key, assetId);
  // Evaluate every candidate in one query, using the native visibility predicates.
  // The mutation still calls caseOwner; this list does not grant authority.
  const forOwner = (sql: string) => sql.replaceAll("$2", "candidate.id");
  const duty = (cap: Parameters<typeof scopeSql>[2]) =>
    forOwner(scopeSql("a.company_id", "a.site_id", cap));
  const service = duty("service.work_order.edit");
  const field = `(${duty("field.read.own")} AND EXISTS(
    SELECT 1 FROM ppo.assignments x JOIN ppo.resources r ON (r.workspace_id,r.id)=(x.workspace_id,x.resource_id)
    WHERE x.workspace_id=a.workspace_id AND x.appointment_id=a.id AND x.active
      AND x.assignment_version=a.assignment_version AND r.user_id=candidate.id AND r.active)
    AND EXISTS(SELECT 1 FROM ppo.scope_revisions sr WHERE sr.workspace_id=a.workspace_id AND sr.id=a.scope_revision_id AND sr.work_order_id=w.id))`;
  return (
    await c.query<{ id: string; display_name: string }>(
      `
    SELECT candidate.id,candidate.display_name FROM ppo.users candidate
    JOIN ppo.appointments a ON a.workspace_id=candidate.workspace_id AND a.id=$2
    JOIN ppo.work_orders w ON (w.workspace_id,w.id)=(a.workspace_id,a.work_order_id)
    LEFT JOIN ppo.activities task ON task.workspace_id=a.workspace_id AND task.id=$3
    LEFT JOIN ppo.incidents incident ON incident.workspace_id=a.workspace_id AND incident.id=$4
    LEFT JOIN ppo.service_reports report ON report.workspace_id=a.workspace_id AND report.id=$4
    WHERE candidate.workspace_id=$1 AND candidate.active
      AND ${duty(caseCapability)} AND ${duty("activity.edit")} AND ${duty("activity.read")}
      AND ${duty("shared.read")} AND ${duty("schedule.read")}
      AND ${forOwner(orderVisibility("w"))}
      AND NOT EXISTS(SELECT 1 FROM ppo.scope_revisions sr JOIN ppo.scope_assets sa ON (sa.workspace_id,sa.scope_revision_id)=(sr.workspace_id,sr.id)
        WHERE sr.workspace_id=w.workspace_id AND sr.work_order_id=w.id AND NOT EXISTS(
          SELECT 1 FROM ppo.assets historic WHERE historic.workspace_id=sa.workspace_id AND historic.id=sa.asset_id AND ${forOwner(visibility("Asset", "historic"))}))
      AND ($3::uuid IS NULL OR ${forOwner(activityVisibility("task", true, true, true))})
      AND CASE $5::text
        WHEN 'inspection' THEN (${duty("report.read")} AND ${service} AND w.service_owner_id=candidate.id) OR ${field}
        WHEN 'incident' THEN ${duty("incident.read")} AND (incident.state<>'Draft' OR incident.reporter_id=candidate.id) AND (${service} OR ${field})
        WHEN 'schedule' THEN true
        ELSE ${duty("report.read")} AND ${forOwner(scopeSql("report.company_id", "report.site_id", "report.read"))}
          AND (${forOwner(scopeSql("report.company_id", "report.site_id", "service.work_order.edit"))} OR ${field}) END
    ORDER BY candidate.display_name,candidate.id`,
      [
        p.workspace_id,
        finding.authority.ctx.a.id,
        finding.source.activity_id,
        finding.source.parent_id,
        finding.source.source,
      ],
    )
  ).rows;
}
export async function caseOptions(p: Principal, input: unknown = {}) {
  const q = object(input, ["finding_key"]);
  if (typeof q.finding_key !== "string")
    invalid("finding_key", "Choose a permitted finding first.");
  return transaction(async (c) => {
    await c.query("SELECT id FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    await requireCapability(c, p, caseCapability);
    const finding = await sourceContext(c, p, q.finding_key as string);
    const rows = (
      await c.query<{ id: string }>(
        `SELECT a.id FROM ppo.assets a WHERE a.workspace_id=$1 AND a.company_id=$3 AND a.site_id=$4 AND ${scopeSql("a.company_id", "a.site_id", caseCapability)} ORDER BY a.description,a.id LIMIT 201`,
        [
          p.workspace_id,
          p.actor_id,
          finding.item.company_id,
          finding.item.site.id,
        ],
      )
    ).rows;
    const equipment = [];
    let eligibleOwners: Awaited<ReturnType<typeof owners>> | undefined;
    for (const r of rows.slice(0, 200)) {
      try {
        const { asset } = await findingEquipment(
          c,
          p,
          q.finding_key as string,
          r.id,
        );
        eligibleOwners ??= await owners(c, p, q.finding_key as string, r.id);
        equipment.push({
          ...equipmentView(asset),
          support_route: await supportRoute(c, p, asset),
          owners: eligibleOwners,
        });
      } catch (e) {
        if (!denied(e)) throw e;
      }
    }
    return {
      finding: finding.item,
      equipment,
      completeness: rows.length > 200 ? "BoundedWindow" : "Complete",
      synthetic: true,
    };
  });
}
export async function listCases(p: Principal, input: unknown = {}) {
  const q = object(input, [
    "view",
    "owner_id",
    "manufacturer",
    "offset",
    "limit",
  ]);
  const view =
    q.view === undefined
      ? "open"
      : choice(q.view, "view", [
          "open",
          "diagnosing",
          "waiting",
          "reply",
          "closed",
        ] as const);
  const owner = q.owner_id ? uuid(q.owner_id, "owner_id") : null;
  const manufacturer =
    q.manufacturer === undefined ? null : String(q.manufacturer);
  if (manufacturer && manufacturer.length > 200)
    invalid("manufacturer", "Use a manufacturer from the list.");
  const number = (v: unknown, f: string, d: number, max: number) => {
    if (v === undefined) return d;
    const n = Number(v);
    if (!Number.isSafeInteger(n) || n < 0 || n > max)
      invalid(f, "Use a valid page size or offset.");
    return n;
  };
  const offset = number(q.offset, "offset", 0, 1000),
    limit = number(q.limit, "limit", 25, 50);
  if (limit === 0) invalid("limit", "Use at least one row per page.");
  return transaction(async (c) => {
    await c.query("SELECT id FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    await requireCapability(c, p, caseCapability);
    const read_at = (
      await c.query<{ now: Date }>("SELECT clock_timestamp() now")
    ).rows[0].now;
    const candidates = (
      await c.query<{ id: string }>(
        `SELECT e.id FROM ppo.service_escalation_cases e WHERE e.workspace_id=$1 AND ${scopeSql("e.company_id", "e.site_id", caseCapability)} ORDER BY e.updated_at DESC,e.id LIMIT 1001`,
        [p.workspace_id, p.actor_id],
      )
    ).rows;
    const permitted = [];
    for (const candidate of candidates.slice(0, 1000)) {
      try {
        const ctx = await caseContext(c, p, candidate.id),
          row = ctx.row;
        const ownerName = (
          await c.query<{ display_name: string }>(
            "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, row.owner_id],
          )
        ).rows[0].display_name;
        const sent = (
          await c.query<{ occurred_at: Date; reply_expected_at: string }>(
            "SELECT occurred_at,details->>'reply_expected_at' AS reply_expected_at FROM ppo.service_escalation_events WHERE workspace_id=$1 AND case_id=$2 AND id=$3",
            [p.workspace_id, row.id, row.last_sent_id],
          )
        ).rows[0];
        permitted.push({
          id: row.id,
          display_number: row.display_number,
          fault: row.fault,
          state: row.state,
          owner_id: row.owner_id,
          owner_name: ownerName,
          manufacturer: ctx.asset.manufacturer as string | null,
          site: ctx.finding.item.site.name,
          updated_at: row.updated_at.toISOString(),
          sent_at: sent?.occurred_at.toISOString() ?? null,
          reply_expected_at: sent?.reply_expected_at ?? null,
          chase_due:
            row.state === "WaitingOnManufacturer" &&
            !!sent &&
            Date.parse(sent.reply_expected_at) <= read_at.getTime(),
        });
      } catch (e) {
        if (!denied(e)) throw e;
      }
    }
    const inView = (state: string) =>
      view === "open"
        ? !["Closed", "Withdrawn"].includes(state)
        : view === "closed"
          ? ["Closed", "Withdrawn"].includes(state)
          : state ===
            (
              {
                diagnosing: "Diagnosing",
                waiting: "WaitingOnManufacturer",
                reply: "ReplyToActOn",
              } as const
            )[view];
    const selected = permitted.filter((r) => inView(r.state));
    const filtered = selected.filter(
      (r) =>
        (!owner || r.owner_id === owner) &&
        (!manufacturer || r.manufacturer === manufacturer),
    );
    return {
      items: filtered.slice(offset, offset + limit),
      count: filtered.length,
      offset,
      limit,
      read_at: read_at.toISOString(),
      completeness: candidates.length > 1000 ? "BoundedWindow" : "Complete",
      owners: [
        ...new Map(
          permitted.map((r) => [
            r.owner_id,
            { id: r.owner_id, display_name: r.owner_name },
          ]),
        ).values(),
      ],
      manufacturers: [
        ...new Set(
          permitted.map((r) => r.manufacturer).filter((m): m is string => !!m),
        ),
      ].sort(),
      synthetic: true,
    };
  });
}
export async function readCase(p: Principal, id: string, input: unknown = {}) {
  object(input, []);
  return transaction(async (c) => {
    await c.query("SELECT id FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const ctx = await caseContext(c, p, id),
      row = ctx.row;
    const configuration =
      (
        await c.query(
          "SELECT id,source_id,revision,description,sha256,created_at FROM ppo.service_escalation_configurations WHERE workspace_id=$1 AND case_id=$2 AND id=$3",
          [p.workspace_id, id, row.current_configuration_id],
        )
      ).rows[0] ?? null;
    const current = await currentConfiguration(c, p.workspace_id, row.asset_id);
    const events = (
      await c.query(
        "SELECT e.id,e.kind,e.occurred_at,e.details,e.created_at,u.display_name AS recorded_by FROM ppo.service_escalation_events e JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.created_by) WHERE e.workspace_id=$1 AND e.case_id=$2 ORDER BY e.created_at,e.id",
        [p.workspace_id, id],
      )
    ).rows;
    const packs = (
      await c.query(
        "SELECT p.id,p.revision,p.content_version,p.html_sha256,p.pdf_sha256,p.evidence_sha256,p.renderer_version,p.created_at,r.reviewed_at FROM ppo.service_escalation_packs p LEFT JOIN ppo.service_escalation_pack_reviews r ON (r.workspace_id,r.case_id,r.pack_id)=(p.workspace_id,p.case_id,p.id) WHERE p.workspace_id=$1 AND p.case_id=$2 ORDER BY p.revision DESC",
        [p.workspace_id, id],
      )
    ).rows;
    const files = (
      await c.query(
        "SELECT id,kind,reply_id,media_type,octet_length(content) AS bytes,sha256,created_at FROM ppo.service_escalation_files WHERE workspace_id=$1 AND case_id=$2 ORDER BY created_at,id",
        [p.workspace_id, id],
      )
    ).rows;
    const history = (
      await c.query(
        "SELECT e.id,e.occurred_at,e.reason,e.details->>'command' AS command,e.details->>'record_version' AS record_version,u.display_name AS actor FROM ppo.audit_events e JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.actor_id) WHERE e.workspace_id=$1 AND e.object_type='EscalationCase' AND e.object_id=$2 ORDER BY e.occurred_at DESC,e.id",
        [p.workspace_id, id],
      )
    ).rows;
    const ownerName = (
      await c.query<{ display_name: string }>(
        "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, row.owner_id],
      )
    ).rows[0].display_name;
    return {
      record: { ...row, owner_name: ownerName },
      equipment: equipmentView(ctx.asset),
      site: ctx.finding.item.site,
      finding: ctx.finding.item,
      source_token: ctx.finding.source_token,
      expected_finding_version: ctx.finding.item.action?.version ?? 0,
      configuration,
      configuration_current:
        !!configuration && configuration.source_id === current?.id,
      support_route: await supportRoute(c, p, ctx.asset),
      events,
      packs,
      files,
      history,
      owners: await owners(c, p, row.finding_key, row.asset_id),
      allowed_actions: caseActions.filter((a) => allowedAction(row.state, a)),
      synthetic: true,
    };
  });
}
export async function retainedFile(p: Principal, id: string, input: unknown) {
  const q = object(input, ["kind", "file_id", "format"]),
    kind = choice(q.kind, "kind", ["pack", "attachment"] as const),
    fileId = uuid(q.file_id, "file_id");
  const format =
    kind === "pack"
      ? choice(q.format, "format", ["html", "pdf"] as const)
      : null;
  return transaction(async (c) => {
    await c.query("SELECT id FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const { row } = await caseContext(c, p, id);
    if (kind === "pack") {
      const pack = (
        await c.query<{
          html: string;
          pdf: Buffer;
          html_sha256: string;
          pdf_sha256: string;
          revision: number;
        }>(
          "SELECT html,pdf,html_sha256,pdf_sha256,revision FROM ppo.service_escalation_packs WHERE workspace_id=$1 AND case_id=$2 AND id=$3",
          [p.workspace_id, id, fileId],
        )
      ).rows[0];
      if (!pack)
        throw new AppError(
          404,
          "NotFound",
          "This retained file is unavailable.",
        );
      const bytes =
          format === "html" ? Buffer.from(pack.html, "utf8") : pack.pdf,
        hash = format === "html" ? pack.html_sha256 : pack.pdf_sha256;
      if (hashBytes(bytes) !== hash)
        throw Error("Retained evidence hash mismatch");
      return {
        bytes,
        hash,
        media_type:
          format === "html" ? "text/html; charset=utf-8" : "application/pdf",
        filename: `${row.display_number}-evidence-${pack.revision}.${format}`,
      };
    }
    const file = (
      await c.query<{ content: Buffer; sha256: string; media_type: string }>(
        "SELECT content,sha256,media_type FROM ppo.service_escalation_files WHERE workspace_id=$1 AND case_id=$2 AND id=$3",
        [p.workspace_id, id, fileId],
      )
    ).rows[0];
    if (!file)
      throw new AppError(404, "NotFound", "This retained file is unavailable.");
    if (hashBytes(file.content) !== file.sha256)
      throw Error("Retained attachment hash mismatch");
    return {
      bytes: file.content,
      hash: file.sha256,
      media_type: file.media_type,
      filename: `${row.display_number}-${fileId}.${file.media_type === "image/png" ? "png" : file.media_type === "image/jpeg" ? "jpg" : "pdf"}`,
    };
  });
}
export type CaseRegister = Awaited<ReturnType<typeof listCases>>;
export type CaseRecord = Awaited<ReturnType<typeof readCase>>;
export type CaseOptions = Awaited<ReturnType<typeof caseOptions>>;
