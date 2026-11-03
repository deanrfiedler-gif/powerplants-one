// Test-only pairing of retained maintenance request tasks with Service scope items. Pairing is
// decided ONCE, against the field job's scope items, by exact description (first unused item), and
// the same scope item ids are then looked up in the report snapshot. Pairing independently against
// each list would let repeated descriptions swap identities between the recorded per-task outcomes
// and the receiving task_mapping (#770 review). Pure: no database access.
export type PairedTask = {
  task: { id: string; description: string };
  index: number;
  scope_item_id: string;
};
export function pairTasks(
  tasks: { id: string; description: string }[],
  items: { id: string; description: string }[],
): PairedTask[] {
  const used = new Set<string>();
  return tasks.map((task, index) => {
    const item = items.find(
      (x) => !used.has(x.id) && x.description === task.description,
    );
    if (!item) throw Error(`No scope item for request task ${index + 1}`);
    used.add(item.id);
    return { task, index, scope_item_id: item.id };
  });
}
// The receiving mapping reuses the chosen scope item ids, checking each is in the reviewed report
// snapshot with the same description, whatever order the snapshot lists them in.
export function mappingFromPairs(
  pairs: PairedTask[],
  snapshotTasks: { id: string; task_description: string }[],
  basis: string,
) {
  return pairs.map(({ task, scope_item_id }) => {
    const snapshot = snapshotTasks.find((x) => x.id === scope_item_id);
    if (!snapshot || snapshot.task_description !== task.description)
      throw Error(`Report snapshot lacks scope item ${scope_item_id} for task ${task.id}`);
    return { task_id: task.id, scope_item_id, basis };
  });
}
