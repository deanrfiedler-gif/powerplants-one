import type { PoolClient } from "pg";
import { transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import {
  hasPermission,
  scopeSql,
  type QueryClient,
} from "../platform/permissions";
import { workingCompanyFor } from "../platform/working-company";
import { choice, invalid, object, uuid } from "../shared/validation";
import { page } from "../shared/reads";
import { packContext, issueContext } from "./context";
import { reportContext } from "../reports/context";
import { financeContext } from "../finance/context";
import { supportedTemplateDefinition, type OutputFamily } from "./p11-template";
import { rendererVersion } from "./render";
import { digest } from "./store";

const families = {
  "OUT-09": {
    prefix: "pack",
    policy: "pack_policy",
    capability: "pack.read",
    label: "Job pack",
    record: "pack_id",
  },
  "OUT-10": {
    prefix: "report",
    policy: "report_template_policy",
    capability: "report.read",
    label: "Service report",
    record: "report_id",
  },
  "OUT-14": {
    prefix: "finance",
    policy: "finance_template_policy",
    capability: "finance.read",
    label: "Finance evidence",
    record: "handoff_id",
  },
} as const;
type Template = {
  id: string;
  version: number;
  definition: string;
  content_hash: string;
  renderer_version: string | null;
  selected_by_policy: boolean;
  policy_version: number | null;
};
type Dependency = { path: string; sha256: string; byte_count: number };

// Inspect retained metadata only. Never read a path supplied by a definition.
export function templateDependencies(definition: string): {
  state: "Recorded" | "NotRecorded" | "Invalid";
  items: Dependency[];
} {
  if (!definition.trimStart().startsWith("{"))
    return { state: "NotRecorded", items: [] };
  try {
    const value = JSON.parse(definition);
    if (!Array.isArray(value.sources))
      return { state: "NotRecorded", items: [] };
    const items: Dependency[] = [];
    for (const s of value.sources) {
      if (
        !s ||
        typeof s.path !== "string" ||
        !s.path ||
        typeof s.sha256 !== "string" ||
        !/^[a-f0-9]{64}$/.test(s.sha256) ||
        !Number.isSafeInteger(s.byte_count) ||
        s.byte_count < 0
      )
        return { state: "Invalid", items: [] };
      items.push({ path: s.path, sha256: s.sha256, byte_count: s.byte_count });
    }
    return { state: "Recorded", items };
  } catch {
    return { state: "Invalid", items: [] };
  }
}

function query(input: Record<string, string>, usage = false) {
  object(
    input,
    usage
      ? ["family", "kind", "limit", "cursor"]
      : ["family", "limit", "cursor"],
  );
  const family = choice(input.family, "family", [
    "OUT-09",
    "OUT-10",
    "OUT-14",
  ] as const);
  if (
    input.limit !== undefined &&
    (!/^[1-9][0-9]*$/.test(input.limit) || Number(input.limit) > 50)
  )
    invalid("limit", "Choose a page size from 1 to 50.");
  return family;
}

async function familyAuthority(
  c: QueryClient,
  p: Principal,
  family: OutputFamily,
) {
  const f = families[family];
  // Workspace definitions have no company of their own. Reachability must still
  // intersect an actual permitted site in the selected working company.
  const result = await c.query(
    `SELECT 1 FROM ppo.sites s WHERE s.workspace_id=$1 AND ${scopeSql("s.company_id", "s.id", f.capability)}
     ${family === "OUT-14" ? `AND ${scopeSql("s.company_id", "s.id", "shared.finance.read")}` : ""} LIMIT 1`,
    [p.workspace_id, p.actor_id],
  );
  if (!result.rowCount)
    throw new AppError(
      403,
      "Forbidden",
      "This output family's catalogue is not available to this identity.",
    );
}
async function readTransaction<T>(
  p: Principal,
  family: OutputFamily,
  work: (c: PoolClient) => Promise<T>,
) {
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    await familyAuthority(c, p, family);
    const result = await work(c);
    await familyAuthority(c, p, family);
    return result;
  });
}
function select(family: OutputFamily) {
  const f = families[family];
  return `SELECT t.id,t.version,t.definition,t.content_hash,
    ${family === "OUT-09" ? "t.renderer_version" : "NULL::text AS renderer_version"},
    COALESCE(pol.template_id=t.id,false) AS selected_by_policy,pol.version AS policy_version
    FROM ppo.${f.prefix}_templates t LEFT JOIN ppo.${f.policy} pol ON pol.workspace_id=t.workspace_id`;
}
async function exactTemplate(
  c: QueryClient,
  p: Principal,
  family: OutputFamily,
  id: string,
) {
  const row = (
    await c.query<Template>(
      `${select(family)} WHERE t.workspace_id=$1 AND t.id=$2`,
      [p.workspace_id, id],
    )
  ).rows[0];
  if (!row) throw unavailable();
  return row;
}
async function projection(
  family: OutputFamily,
  row: Template,
  detail: boolean,
) {
  let expected: string | null = null;
  let unavailableRuntime = false;
  try {
    expected = await supportedTemplateDefinition(family, row.version);
  } catch (e) {
    if (
      !["ENOENT", "EACCES", "EPERM"].includes(
        (e as NodeJS.ErrnoException).code ?? "",
      )
    )
      throw e;
    unavailableRuntime = true;
  }
  const definitionIntegrity = digest(row.definition) === row.content_hash;
  const runtime_support = unavailableRuntime
    ? "Unavailable"
    : expected === null
      ? "UnsupportedVersion"
      : expected !== row.definition
        ? "DefinitionChanged"
        : row.renderer_version !== null &&
            row.renderer_version !== rendererVersion
          ? "RendererChanged"
          : "Supported";
  return {
    family,
    family_name: families[family].label,
    id: row.id,
    version: row.version,
    content_hash: row.content_hash,
    definition_integrity: definitionIntegrity,
    runtime_support,
    renderer_version: row.renderer_version,
    selected_by_policy: row.selected_by_policy,
    policy_version: row.policy_version,
    definition_eligible:
      row.selected_by_policy &&
      definitionIntegrity &&
      runtime_support === "Supported",
    dependencies: templateDependencies(row.definition),
    ...(detail ? { definition: row.definition } : {}),
  };
}
function pagination(
  p: Principal,
  family: OutputFamily,
  input: Record<string, string>,
  target: string,
) {
  return page(
    { limit: input.limit, cursor: input.cursor },
    {
      catalogue: "DK-06-R1",
      actor: p.actor_id,
      workspace: p.workspace_id,
      company: workingCompanyFor(p.actor_id),
      family,
      target,
    },
  );
}
export async function listTemplates(
  p: Principal,
  input: Record<string, string> = {},
) {
  const family = query(input),
    pg = pagination(p, family, input, "definitions");
  return readTransaction(p, family, async (c) => {
    const rows = (
      await c.query<Template>(
        `${select(family)} WHERE t.workspace_id=$1 AND ($2::uuid IS NULL OR t.id>$2) ORDER BY t.id LIMIT $3`,
        [p.workspace_id, pg.after, pg.limit + 1],
      )
    ).rows;
    const selected = rows.slice(0, pg.limit);
    return {
      items: await Promise.all(
        selected.map((row) => projection(family, row, false)),
      ),
      next_cursor:
        rows.length > pg.limit ? pg.cursor(selected.at(-1)!.id) : null,
      completeness: rows.length > pg.limit ? "Partial" : "Complete",
      scope: "FamilyDefinitions",
      synthetic: true,
    };
  });
}
export async function readTemplate(
  p: Principal,
  id: string,
  input: Record<string, string> = {},
) {
  object(input, ["family"]);
  const family = query(input),
    templateId = uuid(id, "template_id");
  return readTransaction(p, family, async (c) => ({
    ...(await projection(
      family,
      await exactTemplate(c, p, family, templateId),
      true,
    )),
    synthetic: true,
  }));
}

