import { database } from "../platform/database";
import type { Principal } from "../platform/identity";
import { AppError } from "../platform/errors";
import { requireCapability } from "../platform/permissions";
import { page } from "../shared/reads";
import { uuid } from "../shared/validation";
import { issueContext } from "./context";
export async function exactDocumentPreview(p: Principal, id: string) {
  const c = database(),
    { issue, pack, a } = await issueContext(c, p, uuid(id, "id"));
  const revision = (
    await c.query(
      "SELECT revision FROM ppo.pack_revisions WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, issue.revision_id],
    )
  ).rows[0];
  return {
    id: issue.id,
    title: `Job pack ${pack.display_number} · r${revision.revision}`,
    display_number: pack.display_number,
    version: revision.revision,
    status:
      pack.current_issue_id === issue.id
        ? pack.needs_review
          ? "Current issue requires review"
          : "Current issued pack"
        : "Earlier exact issue",
    updated_at: issue.issued_at.toISOString(),
    context_title: a.display_number,
  };
}
export async function searchExactDocuments(p: Principal, input: unknown) {
  const c = database();
  await requireCapability(c, p, "pack.read");
  const pg = page(input, {
    workspace: p.workspace_id,
    actor: p.actor_id,
    source: "ExactJobPack",
  });
  // The domain authorises every exact issue before matching or pagination; a file URL grants nothing.
  const ids = (
    await c.query(
      "SELECT id FROM ppo.pack_issues WHERE workspace_id=$1 AND ($2::uuid IS NULL OR id>$2) ORDER BY id",
      [p.workspace_id, pg.after],
    )
  ).rows;
  const items: Awaited<ReturnType<typeof exactDocumentPreview>>[] = [];
  for (const row of ids)
    try {
      const item = await exactDocumentPreview(p, row.id);
      if (
        [item.title, item.display_number, item.context_title]
          .join(" ")
          .toLowerCase()
          .includes(pg.q.toLowerCase())
      )
        items.push(item);
      if (items.length > pg.limit) break;
    } catch (e) {
      if (!(e instanceof AppError && [403, 404].includes(e.status))) throw e;
    }
  return {
    items: items.slice(0, pg.limit),
    next_cursor:
      items.length > pg.limit ? pg.cursor(items[pg.limit - 1].id) : null,
  };
}
