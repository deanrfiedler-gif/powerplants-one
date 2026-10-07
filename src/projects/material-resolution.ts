import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { projectRow, tasksFor } from "./service";
import { engineeringRow } from "../engineering/service";
import { access as acceptanceAccess } from "./acceptance/context";
import { scheduleIssues } from "./model";
import { unavailable } from "../platform/errors";

// This is the owning workflow's bounded receiving contract, not a dispatcher.
export async function forecastPosition(
  c: QueryClient,
  p: Principal,
  projectId: string,
  taskId: string,
  successorId?: string,
  chainEndId?: string,
  branchSuccessorId?: string,
  mergePredecessorId?: string,
  mergeSuccessorId?: string,
  diamondIds?: { b: string; c: string; d: string },
) {
  const project = await projectRow(c, p, projectId);
  const tasks = await tasksFor(c, p, projectId);
  const task = tasks.find((t) => t.id === taskId);
  if (!task || task.owner_unavailable) throw unavailable();
  const successor = successorId
    ? tasks.find((t) => t.id === successorId)
    : undefined;
  if (successorId && (!successor || successor.owner_unavailable))
    throw unavailable();
  const chainEnd = chainEndId
    ? tasks.find((t) => t.id === chainEndId)
    : undefined;
  if (chainEndId && (!successor || !chainEnd || chainEnd.owner_unavailable))
    throw unavailable();
  const branchSuccessor = branchSuccessorId
    ? tasks.find((t) => t.id === branchSuccessorId)
    : undefined;
  if (
    branchSuccessorId &&
    (!successor ||
      chainEnd ||
      !branchSuccessor ||
      branchSuccessor.owner_unavailable)
  )
    throw unavailable();
  const mergePredecessor = mergePredecessorId
    ? tasks.find((t) => t.id === mergePredecessorId)
    : undefined;
  const mergeSuccessor = mergeSuccessorId
    ? tasks.find((t) => t.id === mergeSuccessorId)
    : undefined;
  if (
    (mergePredecessorId || mergeSuccessorId) &&
    (!mergePredecessor ||
      !mergeSuccessor ||
      mergePredecessor.owner_unavailable ||
      mergeSuccessor.owner_unavailable ||
      successor ||
      chainEnd ||
      branchSuccessor)
  )
    throw unavailable();
  const diamondTasks = diamondIds
    ? [diamondIds.b, diamondIds.c, diamondIds.d].map((id) =>
        tasks.find((t) => t.id === id),
      )
    : undefined;
  if (
    diamondTasks &&
    (diamondTasks.some((t) => !t || t.owner_unavailable) ||
      successor ||
      chainEnd ||
      branchSuccessor ||
      mergePredecessor ||
      mergeSuccessor)
  )
    throw unavailable();
  const diamond = diamondTasks
    ? {
        b: diamondTasks[0]!,
        c: diamondTasks[1]!,
        d: diamondTasks[2]!,
        nativeTasks: (
          await c.query<{ value: Record<string, unknown> }>(
            "SELECT to_jsonb(t) value FROM ppo.project_tasks t WHERE workspace_id=$1 AND project_id=$2 AND id=ANY($3::uuid[]) ORDER BY id",
            [
              p.workspace_id,
              projectId,
              [taskId, diamondIds!.b, diamondIds!.c, diamondIds!.d],
            ],
          )
        ).rows.map((r) => r.value),
        nativeProject: (
          await c.query<{ value: Record<string, unknown> }>(
            "SELECT to_jsonb(p) value FROM ppo.projects p WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, projectId],
          )
        ).rows[0].value,
      }
    : undefined;
  // Read the exact retained native row only after current protected task/owner reads.
  const retainedPredecessor = mergePredecessor
    ? (
        await c.query<{ value: Record<string, unknown> }>(
          "SELECT to_jsonb(t) value FROM ppo.project_tasks t WHERE workspace_id=$1 AND project_id=$2 AND id=$3",
          [p.workspace_id, projectId, mergePredecessor.id],
        )
      ).rows[0].value
    : undefined;
  const dependencies = (
    await c.query<{ task_id: string; predecessor_id: string; kind: string }>(
      "SELECT task_id,predecessor_id,kind FROM ppo.project_dependencies WHERE workspace_id=$1 AND project_id=$2 ORDER BY task_id,predecessor_id",
      [p.workspace_id, projectId],
    )
  ).rows;
  const engineering = [];
  for (const r of (
    await c.query<{ id: string }>(
      "SELECT id FROM ppo.engineering_packages WHERE workspace_id=$1 AND project_id=$2 ORDER BY id",
      [p.workspace_id, projectId],
    )
  ).rows) {
    const row = await engineeringRow(c, p, r.id);
    engineering.push({ id: row.id, version: row.version });
  }
  const stages = (
    await c.query<{ id: string; version: number; owner_id: string }>(
      "SELECT id,version,owner_id FROM ppo.acceptance_stages WHERE workspace_id=$1 AND project_id=$2 ORDER BY id",
      [p.workspace_id, projectId],
    )
  ).rows;
  if (stages.length) await acceptanceAccess(c, p, projectId, "scope");
  return {
    project,
    task,
    dependencies,
    engineering,
    stages,
    ...(diamond ? { topology: "Diamond" as const, diamond } : {}),
    ...(mergePredecessor && mergeSuccessor
      ? {
          topology: "Merge" as const,
          mergePredecessor,
          mergeSuccessor,
          retainedPredecessor,
          retainedIssues: scheduleIssues(mergePredecessor, tasks),
        }
      : {}),
    ...(successor ? { successor } : {}),
    ...(chainEnd ? { chainEnd } : {}),
    ...(branchSuccessor
      ? { branchSuccessor, topology: "Branch" as const }
      : {}),
  };
}
export function forecastHolds(
  position: Awaited<ReturnType<typeof forecastPosition>>,
) {
  const {
    project,
    task,
    successor,
    chainEnd,
    branchSuccessor,
    mergePredecessor,
    mergeSuccessor,
    dependencies,
    engineering,
    stages,
    diamond,
  } = position;
  const holds: string[] = [];
  if (project.lifecycle !== "Active")
    holds.push(
      "Projects must reopen a closed Project before a schedule change.",
    );
  if (task.status !== "Planned" || task.progress !== 0 || task.milestone)
    holds.push(
      "Only an unstarted Planned task at zero progress is supported; milestones and started/completed work require Projects follow-up.",
    );
  if (!task.start_date || !task.finish_date)
    holds.push("The task must have both forecast dates to withdraw.");
  if (!task.owner_id || task.external_owner_id)
    holds.push("An independently receiving internal task owner is required.");
  if (diamond) {
    const selected = [task, diamond.b, diamond.c, diamond.d],
      ids = selected.map((t) => t.id);
    const touching = dependencies.filter(
      (d) => ids.includes(d.task_id) || ids.includes(d.predecessor_id),
    );
    const edges = [
      [task.id, diamond.b.id],
      [task.id, diamond.c.id],
      [diamond.b.id, diamond.d.id],
      [diamond.c.id, diamond.d.id],
    ];
    if (
      new Set(ids).size !== 4 ||
      touching.length !== 4 ||
      !edges.every(([from, to]) =>
        touching.some(
          (d) =>
            d.predecessor_id === from &&
            d.task_id === to &&
            ["FS", "SS"].includes(d.kind),
        ),
      )
    )
      holds.push(
        "Select exactly A → B, A → C, B → D and C → D; additional, missing or reversed dependencies require separate Projects receiving.",
      );
    if (
      selected.some(
        (t) =>
          t.status !== "Planned" ||
          t.progress !== 0 ||
          t.milestone ||
          !t.start_date ||
          !t.finish_date ||
          t.finish_date < t.start_date ||
          !t.owner_id ||
          t.external_owner_id,
      )
    )
      holds.push(
        "Each diamond task must be internally owned, dated, non-milestone and Planned at zero progress.",
      );
  } else if (mergePredecessor && mergeSuccessor) {
    const selected = [task, mergePredecessor, mergeSuccessor],
      ids = selected.map((t) => t.id);
    const touching = dependencies.filter(
      (d) => ids.includes(d.task_id) || ids.includes(d.predecessor_id),
    );
    if (
      new Set(ids).size !== 3 ||
      touching.length !== 2 ||
      ![task, mergePredecessor].every((prior) =>
        touching.some(
          (d) =>
            d.predecessor_id === prior.id &&
            d.task_id === mergeSuccessor.id &&
            ["FS", "SS"].includes(d.kind),
        ),
      )
    )
      holds.push(
        "Select exactly A → C and B → C; additional, missing or reversed dependencies require separate Projects receiving.",
      );
    for (const selectedTask of selected.slice(1))
      if (
        selectedTask.status !== "Planned" ||
        selectedTask.progress !== 0 ||
        selectedTask.milestone ||
        !selectedTask.start_date ||
        !selectedTask.finish_date ||
        !selectedTask.owner_id ||
        selectedTask.external_owner_id
      )
        holds.push(
          "Each selected merge task must be internally owned, dated, non-milestone and Planned at zero progress.",
        );
    if (
      mergePredecessor.dependencies.length ||
      (position.retainedIssues?.length ?? 0) ||
      !mergePredecessor.start_date ||
      !mergePredecessor.finish_date ||
      mergePredecessor.finish_date < mergePredecessor.start_date
    )
      holds.push(
        "B must have a valid native forecast with no incoming dependencies or native schedule warnings; its exact position is retained, without a new commitment.",
      );
  } else if (chainEnd || branchSuccessor) {
    const third = branchSuccessor ?? chainEnd!;
    const selected = [task, successor!, third];
    const ids = selected.map((t) => t.id);
    const touching = dependencies.filter(
      (d) => ids.includes(d.task_id) || ids.includes(d.predecessor_id),
    );
    if (
      !!(chainEnd && branchSuccessor) ||
      new Set(ids).size !== 3 ||
      touching.length !== 2 ||
      !touching.some(
        (d) =>
          d.predecessor_id === task.id &&
          d.task_id === successor!.id &&
          ["FS", "SS"].includes(d.kind),
      ) ||
      !touching.some(
        (d) =>
          d.predecessor_id === (branchSuccessor ? task.id : successor!.id) &&
          d.task_id === third.id &&
          ["FS", "SS"].includes(d.kind),
      )
    )
      holds.push(
        branchSuccessor
          ? "Select exactly A → B and A → C; additional, missing or reversed dependencies require separate Projects receiving."
          : "Select exactly A → B → C; additional, missing or reversed dependencies require separate Projects receiving.",
      );
    for (const next of selected.slice(1))
      if (
        next.status !== "Planned" ||
        next.progress !== 0 ||
        next.milestone ||
        !next.start_date ||
        !next.finish_date ||
        !next.owner_id ||
        next.external_owner_id
      )
        holds.push(
          "Each selected successor must be an internally owned, dated, non-milestone, unstarted Planned task at zero progress.",
        );
  } else if (successor) {
    const touching = dependencies.filter(
      (d) =>
        [task.id, successor.id].includes(d.task_id) ||
        [task.id, successor.id].includes(d.predecessor_id),
    );
    if (
      successor.id === task.id ||
      touching.length !== 1 ||
      touching[0]?.task_id !== successor.id ||
      touching[0]?.predecessor_id !== task.id ||
      !["FS", "SS"].includes(touching[0]?.kind)
    )
      holds.push(
        "Select exactly one successor relationship from the affected task; additional or reversed dependencies require separate Projects receiving.",
      );
    if (
      successor.status !== "Planned" ||
      successor.progress !== 0 ||
      successor.milestone ||
      !successor.start_date ||
      !successor.finish_date ||
      !successor.owner_id ||
      successor.external_owner_id
    )
      holds.push(
        "The successor must be an internally owned, dated, non-milestone, unstarted Planned task at zero progress.",
      );
  } else if (
    dependencies.some(
      (d) => d.task_id === task.id || d.predecessor_id === task.id,
    )
  )
    holds.push(
      "Task predecessors or successors require a separately received Projects dependency change.",
    );
  if (engineering.length || stages.length)
    holds.push(
      "Linked Engineering or Project acceptance evidence requires its owning workflow before forecast withdrawal.",
    );
  return holds;
}