type UsageKind = "PackRevision" | "RenderJob" | "Issue";
type Usage = {
  id: string;
  record_id: string;
  revision_id: string;
  state: string;
  template: {
    id: string;
    version: number;
    hash?: string;
    content_hash?: string;
    policy_version: number;
  };
};
const hidden = (e: unknown) =>
  e instanceof AppError && [403, 404].includes(e.status);
async function usageAuthority(
  c: QueryClient,
  p: Principal,
  family: OutputFamily,
  kind: UsageKind,
  row: Usage,
) {
  if (family === "OUT-09") {
    if (kind === "Issue") {
      await issueContext(c, p, row.id);
      return;
    }
    const { a, pack } = await packContext(
      c,
      p,
      row.record_id,
      kind === "RenderJob" ? "pack.issue" : "pack.read",
    );
    if (kind === "PackRevision") {
      const staff =
        (await hasPermission(c, p, "pack.prepare", a.company_id, a.site_id)) ||
        (await hasPermission(c, p, "pack.issue", a.company_id, a.site_id)) ||
        (await hasPermission(c, p, "pack.check", a.company_id, a.site_id));
      if (!staff) {
        const issues = (
          await c.query(
            "SELECT id FROM ppo.pack_issues WHERE workspace_id=$1 AND revision_id=$2 AND id=$3",
            [p.workspace_id, row.revision_id, pack.current_issue_id],
          )
        ).rows;
        if (!issues.length) throw unavailable();
        await issueContext(c, p, issues[0].id);
      }
    }
  } else if (family === "OUT-10") {
    await reportContext(
      c,
      p,
      row.record_id,
      kind === "RenderJob" ? "report.issue" : "report.read",
    );
  } else await financeContext(c, p, row.record_id);
}
function usageSelect(family: OutputFamily, kind: UsageKind) {
  const f = families[family];
  if (kind === "PackRevision")
    return {
      sql: "SELECT r.id,r.pack_id AS record_id,r.id AS revision_id,'Saved'::text AS state,r.snapshot->'template' AS template FROM ppo.pack_revisions r",
      template: "r.snapshot->'template'",
    };
  if (kind === "RenderJob")
    return {
      sql: `SELECT r.id,r.${f.record} AS record_id,r.revision_id,r.state,${family === "OUT-09" ? "r.render_snapshot->'source'->'template'" : "r.render_snapshot->'template'"} AS template FROM ppo.${f.prefix}_render_jobs r`,
      template:
        family === "OUT-09"
          ? "r.render_snapshot->'source'->'template'"
          : "r.render_snapshot->'template'",
    };
  return {
    sql: `SELECT r.id,r.${f.record} AS record_id,r.revision_id,'Issued'::text AS state,r.manifest->'template' AS template FROM ppo.${f.prefix}_issues r`,
    template: "r.manifest->'template'",
  };
}
export async function templateUsage(
  p: Principal,
  id: string,
  input: Record<string, string> = {},
) {
  const family = query(input, true),
    templateId = uuid(id, "template_id");
  const kind = choice(input.kind, "kind", [
    "PackRevision",
    "RenderJob",
    "Issue",
  ] as const);
  if (kind === "PackRevision" && family !== "OUT-09")
    invalid(
      "kind",
      "Only Job packs retain a template on saved preparation revisions.",
    );
  const pg = pagination(p, family, input, `${templateId}:${kind}`),
    source = usageSelect(family, kind);
  return readTransaction(p, family, async (c) => {
    const definition = await exactTemplate(c, p, family, templateId);
    let after = pg.after;
    const visible: Usage[] = [];
    // Scan before public pagination, like the library. A cursor only contains a
    // visible identity, never a hidden candidate; no workspace usage total leaks.
    while (visible.length <= pg.limit) {
      const candidates = (
        await c.query<Usage>(
          `${source.sql} WHERE r.workspace_id=$1 AND (${source.template})->>'id'=$2
        AND ($3::uuid IS NULL OR r.id>$3) ORDER BY r.id LIMIT 100`,
          [p.workspace_id, templateId, after],
        )
      ).rows;
      if (!candidates.length) break;
      for (const row of candidates) {
        after = row.id;
        try {
          await usageAuthority(c, p, family, kind, row);
        } catch (e) {
          if (hidden(e)) continue;
          throw e;
        }
        visible.push(row);
        if (visible.length > pg.limit) break;
      }
      if (candidates.length < 100) break;
    }
    const selected = visible.slice(0, pg.limit);
    // Recheck source authority after asynchronous inspection; expiry and changed
    // assignments cannot turn a previously visible row into disclosed metadata.
    for (const row of selected) await usageAuthority(c, p, family, kind, row);
    return {
      template_id: templateId,
      family,
      kind,
      items: selected.map((row) => ({
        kind,
        id: row.id,
        record_id: row.record_id,
        revision_id: row.revision_id,
        state: row.state,
        template: {
          id: row.template.id,
          version: row.template.version,
          content_hash: row.template.hash ?? row.template.content_hash,
          policy_version: row.template.policy_version,
        },
        exact_definition_match:
          row.template.version === definition.version &&
          (row.template.hash ?? row.template.content_hash) ===
            definition.content_hash,
        file_availability: "NotChecked",
      })),
      next_cursor:
        visible.length > pg.limit ? pg.cursor(selected.at(-1)!.id) : null,
      completeness: visible.length > pg.limit ? "Partial" : "Complete",
      scope: "CurrentPermittedRecords",
      observed_at: new Date().toISOString(),
      synthetic: true,
    };
  });
}
