import type { NextRequest } from "next/server";
import {
  identity,
  localRequest,
  jsonBody,
  reply,
  failure,
} from "../platform/http";
import { readRoute, type RouteContext } from "../shared/http";
import { transaction } from "../platform/database";
import { object, uuid } from "../shared/validation";
import { AppError, unavailable } from "../platform/errors";
import { appointmentAccess, binding } from "./context";
import { visible } from "../shared/reads";
import { incidentCommand, readIncident, fileBytes } from "./service";
import { readBundle } from "../engineering/commissioning/outputs";
export const recordRead = readRoute((p, id, q) => {
  object(q, []);
  return transaction((c) => readIncident(c, p, uuid(id, "id")));
});
export async function post(request: NextRequest) {
  try {
    localRequest(request, true);
    const p = await identity(request);
    const result = await incidentCommand(p, await jsonBody(request, 3_000_000));
    return reply(result.receipt, result.replayed ? 200 : 201);
  } catch (e) {
    return failure(e);
  }
}
export const list = readRoute((p, _id, q) => {
  object(q, []);
  return transaction(async (c) => {
    const candidates = (
      await c.query<{ id: string }>(
        "SELECT id FROM ppo.incidents WHERE workspace_id=$1 ORDER BY updated_at DESC,id LIMIT 200",
        [p.workspace_id],
      )
    ).rows;
    const items = [];
    for (const x of candidates) {
      try {
        const { row, operational_hold } = await readIncident(c, p, x.id);
        items.push({
          id: row.id,
          summary: row.facts.summary,
          state: row.state,
          classification: row.facts.classification,
          assessment: row.assessment,
          priority: row.priority,
          hold: operational_hold,
          due_at: row.due_at,
          appointment_id: row.appointment_id,
        });
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
    }
    return {
      items,
      window:
        "Latest 200 candidates, individually permission checked. No restricted counts or search index.",
    };
  });
});
export const contextRead = readRoute((p, _id, q) => {
  object(q, ["appointment_id", "scope_item_id", "asset_id"]);
  return transaction(async (c) => {
    const id = uuid(q.appointment_id, "appointment_id"),
      ctx = await appointmentAccess(c, p, id),
      targets = (
        await c.query(
          "SELECT i.id AS scope_item_id,i.task_description,a.asset_id,e.display_number AS display_name FROM ppo.scope_items i JOIN ppo.scope_assets a ON (a.workspace_id,a.scope_item_id)=(i.workspace_id,i.id) JOIN ppo.assets e ON e.workspace_id=a.workspace_id AND e.id=a.asset_id WHERE i.workspace_id=$1 AND i.scope_revision_id=$2 ORDER BY i.sequence,a.asset_id",
          [p.workspace_id, ctx.a.scope_revision_id],
        )
      ).rows;
    for (const t of targets) await visible(c, p, "Asset", t.asset_id);
    const selected = q.scope_item_id
      ? await binding(
          c,
          p,
          id,
          uuid(q.scope_item_id, "scope_item_id"),
          uuid(q.asset_id, "asset_id"),
        )
      : null;
    let can_report = false;
    try {
      await appointmentAccess(c, p, id, "incident.report");
      can_report = true;
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    }
    const owners = (
      await c.query(
        "SELECT DISTINCT u.id,u.display_name FROM ppo.users u JOIN ppo.permission_grants g ON g.workspace_id=u.workspace_id AND g.user_id=u.id WHERE u.workspace_id=$1 AND u.active AND g.capability='incident.report' AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp()) AND (g.scope_type='Workspace' OR g.company_id=$2 AND (g.scope_type='Company' OR g.site_id=$3)) ORDER BY u.display_name",
        [p.workspace_id, ctx.a.company_id, ctx.a.site_id],
      )
    ).rows;
    const permittedOwners = [];
    for (const o of owners) {
      try {
        await appointmentAccess(
          c,
          { ...p, actor_id: o.id, display_name: o.display_name },
          id,
          "incident.report",
        );
        permittedOwners.push(o);
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
    }
    return {
      appointment: {
        id: ctx.a.id,
        reference: ctx.a.display_number,
        work_order: ctx.w.display_number,
        status: ctx.a.status,
      },
      targets,
      selected: selected
        ? { source_hash: selected.source_hash, known: selected.known }
        : null,
      owners: permittedOwners,
      can_report,
    };
  });
});
export async function files(request: NextRequest, context: RouteContext) {
  try {
    localRequest(request);
    const p = await identity(request),
      id = uuid((await context.params).id, "id"),
      q = Object.fromEntries(request.nextUrl.searchParams);
    object(q, ["evidence_id", "output_id", "format"]);
    const file = await transaction(async (c) => {
      const v = await readIncident(c, p, id);
      if (q.evidence_id) {
        const e = v.evidence.find(
          (e) => e.id === uuid(q.evidence_id, "evidence_id"),
        );
        if (!e) throw unavailable();
        return {
          bytes: await fileBytes(p, e),
          type: e.media_type,
          hash: e.content_hash,
        };
      }
      const o = v.outputs.find((o) => o.id === uuid(q.output_id, "output_id"));
      if (!o) throw unavailable();
      const bytes = await readBundle(p, o.bundle);
      return q.format === "pdf"
        ? {
            bytes: bytes.pdf,
            type: "application/pdf",
            hash: o.bundle.pdf_sha256,
          }
        : {
            bytes: Buffer.from(bytes.html),
            type: "text/html; charset=utf-8",
            hash: o.bundle.html_sha256,
          };
    });
    return new Response(new Uint8Array(file.bytes), {
      headers: {
        "Content-Type": file.type,
        "Cache-Control": "private, no-store",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
        "X-Content-Type-Options": "nosniff",
        "X-Content-SHA256": file.hash,
      },
    });
  } catch (e) {
    return failure(e);
  }
}
