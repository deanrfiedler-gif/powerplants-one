import type { PageGuide } from "../components/leads-guide";
import { supplyPages } from "./navigation";
export const supplyTasks: Record<
  string,
  readonly (readonly [string, string])[]
> = {
  "SC-01": [
    [
      "Establish demand",
      "Create a demand against the exact Project, Work Order or separately named approved origin. Forecast and Approved are distinct; Approved needs authority evidence. Enter quantity, explicit unit, local required date and timezone, or explain the missing date.",
    ],
    [
      "Review readiness",
      "Allocate incoming and usable supply separately. Only complete evidenced usable allocations can support readiness. A saved assessment retains the exact demand, source and fact versions; Ready applies only to the stated material scope and evidence point.",
    ],
    [
      "Own the blocker",
      "Keep the owner and next action current. Promise, receipt, reservation, substitution and allocation changes create an impact review and shared Material Action; follow it through My Work.",
    ],
  ],
  "SC-02": [
    [
      "Prepare a request",
      "Select approved demand. Record requisition, RFQ/quotation comparison evidence, supplier, manufacturing milestones, technical submittals and exceptions. An approved request needs its separate authority evidence.",
    ],
    [
      "Record a promise",
      "Enter quantity, date, Estimated or SupplierConfirmed basis and confirmation source. Revise the previous promise to retain its predecessor and create a change review.",
    ],
    [
      "Observe the purchase outcome",
      "Record the purchase reference and observed outcome. This page does not place an order, spend money or confirm an ERP transaction.",
    ],
  ],
  "SC-03": [
    [
      "Register each shipment line",
      "Create a Supply line with Shipment basis, shared shipment identity, unique line reference, supplier, warehouse, item and unit. Several lines can use one shipment identity; several shipments can serve one demand.",
    ],
    [
      "Allocate to demands",
      "Use Allocate to a line for like-unit, same-company and same-item demand. The server conserves both line capacities even when two users save together.",
    ],
    [
      "Review ETA changes",
      "Revise the source record with a reason. Retain estimated versus confirmed ETA, a confidence basis only if the source provides one, dispatch evidence, manufacturing, customs, broker and freight references.",
    ],
  ],
  "SC-04": [
    [
      "Record physical receipt",
      "Select the incoming line and open Receipt and inspection. Carrier arrival and ERP receipt reference are separate observations. Record actual quantities and explicit identity evidence.",
    ],
    [
      "Inspect and quarantine",
      "Inspected cannot exceed received. Usable plus quarantined cannot exceed inspected. Damage is included within quarantined quantity. Short quantity records the shortage for this receipt; neither arrival nor quarantine makes goods usable.",
    ],
    [
      "Capture and correct",
      "On a phone, complete the stacked capture form and optionally upload a supported PNG. A verified stored photo is linked to the exact capture. Review / correct capture adds a successor; originals remain available.",
    ],
  ],
  "SC-05": [
    [
      "Read the observation basis",
      "Review company, warehouse, bin, item, unit, source time and completeness. On hand, source available, source reserved, held and evidenced usable are distinct. Unknown values remain unknown, never zero.",
    ],
    [
      "Review competing demand",
      "Open line allocations and their native demand handovers. Incoming coordination allocation is not a source reservation; usable allocation needs complete evidence.",
    ],
    [
      "Respect the source boundary",
      "Live reservation policy is Not configured. Reservation observations can be recorded from fulfilment, but no external command is sent and no unit conversion is inferred.",
    ],
  ],
  "SC-06": [
    [
      "Pick then stage",
      "Open approved demand with evidenced usable allocation. Record picked quantity and location/serial/batch evidence. Record staged quantity and packing separately. Neither may exceed its preceding physical quantity.",
    ],
    [
      "Resolve findings and substitutions",
      "Retain shortages and findings. A proposed substitution blocks further fulfilment until a decision references Engineering and the commercial/delivery scope review. No technical release or spend authority is granted here.",
    ],
    [
      "Prepare then move",
      "Record Prepared dispatch with packing, receiving details and documents. Review that exact capture to record Moved and movement time. Source shipment outcome is a separate observation. On mobile, each step has a labelled form.",
    ],
  ],
  "SC-07": [
    [
      "Prepare the delivery context",
      "Open the demand and review the moved and outstanding quantities. State delivery address, receiving point, instructions and intended installation/use area separately.",
    ],
    [
      "Capture POD",
      "Record delivered quantity, physical time, recipient evidence, damage within delivery, reported missing and excess held for review. Carrier arrival does not prove delivery. Upload a supported photo where useful.",
    ],
    [
      "Record customer response",
      "Customer acknowledgement references an exact current delivery capture, actor, medium and response time. Correct mistakes through retained predecessors. Delivery does not establish installation, Service completion, invoicing or payment.",
    ],
  ],
  "SC-08": [
    [
      "Authorise a return",
      "Use the six workspaces to keep return authorisation, inspection, customer outcome, supplier claim and credits distinct. Link the original demand and delivery/receipt reference. Unknown returned identity remains unresolved evidence; approval needs verified identity and remaining entitlement.",
    ],
    [
      "Inspect and decide",
      "Keep reported symptom, observed damage, suspected cause and verified finding separate. Propose a disposition, approve that exact quantity/outcome, then separately record execution. Reference MA-06/MA-07 decisions; do not repeat warranty decisions here.",
    ],
    [
      "Track independent outcomes",
      "Customer remedy can complete while supplier recovery remains open. Physical supplier movement and source/credit observations are separate. Finance permission is needed before any credit content is read; no customer credit is netted against supplier recovery.",
    ],
  ],
  "SC-09": [
    [
      "Compare the evidence",
      "Open a demand and its impact reviews. Review before/after versions, reason, exact source references and affected Project/Service/customer context. Original facts and record revisions remain available.",
    ],
    [
      "Request the owning review",
      "Open the linked Material Action and canonical Project or appointment workspace. Scheduling owns any proposed new date and crew; Supply Chain does not guess them or alter a confirmed booking. Job-pack owners own reissue decisions.",
    ],
    [
      "Record follow-through",
      "Review the requested capture, record Reviewed and the owning module's exact outcome reference. This records coordination evidence; it never applies the downstream decision automatically.",
    ],
  ],
  "SC-10": [
    [
      "Establish custody",
      "Create a custody record against Service demand, its actual Work Order appointment/visit, custodian, van, warehouse and authoritative issue/transfer observation. Preserve item, unit and serial/batch identity.",
    ],
    [
      "Explain every issued quantity",
      "Record a full reconciliation snapshot: held in custody, at job, used, unused returned, damaged, quarantined and missing. These are mutually exclusive current outcomes and must total issued exactly. Used quantity references matching current Field parts capture.",
    ],
    [
      "Reconcile before closure",
      "Close only after no quantity remains unexplained, in custody, at the job or in quarantine, and an inventory reference and evidence time support reconciliation. Custody is not consumption; consumption is not automatically billable. Investigate an unknown original transfer before repeating any equivalent effect.",
    ],
  ],
};
export function supplyGuide(path: string): PageGuide | undefined {
  const page = supplyPages.find((p) => path === `/supply/${p.slug}`);
  if (!page) return undefined;
  return {
    title: page.title,
    intro: page.intro,
    overviewTitle: `${page.scope} — purpose and prerequisites`,
    purpose:
      "Use your permitted synthetic profile and the exact company, Site and existing source identities. Keep the source time, completeness, units, owner and next action explicit. These pages coordinate evidence; MYOB remains the intended inventory and Finance authority.",
    features: supplyTasks[page.scope],
    steps: [
      [
        "Find the record",
        "Search and completeness filters remain in the URL. Select a record; Back and reload restore the selected line under your current permissions.",
      ],
      [
        "Read the evidence",
        "Review source time, completeness, current quantities and retained revisions. Missing evidence remains unknown; there is no assumed observation-age threshold.",
      ],
      [
        "Save deliberately",
        "Use the relevant workflow action and enter evidence, observation time, completeness and a reason. Saved is shown only after a server receipt. Review / correct capture retains its original.",
      ],
      [
        "Complete the handover",
        "Follow canonical context links and the one owned Activity. Keep technical, commercial, scheduling, document and Finance decisions with their owners.",
      ],
    ],
    journeyIntro:
      "Evidence enters once and is followed through the appropriate native workspace.",
    journey: supplyTasks[page.scope],
    mobile:
      "At 390 and 320 CSS pixels the worklist and detail stack, capture fields use 16px text and controls retain 44px targets. Receipt, picking/dispatch and delivery have focused mobile forms. This workflow is online; no offline queue is implied.",
    shortcuts: [
      ["Tab / Shift Tab", "Move between labelled controls."],
      ["Enter / Space", "Open the focused record or action."],
      [
        "Escape",
        "Close the form or page guide; a form asks before discarding entered values.",
      ],
    ],
    recovery:
      "For validation errors, correct the named fields. For a stale revision, refresh and compare the retained proposal against current evidence. An uncertain save retains its original operation and content in this browser session: check the original receipt or retry that exact PPO save. Restored access is checked before any receipt is disclosed. Unknown external outcomes require evidence against the original reference; absence is not proof of failure.",
    boundary:
      "Synthetic/manual coordination only. No live purchase, reservation, ERP receipt/shipment/return/credit, customer message, automatic reschedule or stock/Finance ledger is provided. Visual review, owner acceptance and deployment are separate.",
  };
}
