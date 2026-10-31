// M-R2 (PPO-MAINTENANCE-TS02-DEC): receiving a maintenance result needs a distinct scope item whose
// description matches each plan task exactly. The work order page warns, without blocking, before
// a scope edit leaves any plan task without such an item. Counting descriptions keeps multiplicity,
// so a task replaced by another task's wording, a removed task and a lost repeat are all detected,
// while legitimately repeated plan wording is not (#770 review R2). Pure: safe in client components.
export function plannedTaskWordingGaps(planned: string[], items: string[]) {
  const required = new Map<string, number>();
  for (const description of planned)
    required.set(description, (required.get(description) ?? 0) + 1);
  const present = new Map<string, number>();
  for (const description of items)
    present.set(description, (present.get(description) ?? 0) + 1);
  // Scope items (1-based) whose wording matches no plan task at all.
  const unmatched = items.flatMap((description, n) =>
    required.has(description) ? [] : [n + 1],
  );
  // Plan task wording with fewer matching items than plan tasks, repeated once per missing task.
  const missing = [...required].flatMap(([description, count]) =>
    Array.from(
      { length: Math.max(0, count - (present.get(description) ?? 0)) },
      () => description,
    ),
  );
  return { unmatched, missing };
}
