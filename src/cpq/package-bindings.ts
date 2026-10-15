import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import type { Definition } from "./types";
import {
  coverage,
  type PackageReference,
  type PackageSnapshot,
} from "./package-model";
import { publishedPackage, packageError } from "./package-context";
import { hash } from "./hash";
import { testIsolated } from "./runner";
import { transaction } from "../platform/database";
import { object, uuid } from "../shared/validation";
import { duty } from "./context";
import { definition } from "./validation";
import { packageReferences, members } from "./package-model";

// Explicit assembly preview. Save still rechecks the exact manifest atomically.
export async function previewPackages(p: Principal, value: unknown) {
  const r = object(value, ["company_id", "definition", "packages"]);
  const company = uuid(r.company_id, "company_id"),
    template = definition(r.definition),
    refs = packageReferences(r.packages);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    await duty(c, p, company, "cpq.author");
    const selected = [];
    for (const ref of refs)
      selected.push(await publishedPackage(c, p, company, ref, true));
    const rules = selected
      .filter((s) => s.root.kind === "Rules")
      .flatMap((s) =>
        members(s.revision.content.definition, "Rules").filter((m) =>
          s.revision.content.member_keys.includes(m.key),
        ),
      );
    const tables = selected
      .filter((s) => s.root.kind === "Tables")
      .flatMap((s) =>
        members(s.revision.content.definition, "Tables").filter((m) =>
          s.revision.content.member_keys.includes(m.key),
        ),
      );
    if (tables.length && template.schema_version !== 3)
      throw packageError("Table composition requires schema 3.");
    const candidate = definition({
      ...template,
      rules,
      ...(template.design
        ? { design: { ...template.design, decision_tables: tables } }
        : {}),
    });
    const manifest = await composePackages(
      c,
      p,
      company,
      candidate,
      refs,
      true,
    );
    return {
      definition: candidate,
      definition_hash: hash(candidate),
      packages: refs,
      package_manifest: manifest,
      manifest_hash: hash(manifest),
      synthetic: true,
    };
  });
}

export async function composePackages(
  c: QueryClient,
  p: Principal,
  company: string,
  d: Definition,
  refs: PackageReference[],
  current = false,
) {
  const selected = [];
  for (const ref of refs)
    selected.push(await publishedPackage(c, p, company, ref, current));
  const problems = coverage(
    d,
    selected.map((s) => ({ kind: s.root.kind, content: s.revision.content })),
  );
  if (problems.length) throw packageError(problems.join("; "));
  if (current)
    for (const s of selected) {
      const results = await testIsolated({
        ...d,
        fixtures: s.revision.content.definition.fixtures,
      });
      if (results.some((r) => !r.passed))
        throw packageError(
          "Package fixtures do not pass against this complete candidate, including its prices. Revise the owned fixtures explicitly.",
        );
    }
  return selected.map((s) => s.snapshot);
}
export async function releasePackages(
  c: QueryClient,
  p: Principal,
  revision: {
    company_id: string;
    definition: Definition;
    package_manifest?: PackageSnapshot[] | null;
  },
  current = false,
) {
  if (!revision.package_manifest) return [];
  const actual = [];
  for (const ref of revision.package_manifest)
    actual.push(
      (await publishedPackage(c, p, revision.company_id, ref, current))
        .snapshot,
    );
  if (hash(actual) !== hash(revision.package_manifest))
    throw packageError(
      "The immutable release package manifest does not match its exact source evidence.",
    );
  return actual;
}
