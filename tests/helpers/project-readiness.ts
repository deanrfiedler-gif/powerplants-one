import { createSession } from "../../src/platform/identity";
import { createProject } from "../../src/projects/service";
import { createEngineeringRequest } from "../../src/engineering/service";
import { saveRecord } from "../../src/supply/commands";
import { projectInput } from "./projects";
import { engineeringInput } from "./engineering";
import { supplyInput } from "./supply";
import { grantLibrary } from "./library";

export async function readinessFixture() {
  const p = (await createSession("coordinator")).principal;
  await grantLibrary(p, ["supply.read", "supply.coordinate"]);
  const project = projectInput();
  await createProject(p, project);
  const engineering = engineeringInput(project.id);
  await createEngineeringRequest(p, engineering);
  const demand = supplyInput();
  Object.assign(demand.data, {
    origin_kind: "Project",
    origin_id: project.id,
    origin_reference: null,
  });
  await saveRecord(p, demand);
  return { p, project, engineering, demand };
}
