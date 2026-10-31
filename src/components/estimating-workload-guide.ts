import type { PageGuide } from "./leads-guide";

export const estimatingWorkloadGuide: PageGuide = {
  title: "Estimating intake & workload",
  intro:
    "Find the current opportunity brief, scope readiness and estimating owner, then continue with exact discovery or saved work.",
  overviewTitle: "Workload, source context and authority",
  purpose:
    "This online view joins records you can currently read. Appearing here does not mean intake was accepted. Scope readiness, saved prices, commercial approval and quotation issue are separate facts.",
  features: [
    [
      "Canonical brief",
      "The Sales reference and source version identify customer, site and need. Sales ownership stays separate from the estimating workspace owner.",
    ],
    [
      "Readiness",
      "Discovery not started has no workspace or estimating allocation. Scope clarification means the selected Discovery is incomplete. Discovery complete describes scope ready to review for manual costing. Legacy manual basis has no recorded E2 questionnaire. Read the reasons in the snapshot.",
    ],
    [
      "Exact saved basis",
      "Alternatives retain their option IDs. Saved-estimate links retain exact versions and the Discovery revision costed. A later Discovery save never silently reprices an estimate.",
    ],
    [
      "Dates and policy",
      "Required response stays Unknown. Sales action dates and handover-due obligations are separate. Intake acceptance, allocation, returns and priority policy remain Not configured.",
    ],
  ],
  steps: [
    [
      "Find permitted work",
      "Search a customer, opportunity reference, title or brief. Use All workload, My estimating work or a readiness view in the secondary menu; on a phone use the header view picker and Filter. My means the estimating workspace owner, not the Sales owner.",
    ],
    [
      "Read the result boundary",
      "All and My each examine up to 100 search-matched opportunities in the chosen sort order. Readiness counts use the selected owner window before the readiness filter. These are permitted rows within the window, not global totals. Narrow search for older work. Closed opportunities appear only with existing estimating workspaces.",
    ],
    [
      "Review the snapshot",
      "Open a row title. The snapshot overlaps the register, or fills the phone screen. Review the brief, both owners, readiness reasons, next step and attributed Sales context. Escape closes it and returns to the row.",
    ],
    [
      "Work with a selection",
      "Select rows, or use Select opportunities in phone filters. Open in sequence visits most recently changed first. Export list rechecks records and permissions; changed or inaccessible records require a fresh selection. Neither action accepts or assigns work.",
    ],
    [
      "Continue Discovery",
      "Start discovery requires current edit and native receiving/linking authority. Starting never accepts a Sales brief or confirms its reported scope. Eligible accepted context is explicitly reviewed in native creation; existing workspaces use the separate link review. Resolve changed accepted sources in their owning workflow.",
    ],
    [
      "Open saved work",
      "Saved estimates is a separate view with exact version links and saved sell in AUD excluding tax. No cost lines reads Not estimated. Workload filters remain in the URL when switching views.",
    ],
  ],
  journeyIntro:
    "Each destination owns its saved records and recovery. Navigation and filtering make no business changes.",
  journey: [
    ["Opportunity brief", "Review customer need and exact source context."],
    [
      "Discovery and alternatives",
      "Capture and confirm scope independently in the native wizard.",
    ],
    [
      "Deliberate costing",
      "Review saved Discovery before creating or adopting manual costs.",
    ],
    [
      "Exact Draft quotation",
      "Prepare a Draft from an exact saved version. This is not approval, issue, sending or acceptance.",
    ],
  ],
  mobile:
    "The compact header holds the view picker and Filter. Rows show title, changed date, reference, readiness, customer and estimating owner. The full-screen snapshot wraps its title and keeps handovers at the bottom. At 320 px previous/next are in Snapshot actions. This page is online only.",
  shortcuts: [
    ["Tab / Shift+Tab", "Move through views, filters, rows and record links."],
    ["Enter / Space", "Activate a focused row or control."],
    ["Arrow keys / Home / End", "Choose a snapshot tab."],
    ["Esc", "Close the top dialog or menu and return focus."],
    [
      "Back / Forward",
      "Restore URL filters, Saved estimates and the open snapshot.",
    ],
  ],
  recovery:
    "Loading and failed reads are not an empty queue. During refresh, earlier rows are marked unconfirmed, counts withheld and actions disabled. Failure clears obsolete rows, counts, selection and snapshot; use Try loading again. Denied access and no matches are separate. Native saves retain their original-operation recovery in the destination.",
  boundary:
    "No allocation, commercial approval, customer message, work authority or ERP effect is granted here. The guide describes the synthetic implementation; owner, business and device acceptance remain separate.",
};
