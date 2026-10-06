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
    dependencies: [{ task_id: task.id, kind: "FS" as const }],
  };
  const chainEnd = {
    ...taskInput(3),
    title: "SYN downstream commissioning forecast",
    start_date: "2027-12-13",
    finish_date: "2027-12-17",
    status: "Planned",
    progress: 0,
    dependencies: [
      { task_id: branch ? task.id : successor.id, kind: "SS" as const },
    ],
  };
  const f = await shortfallHttpFixture(true, async (f, other) => {
    project.coordinator_id = other.owner_id;
    await json(f.owner, "projects", project);
    task.owner_id = other.owner_id;
    await json(f.owner, `projects/${project.id}/tasks`, task);
    if (dependency) {
      successor.owner_id = other.owner_id;
      await json(f.owner, `projects/${project.id}/tasks`, successor);
    }
    if (chain || branch) {
      chainEnd.owner_id = other.owner_id;
      await json(f.owner, `projects/${project.id}/tasks`, chainEnd);
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
      ...(dependency ? { successor_task_id: successor.id } : {}),
      ...(chain ? { chain_end_task_id: chainEnd.id } : {}),
      ...(branch ? { branch_successor_task_id: chainEnd.id } : {}),
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
    ...(dependency ? { successor } : {}),
    ...(chain ? { chainEnd } : {}),
    ...(branch ? { branchSuccessor: chainEnd } : {}),
  };
}
