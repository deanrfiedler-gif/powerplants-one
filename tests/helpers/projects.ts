import { randomUUID } from "node:crypto";
import { CRM, crmBase } from "./crm";
export const projectInput = () => ({
  ...crmBase(),
  id: randomUUID(),
  company_id: CRM.company,
  organisation_id: CRM.org,
  site_id: CRM.site,
  coordinator_id: CRM.owner,
  title: "SYN Irrigation and climate delivery",
  target_date: "2028-03-31",
});
export const taskInput = (expected_version = 1) => ({
  ...crmBase(),
  id: randomUUID(),
  expected_version,
  title: "SYN Procurement package",
  phase: "Procurement",
  status: "InProgress",
  milestone: false,
  start_date: "2026-09-14" as string | null,
  finish_date: "2027-11-30" as string | null,
  progress: 40,
  note: "SYN Manual coordination",
  owner_id: CRM.owner as string | null,
  external_owner_id: null as string | null,
  dependencies: [] as { task_id: string; kind: "FS" | "SS" }[],
});
