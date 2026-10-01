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
import { unavailable, AppError } from "../platform/errors";
import { uuid, object } from "../shared/validation";
import {
  inspectionCommand,
  previewServiceInspection,
} from "./service-commands";
import {
  loadServiceInspections,
  serviceInspectionAccess,
  type Mode,
} from "./service-context";
import { evidenceBytes } from "./service";
import { readBundle } from "../engineering/commissioning/outputs";
export const inspectionRead = (mode: Mode) =>
  readRoute(async (p, id, q) => {
    object(q, []);
    return transaction((c) =>
      loadServiceInspections(c, p, uuid(id, "appointment_id"), mode),
    );
  });
export const inspectionPreview = readRoute(previewServiceInspection);
export const inspectionPost =
  (mode: Mode) => async (request: NextRequest, context: RouteContext) => {
    try {
      localRequest(request, true);
      const p = await identity(request),
        id = (await context.params).id!;
      const r = await inspectionCommand(
        p,
        id,
        await jsonBody(request, 6_000_000),
        mode,
      );
      return reply(r.receipt, r.replayed ? 200 : 201);
    } catch (e) {
      return failure(e);
    }
  };
export const inspectionList = (mode: Mode) =>
  readRoute(async (p, _id, q) => {
    object(q, []);
    return transaction(async (c) => {
      // Bounded worklist. Every row is checked through the owning domain before
      // names, counts or links are disclosed.
      const candidates = (
        await c.query<{ id: string }>(
          `SELECT a.id FROM ppo.appointments a
      WHERE a.workspace_id=$1 AND ($3='capture' AND EXISTS(SELECT 1 FROM ppo.assignments x JOIN ppo.resources r ON r.workspace_id=x.workspace_id AND r.id=x.resource_id WHERE x.workspace_id=a.workspace_id AND x.appointment_id=a.id AND x.active AND r.user_id=$2)
      OR $3='review' AND EXISTS(SELECT 1 FROM ppo.inspection_attempts i WHERE i.workspace_id=a.workspace_id AND i.host_type='ServiceAppointment' AND i.host_id=a.id AND i.state='Submitted')) ORDER BY a.start_at DESC,a.id LIMIT 101`,
          [p.workspace_id, p.actor_id, mode],
        )
      ).rows;
      const items = [];
      for (const row of candidates.slice(0, 100)) {
        try {
          const { a, w } = await serviceInspectionAccess(c, p, row.id, mode);
          items.push({
            id: a.id,
            reference: a.display_number,
            work_order: w.display_number,
            status: a.status,
          });
        } catch (e) {
          if (!(e instanceof AppError) || ![403, 404].includes(e.status))
            throw e;
        }
      }
      return {
        items,
        window: "Latest 100 candidate visits; access checked individually.",
      };
    });
  });
export const inspectionFiles =
  (mode: Mode) => async (request: NextRequest, context: RouteContext) => {
    try {
      localRequest(request);
      const p = await identity(request),
        id = (await context.params).id!,
        q = Object.fromEntries(request.nextUrl.searchParams);
      object(q, ["evidence_id", "output_id", "format"]);
      const file = await transaction(async (c) => {
        const v = await loadServiceInspections(c, p, uuid(id, "id"), mode);
        if (q.evidence_id) {
          const e = v.attempts
            .flatMap((x) => x.evidence)
            .find((x) => x.id === uuid(q.evidence_id, "evidence_id"));
          if (!e || e.state !== "Complete" || e.kind !== "StoredFile")
            throw unavailable();
          return {
            bytes: await evidenceBytes(p, e),
            type: e.media_type!,
            hash: e.content_hash!,
          };
        }
        const output = v.outputs.find(
          (o) => o.id === uuid(q.output_id, "output_id"),
        );
        if (!output) throw unavailable();
        // Internal audience only, including currently assigned technicians.
        const b = output.bundle as unknown as Parameters<typeof readBundle>[1],
          bytes = await readBundle(p, b);
        return q.format === "pdf"
          ? { bytes: bytes.pdf, type: "application/pdf", hash: b.pdf_sha256 }
          : {
              bytes: Buffer.from(bytes.html),
              type: "text/html; charset=utf-8",
              hash: b.html_sha256,
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
  };
