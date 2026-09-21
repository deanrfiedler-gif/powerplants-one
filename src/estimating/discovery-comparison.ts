import { canonical } from "../platform/operations";
import type { DiscoveryRevision } from "./discovery-workspace-context";
import type { Configuration } from "./configuration-definition";
export type DiscoveryDifference = {
  entity: string;
  entity_id: string;
  target_id: string | null;
  field: string;
  change: "Added" | "Removed" | "Changed";
  before: unknown;
  after: unknown;
};
const groups = [
  "areas",
  "systems",
  "facts",
  "evidence",
  "responsibilities",
  "follow_ups",
] as const;
// Exact source identity only. No name, array index, or fuzzy matching.
export function compareSavedDiscovery(
  before: Pick<DiscoveryRevision, "id" | "option_id" | "kind" | "input">,
  after: Pick<DiscoveryRevision, "id" | "option_id" | "kind" | "input">,
) {
  const result: DiscoveryDifference[] = [];
  if (before.id === after.id) return result;
  const add = (
    entity: string,
    entity_id: string,
    target_id: string | null,
    field: string,
    a: unknown,
    b: unknown,
  ) => {
    if (canonical(a ?? null) !== canonical(b ?? null))
      result.push({
        entity,
        entity_id,
        target_id,
        field,
        change:
          a === undefined ? "Added" : b === undefined ? "Removed" : "Changed",
        before: a === undefined ? { status: "NotRecorded" } : a,
        after: b === undefined ? { status: "NotRecorded" } : b,
      });
  };
  for (const field of [
    "kind",
    "definition_id",
    "definition_revision",
    "effort",
    "scope",
  ] as const)
    add(
      "discovery",
      before.id,
      after.id,
      field,
      field === "kind" ? before.kind : before.input?.[field],
      field === "kind" ? after.kind : after.input?.[field],
    );
  for (const id of [
    ...new Set(
      [...(before.input?.answers ?? []), ...(after.input?.answers ?? [])].map(
        (a) => a.question_id,
      ),
    ),
  ].sort()) {
    const a = before.input?.answers.find((a) => a.question_id === id),
      b = after.input?.answers.find((a) => a.question_id === id);
    for (const field of ["state", "value", "source", "follow_up"] as const)
      add("answer", id, id, field, a?.[field], b?.[field]);
  }
  const pair = (
    a:
      | Configuration["areas"][number]
      | Configuration["systems"][number]
      | Configuration["facts"][number]
      | Configuration["evidence"][number]
      | Configuration["responsibilities"][number]
      | Configuration["follow_ups"][number],
    b: typeof a,
  ) =>
    before.option_id === after.option_id
      ? b.id === a.id
      : (b.lineage?.revision_id === before.id &&
          b.lineage.entity_id === a.id) ||
        (a.lineage?.revision_id === after.id && a.lineage.entity_id === b.id) ||
        Boolean(
          a.lineage &&
          b.lineage &&
          canonical(a.lineage) === canonical(b.lineage),
        );
  const referenceMap = new Map<string, string>();
  for (const group of groups)
    for (const a of before.input?.configuration?.[group] ?? []) {
      const b = after.input?.configuration?.[group].find((b) => pair(a, b));
      if (b) referenceMap.set(b.id, a.id);
    }
  const normalize = (value: unknown): unknown =>
    typeof value === "string"
      ? (referenceMap.get(value) ?? value)
      : Array.isArray(value)
        ? value
            .map(normalize)
            .sort((a, b) => canonical(a).localeCompare(canonical(b)))
        : value && typeof value === "object"
          ? Object.fromEntries(
              Object.entries(value).map(([k, v]) => [k, normalize(v)]),
            )
          : value;
  for (const group of groups) {
    const aa = before.input?.configuration?.[group] ?? [],
      bb = after.input?.configuration?.[group] ?? [];
    const matched = new Set<string>();
    for (const a of aa) {
      const b = bb.find((b) => pair(a, b));
      if (b) matched.add(b.id);
      if (!b) add(group, a.id, null, "entity", a, undefined);
      else
        for (const field of [...new Set([...Object.keys(a), ...Object.keys(b)])]
          .filter((k) => !["id", "lineage"].includes(k))
          .sort()) {
          const av = (a as unknown as Record<string, unknown>)[field],
            bv = (b as unknown as Record<string, unknown>)[field];
          if (
            canonical(normalize(av) ?? null) !==
            canonical(normalize(bv) ?? null)
          )
            add(group, a.id, b.id, field, av, bv);
        }
    }
    for (const b of bb)
      if (!matched.has(b.id)) add(group, b.id, b.id, "entity", undefined, b);
  }
  return result.sort((a, b) =>
    `${a.entity}:${a.entity_id}:${a.field}`.localeCompare(
      `${b.entity}:${b.entity_id}:${b.field}`,
    ),
  );
}
export function configurationEntities(config: Configuration) {
  return groups.flatMap((kind) =>
    config[kind].map((entity) => ({ kind, entity })),
  );
}
