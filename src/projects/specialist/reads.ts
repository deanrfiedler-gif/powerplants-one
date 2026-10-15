import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { AppError, unavailable } from "../../platform/errors";
import { object, uuid, invalid } from "../../shared/validation";
import { page } from "../../shared/reads";
import { workingCompanyFor } from "../../platform/working-company";
import {
  authority,
  packageRow,
  history,
  inspect,
  type Package,
  type Event,
} from "./context";
const projection = (pkg: Package, e: Event) => ({
  id: pkg.id,
  basis_id: pkg.basis_id,
  basis_version: pkg.basis_version,
  predecessor_id: pkg.predecessor_id,
  version: e.version,
  state: e.state,
  content: e.content,
  source: e.source,
  source_hash: e.source_hash,
  command: e.command,
  note: e.note,
  reason: e.reason,
  recorded_by: e.created_by,
  recorded_at: e.created_at.toISOString(),
});
export async function readPackages(
  p: Principal,
  project: string,
  value: Record<string, string> = {},
) {
  const q = object(value, ["id", "before_version", "limit", "cursor"]);
  const before =
    q.before_version === undefined ? undefined : Number(q.before_version);
  if (
    before !== undefined &&
    (!/^[1-9][0-9]*$/.test(String(q.before_version)) ||
      before > 2147483647 ||
      !q.id)
  )
    invalid(
      "before_version",
      "Use a positive bounded history version with an id.",
    );
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const pr = await authority(c, p, project);
    const present = async (pkg: Package, e: Event) => {
      await inspect(c, p, pkg, e.content, false, e.source);
      let source_status: "Current" | "Changed" = "Current";
      try {
        await inspect(c, p, pkg, e.content, true, e.source);
      } catch (error) {
        if (
          error instanceof AppError &&
          error.code === "SpecialistSourceChanged"
        )
          source_status = "Changed";
        else throw error;
      }
      return { ...projection(pkg, e), source_status };
    };
    if (q.id !== undefined) {
      object(q, ["id", "before_version"]);
      const pkg = await packageRow(c, p, uuid(q.id, "id"));
      if (!pkg || pkg.project_id !== pr.id) throw unavailable();
      const rows = await history(c, p, pkg.id, before),
        current = (await history(c, p, pkg.id, undefined, 1))[0];
      const shown = [];
      for (const e of rows.slice(0, 50)) shown.push(await present(pkg, e));
      return {
        current: await present(pkg, current),
        history: shown,
        next_before_version: rows.length > 50 ? rows[49].version : null,
        synthetic: true,
      };
    }
    const pg = page(
      { limit: q.limit, cursor: q.cursor },
      {
        workspace: p.workspace_id,
        actor: p.actor_id,
        company: workingCompanyFor(p.actor_id),
        project: pr.id,
        kind: "SpecialistPackage",
      },
    );
    const items: Awaited<ReturnType<typeof present>>[] = [];
    let after = pg.after;
    for (;;) {
      const rows = (
        await c.query<Package>(
          "SELECT * FROM ppo.project_specialist_packages WHERE workspace_id=$1 AND project_id=$2 AND ($3::uuid IS NULL OR id>$3) ORDER BY id LIMIT 100",
          [p.workspace_id, pr.id, after],
        )
      ).rows;
      for (const pkg of rows) {
        try {
          items.push(
            await present(pkg, (await history(c, p, pkg.id, undefined, 1))[0]),
          );
        } catch (error) {
          if (!(error instanceof AppError && [403, 404].includes(error.status)))
            throw error;
        }
        if (items.length > pg.limit) break;
      }
      if (items.length > pg.limit || rows.length < 100) break;
      after = rows.at(-1)!.id;
    }
    const selected = items.slice(0, pg.limit);
    return {
      items: selected,
      next_cursor:
        items.length > pg.limit ? pg.cursor(selected.at(-1)!.id) : null,
      synthetic: true,
    };
  });
}
