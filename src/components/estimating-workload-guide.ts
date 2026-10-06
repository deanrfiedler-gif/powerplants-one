import type { PageGuide } from "./leads-guide";

export const estimatingWorkloadGuide: PageGuide = {
  title: "Estimating intake & workload",
  intro: "Find the current opportunity brief, scope readiness and estimating owner, then continue with the exact discovery or saved estimate.",
  overviewTitle: "Workload, source context and authority",
  purpose: "This online view joins records you can currently read. Appearing here does not mean an intake has been accepted. Discovery completeness, saved prices, estimate approval and quotation issue are separate facts.",
  features: [
    ["Canonical brief", "The linked Sales reference and source version identify the customer, site and need summary. Sales ownership stays separate from the estimating workspace owner."],
    ["Readiness", "Discovery not started has no workspace or estimating allocation. Scope clarification (amber) means the selected discovery is incomplete. Discovery complete (green) means the scope can be reviewed for manual costing; it does not approve a price or issue a quotation. Legacy manual basis has no recorded E2 questionnaire. Each state is named in words as well as colour."],
    ["Exact saved basis", "Saved-estimate links show the cost version and the discovery revision it costed. A later discovery save never silently reprices that estimate. Competing alternatives remain separate."],
    ["Dates and policy", "Required response is Unknown. A displayed Sales action date is not a quotation deadline. Intake acceptance, allocation, returns and priority policy are Not configured. A Sales handover-due obligation is not receiving acceptance."],
  ],
  steps: [
    ["Find permitted work", "Search by customer, reference, title or brief, choose an estimating owner and sort, then Apply filters. Choose a readiness state from Scope readiness; each shows how many permitted opportunities it holds. My estimating work selects workspaces you own, not every Sales opportunity you own. On a phone, readiness, owner and sort sit under one button that names the current selections."],
    ["Read the result boundary", "The view examines up to 100 permitted opportunities matching the search and owner, in the chosen sort order. Readiness filters and counts apply within that window. Narrow search for older work. Counts describe permitted rows only. Closed opportunities appear only with existing estimating workspaces."],
    ["Review the brief", "Select an opportunity's title to show its detail: in the panel beside the register on a wide screen, or in a drawer on a narrower one. Escape or Done closes the drawer and returns you to the row. On a phone each card shows the detail. Open the Sales reference to review source details and its independently owned next action. No Sales stage or handover state changes here."],
    ["Continue discovery", "Start discovery requires estimating edit permission. The existing wizard checks current authority and establishes its own owner. Open discovery retains the workspace and selected alternative; resolve owned questions there."],
    ["Open saved work", "Saved estimates lists the manual workbooks with their saved sell total in AUD, excluding tax. An estimate without cost lines reads Not estimated, never zero. Saved estimate links open exact history and Draft quotation preparation. The Estimation wizard and Specialist configurations are in the module navigation and use their existing guarded workflows."],
  ],
  journeyIntro: "Each destination owns its saved records and recovery. Navigation and filtering make no business changes.",
  journey: [
    ["Opportunity brief", "Review the customer need and known source context."],
    ["Discovery and alternatives", "Capture areas, systems, evidence, responsibilities and exact immutable revisions in the five-step wizard."],
    ["Deliberate costing", "Review the saved discovery before creating a manual estimate or successor. Review specialist runs before adopting their contributions."],
    ["Exact Draft quotation", "Prepare a customer-safe Draft from an exact saved estimate version. Draft generation is not approval, issue, sending, delivery or acceptance."],
  ],
  mobile: "Search stays visible; open Readiness, owner and sort when needed. Its label names the current selections while it is closed. Each card shows the full owner, readiness, unknown-date and next-step detail. This page is online only; no business draft is stored on the device.",
  shortcuts: [["Tab / Shift+Tab", "Move through filters, readiness choices, rows and record links."], ["Enter / Space", "Apply the filter form, choose a readiness state or select a row."], ["Esc", "Close the detail drawer or this guide and return to its opener."], ["Back / Forward", "Restore the workload filters recorded in the URL."]],
  recovery: "Loading and failed reads are not an empty queue. Failed refresh clears the rows and offers Try loading again. Current estimating, CRM and underlying source permissions are rechecked; revoked records and actions disappear. If a downstream save is uncertain, reconcile its original operation in that workspace before making another attempt. Stale versions require comparison there.",
  boundary: "No allocation, commercial approval, customer message, work authority or ERP effect is granted here. Excel estimate import and supplier refresh remain separate programme work. This guide describes the synthetic implementation; business and device acceptance remain separate.",
};
