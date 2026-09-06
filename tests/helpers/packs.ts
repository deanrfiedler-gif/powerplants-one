import { randomUUID } from "node:crypto";
import { createSession } from "../../src/platform/identity";
import { database } from "../../src/platform/database";
import {
  confirmAppointment,
  readAppointment,
} from "../../src/scheduling/planner";
import {
  createPack,
  checkPack,
  requestIssue,
  readPack,
} from "../../src/documents/packs";
import { processRenderJob } from "../../src/documents/worker";
import { sectionKeys } from "../../src/documents/validation";
export const id = (t: string, n = 1) =>
  `${t}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN P06 component challenge",
});
export const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
export const rows = async (sql: string, values: unknown[] = []) =>
  (await database().query(sql, values)).rows;
export const content = () => ({
  sections: Object.fromEntries(
    sectionKeys.map((k) => [
      k,
      `SYN reviewed ${k.replaceAll("_", " ")}: visual inspection only; no intervention. Any change requires the service owner’s review.`,
    ]),
  ),
  source_ids: [id("c2")],
  history_ids: [],
});
export async function confirmed(n = 9, crewIds = [id("a4", 9), id("a4", 2)]) {
  const p = await principal(),
    a = (await readAppointment(p, id("a8", n))).items[0];
  await confirmAppointment(p, a.id, {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
    scope_revision_id: a.scope_revision_id,
    scope_version: a.scope_version,
    policy_version_id: a.policy_version_id,
    scheduling_policy_id: id("a0"),
    scheduling_policy_version: 1,
    crew: crewIds.map((resource_id, i) => ({
      resource_id,
      resource_version: 1,
      calendar_version: 1,
      crew_role: i ? "Technician" : "Lead",
      travel_before_minutes: 0,
      travel_after_minutes: 0,
      travel_reason: "SYN explicit zero allowance at the fictional site.",
    })),
  });
  return (await readAppointment(p, a.id)).items[0];
}
export async function prepared(n = 9, notes = content(), crewIds?: string[]) {
  const p = await principal(),
    a = await confirmed(n, crewIds),
    pid = randomUUID();
  await createPack(p, {
    ...base(),
    id: pid,
    appointment_id: a.id,
    expected_appointment_version: a.version,
    content: notes,
  });
  return (await readPack(p, pid)).items[0];
}
export async function queued(n = 9, notes = content(), crewIds?: string[]) {
  const p = await principal(),
    pack = await prepared(n, notes, crewIds);
  await checkPack(p, pack.id, {
    ...base(),
    expected_version: pack.version,
    decision: "Checked",
  });
  const checked = (await readPack(p, pack.id)).items[0],
    cmd = { ...base(), expected_version: checked.version };
  const receipt = await requestIssue(p, pack.id, cmd);
  return { p, pack: (await readPack(p, pack.id)).items[0], cmd, receipt };
}
export async function issued(crewIds?: string[]) {
  const q = await queued(9, content(), crewIds),
    job = q.pack.jobs[0];
  const result = await processRenderJob(job.id);
  if (!("issue_id" in result)) throw Error(JSON.stringify(result));
  return {
    ...q,
    job,
    pack: (await readPack(q.p, q.pack.id)).items[0],
    issue_id: result.issue_id!,
  };
}
