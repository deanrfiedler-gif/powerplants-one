import type { PageGuide } from "../../components/leads-guide";
import { controlModules, controlPath } from "./navigation";
const tasks = {
  basis: [
    [
      "Prepare the draft",
      "Choose the package, add a basis and retain its purpose, scope, exclusions, facility applicability and exact sources. Unknown inputs stay unknown.",
    ],
    [
      "Own requirements and interfaces",
      "Requirements need owners and evidence. Record assumptions, constraints and questions with affected deliverables. Each interface needs two distinct named parties, their inputs and outputs, and confirmation against the saved content.",
    ],
    [
      "Submit and correct",
      "Review & handover submits a frozen snapshot to an independent reviewer. Missing evidence blocks a positive decision. Returned content needs a successor; earlier findings still need accepted closure.",
    ],
  ],
  drawings: [
    [
      "Register a document",
      "Add the stable document reference, title, discipline and owner. Keep the original UUID and reference across engineering revisions.",
    ],
    [
      "Retain an exact revision",
      "Select the document and retain the native authoring system, path/reference, native file version, engineering revision, configuration and published output reference/version/SHA-256. PPO does not move or edit CAD files.",
    ],
    [
      "Plan accountable work",
      "Use Accountable deliverables for ownership, due dates, prerequisites and next action. Planned and authorised effort each need a source. Missing evidence is blocked work; there is no invented staff utilisation.",
    ],
  ],
  queries: [
    [
      "Ask an owned technical question",
      "Add the exact sources, responsible owner, requested response date and affected deliverables. A coordination note is not a formal answer.",
    ],
    [
      "Respond and dispose",
      "The named owner records the formal response and resulting actions. Where review is required, a separate technical reviewer records the disposition. An answer does not amend the original basis or drawing.",
    ],
    [
      "Control supplier submittals",
      "Retain supplier and product context, PO reference if available, submitted revision, evidence, assigned reviewer and downstream actions. Returned or rejected work needs a successor. Acceptance is technical, never a goods receipt.",
    ],
  ],
  reviews: [
    [
      "Submit exact content",
      "Choose one exact revision per controlled document, the reviewed basis and applicable submittals, then set purpose, reviewer and due date. The server freezes the submission and its hash.",
    ],
    [
      "Resolve findings",
      "The reviewer records findings, the named owner responds, and the reviewer accepts closure. Returned work retains the original snapshot and findings through resubmission.",
    ],
    [
      "Issue and retain recipient evidence",
      "A separate configured issuer releases the exact completed review. Sent, delivered and acknowledged are separate retained observations; only the named recipient acknowledges. No messages are sent. Changed sources require reassessment; old acknowledgements remain historical.",
    ],
  ],
} as const;
export function engineeringControlGuide(path: string): PageGuide | undefined {
  if (path === "/engineering" || /^\/engineering\/[0-9a-f-]{36}$/.test(path)) return workloadGuide;
  const current = controlPath(path);
  if (!current) return undefined;
  const definition = controlModules[current.module];
  return {
    title: definition.title,
    intro:
      "Native Engineering records for one permitted package. Confirm the customer, site and package before acting.",
    purpose:
      "Keep accountable technical work, exact evidence and independent decisions connected without confusing coordination progress with a technical issue.",
    overviewTitle: "What this workspace controls",
    journeyIntro:
      "Each decision retains its source content and accountable person.",
    features: [
      [
        "Package context",
        "The package, customer and Project/Opportunity remain visible. Choose package returns to a permission-scoped list.",
      ],
      [
        "Work queue",
        "Search by reference or title, then use Assigned to me, Work waiting or Overdue. Select a row to open its inspector.",
      ],
      [
        "Exact evidence",
        "The inspector shows revision, state, owner, due date, exact sources and retained history. Source reassessment warnings do not erase past decisions.",
      ],
    ],
    steps: tasks[current.module],
    journey: [
      ["Prepare", "Retain an owned draft and exact source references."],
      [
        "Review",
        "Submit frozen content for the stated purpose and resolve findings.",
      ],
      [
        "Issue and hand over",
        "Configured duties govern formal issue and recipient evidence. Materials, change-impact and commissioning workflows retain their own decisions.",
      ],
    ],
    mobile:
      "Use the header module menu to switch views. Below desktop width the inspector replaces the list; Close inspector returns to the register. Long references wrap. Forms stay labelled and scroll within the dialog.",
    recovery:
      "Saving disables repeated actions. Validation preserves entries. A stale version requires inspecting the refreshed source. If the outcome is unknown, keep the page open and use Recover original result or Retry unchanged operation. A missing receipt is not proof of failure; do not invent a new operation. Access is checked again during recovery.",
    shortcuts: [
      ["Tab / Shift+Tab", "Move through links, fields and actions"],
      ["Enter / Space", "Activate the focused action"],
      ["Escape", "Close a dismissible dialog and return focus"],
    ],
    boundary:
      "Synthetic prototype only. No live CAD, SharePoint or ERP transactions, statutory certification, procurement receipt, installation permission or project completion is implied. No offline mutation queue is provided; authority may be not configured.",
  };
}

const workloadGuide: PageGuide = {
  title: "Engineering workload & deliverables",
  intro: "Coordinate owned packages and follow their exact technical work in the same Project/Opportunity and customer/site context.",
  purpose: "Identify accountable work, missing prerequisites and next actions. Technical decisions remain separate from coordination notes.",
  overviewTitle: "From request to accountable technical work",
  features: [
    ["Workload queues", "All packages and My work retain package ownership. Author actions shows your draft/returned bases, open/returned queries, returned submittals and open findings. Reviews shows submitted reviews assigned to you. Released requires a current formal issue."],
    ["Accountable deliverables", "Open Deliverables for owner, discipline, due date, prerequisites, next action and controlled documents. Add or amend them in Drawings. Missing prerequisite evidence is blocked work."],
    ["Technical context", "Overview links bases and issues. Technical queries opens formal questions/submittals. Review & history keeps technical decisions separate from existing coordination notes."],
  ],
  steps: [
    ["Capture or find the request", "Use the existing intake form for an authorised Project/Opportunity brief, owner, date and next action. Existing package references and bookmarks are retained."],
    ["Choose the work queue", "Search or filter by discipline, package owner and attention, then select a package. Counts include only records and sources you may read."],
    ["Prepare the technical work", "Follow Design basis, Drawings, Technical queries or Technical reviews. Retain exact source revisions and independent review; a coordination note is not a formal technical answer."],
  ],
  journeyIntro: "Each module retains its own accountable evidence and authority.",
  journey: [["Intake", "Confirm scope and prerequisites."], ["Author", "Retain exact basis, documents and formal responses."], ["Review and issue", "Use configured independent duties and retain exact recipient evidence."]],
  mobile: "Use labelled package cards and the same context tabs on a phone. Long references wrap. These Engineering commands require a connection; they do not create an offline queue.",
  shortcuts: [["Tab / Shift+Tab", "Move between labelled controls."], ["Escape", "Close a supported dialog and return to its opener."]],
  recovery: "Keep the draft if a save is refused. Compare a newer version before deciding again. If the outcome is unknown, recover or retry the unchanged original operation; do not create a duplicate. Access is checked again on recovery.",
  boundary: "Planned hours require a planning source; authorised hours require authority evidence. Actual effort and availability are ungoverned, so utilisation is not calculated. Coordination progress never grants technical issue, purchase or Project completion.",
};
