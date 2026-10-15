import { object, label, uuid, choice, invalid } from "../shared/validation";
import { bounded, definition, digest, key } from "./validation";
import { hash } from "./hash";
import { evaluate, testDefinition } from "./engine";
import { tableCoverage } from "./design-runtime";
import type { Definition } from "./types";

export type PackageKind = "Rules" | "Tables";
export type PackageReference = {
  package_id: string;
  revision_id: string;
  content_hash: string;
  publication_id: string;
};
export type PackageSnapshot = PackageReference & {
  kind: PackageKind;
  owner_id: string;
  fixture_owner_id: string;
  evidence_hash: string;
  members: { key: string; content_hash: string }[];
};
export function integer(
  value: unknown,
  field: string,
  min: number,
  max: number,
) {
  if (
    !Number.isSafeInteger(value) ||
    Number(value) < min ||
    Number(value) > max
  )
    invalid(field, `Use an integer from ${min} to ${max}.`);
  return Number(value);
}
export function packageReferences(value: unknown): PackageReference[] {
  const refs = bounded(value, "packages", 20, 1)
    .map((value) => {
      const r = object(value, [
        "package_id",
        "revision_id",
        "content_hash",
        "publication_id",
      ]);
      return {
        package_id: uuid(r.package_id, "package_id"),
        revision_id: uuid(r.revision_id, "revision_id"),
        content_hash: digest(r.content_hash, "content_hash"),
        publication_id: uuid(r.publication_id, "publication_id"),
      };
    })
    .sort((a, b) => a.package_id.localeCompare(b.package_id));
  if (new Set(refs.map((r) => r.package_id)).size !== refs.length)
    invalid("packages", "Select each package once.");
  return refs;
}
export function members(d: Definition, kind: PackageKind) {
  return kind === "Rules" ? d.rules : (d.design?.decision_tables ?? []);
}
export function packageContent(value: unknown, kind: PackageKind) {
  const r = object(value, [
    "schema_version",
    "label",
    "definition",
    "member_keys",
    "fixture_owner_id",
    "workload",
  ]);
  if (r.schema_version !== 1)
    invalid("schema_version", "Use package content schema 1.");
  const d = definition(r.definition);
  if (kind === "Tables" && d.schema_version !== 3)
    invalid(
      "definition",
      "Tables require the existing schema 3 design contract.",
    );
  const keys = bounded(r.member_keys, "member_keys", 100, 1)
    .map((v) => key(v))
    .sort();
  if (
    new Set(keys).size !== keys.length ||
    keys.some((k) => !members(d, kind).some((m) => m.key === k))
  )
    invalid(
      "member_keys",
      "Use unique members present in the rehearsal definition.",
    );
  const w = object(r.workload, [
    "family",
    "rationale",
    "evaluation_ms",
    "result_bytes",
    "cases",
  ]);
  if (d.fixtures.length < 3 || d.fixtures.length > 6)
    invalid(
      "fixtures",
      "Supply three to six representative synthetic fixtures.",
    );
  const cases = bounded(w.cases, "cases", 6, 3).map((value) => {
    const c = object(value, ["fixture", "role"]);
    return {
      fixture: label(c.fixture, "fixture", 200),
      role: choice(c.role, "role", ["Small", "Typical", "Boundary"] as const),
    };
  });
  if (
    new Set(cases.map((c) => c.fixture)).size !== cases.length ||
    new Set(cases.map((c) => c.role)).size !== 3 ||
    cases.length !== d.fixtures.length ||
    cases.some((c) => !d.fixtures.some((f) => f.name === c.fixture))
  )
    invalid(
      "cases",
      "Label every fixture once and include small, typical and boundary workloads.",
    );
  const content = {
    schema_version: 1 as const,
    label: label(r.label, "label", 200),
    definition: d,
    member_keys: keys,
    fixture_owner_id: uuid(r.fixture_owner_id, "fixture_owner_id"),
    workload: {
      family: label(w.family, "family", 200),
      rationale: label(w.rationale, "rationale", 1000),
      evaluation_ms: integer(w.evaluation_ms, "evaluation_ms", 1, 1000),
      result_bytes: integer(w.result_bytes, "result_bytes", 1024, 2000000),
      cases,
    },
  };
  if (Buffer.byteLength(JSON.stringify(content)) > 150000)
    invalid("content", "Package content exceeds 150000 bytes.");
  return content;
}
export type PackageContent = ReturnType<typeof packageContent>;

