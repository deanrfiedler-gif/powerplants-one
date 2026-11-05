# Shell concept trial consumer note

Owner: Dean Fiedler. Review: proposed concept, owner review pending. Source and exact private Figma nodes: [shell concept trial](../../../decisions/shell-concept-prototype.md). No artwork or file link is published here.

## application-shell

The trial reuses the concept's top bar, compact/expanded rails, grouped Sales flyout, pinned menu and snapshot. Service uses the same frame around scope readiness and explicit authorisation. Phone views at 390 x 844 and 320 x 568 distinguish workspace Menu from record More, use separate record-actions sheets, and retain a fixed primary action. State-specific Service lists and Schedule returns preserve the local journey; shared workspace re-entry still resets the fixed example. This is a reference-only consumer, with no new application route or renderer. The concept's rail width, compact breakpoint, outline icons and reduced phone utilities must be reconciled with accepted shell rules before adoption. Graph connectivity and visual review do not establish keyboard, screen-reader, physical-device or production acceptance.

## register-table

Sales browse, preview and checked-row fixtures distinguish record inspection from bulk action. Clear selection retains the preview. The Service register opens the blocked synthetic work order; readiness evidence remains attached to the exact scope. Compact laptop/tablet and phone rows are trial compositions, not a replacement for the accepted register control set. Arbitrary sorting, filters, bulk execution and the complete permission matrix are outside this prototype.

The compact deal-row component retains customer, scope, amount/stage and next activity in six row instances. The 390 view shows all six; the short 320 view scrolls. Only the named Sunline phone record journey is connected. Overdue status includes the word as well as colour.

## read-state

Quotation fixtures make saving, saved, failed, offline and conflict states visible. Undo reverses only the demonstrated draft field edit. Issue/send and Service authorisation require explicit confirmation and show their exact result. Queued never claims delivery; authorised work creates no appointment. Fixed synthetic inputs and Figma transitions demonstrate the proposed wording and journey, not actual persistence, concurrency, retries, delivery or business authority.

## dialog

Four desktop dialogs fit their content and cover the whole shell with a scrim. Delivery actions align in one row; conflict resolution keeps the two value choices distinct. Phone authorisation uses a fitted bottom sheet with record identity, reason, consequence and visible Cancel/Confirm actions at both widths. The player walkthrough verified cancellation, Escape and the intended saved-quote and Service confirmation paths.

The issue dialog and issued result still use the 8 December saved fixture when invoked from other quote states. This is an observed prototype consistency gap, not accepted behaviour. Arbitrary input, context-dependent result rendering, keyboard focus trapping/return and assistive technology require an implementation proof.
