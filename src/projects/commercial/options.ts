import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { AppError, unavailable } from "../../platform/errors";
import { scopedOwner } from "../../shared/authority";
import { object, choice, uuid } from "../../shared/validation";
import { authority, actions } from "./context";
import { deliverySalesSourcesInSnapshot } from "../../sales/delivery-binding";
import { responseContext } from "../../estimating/response/context";
import { documentContext } from "../../library/context";

// Picker reads never confer command authority. Exact selections are resolved by
// the existing basis-options read and revalidated by the native Create command.
export async function readCommercialPicker(
  p: Principal,
  project: string,
  input: Record<string, string>,
) {
  const q = object(input, ["picker", "handover_id", "q"]);
  const mode = choice(q.picker, "picker", [
    "owners",
    "activities",
    "handovers",
    "quotations",
    "documents",
  ] as const);
  const search = String(q.q ?? "")
    .trim()
    .toLowerCase();
  if (search.length > 200)
    throw new AppError(422, "InvalidData", "Search up to 200 characters.");
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const pr = await authority(c, p, project, "prepare");
    const items: {
      id: string;
      display_name: string;
      display_number?: string;
    }[] = [];
    let more = false;
    const add = (id: string, display_name: string, display_number?: string) => {
      if (
        (display_name + " " + (display_number ?? ""))
          .toLowerCase()
          .includes(search)
      )
        items.push({ id, display_name, display_number });
    };
    if (mode === "owners") {
      const rows = (
        await c.query<{ id: string; display_name: string }>(
          "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND active ORDER BY display_name,id",
          [p.workspace_id],
        )
      ).rows;
      for (const u of rows)
        try {
          const owner = await scopedOwner(
            c,
            p,
            u.id,
            pr.company_id,
            pr.site_id,
            "project.commercial.prepare",
          );
          await authority(c, owner, project);
          add(u.id, u.display_name);
        } catch (e) {
          if (!(e instanceof AppError && [403, 404].includes(e.status)))
            throw e;
        }
    } else if (mode === "activities") {
      const rows = (
        await c.query<{ id: string; summary: string }>(
          "SELECT a.id,a.summary FROM ppo.activities a JOIN ppo.activity_links l ON (l.workspace_id,l.activity_id)=(a.workspace_id,a.id) WHERE a.workspace_id=$1 AND l.object_type='Project' AND l.object_id=$2 ORDER BY a.summary,a.id",
          [p.workspace_id, project],
        )
      ).rows;
      for (const a of rows)
        try {
          await actions(c, p, project, [a.id]);
          add(a.id, a.summary);
        } catch (e) {
          if (!(e instanceof AppError && [403, 404].includes(e.status)))
            throw e;
        }
    } else if (mode === "documents") {
      const rows = (
        await c.query<{ id: string }>(
          "SELECT id FROM ppo.library_documents WHERE workspace_id=$1 AND company_id=$2 AND organisation_id=$3 AND (site_id IS NULL OR site_id=$4) AND state='Current' ORDER BY id",
          [p.workspace_id, pr.company_id, pr.organisation_id, pr.site_id],
        )
      ).rows;
      for (const row of rows)
        try {
          const { d, r } = await documentContext(c, p, row.id);
          if (
            (
              await c.query(
                "SELECT 1 FROM ppo.library_reviews WHERE workspace_id=$1 AND revision_id=$2 AND outcome='Reviewed'",
                [p.workspace_id, r.id],
              )
            ).rowCount
          )
            add(d.id, `${r.title} · revision ${r.revision}`, d.display_number);
        } catch (e) {
          if (!(e instanceof AppError && [403, 404].includes(e.status)))
            throw e;
        }
    } else {
      const sales = await deliverySalesSourcesInSnapshot(
        c,
        p,
        "Projects",
        project,
      );
      const allowed = sales.items.filter(
        (x) => x.access === "Available" && x.current && !x.source_changed,
      );
      if (mode === "handovers")
        for (const h of allowed) {
          if (h.access === "Available")
            add(
              h.handover_id,
              `${h.opportunity_title} · accepted revision ${h.revision}`,
              h.opportunity_reference,
            );
        }
      else {
        const handover = allowed.find(
          (x) =>
            x.access === "Available" &&
            x.handover_id === uuid(q.handover_id, "handover_id"),
        );
        if (!handover || handover.access !== "Available") throw unavailable();
        const rows = (
          await c.query<{ id: string }>(
            "SELECT q.id FROM ppo.draft_quote_revisions q JOIN ppo.estimates e ON (e.workspace_id,e.id)=(q.workspace_id,q.estimate_id) WHERE e.workspace_id=$1 AND e.opportunity_id=$2 ORDER BY q.id",
            [p.workspace_id, handover.opportunity_id],
          )
        ).rows;
        for (const row of rows)
          try {
            const quote = await responseContext(c, p, row.id);
            if (
              quote.current &&
              quote.state.response?.report?.outcome === "Accepted"
            ) {
              const header = (
                await c.query<{ display_number: string }>(
                  "SELECT display_number FROM ppo.draft_quotes WHERE workspace_id=$1 AND id=$2",
                  [p.workspace_id, quote.q.quote_id],
                )
              ).rows[0];
              add(
                row.id,
                `Accepted quotation · revision ${quote.q.version}`,
                header.display_number,
              );
            }
          } catch (e) {
            if (!(e instanceof AppError && [403, 404, 409].includes(e.status)))
              throw e;
          }
      }
    }
    more = items.length > 100;
    return {
      items: items.slice(0, 100),
      has_more: more,
      observed_at: new Date().toISOString(),
      synthetic: true,
    };
  });
}
