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
export async function materialHttpFixture(reviewed = false) {
  const project = projectInput(),
    task = { ...taskInput(), status: "Planned", progress: 0 };
  const f = await shortfallHttpFixture(true, async (f, other) => {
    project.coordinator_id = other.owner_id;
    await json(f.owner, "projects", project);
    task.owner_id = other.owner_id;
    await json(f.owner, `projects/${project.id}/tasks`, task);
    Object.assign(other.data, {
      origin_kind: "Project",
      origin_id: project.id,
      origin_reference: "SYN pre-existing Project material demand",
    });
  });
  await json(f.owner, f.path + "/supply-apply", supplyApply(await f.current()));
  if (reviewed) {
    await json(
      f.owner,
      f.path + "/material-propose",
      materialProposal(await f.current(), task.id),
    );
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
  return { ...f, project, task };
}
