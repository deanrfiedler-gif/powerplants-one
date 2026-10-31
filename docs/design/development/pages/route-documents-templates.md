# Templates definitions and proposals — working page contract

Stable entry: `route:/documents/templates`. Scope DK-06; parents DOC-02, DOC-03 and DOC-06. Owner Dean Fiedler. Implementation in progress under PR #704; functional proof is recorded separately; visual review, owner acceptance and deployment remain pending.

## Desktop

[Accepted Template management design](../../../decisions/template-management-figma-design.md), PPO - Design, page 793:6155, named version “Template management — accepted”. [Icon-free captures 01–20](../../../reference/ui/template-management/template-management-figma-r01/README.md) remain the visual source. Required family choice (OUT-09, OUT-10 or OUT-14), separate Definitions and Proposals views, permitted identity-order paging and a read-only definition snapshot. No combined-family totals, global search or column sorting.

Use SecondaryMenuFrame, RegisterTable, RecordTabs/RecordPanel, Button, Field, WorklistChoice and WorklistPanel. Definitions, proposals, publication and site use retain separate authority and identities. Incoming reads and outgoing commands use the existing catalogue, proposal, publication and use contracts. MYOB remains ERP authority and SharePoint owns business documents.

## Mobile

Apply the [accepted compact phone-header amendment](../../../decisions/phone-header-amendment.md) through one SecondaryMenuFrame configuration, including record actions. Preserve view choice at 320 px, full-width list rows, reachable forms and visible focus. Tables may scroll within their region; the page must not overflow horizontally. Preserve context and controls across reads, clear unconfirmed evidence after failure, and offer Start again for an expired continuation. Dialogs retain the original uncertain operation and prevent accidental replacement. Desktop/tablet/phone captures and keyboard/actual Chrome 200% zoom proof are recorded in the execution ledger; independent visual and manual screen-reader review remain pending.

## Workflow and remaining proof

Choose a family, inspect a definition or open its record. Proposals are review evidence and never imply a supported runtime version. Loading, empty, denied, unavailable, stale and uncertain-command recovery are distinct. Reads never grant command authority. No preview/render, import/export, definition editing or assignment cancellation is offered.

Functional proof: native database, HTTP and browser workflows, exact handovers, current-authority recovery, snapshot focus and the approved proposal-list compatibility restoration are recorded in the execution ledger. Remaining: independent composition review, exhaustive refusal-state screenshot coverage and manual screen-reader review. This contract grants no owner acceptance.

## Current consumer behavior

The existing secondary menu starts collapsed for exact records. Phone family and company/site filters open from the single compact header, replacing toolbar rows; no global totals or combined-family catalogue is implied. One SecondaryMenuFrame owns the phone header. Lists provide Filter and, when permitted, New proposal; pull-down re-reads current evidence. Phone records hide the shell tab bar and keep their main action at the bottom.

Definitions/proposals use identity-order native pages. Load more re-reads the visible window, preserves rows while pending, focuses newly added evidence, and clears all rows after an unconfirmed read. Snapshot focus returns to its checkbox on Escape. Record tab selection survives refresh. Publication readiness is publisher-only; retained publication evidence is available when its native read permits it. A seeded definition has no Publication tab.

Publication evidence names its authorized publisher and links to the exact retained proposal revision. Latest-review evidence supplies its authorized reviewer name. Native authority is checked before returning either label. See the [consumer bindings](../component-bindings/2026-10-31-template-management.md) and [execution evidence](../../../testing/evidence/template-management/workspace/README.md). Visual review and owner acceptance remain pending.
