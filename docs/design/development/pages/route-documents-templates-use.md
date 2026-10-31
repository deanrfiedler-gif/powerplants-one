# Job pack site use — working page contract

Stable entry: `route:/documents/templates/use`. Scope DK-06; parents DOC-02, DOC-03 and DOC-06. Owner Dean Fiedler. Implementation in progress under PR #704; visual review, functional proof, owner acceptance and deployment remain separate and pending.

## Desktop

[Accepted Template management design](../../../decisions/template-management-figma-design.md), PPO - Design, page 793:6155, named version “Template management — accepted”. [Icon-free captures 01–20](../../../reference/ui/template-management/template-management-figma-r01/README.md) remain the visual source. Required company/site context, database-clock selection, separately pinned baseline and immutable start-inclusive/end-exclusive assignment intervals. Job packs only; successors preserve earlier intervals.

Use SecondaryMenuFrame, RegisterTable, RecordTabs/RecordPanel, Button, Field, WorklistChoice and WorklistPanel. Definitions, proposals, publication and site use retain separate authority and identities. Incoming reads and outgoing commands use the existing catalogue, proposal, publication and use contracts. MYOB remains ERP authority and SharePoint owns business documents.

## Mobile

Apply the [accepted compact phone-header amendment](../../../decisions/phone-header-amendment.md) through one SecondaryMenuFrame configuration, including record actions. Preserve view choice at 320 px, full-width list rows, reachable forms and visible focus. Tables may scroll within their region; the page must not overflow horizontally. Preserve context and controls across reads, clear unconfirmed evidence after failure, and offer Start again for an expired continuation. Dialogs retain the original uncertain operation and prevent accidental replacement. Desktop/tablet/phone screenshots and keyboard/zoom audits are still required.

## Workflow and remaining proof

Choose the company and site. Inspect Selected now and retained assignments. Assign use names an exact supported publication; gaps after adoption hold preparation. Loading, empty, denied, unavailable, stale and uncertain-command recovery are distinct. Reads never grant command authority. No preview/render, import/export, definition editing or assignment cancellation is offered.

Remaining: complete browser/native database/HTTP proof, visual comparison for every drawn state, selected-label and snapshot focus audit, and regression proof for the approved proposal-list compatibility restoration. This contract is not a delivery or acceptance claim.
