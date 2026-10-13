import { transaction } from "../platform/database";
import { sharedOperation } from "../platform/operations";
import { AppError, unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import {
  common,
  commonKeys,
  object,
  uuid,
  label,
  choice,
  invalid,
} from "../shared/validation";
import { expected } from "../estimating/service";
import {
  workspaceAuthority,
  revisionAuthority,
} from "../estimating/discovery-workspace-context";
import { duty, release, revision, run } from "./context";
import { hash } from "./hash";
import { digest } from "./validation";
export type Draft = {
  id: string;
  workspace_id: string;
  company_id: string;
  kind: "Rules" | "Configuration";
  release_id: string | null;
  estimating_workspace_id: string | null;
  option_id: string | null;
  discovery_revision_id: string | null;
  base_revision_id: string | null;
  base_run_id: string | null;
  binding_hash: string | null;
  label: string;
  content: Record<string, unknown>;
  content_hash: string;
  version: number;
  state: string;
  created_by: string;
  updated_by: string;
  updated_at: Date;
};
export async function draftAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  edit = false,
) {
  const r = (
    await c.query<Draft>(
      "SELECT * FROM ppo.cpq_drafts WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "draft_id")],
    )
  ).rows[0];
  if (!r) throw unavailable();
  await sourceAuthority(c, p, r, edit);
  if (hash(r.content) !== r.content_hash)
    throw new AppError(
      409,
      "CpqEvidenceMismatch",
      "The saved draft does not match its content hash.",
    );
  return r;
}
async function sourceAuthority(
  c: QueryClient,
  p: Principal,
  r: Pick<
    Draft,
    | "kind"
    | "company_id"
    | "release_id"
    | "estimating_workspace_id"
    | "option_id"
    | "discovery_revision_id"
    | "base_revision_id"
    | "base_run_id"
  >,
  edit: boolean,
) {
  await duty(
    c,
    p,
    r.company_id,
    edit ? (r.kind === "Rules" ? "cpq.author" : "cpq.calculate") : "cpq.read",
  );
  if (
    r.release_id &&
    (await release(c, p, r.release_id)).company_id !== r.company_id
  )
    throw unavailable();
  if (r.base_revision_id) {
    const base = await revision(c, p, r.base_revision_id);
    if (
      base.company_id !== r.company_id ||
      (r.release_id && base.release_id !== r.release_id)
    )
      throw unavailable();
  }
  if (r.kind === "Configuration") {
    const g = await workspaceAuthority(c, p, r.estimating_workspace_id!, edit);
    const v = await revisionAuthority(c, p, g, r.discovery_revision_id!, edit);
    if (g.company_id !== r.company_id || v.option_id !== r.option_id)
      throw unavailable();
    if (r.base_run_id) {
      const base = await run(c, p, r.base_run_id, edit);
      if (
        base.option_id !== r.option_id ||
        base.estimating_workspace_id !== g.id
      )
        throw unavailable();
    }
  }
}
// Incomplete form values are intentionally retained here; only validated,
// recalculated content can become an immutable release version or evaluation.
export async function saveDraft(p: Principal, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "id",
    "company_id",
    "kind",
    "release_id",
    "estimating_workspace_id",
    "option_id",
    "discovery_revision_id",
    "base_revision_id",
    "base_run_id",
    "binding_hash",
    "expected_version",
    "label",
    "content",
  ]);
  const nullable = (field: string) =>
    r[field] == null ? null : uuid(r[field], field);
  const kind = choice(r.kind, "kind", ["Rules", "Configuration"] as const);
  if (
    !Number.isSafeInteger(r.expected_version) ||
    Number(r.expected_version) < 0
  )
    invalid(
      "expected_version",
      "Use zero for a new draft or the exact current version.",
    );
  if (!r.content || Array.isArray(r.content) || typeof r.content !== "object")
    invalid("content", "Save a JSON object of at most 60 KB.");
  const pending: { value: unknown; depth: number }[] = [
    { value: r.content, depth: 0 },
  ];
  let nodes = 0;
  while (pending.length) {
    const { value, depth } = pending.pop()!;
    if (++nodes > 6000 || depth > 24)
      invalid(
        "content",
        "The draft exceeds the supported document complexity.",
      );
    if (value && typeof value === "object")
      pending.push(
        ...Object.values(value).map((value) => ({ value, depth: depth + 1 })),
      );
  }
  if (Buffer.byteLength(JSON.stringify(r.content)) > 60000)
    invalid("content", "Save a JSON object of at most 60 KB.");
  const input = {
    ...common(r),
    id: uuid(r.id, "id"),
    company_id: uuid(r.company_id, "company_id"),
    kind,
    release_id: nullable("release_id"),
    estimating_workspace_id: nullable("estimating_workspace_id"),
    option_id: nullable("option_id"),
    discovery_revision_id: nullable("discovery_revision_id"),
    base_revision_id: nullable("base_revision_id"),
    base_run_id: nullable("base_run_id"),
    binding_hash:
      r.binding_hash == null ? null : digest(r.binding_hash, "binding_hash"),
    label: label(r.label, "label", 200),
    expected_version: Number(r.expected_version),
    content: r.content as Record<string, unknown>,
  };
  if (
    kind === "Rules"
      ? input.estimating_workspace_id ||
        input.option_id ||
        input.discovery_revision_id ||
        input.base_run_id ||
        input.binding_hash
      : input.release_id ||
        !input.estimating_workspace_id ||
        !input.option_id ||
        !input.discovery_revision_id ||
        !input.base_revision_id ||
        !input.binding_hash
  )
    invalid(
      "kind",
      "Use only the source bindings required for this draft kind.",
    );
  return sharedOperation(
    p,
    input,
    "Cpq:Draft",
    async (c) => {
      await sourceAuthority(c, p, input, true);
      const exists = (
        await c.query(
          "SELECT id FROM ppo.cpq_drafts WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, input.id],
        )
      ).rowCount;
      return exists ? draftAuthority(c, p, input.id, true) : null;
    },
    async (c, prior) => {
      expected(prior?.version ?? 0, input.expected_version);
      if (
        prior &&
        [
          "company_id",
          "kind",
          "release_id",
          "estimating_workspace_id",
          "option_id",
        ].some(
          (k) => prior[k as keyof Draft] !== input[k as keyof typeof input],
        )
      )
        throw new AppError(
          409,
          "CpqDraftScopeChanged",
          "A draft cannot move to another company, release or option.",
        );
      const saved = (
        await c.query<Draft>(
          `INSERT INTO ppo.cpq_drafts
      (id,workspace_id,company_id,kind,release_id,estimating_workspace_id,option_id,discovery_revision_id,base_revision_id,base_run_id,binding_hash,label,content,content_hash,version,created_by,updated_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,1,$15,$15)
      ON CONFLICT(id) DO UPDATE SET discovery_revision_id=excluded.discovery_revision_id,base_revision_id=excluded.base_revision_id,
      base_run_id=excluded.base_run_id,binding_hash=excluded.binding_hash,label=excluded.label,content=excluded.content,content_hash=excluded.content_hash,
      version=ppo.cpq_drafts.version+1,updated_by=excluded.updated_by,updated_at=clock_timestamp()
      WHERE ppo.cpq_drafts.workspace_id=excluded.workspace_id RETURNING *`,
          [
            input.id,
            p.workspace_id,
            input.company_id,
            kind,
            input.release_id,
            input.estimating_workspace_id,
            input.option_id,
            input.discovery_revision_id,
            input.base_revision_id,
            input.base_run_id,
            input.binding_hash,
            input.label,
            input.content,
            hash(input.content),
            p.actor_id,
          ],
        )
      ).rows[0];
      if (!saved) throw unavailable();
      await c.query(
        "INSERT INTO ppo.cpq_draft_history(workspace_id,draft_id,version,snapshot,reason,created_by) VALUES($1,$2,$3,$4,$5,$6)",
        [
          p.workspace_id,
          saved.id,
          saved.version,
          saved,
          input.reason,
          p.actor_id,
        ],
      );
      return {
        ...saved,
        audit_details: {
          content_hash: saved.content_hash,
          kind,
          base_run_id: input.base_run_id,
          base_revision_id: input.base_revision_id,
        },
      };
    },
    "CpqDraft",
    "CpqChanged",
  );
}
export async function readDraft(p: Principal, id: string) {
  return transaction(async (c) => {
    const draft = await draftAuthority(c, p, id);
    const history = (
      await c.query(
        "SELECT version,reason,created_by,created_at,snapshot->>'content_hash' AS content_hash FROM ppo.cpq_draft_history WHERE workspace_id=$1 AND draft_id=$2 ORDER BY version DESC LIMIT 100",
        [p.workspace_id, id],
      )
    ).rows;
    return { draft, history, synthetic: true };
  });
}
export async function listDrafts(p: Principal, query: Record<string, string>) {
  const q = object(query, [
    "company_id",
    "kind",
    "estimating_workspace_id",
    "option_id",
  ]);
  const company = uuid(q.company_id, "company_id"),
    kind = choice(q.kind, "kind", ["Rules", "Configuration"] as const);
  return transaction(async (c) => {
    await duty(c, p, company);
    const candidates = (
      await c.query<{ id: string }>(
        `SELECT id FROM ppo.cpq_drafts WHERE workspace_id=$1 AND company_id=$2 AND kind=$3
      AND ($4::uuid IS NULL OR estimating_workspace_id=$4) AND ($5::uuid IS NULL OR option_id=$5) ORDER BY updated_at DESC,id LIMIT 100`,
        [
          p.workspace_id,
          company,
          kind,
          q.estimating_workspace_id
            ? uuid(q.estimating_workspace_id, "estimating_workspace_id")
            : null,
          q.option_id ? uuid(q.option_id, "option_id") : null,
        ],
      )
    ).rows;
    const items: Draft[] = [];
    for (const row of candidates)
      try {
        items.push(await draftAuthority(c, p, row.id));
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
    return { items, limit: 100, synthetic: true };
  });
}

// Called inside Calculate's existing workspace-locked transaction. Saving an
// evaluation and its editable successor is all-or-nothing, including draft CAS.
export async function saveCalculatedDraft(
  c: QueryClient,
  p: Principal,
  args: {
    id: string;
    expected_version: number;
    company_id: string;
    label: string;
    reason: string;
    binding: import("./context").Binding;
    binding_hash: string;
    run_id: string;
    content: import("./types").CalculationInput;
  },
) {
  const exists = (
    await c.query(
      "SELECT id FROM ppo.cpq_drafts WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, args.id],
    )
  ).rowCount;
  const prior = exists ? await draftAuthority(c, p, args.id, true) : null;
  expected(prior?.version ?? 0, args.expected_version);
  if (
    prior &&
    (prior.kind !== "Configuration" ||
      prior.company_id !== args.company_id ||
      prior.estimating_workspace_id !== args.binding.estimating_workspace_id ||
      prior.option_id !== args.binding.option_id)
  )
    throw new AppError(
      409,
      "CpqDraftScopeChanged",
      "Save into a configuration draft for this exact option.",
    );
  const b = args.binding;
  const saved = (
    await c.query<Draft>(
      `INSERT INTO ppo.cpq_drafts
    (id,workspace_id,company_id,kind,estimating_workspace_id,option_id,discovery_revision_id,base_revision_id,base_run_id,binding_hash,label,content,content_hash,version,created_by,updated_by)
    VALUES($1,$2,$3,'Configuration',$4,$5,$6,$7,$8,$9,$10,$11,$12,1,$13,$13)
    ON CONFLICT(id) DO UPDATE SET discovery_revision_id=excluded.discovery_revision_id,base_revision_id=excluded.base_revision_id,base_run_id=excluded.base_run_id,
    binding_hash=excluded.binding_hash,label=excluded.label,content=excluded.content,content_hash=excluded.content_hash,
    version=ppo.cpq_drafts.version+1,updated_by=excluded.updated_by,updated_at=clock_timestamp()
    WHERE ppo.cpq_drafts.workspace_id=excluded.workspace_id RETURNING *`,
      [
        args.id,
        p.workspace_id,
        args.company_id,
        b.estimating_workspace_id,
        b.option_id,
        b.revision_id,
        b.release_revision_id,
        args.run_id,
        args.binding_hash,
        args.label,
        args.content,
        hash(args.content),
        p.actor_id,
      ],
    )
  ).rows[0];
  if (!saved) throw unavailable();
  await c.query(
    "INSERT INTO ppo.cpq_draft_history(workspace_id,draft_id,version,snapshot,reason,created_by) VALUES($1,$2,$3,$4,$5,$6)",
    [p.workspace_id, saved.id, saved.version, saved, args.reason, p.actor_id],
  );
  return saved;
}

export async function retainVersionDraft(
  c: QueryClient,
  p: Principal,
  args: {
    id: string;
    expected_version: number;
    release_id: string;
    revision_id: string;
    company_id: string;
    content: import("./types").Definition;
    reason: string;
  },
) {
  const prior = await draftAuthority(c, p, args.id, true);
  expected(prior.version, args.expected_version);
  if (
    prior.kind !== "Rules" ||
    prior.company_id !== args.company_id ||
    (prior.release_id !== null && prior.release_id !== args.release_id)
  )
    throw new AppError(
      409,
      "CpqDraftScopeChanged",
      "Create a version in this draft's own release.",
    );
  const saved = (
    await c.query<Draft>(
      "UPDATE ppo.cpq_drafts SET release_id=$3,base_revision_id=$4,content=$5,content_hash=$6,version=version+1,updated_by=$7,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
      [
        p.workspace_id,
        args.id,
        args.release_id,
        args.revision_id,
        args.content,
        hash(args.content),
        p.actor_id,
      ],
    )
  ).rows[0];
  await c.query(
    "INSERT INTO ppo.cpq_draft_history(workspace_id,draft_id,version,snapshot,reason,created_by) VALUES($1,$2,$3,$4,$5,$6)",
    [p.workspace_id, saved.id, saved.version, saved, args.reason, p.actor_id],
  );
}
