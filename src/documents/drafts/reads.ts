import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { AppError } from "../../platform/errors";
import { hasPermission } from "../../platform/permissions";
import { workingCompanyFor } from "../../platform/working-company";
import { page } from "../../shared/reads";
import { choice, invalid, object, uuid } from "../../shared/validation";
import { proposalContext, revisionContext, scopeAuthority } from "./context";
import { proposalPresentation } from "../workspace-reads";
import { bindingCatalogue, families } from "./validation";

async function read<T>(p: Principal, work: (c: PoolClient) => Promise<T>) {
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    return work(c);
  });
}
function pagination(p: Principal, q: Record<string, string>, target: string) {
  if (
    q.limit !== undefined &&
    (!/^[1-9][0-9]*$/.test(q.limit) || Number(q.limit) > 50)
  )
    invalid("limit", "Use 1–50 rows.");
  return page(
    { limit: q.limit, cursor: q.cursor },
    {
      catalogue: "DK-06-R2",
      actor: p.actor_id,
      workspace: p.workspace_id,
      company: workingCompanyFor(p.actor_id),
      target,
    },
  );
}
const status = {
  synthetic: true,
  publication_eligible: false,
  supported_runtime_version: null,
};
const hidden = (e: unknown) =>
  e instanceof AppError && [403, 404].includes(e.status);
export async function readBindings(p: Principal, q: Record<string, string>) {
  object(q, ["family", "company_id", "site_id"]);
  const scope = {
    family: choice(q.family, "family", families),
    company_id: uuid(q.company_id, "company_id"),
    site_id: uuid(q.site_id, "site_id"),
  };
  return read(p, async (c) => {
    await scopeAuthority(c, p, scope);
    const items = [];
    for (const [binding, rule] of Object.entries(
      bindingCatalogue[scope.family],
    ))
      if (
        await hasPermission(
          c,
          p,
          rule.capability,
          scope.company_id,
          scope.site_id,
        )
      )
        items.push({ binding, ...rule });
    await scopeAuthority(c, p, scope);
    return { ...status, ...scope, items, schema_version: 1 };
  });
}
export async function readProposal(
  p: Principal,
  id: string,
  q: Record<string, string> = {},
) {
  object(q, ["revision_id"]);
  return read(p, async (c) => {
    const { d, r } = await proposalContext(c, p, id);
    const revision = q.revision_id
      ? await revisionContext(c, p, d, q.revision_id)
      : r;
    const latest_review =
      (
        await c.query(
          "SELECT * FROM ppo.template_proposal_reviews WHERE workspace_id=$1 AND proposal_id=$2 AND revision_id=$3 ORDER BY proposal_version DESC LIMIT 1",
          [p.workspace_id, d.id, revision.id],
        )
      ).rows[0] ?? null;
    await proposalContext(c, p, id);
    await revisionContext(c, p, d, revision.id);
    return {
      ...status,
      proposal: d,
      revision,
      ...(await proposalPresentation(c, p, d, revision)),
      latest_review,
      is_current_revision: revision.id === d.current_revision_id,
    };
  });
}
export async function listProposals(
  p: Principal,
  q: Record<string, string> = {},
) {
  object(q, ["family", "limit", "cursor"]);
  const family = choice(q.family, "family", families),
    pg = pagination(p, q, "list:" + family);
  return read(p, async (c) => {
    let after = pg.after;
    const visible: Awaited<ReturnType<typeof proposalContext>>[] = [];
    while (visible.length <= pg.limit) {
      const rows = (
        await c.query(
          "SELECT id FROM ppo.template_proposals WHERE workspace_id=$1 AND family=$2 AND ($3::uuid IS NULL OR id>$3) ORDER BY id LIMIT 100",
          [p.workspace_id, family, after],
        )
      ).rows;
      if (!rows.length) break;
      for (const row of rows) {
        after = row.id;
        try {
          visible.push(await proposalContext(c, p, row.id));
        } catch (e) {
          if (!hidden(e)) throw e;
        }
        if (visible.length > pg.limit) break;
      }
      if (rows.length < 100) break;
    }
    const selected = visible.slice(0, pg.limit);
    const presentations = await Promise.all(
      selected.map(({ d, r }) => proposalPresentation(c, p, d, r)),
    );
    for (const { d } of selected) await proposalContext(c, p, d.id);
    return {
      ...status,
      items: selected.map(({ d, r }, index) => ({
        ...presentations[index],
        revision: r.revision,
        id: d.id,
        company_id: d.company_id,
        site_id: d.site_id,
        family: d.family,
        version: d.version,
        state: d.state,
        current_revision_id: r.id,
        content_hash: r.content_hash,
        title: r.body.title,
        audience: r.body.audience,
      })),
      next_cursor:
        visible.length > pg.limit ? pg.cursor(selected.at(-1)!.d.id) : null,
      completeness: visible.length > pg.limit ? "Partial" : "Complete",
      scope: "CurrentPermittedProposals",
    };
  });
}
export async function proposalHistory(
  p: Principal,
  id: string,
  q: Record<string, string>,
) {
  object(q, ["kind", "limit", "cursor"]);
  const kind = choice(q.kind, "kind", ["Revision", "Review"] as const),
    pg = pagination(p, q, uuid(id, "proposal_id") + ":chronological:" + kind);
  return read(p, async (c) => {
    const { d } = await proposalContext(c, p, id);
    const table =
      kind === "Revision"
        ? "template_proposal_revisions"
        : "template_proposal_reviews";
    let after = pg.after;
    const visible: Record<string, unknown>[] = [];
    // An opaque cursor still names only visible evidence. Its immutable row supplies
    // the chronological key; UUID order must not reorder revisions or reviews.
    const order = kind === "Revision" ? "revision" : "proposal_version";
    while (visible.length <= pg.limit) {
      const rows = (
        await c.query(
          `SELECT * FROM ppo.${table} WHERE workspace_id=$1 AND proposal_id=$2 AND ($3::uuid IS NULL OR ${order}>(SELECT ${order} FROM ppo.${table} WHERE workspace_id=$1 AND proposal_id=$2 AND id=$3)) ORDER BY ${order},created_at,id LIMIT 100`,
          [p.workspace_id, d.id, after],
        )
      ).rows;
      if (!rows.length) break;
      for (const row of rows) {
        after = row.id;
        try {
          await revisionContext(
            c,
            p,
            d,
            kind === "Revision" ? row.id : row.revision_id,
          );
          visible.push(row);
        } catch (e) {
          if (!hidden(e)) throw e;
        }
        if (visible.length > pg.limit) break;
      }
      if (rows.length < 100) break;
    }
    const items = visible.slice(0, pg.limit);
    for (const row of items) {
      const actor = await c.query(
        "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, row.created_by ?? row.reviewer_id],
      );
      row.actor_name = actor.rows[0]?.display_name ?? null;
    }
    await proposalContext(c, p, d.id);
    for (const row of items)
      await revisionContext(
        c,
        p,
        d,
        String(kind === "Revision" ? row.id : row.revision_id),
      );
    return {
      ...status,
      kind,
      items,
      next_cursor:
        visible.length > pg.limit ? pg.cursor(String(items.at(-1)!.id)) : null,
      completeness: visible.length > pg.limit ? "Partial" : "Complete",
      scope: "CurrentPermittedEvidence",
    };
  });
}
