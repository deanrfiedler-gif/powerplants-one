import type { PageGuide } from "./leads-guide";

export const estimatingWorkloadGuide: PageGuide = {
  title: "Estimating intake & workload",
  intro: "Find the current opportunity brief, scope readiness and estimating owner, then continue with the exact discovery or saved estimate.",
  overviewTitle: "Workload, source context and authority",
  purpose: "This online view joins records you can currently read. Appearing here does not mean an intake has been accepted. Discovery completeness, saved prices, estimate approval and quotation issue are separate facts.",
  features: [
    ["Canonical brief", "The linked Sales reference and source version identify the customer, site and need summary. Sales ownership stays separate from the estimating workspace owner."],
    ["Readiness", "Discovery not started has no workspace or estimating allocation. Scope clarification means the selected discovery is incomplete. Discovery complete means the scope can be reviewed for manual costing. Legacy manual basis has no recorded E2 questionnaire."],
    ["Exact saved basis", "Saved-estimate links show the cost version and the discovery revision it costed. A later discovery save never silently reprices that estimate. Competing alternatives remain separate."],
    ["Dates and policy", "Required response is Unknown. A displayed Sales action date is not a quotation deadline. Intake acceptance, allocation, returns and priority policy are Not configured. A Sales handover-due obligation is not receiving acceptance."],
  ],
  steps: [
    ["Find permitted work", "Search by customer, reference, title or brief, choose readiness and owner, then Apply filters. My estimating work selects workspaces you own, not every Sales opportunity you own."],
    ["Read the result boundary", "The view examines up to 100 search/owner-matching opportunities; readiness filters apply within that window. Narrow search for older work. Counts describe visible rows only. Closed opportunities appear only with existing estimating workspaces."],
    ["Review the brief", "Open the Sales reference to review source details and its independently owned next action. No Sales stage or handover state changes here."],
    ["Continue discovery", "Start discovery requires estimating edit permission. The existing wizard checks current authority and establishes its own owner. Open discovery retains the workspace and selected alternative; resolve owned questions there."],
    ["Open saved work", "Saved estimates retains the manual workbook register. Saved estimate links open exact history and Draft quotation preparation. The wizard and specialist configuration links use their existing guarded workflows."],
  ],
  journeyIntro: "Each destination owns its saved records and recovery. Navigation and filtering make no business changes.",
  journey: [
    ["Opportunity brief", "Review the customer need and known source context."],
    ["Discovery and alternatives", "Capture areas, systems, evidence, responsibilities and exact immutable revisions in the five-step wizard."],
    ["Deliberate costing", "Review the saved discovery before creating a manual estimate or successor. Review specialist runs before adopting their contributions."],
    ["Exact Draft quotation", "Prepare a customer-safe Draft from an exact saved estimate version. Draft generation is not approval, issue, sending, delivery or acceptance."],
  ],
  mobile: "Filters and record sections stack on a phone. All owner, readiness, unknown-date and next-step information remains available. This page is online only; no business draft is stored on the device.",
  shortcuts: [["Tab / Shift+Tab", "Move through filters and record links."], ["Enter", "Apply the filter form or open a focused link."], ["Esc", "Close this guide and return to its opener."], ["Back / Forward", "Restore the workload filters recorded in the URL."]],
  recovery: "Loading and failed reads are not an empty queue. Failed refresh clears the rows and offers Try loading again. Current estimating, CRM and underlying source permissions are rechecked; revoked records and actions disappear. If a downstream save is uncertain, reconcile its original operation in that workspace before making another attempt. Stale versions require comparison there.",
  boundary: "No allocation, commercial approval, customer message, work authority or ERP effect is granted here. Excel estimate import and supplier refresh remain separate programme work. This guide describes the synthetic implementation; business and device acceptance remain separate.",
};