// Prices stay in existing release/Cost Source contracts. All technical context
// must agree; complete candidate fixtures separately prove price expectations.
export function interfaceHash(d: Definition) {
  const design = d.design ? { ...d.design, decision_tables: [] } : null;
  return hash({
    schema_version: d.schema_version,
    facts: d.facts,
    constraints: d.constraints,
    design,
    parts: d.parts.map((p) => ({
      key: p.key,
      unit: p.unit,
      category: p.category,
      resolver: p.resolver,
      scope: p.scope ?? null,
    })),
  });
}
export function coverage(
  d: Definition,
  packages: { kind: PackageKind; content: PackageContent }[],
) {
  const problems: string[] = [];
  for (const kind of ["Rules", "Tables"] as const) {
    const expected = members(d, kind),
      selected = packages
        .filter((p) => p.kind === kind)
        .flatMap((p) =>
          p.content.member_keys.map((k) =>
            members(p.content.definition, kind).find((m) => m.key === k)!,
          ),
        );
    if (
      expected.length !== selected.length ||
      new Set(selected.map((m) => m.key)).size !== selected.length ||
      expected.some(
        (m) => !selected.some((s) => s.key === m.key && hash(s) === hash(m)),
      )
    )
      problems.push(`${kind}: exact complete membership required`);
  }
  if (
    packages.some(
      (p) => interfaceHash(p.content.definition) !== interfaceHash(d),
    )
  )
    problems.push("Package technical rehearsal context differs");
  return problems;
}

// Invoked only inside the existing resource-bounded application worker.
export function measurePackage(content: PackageContent) {
  const fixtures = testDefinition(content.definition).map(
    ({ name, passed, expected, actual, result_hash }) => ({
      name,
      passed,
      expected,
      actual,
      result_hash,
    }),
  );
  const cases = content.definition.fixtures.map((f) => {
    const samples = [];
    for (let i = 0; i < 3; i++) {
      const start = performance.now(),
        result = evaluate(content.definition, f.input);
      const evaluation_ms = performance.now() - start;
      samples.push({
        evaluation_ms,
        result_bytes: Buffer.byteLength(JSON.stringify(result)),
        lines: result.lines.length,
        result_hash: result.result_hash,
      });
    }
    return {
      fixture: f.name,
      role: content.workload.cases.find((c) => c.fixture === f.name)!.role,
      instances: f.input.instances.length,
      input_bytes: Buffer.byteLength(JSON.stringify(f.input)),
      samples,
      maximum_evaluation_ms: Math.max(...samples.map((s) => s.evaluation_ms)),
      maximum_result_bytes: Math.max(...samples.map((s) => s.result_bytes)),
      passed: samples.every(
        (s) =>
          s.evaluation_ms <= content.workload.evaluation_ms &&
          s.result_bytes <= content.workload.result_bytes,
      ),
    };
  });
  const tables =
    content.definition.schema_version === 3
      ? tableCoverage(content.definition)
      : [];
  return {
    schema_version: 1 as const,
    scope: "SyntheticInWorkerEvaluation" as const,
    runtime: process.version,
    content_hash: hash(content),
    target: content.workload,
    fixtures,
    cases,
    tables,
    passed:
      fixtures.every((f) => f.passed) &&
      cases.every((c) => c.passed) &&
      tables.every((t) => t.complete && !t.issues.length),
  };
}
