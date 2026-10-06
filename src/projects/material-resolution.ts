import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { projectRow, tasksFor } from "./service";
import { engineeringRow } from "../engineering/service";
import { access as acceptanceAccess } from "./acceptance/context";
import { unavailable } from "../platform/errors";

// This is the owning workflow's bounded receiving contract, not a dispatcher.
export async function forecastPosition(
  c: QueryClient,
  p: Principal,
  projectId: string,
  taskId: string,
  successorId?: string,
  chainEndId?: string,
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
    ...(successor ? { successor } : {}),
    ...(chainEnd ? { chainEnd } : {}),
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
    dependencies,
    engineering,
    stages,
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
  if (chainEnd) {
    const selected = [task, successor!, chainEnd];
    const ids = selected.map((t) => t.id);
    const touching = dependencies.filter(
      (d) => ids.includes(d.task_id) || ids.includes(d.predecessor_id),
    );
    if (
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
          d.predecessor_id === successor!.id &&
          d.task_id === chainEnd.id &&
          ["FS", "SS"].includes(d.kind),
      )
    )
      holds.push(
        "Select exactly A → B → C; additional, missing or reversed dependencies require separate Projects receiving.",
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
          "Each chain successor must be an internally owned, dated, non-milestone, unstarted Planned task at zero progress.",
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
