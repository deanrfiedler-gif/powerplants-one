# BP-03 — Synthetic opportunity handover journey

**Revision:** r01 · **Date:** 7 September 2026 · **Owner:** Dean Fiedler · **State:** Proposed screen contract; no application controls implemented. **Work:** #55 / PPO-009. [Policy decisions](../decisions/crm-opportunity-handover.md) · [Contract](../contracts/crm-opportunity-handover.md) · [Future proof](../testing/crm-handover-verification.md).

This extends the canonical C03 Opportunity detail and existing Activity detail. It does not redesign the delivered C02 Board/Grid. Use the [shared UI specification](../standards/ui-style-specification.md), [I2 guidance](../delivery/crm-i2-ui-guidance.md) and [original supplied-asset manifest](crm-ui-mockups/manifest.json). Reattached logo and brand PDF hashes match that manifest; the full PNG and PDF colour page were inspected in this design session. No company mark, contact block or new palette is invented.

## Walkthrough: one deliberate handover

All names and records below are fictional design cases, not seeded actors or operational records. Alex created an opportunity for owner Alex; Casey is an eligible recipient. Jordan owns its designated action. A separate test covers creator different from initial owner.

1. From either Board or Grid, Alex opens **SYN-PPO-OPP-000901 — Review greenhouse controller upgrade** for **Example Nursery — Synthetic**. The saved record is Qualified / Open, version 4. Detail separately labels Opportunity owner: Alex and Next action owner: Jordan. The last read time and saved version remain visible.
2. A server-derived **Hand over opportunity** action opens an inline, labelled section within the same canonical detail. Load eligible recipients and required action consequences before enabling submission. No recipient is preselected from a filter, organisation owner or current view.
3. Alex chooses Casey. Show the current/proposed ownership comparison below and require a reason. The checkbox confirms the displayed consequence, not recipient agreement or managerial approval. The underlying exact Opportunity and required Activity versions are frozen with this reviewed proposal.
4. Alex selects **Confirm handover to Casey**. Show Saving; disable duplicate or replacement submission. A server receipt alone establishes Handed over. On success reload authorised detail: Opportunity owner Casey, Next action owner Jordan, version 5; Qualified/Open and original qualification remain. History shows Alex → Casey, initiator Alex, reason and server time. Do not display Sent, Notified or Accepted by Casey.
5. Casey can continue existing qualification/action-planning rules where applicable. Jordan can complete the existing action under Jordan's current Activity authority. If that action is terminal, Casey sees **Next action needed** and uses the separate existing action planner. Alex may retain scoped reads but cannot issue new owner-only Opportunity commands.
6. Returning to Board/Grid uses its current server query and existing changed-window handling. The owner filter can legitimately exclude the handed-over record. Show that outcome accurately; preserve the user's view/search/filter/sort/phone-stage context, with a deliberate link to the canonical detail if still permitted. Do not optimistically insert a hidden row or change filters to make a transfer look successful.

## Proposed canonical-detail form

| Visible field or control | Synthetic comparison / content | Behaviour |
|---|---|---|
| Heading | Hand over opportunity | In-page heading; focus it when opened, return to trigger on Cancel. |
| Record context | SYN-PPO-OPP-000901; Example Nursery — Synthetic; Example site | Read-only permitted context, saved version and observed time. |
| Stage / outcome | Qualified / Open | Read-only; no additional stage or close controls. |
| Original opportunity owner | Alex | Distinct from original author and current owner; source from immutable origin/history. |
| Current opportunity owner | Alex | Before column/row, explicit full label. |
| New opportunity owner | Casey, selected from eligible owners | Labelled searchable bounded selector with keyboard option access; never an unrestricted directory. |
| Current next action | Confirm controller access and visit requirements | Full accepted Activity summary, status, due instant/timezone or Due date needed. Natural wrapping; no ellipsis as the only accessible content. |
| Next action owner after handover | Jordan — unchanged | Show both current and after values even when the action owner equals Alex. Existing activity stays in Jordan's My Work. |
| Qualification identification action, if present | Original contact-identification action; owner at qualification Alex | Show separately from today's next action. Its retained owner/status may differ from Casey; that does not undo qualification. |
| Consequence | Casey will own this opportunity. Jordan keeps the next action. Existing Activities and related work keep their current owners. | Always visible, text in addition to colour. Do not show counts/names for unavailable related records. |
| Reason for handover | SYN Casey will coordinate the next sales discussions | Required 1–1000 characters; labelled help/error; retain safe proposal on validation. |
| Confirmation | I have reviewed the opportunity and action owners shown above | Required deliberate confirmation of this loaded comparison; clear after any version/owner/action-context change. Not proof of recipient consent. |
| Primary action | Confirm handover to Casey | 44 px minimum target, navy text on green; only enabled with loaded eligible comparison, reason and confirmation. |
| Secondary action | Cancel handover | Leaves saved records unchanged; never used to discard an unresolved submitted original. |

