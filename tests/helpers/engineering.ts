import { randomUUID } from "node:crypto";
import { CRM, crmBase } from "./crm";
export const engineeringInput = (contextId: string, kind = "Project") => ({
  ...crmBase(),
  id: randomUUID(),
  context_kind: kind,
  context_id: contextId,
  title: "SYN Pump station engineering",
  brief: "SYN Coordinate the arrangement and service access.",
  owner_id: CRM.owner,
  discipline: "Mechanical",
  required_date: "2028-03-31",
  next_action: "Review design scope",
  action_due: "2028-03-20",
});
export const engineeringUpdate = (version = 1) => ({
  ...crmBase(),
  expected_version: version,
  owner_id: CRM.owner,
  state: "In design",
  required_date: "2028-03-31",
  next_action: "Confirm equipment envelope",
  action_due: "2028-03-21",
  blocker: null,
});
