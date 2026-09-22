import { createHash, randomUUID } from "node:crypto";
import type { Principal } from "../../platform/identity";
import { database } from "../../platform/database";
import { sharedOperation } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import {
  object,
  uuid,
  label,
  version,
  common,
  commonKeys,
} from "../../shared/validation";
import {
  workspaceAuthority,
  optionContext,
  requireDraftGroup,
} from "../discovery-workspace-context";
import { expected } from "../service";
import { validateScope } from "./validation";
import { insertRevision } from "./service";
import {
  bounded,
  coverage,
  hash,
  scopeRecord,
  savedRevision,
  observeBinding,
  writable,
  commandAuthority,
  notClosed,
  acceptedAuthority,
} from "./context";
import type { Scope } from "./types";
import type { FertigationRecord } from "./storage-types";

export function remapScope(source: Scope, allocationId: string) {
  const identity_map: Record<string, string> = {};
  const walk = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") {
      const row = value as Record<string, unknown>;
      if (typeof row.id === "string") {
        const digest = createHash("sha256")
          .update(`${allocationId}:${row.id}`)
          .digest("hex");
        identity_map[row.id] =
          `${digest.slice(0, 8)}-${digest.slice(8, 12)}-5${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
      }
      Object.values(row).forEach(walk);
    }
  };
  walk(source);
  const remap = (value: unknown, key = ""): unknown => {
    if (Array.isArray(value)) return value.map((v) => remap(v, key));
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, remap(v, k)]),
      );
    return typeof value === "string" &&
      (key === "id" || key.endsWith("_id") || key.endsWith("_ids")) &&
      !["facility_id", "asset_id"].includes(key)
      ? (identity_map[value] ?? value)
      : value;
  };
  return { proposal: validateScope(remap(source)), identity_map };
}
export async function copyScope(p: Principal, id: string, value: unknown) {
  bounded(value);
  const r = object(value, [
    ...commonKeys,
    "id",
    "name",
    "source_revision_id",
    "estimating_workspace_id",
    "option_id",
    "revision_id",
    "expected_workspace_version",
    "coverage",
  ]);
  const input = {
    ...common(r),
    source_id: uuid(id, "source_id"),
    id: uuid(r.id, "id"),
    name: label(r.name, "name", 200),
    source_revision_id: uuid(r.source_revision_id, "source_revision_id"),
    estimating_workspace_id: uuid(
      r.estimating_workspace_id,
      "estimating_workspace_id",
    ),
    option_id: uuid(r.option_id, "option_id"),
    revision_id: uuid(r.revision_id, "revision_id"),
    expected_workspace_version: version(r.expected_workspace_version),
    coverage: coverage(r.coverage),
  };
  return sharedOperation(
    p,
    input,
    "CopyFertigationScope",
    async (c) => {
      await notClosed(c, p, input.operation_id);
      const original = await scopeRecord(c, p, input.source_id),
        source = await savedRevision(c, p, original, input.source_revision_id);
      const accepted = await acceptedAuthority(
        c,
        p,
        input.id,
        input.operation_id,
      );
      const g = await workspaceAuthority(
        c,
        p,
        input.estimating_workspace_id,
        true,
      );
      if (g.company_id !== original.company_id) throw unavailable();
      return { original, source, accepted, g };
    },
    async (c, { source, g }) => {
      expected(g.version, input.expected_workspace_version);
      await requireDraftGroup(c, p, g);
      const option = await optionContext(c, g, input.option_id);
      if (option.current_revision_id !== input.revision_id)
        throw new AppError(
          409,
          "FertigationSourceChanged",
          "Copy into the current saved Discovery source.",
        );
      const binding = await observeBinding(
          c,
          p,
          g.id,
          input.option_id,
          input.revision_id,
          input.coverage,
        ),
        copy = remapScope(source.saved.proposal, input.id);
      copy.proposal.name = input.name;
      const revisionId = randomUUID(),
        scope = (
          await c.query<FertigationRecord>(
            "INSERT INTO ppo.fertigation_scopes(id,workspace_id,company_id,estimating_workspace_id,option_id,name,owner_id,current_revision_id,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$7,$7) RETURNING *",
            [
              input.id,
              p.workspace_id,
              g.company_id,
              g.id,
              input.option_id,
              input.name,
              p.actor_id,
              revisionId,
            ],
          )
        ).rows[0];
      await insertRevision(
        c,
        p,
        scope,
        revisionId,
        1,
        binding,
        copy.proposal,
        input.reason,
        null,
      );
      const lineage = {
        source_scope_id: input.source_id,
        source_revision_id: source.saved.id,
        identity_map: copy.identity_map,
      };
      await c.query(
        "INSERT INTO ppo.fertigation_copies(workspace_id,scope_id,revision_id,source_scope_id,source_revision_id,identity_map,content_hash) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          p.workspace_id,
          input.id,
          revisionId,
          input.source_id,
          source.saved.id,
          copy.identity_map,
          hash(lineage),
        ],
      );
      await savedRevision(c, p, scope, revisionId);
      return {
        ...scope,
        audit_details: {
          revision_id: revisionId,
          copied_from_scope_id: input.source_id,
          copied_from_revision_id: source.saved.id,
        },
      };
    },
    "FertigationScope",
    "FertigationScopeSaved",
  );
}
export async function restoreRevision(
  p: Principal,
  id: string,
  value: unknown,
) {
  const r = object(value, [
      ...commonKeys,
      "source_revision_id",
      "expected_version",
      "expected_revision_id",
    ]),
    input = {
      ...common(r),
      id: uuid(id, "id"),
      source_revision_id: uuid(r.source_revision_id, "source_revision_id"),
      expected_version: version(r.expected_version),
      expected_revision_id: uuid(
        r.expected_revision_id,
        "expected_revision_id",
      ),
    };
  return sharedOperation(
    p,
    input,
    "RestoreFertigationRevision",
    async (c) => {
      const scope = await commandAuthority(c, p, id, input.operation_id);
      await savedRevision(c, p, scope, input.source_revision_id);
      return scope;
    },
    async (c, scope) => {
      const current = await writable(c, p, scope),
        historical = await savedRevision(c, p, scope, input.source_revision_id);
      expected(scope.version, input.expected_version);
      if (current.saved.id !== input.expected_revision_id)
        throw new AppError(
          409,
          "FertigationRevisionChanged",
          "Review the current scope revision before restoration.",
        );
      const live = await observeBinding(
        c,
        p,
        scope.estimating_workspace_id,
        scope.option_id,
        current.saved.source_revision_id,
        current.saved.binding,
      );
      const option = await optionContext(c, current.g, scope.option_id);
      if (
        option.current_revision_id !== current.saved.source_revision_id ||
        live.upstream_context_hash !==
          current.saved.binding.upstream_context_hash
      )
        throw new AppError(
          409,
          "FertigationSourceChanged",
          "Explicitly refresh changed source context before restoring historical inputs.",
        );
      const revisionId = randomUUID();
      await insertRevision(
        c,
        p,
        scope,
        revisionId,
        current.saved.version + 1,
        current.saved.binding,
        historical.saved.proposal,
        input.reason,
        current.saved.id,
      );
      const updated = (
        await c.query<FertigationRecord>(
          "UPDATE ppo.fertigation_scopes SET version=version+1,current_revision_id=$3,name=$4,updated_by=$5,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [
            p.workspace_id,
            id,
            revisionId,
            historical.saved.proposal.name,
            p.actor_id,
          ],
        )
      ).rows[0];
      return {
        ...updated,
        audit_details: {
          revision_id: revisionId,
          restored_revision_id: historical.saved.id,
        },
      };
    },
    "FertigationScope",
    "FertigationScopeSaved",
  );
}
export async function compareRevisions(
  p: Principal,
  id: string,
  value: unknown,
) {
  const r = object(value, ["before_revision_id", "after_revision_id"]),
    c = database(),
    scope = await scopeRecord(c, p, id),
    before = (
      await savedRevision(
        c,
        p,
        scope,
        uuid(r.before_revision_id, "before_revision_id"),
      )
    ).saved,
    after = (
      await savedRevision(
        c,
        p,
        scope,
        uuid(r.after_revision_id, "after_revision_id"),
      )
    ).saved;
  const differences: { path: string; before: unknown; after: unknown }[] = [];
  const walk = (a: unknown, b: unknown, path: string) => {
    if (hash(a ?? null) === hash(b ?? null)) return;
    if (
      Array.isArray(a) &&
      Array.isArray(b) &&
      [...a, ...b].every((x) => x && typeof x === "object" && "id" in x)
    ) {
      const left = new Map(a.map((x) => [(x as { id: string }).id, x])),
        right = new Map(b.map((x) => [(x as { id: string }).id, x]));
      for (const key of new Set([...left.keys(), ...right.keys()]))
        walk(left.get(key) ?? null, right.get(key) ?? null, `${path}[${key}]`);
    } else if (
      a &&
      b &&
      typeof a === "object" &&
      typeof b === "object" &&
      !Array.isArray(a) &&
      !Array.isArray(b)
    ) {
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
        walk(
          (a as Record<string, unknown>)[key] ?? null,
          (b as Record<string, unknown>)[key] ?? null,
          `${path}.${key}`,
        );
    } else differences.push({ path, before: a ?? null, after: b ?? null });
  };
  walk(before.proposal, after.proposal, "scope");
  walk(before.binding, after.binding, "source");
  return {
    before_revision_id: before.id,
    after_revision_id: after.id,
    before_hash: before.content_hash,
    after_hash: after.content_hash,
    differences,
  };
}