The confirmation checkbox is UI intent evidence represented by the exact versioned submitted comparison and explicit command, not a new business permission. If implementation needs a persisted acknowledgement field, define it explicitly without changing old command hashes. Displayed labels alone are insufficient: UUIDs and exact versions bind the command.

## State and recovery contract

| State | User-facing message/action | Information and retry rule |
|---|---|---|
| Loading comparison | Loading eligible owners and current actions… | No selectable stale owners; no enabled confirmation; loading is not an empty result. |
| No eligible recipient | No eligible owner is available for this opportunity. | Cancel or refresh. Do not list excluded people, grant details or hidden-match counts. No request to change access from the form. |
| Required context unavailable | This handover is unavailable. Refresh the opportunity to check your current access. | Clear inaccessible action/owner content. Do not disclose which hidden target or candidate caused it. |
| Validation | Choose a different eligible owner / Enter a reason / Review the owners before confirming | Error summary and field-linked message, focus first invalid field; safe other input remains. |
| Opportunity or required Activity changed | This opportunity or its action details changed. Your proposal has not been applied. Load the current details and compare. | Only use this message for a confirmed rejection. Keep proposal while authorised; disable confirmation until explicit comparison. Activity-only changes also invalidate the reviewed version. |
| Confirmed conflict comparison | Previously viewed owner/action versus current saved owner/action | If Alex is no longer owner, remove new-transfer action; do not let adopting a newer version restore authority. Otherwise deliberate revised confirmation creates a new intent after the original rejection is known. |
| Saving | Saving handover… | Freeze original UUID/payload; disable duplicate and replacement submission. |
| Response lost | Handover outcome is not yet confirmed. Check the original result before trying again. | **Check original handover outcome** uses existing actor-bound operations lookup under H-03. A missing/denied/unavailable lookup is not proof of rejection. No automatic fresh intent. |
| Recovered accepted | Original handover confirmed. | Show exact original accepted version/time, then separately refresh today's permitted owner. A later transfer may mean today's owner differs from the original receipt's result. |
| Accepted | Opportunity handed over to Casey. Next action remains with Jordan. | Only after receipt plus current permitted projection; history records original receipt separately from current state. No notification/recipient acceptance implied. |
| Identity changed / access revoked | Your access changed. This opportunity is unavailable. | Unmount record/form/selector/history and clear counts/labels; discard late prior-actor responses. Keep server evidence; new identity cannot recover another actor's original. |

HTTP 503 or network failure during submission is potentially uncertain, not a confirmed rejection. Offer original-result reconciliation. Browser reload/process exit may lose unsaved online proposal memory; this design adds no localStorage, IndexedDB, service-worker route or offline guarantee.

## Reflow, keyboard and brand contract

Retain navy `#242a37`, green `#62bb46`, white, delivered Roboto with Verdana fallback, full unchanged logo on navy and existing shared navigation. Do not crop or shrink the mark to fit an added panel. Use the existing semantic warning/error styles with explicit words. The supplied PDF's primary colours were checked on page 18; typography and logo rules remain those in the accepted shared specification, including the deferred inconsistent Light Cloud value.

At desktop width, use two clearly labelled current/proposed owner columns; at phone and 320px, stack Current opportunity owner, New opportunity owner and Next action owner after handover in reading order. Keep the entire consequence above confirmation; allow long text and 1000-character reasons to grow. Inputs use 16 px phone text and 44 px controls. No horizontal outer-page scrolling, essential hover text or colour-only state.

Use native labels, heading order, a described fieldset for ownership comparison, status/live announcements for saving/recovery and visible keyboard focus. Opening/Cancel returns focus predictably; errors focus the invalid control; successful refresh announces the new saved state. Space confirms the checkbox, Enter activates the explicitly focused submit button, and Escape/Cancel closes only an unsubmitted comparison. An uncertain original must remain clearly unresolved. Real keyboard, screen-reader and device behaviour needs future implementation evidence; this authored screen contract is not a visual/runtime test pass.

Current primary guidance checked 7 September 2026: [W3C Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) informs the narrow-screen reading order, and [W3C Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) informs announcing save/recovery outcomes without unnecessary focus movement. These references are design inputs, not whole-product accessibility certification.
