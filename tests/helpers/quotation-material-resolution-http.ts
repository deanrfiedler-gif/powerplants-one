import {
  shortfallHttpFixture,
  json,
  supplyApply,
} from "./quotation-allocation-shortfall-http";
import { projectInput, taskInput } from "./projects";
import {
  materialProposal,
  materialReceiving,
  materialReview,
} from "./quotation-material-resolution";
export {
  json,
  request,
  session,
  conversionDetail,
} from "./quotation-allocation-shortfall-http";
export {
  materialProposal,
  materialReceiving,
  materialReview,
  materialApply,
} from "./quotation-material-resolution";
export async function materialHttpFixture(
  reviewed = false,
  dependency = false,
  chain = false,
  branch = false,
  merge = false,
  diamond = false,
) {
  const project = projectInput(),
    task = { ...taskInput(), status: "Planned", progress: 0 };
  const successor = {
    ...taskInput(2),
    title: "SYN dependent installation",
    start_date: "2027-12-01",
    finish_date: "2027-12-10",
    status: "Planned",
    progress: 0,
    dependencies: merge ? [] : [{ task_id: task.id, kind: "FS" as const }],
  };
  const chainEnd = {
    ...taskInput(3),
    title: "SYN downstream commissioning forecast",
    start_date: "2027-12-13",
    finish_date: "2027-12-17",
    status: "Planned",
    progress: 0,
    dependencies: merge
      ? [
          { task_id: task.id, kind: "FS" as const },
          { task_id: successor.id, kind: "SS" as const },
        ]
      : [
          {
            task_id: branch || diamond ? task.id : successor.id,
            kind: "SS" as const,
          },
        ],
  };
  const diamondEnd = {
    ...taskInput(4),
    title: "SYN shared diamond successor D",
    start_date: "2027-12-20",
    finish_date: "2027-12-24",
    status: "Planned",
    progress: 0,
    dependencies: [
      { task_id: successor.id, kind: "FS" as const },
      { task_id: chainEnd.id, kind: "SS" as const },
    ],
  };
  const f = await shortfallHttpFixture(true, async (f, other) => {
    project.coordinator_id = other.owner_id;
    await json(f.owner, "projects", project);
    task.owner_id = other.owner_id;
    await json(f.owner, `projects/${project.id}/tasks`, task);
    if (dependency || merge || diamond) {
      successor.owner_id = other.owner_id;
      await json(f.owner, `projects/${project.id}/tasks`, successor);
    }
    if (chain || branch || merge || diamond) {
      chainEnd.owner_id = other.owner_id;
      await json(f.owner, `projects/${project.id}/tasks`, chainEnd);
    }
    if (diamond) {
      diamondEnd.owner_id = other.owner_id;
      await json(f.owner, `projects/${project.id}/tasks`, diamondEnd);
    }
    Object.assign(other.data, {
      origin_kind: "Project",
      origin_id: project.id,
      origin_reference: "SYN pre-existing Project material demand",
    });
  });
  await json(f.owner, f.path + "/supply-apply", supplyApply(await f.current()));
  if (reviewed) {
    await json(f.owner, f.path + "/material-propose", {
      ...materialProposal(await f.current(), task.id),
      ...(diamond
        ? {
            diamond_b_task_id: successor.id,
            diamond_c_task_id: chainEnd.id,
            diamond_d_task_id: diamondEnd.id,
          }
        : {}),
      ...(dependency ? { successor_task_id: successor.id } : {}),
      ...(chain ? { chain_end_task_id: chainEnd.id } : {}),
      ...(branch ? { branch_successor_task_id: chainEnd.id } : {}),
      ...(merge
        ? {
            merge_predecessor_task_id: successor.id,
            merge_successor_task_id: chainEnd.id,
          }
        : {}),
    });
    for (const r of (await f.current()).material_resolution.required)
      await json(
        f.owner,
        f.path + "/material-receive",
        materialReceiving(await f.current(), r.role),
      );
    await json(
      f.owner,
      f.path + "/material-review",
      materialReview(await f.current()),
    );
  }
  return {
    ...f,
    project,
    task,
    ...(diamond
      ? { diamond: { b: successor, c: chainEnd, d: diamondEnd } }
      : {}),
    ...(dependency ? { successor } : {}),
    ...(chain ? { chainEnd } : {}),
    ...(branch ? { branchSuccessor: chainEnd } : {}),
    ...(merge ? { mergePredecessor: successor, mergeSuccessor: chainEnd } : {}),
  };
}
