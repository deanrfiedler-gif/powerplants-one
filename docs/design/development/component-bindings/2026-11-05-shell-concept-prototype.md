# Shell concept trial consumer note

Owner: Dean Fiedler. Review: desktop header branding, right divider, rail-footer arrangement and active-workspace styling adopted; wider concept review pending. Source and exact private Figma nodes: [shell concept trial](../../../decisions/shell-concept-prototype.md). No artwork or file link is published here.

## application-shell

The trial reuses the concept's top bar, compact/expanded rails, grouped Sales flyout, pinned menu and snapshot. Service uses the same frame around scope readiness and explicit authorisation. Phone views at 390 x 844 and 320 x 568 distinguish workspace Menu from record More, use separate record-actions sheets, and retain a fixed primary action. State-specific Service lists and Schedule returns preserve the local journey; shared workspace re-entry still resets the fixed example. This is a reference-only consumer, with no new application route or renderer. The concept's rail width, compact breakpoint, outline icons and reduced phone utilities must be reconciled with accepted shell rules before adoption. Graph connectivity and visual review do not establish keyboard, screen-reader, physical-device or production acceptance.

The adopted desktop arrangement uses derived local top-bar and rail components. The logo, workspace icons and footer arrow share x=36 in both widths. Settings and the display control remain below the independently scrolling workspace list, with 44 px target height and 8 px bottom inset. Thirty-one fixture pairs retain page/state on toggle and onward desktop links retain rail width. These are Figma transitions, not persistence or accessible implementation proof. The 32 phone layouts remain unchanged; tooltip wording is specified but hover behaviour is not demonstrated.

The current workspace uses a full-width slate band with square corners and a white icon and Medium label. Its 3 px green stripe touches the left edge and the slate fill reaches the right edge in both the 72 px and 240 px trial rails. The indented current page retains its quieter marker. Reference `156:41012` separates hover, active, focus and combined active/focus; keyboard and pointer behaviour remain implementation proof. The sampled contrast figures and source checks are in the [active-workspace decision](../../../decisions/shell-concept-prototype.md#adopted-desktop-active-workspace).

The desktop header uses a 240 px brand area. Global search starts at x=264 in the 1440 px fixture and x=256 in the narrower fixtures. At 1024 px the field shrinks to 383 px and the full wordmark fits. The shared desktop header uses the adopted 36 px symbol, 18 px Medium wordmark and 1 px right-edge-only divider. Reference `170:41052` compares the previous and adopted header.

## register-table

Sales browse, preview and checked-row fixtures distinguish record inspection from bulk action. Clear selection retains the preview. The Service register opens the blocked synthetic work order; readiness evidence remains attached to the exact scope. Compact laptop/tablet and phone rows are trial compositions, not a replacement for the accepted register control set. Arbitrary sorting, filters, bulk execution and the complete permission matrix are outside this prototype.

The expanded preview and pinned-menu examples use a derived Deals component with 140 px local search, compact gaps and wrapped filters. This keeps the primary action visible within the reduced workspace. Expanded Service headers, summaries and cards use available width rather than their earlier fixed compact-rail dimensions.

The compact deal-row component retains customer, scope, amount/stage and next activity in six row instances. The final pass uses 15/20 customer names, 13/18 supporting text, 12 px padding and 8 px corners inside 16 px content gutters. The 390 view shows all six; the short 320 view scrolls. Only the named Sunline phone record journey is connected. Overdue status includes the word as well as colour.

## read-state

Quotation fixtures make saving, saved, failed, offline and conflict states visible. Undo reverses only the demonstrated draft field edit. Issue/send and Service authorisation require explicit confirmation and show their exact result. Queued never claims delivery; authorised work creates no appointment. Fixed synthetic inputs and Figma transitions demonstrate the proposed wording and journey, not actual persistence, concurrency, retries, delivery or business authority.

## dialog

Four desktop dialogs fit their content and cover the whole shell with a scrim. The final pass gives them 24 px padding, 24/32 titles, 14/20 body text and a divided footer with right-aligned 44 px actions and a rightmost primary action. Conflict resolution keeps its two value choices distinct beside Keep reviewing in one contained footer. Phone authorisation uses a fitted bottom sheet with record identity, reason, consequence and visible Cancel/Confirm actions at both widths. The earlier player walkthrough verified cancellation, Escape and the intended saved-quote and Service confirmation paths; the final pass verifies screenshots and graph continuity separately.

The issue dialog and issued result still use the 8 December saved fixture when invoked from other quote states. This is an observed prototype consistency gap, not accepted behaviour. Arbitrary input, context-dependent result rendering, keyboard focus trapping/return and assistive technology require an implementation proof.

## buttons

Existing local trial button components share Roboto Medium 14/20 labels and 6 px corners. Phone instances retain a fixed 44 px height after text reflow; desktop dialog footers use the same height and hierarchy. The trial's other compact desktop controls keep their existing height. This is a private Figma reference binding, not a change to the application Button component.

Final source review found no undersized phone action instance, horizontal phone-text overflow or broken destination. The first colour-render and footer-overflow defects were corrected and recaptured. Blocked, ready and authorised Service status text uses warning, information and success tokens consistently across desktop and phone. Owner approval, complete phone-shell conformance and application accessibility remain pending.
