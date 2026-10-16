import { randomUUID } from "node:crypto";
import {
  commercialFixture,
  approvedBasis,
  commercialAction,
} from "./project-commercial";
import { grantLibrary } from "./library";
import { engineeringInput } from "./engineering";
import { createEngineeringRequest } from "../../src/engineering/service";
import { supplyInput } from "./supply";
import { saveRecord } from "../../src/supply/commands";
export const packageAction = commercialAction;
export async function specialistFixture() {
  const f = await commercialFixture();
  await approvedBasis(f);
  await grantLibrary(f.owner, [
    "project.specialist.read",
    "project.specialist.prepare",
    "project.specialist.receive",
    "supply.read",
    "supply.coordinate",
  ]);
  await grantLibrary(f.reviewer, [
    "project.specialist.read",
    "project.specialist.receive",
    "supply.read",
    "engineering.read",
  ]);
  const engineering = engineeringInput(f.project.id);
  await createEngineeringRequest(f.owner, engineering);
  const demand = supplyInput();
  Object.assign(demand.data, {
    origin_kind: "Project",
    origin_id: f.project.id,
    origin_reference: null,
  });
  await saveRecord(f.owner, demand);
  const content = {
    title: "SYN electrical package brief",
    scope: "SYN prepare the controller interfaces",
    exclusions: "No purchase, installation or technical release",
    deliverables: "SYN interface schedule for separate technical review",
    specialist: "SYN declared specialist; identity unverified",
    owner_id: f.owner.actor_id,
    receiver_id: f.reviewer.actor_id,
    due_date: null,
    date_needed_reason: "SYN date awaits source review",
    engineering: { id: engineering.id, version: 1 },
    engineering_needed_reason: null,
    demand: { id: demand.id, version: 1 },
    demand_needed_reason: null,
    action_ids: [] as string[],
  };
  const create = {
    ...packageAction(randomUUID(), 0, "Create"),
    basis_id: f.create.id,
    basis_version: 3,
    predecessor_id: null as string | null,
    content,
  };
  return { ...f, engineering, demand, package: create };
}
