# Conversations assistant and composer

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Catalogue key: `conversations-agent`. Review: owner acceptance pending. Host example; no isolated renderer.

## Source, mapping and consumers

[T2c design](../../../decisions/conversations-t2c-design.md), [amended captures](../../../reference/ui/my-work/conversations-t2-w3-r01/README.md), [Conversations](../pages/route-conversations.md) and [thread contract](../pages/route-conversations-id.md) govern. Bindings and fixtures are in components.json.

Figma mapping is Partial, Components › Conversations, private PPO - Design: Conversations / Message (proposed) 1144:181, Author=Carl 1144:172; Conversations / Avatar (proposed) 1144:55, Kind=Carl 1144:52. Names retain their provenance. The approved W3 version and exact source/capture IDs are in the capture manifest. P3 and R8 follow current decisions where historical illustrations differ.

## States and interaction

The @ picker separates AI assistant and People. Server-derived anchor authority controls Carl's availability. One atomic Agent tag is allowed, without Ask. People retain their own IDs and asks, including a person named Carl. Roles are not stored, so the secondary label says Role not recorded.

The thread picker opens above the composer, keeping its scrollable list clear of phone bottom navigation. The new-thread dialog keeps the picker in its own scrolling layout above the message field. Escape or Close picker returns focus to the message field and preserves its draft; the phone Close target is at least 44 px.

Answered/CannotAnswer cards render only the safe server projection as plain text, with AI/Simulated/acted-for labels and validated sources. Withheld sources have no name, link or tooltip. Queued/Answering and terminal states appear beside the trigger; only the tagger gets a reason. Worker/current-reader definitions remain unchanged.

## Desktop

At 1440/1024 px source chips wrap. The existing shell and context panel remain. Scoped surface/border/text aliases map to current white/line/ink tokens; the composer footer explicitly uses block layout and 14 px body text instead of inheriting the generic site footer.

## Mobile

At 390 px source links have 44 px targets. At 320 px attribution stacks and long labels truncate while retaining permitted accessible names. The native warning stays within the viewport and source chips do not create horizontal overflow.

## Keyboard, focus and recovery

Arrow keys/Enter select a picker option; Escape restores composer focus. Editing through a tag removes it atomically. Ctrl+Enter and Send share readiness/pending guards. R8 uses a native modal: Cancel preserves the draft, Add and send confirms the current evidence basis, and Start a new thread opens the existing flow on the same record. Cancelling returns to the original thread/draft. Confirmation grants no access.

Original-operation recovery retains tags and asks without another turn. A successful receipt clears only the submitted draft, preserving later edits. Existing generation/scope guards handle denied/stale reads; no raw answer is cached.

## Fixtures and limitations

tests/browser/conversations-agent.spec.ts uses mocked presentation projections. conversations-agent-worker.spec.ts proves a real UI post, lost response, recovery and existing worker. conversations-agent-stored.spec.ts renders persisted history, including compiled/off application behaviour. See [execution evidence](../../../testing/evidence/conversations-t2c/README.md). The private Kit draws sparkles online; an explicit white AI mark is the offline fallback. Owner/device acceptance and independent review remain separate; no review fingerprint is recorded.

If a retained original is refused because its earlier participant warning changed, choose Review current warning. The dialog previews that original message and its asks, with fresh count-only warnings. Cancel keeps both the original and any newer draft. Send original message keeps the same operation and content, updates only the reviewed acknowledgement, and returns focus to Message after confirmation. An already accepted original receipt wins without another post. This recovery state reuses the native warning and has no separately accepted Figma frame.
