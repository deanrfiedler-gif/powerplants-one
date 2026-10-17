import { randomUUID } from "node:crypto";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { createProject } from "../../src/projects/service";
import { startThread, postMessage } from "../../src/conversations/commands";
import { database } from "../../src/platform/database";
import { crmBase, crmDiscovery } from "./crm";
import { projectInput } from "./projects";

// Synthetic profiles seeded by db/seed*.sql. After seed 108 each holds conversation.read and conversation.post wherever it
// already holds crm.opportunity.read or project.read.
export const profiles = {
  coordinator: "coordinator", // Company A: deals, projects and both conversation capabilities
  dealReader: "crm-receiver", // Company A: deals only
  projectReader: "materials-viewer", // Company A: projects only
  otherCompany: "second-company", // Company B: cannot open Company A records
  observer: "observer", // shared.read only: no deal, project or conversation capability
} as const;
export const principal = async (profile: string) => (await createSession(profile)).principal;
export type Who = Awaited<ReturnType<typeof principal>>;

export async function newDeal(p: Who) {
  const input = crmDiscovery();
  await createOpportunity(p, input);
  return input.id;
}
export async function newProject(p: Who) {
  const input = projectInput();
  await createProject(p, input);
  return input.id;
}
export const person = (user: string, ordinal = 1) => ({ ordinal, kind: "Person" as const, person_id: user });
export const record = (type: "Opportunity" | "Project", id: string, ordinal = 1) => ({
  ordinal,
  kind: "Record" as const,
  record_type: type,
  record_id: id,
});
export const threadInput = (anchor_id: string, extra: Record<string, unknown> = {}) => ({
  ...crmBase(),
  anchor_type: "Opportunity",
  anchor_id,
  title: "SYN Delivery timing",
  body: "SYN Kick-off for the controls upgrade.",
  ...extra,
});
export const messageInput = (extra: Record<string, unknown> = {}) => ({
  ...crmBase(),
  body: "SYN Update on the controls upgrade.",
  ...extra,
});
export async function begin(p: Who, anchor_id: string, extra: Record<string, unknown> = {}) {
  const result = await startThread(p, threadInput(anchor_id, extra));
  return result.receipt.record_id;
}
export async function post(p: Who, thread: string, extra: Record<string, unknown> = {}) {
  const result = await postMessage(p, thread, messageInput(extra));
  return result.receipt.record_id;
}
export const rows = async (sql: string, args: unknown[] = []) => (await database().query(sql, args)).rows;
export const brisbaneToday = async () =>
  (await rows("SELECT (clock_timestamp() AT TIME ZONE 'Australia/Brisbane')::date::text AS d"))[0].d as string;
export const shiftDate = async (days: number) =>
  (await rows("SELECT ((clock_timestamp() AT TIME ZONE 'Australia/Brisbane')::date + $1::int)::text AS d", [days]))[0].d as string;
export const code = (value: string) => (error: unknown) => (error as { code?: string }).code === value;
export const newId = randomUUID;
