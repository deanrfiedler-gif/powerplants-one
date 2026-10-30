// B1 (project delivery billing decision R1): the pure rules for linking a work order to a project.
// The database guard in migration 0122 enforces the same rules; these give the person a precise reason.
export type FieldWorkItem = {
  id: string;
  display_number: string;
  status: "Draft" | "Authorised";
  version: number;
  site_name: string;
  summary: string | null;
  visit_started: boolean;
  can_unlink: boolean;
};
export type FieldWork = {
  // Only work orders the reader may read. Hidden ones are omitted and never counted.
  items: FieldWorkItem[];
  can_link: boolean;
};
export type FieldWorkCandidate = {
  id: string;
  display_number: string;
  status: "Draft" | "Authorised";
  version: number;
  site_name: string;
  summary: string | null;
};
export type LinkedProject = {
  id: string;
  display_number: string;
  title: string;
  lifecycle: "Active" | "Closed";
};
export type LinkFacts = {
  work_order: { company_id: string; customer_id: string; project_id: string | null };
  project: { id: string; company_id: string; organisation_id: string; lifecycle: string };
  visit_started: boolean;
};
export type LinkRefusal = {
  status: 409 | 422;
  code: string;
  message: string;
  field?: string;
};
export function linkRefusal(
  action: "link" | "unlink",
  facts: LinkFacts,
): LinkRefusal | null {
  const { work_order: w, project } = facts;
  if (action === "link") {
    if (w.project_id === project.id)
      return { status: 409, code: "AlreadyLinked", message: "This work order already belongs to this project." };
    if (w.project_id)
      return { status: 409, code: "ProjectLinkExists", message: "This work order already belongs to another project. Unlink it there first, with a reason." };
    if (project.company_id !== w.company_id || project.organisation_id !== w.customer_id)
      return { status: 422, code: "InvalidData", field: "project_id", message: "Choose a project for the same company and customer as this work order." };
  } else if (w.project_id !== project.id)
    return { status: 409, code: "VersionConflict", message: "This work order is no longer linked to this project. Refresh to see its current link." };
  if (project.lifecycle !== "Active")
    return { status: 409, code: "ClosedProject", message: "This project is closed. Reopen it through Acceptance & closeout before changing its field work." };
  if (facts.visit_started)
    return { status: 409, code: "FieldWorkStarted", message: "A visit on this work order has started, so its project link is fixed." };
  return null;
}
