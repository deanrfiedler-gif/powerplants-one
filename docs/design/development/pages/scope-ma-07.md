# Supplier recovery — native design contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `scope:MA-07`. Scope: **MA-07**. Owner: Dean Fiedler. Visual/business acceptance: **Pending**. Source baseline: `0f10b7fb46a8ab512e9b019573ece272cf5920b9`.

## Purpose and page type

Coordinate an exact supplier package, response and Finance evidence independently of customer resolution. Destination: `/warranty/supplier-recovery`. r20 page type: register/worklist with record/evidence detail. Retain the complete native Service Operations shell; do not adopt historical `/service/agreements` links as route authority.

## Desktop

At 1440 × 960 and 1024 × 768, show module navigation, title/context, server-permitted actions, filters and the source worklist. Registers use two labelled card columns; detail uses shared RecordTabs and separately disclosed evidence/decisions. Long customer/site/source names and immutable identities wrap. Use the shell content pane as the sole vertical scrolling owner; no nested fixed-height record scroller.

## Mobile

At 390 × 844 and 320 CSS px, cards, fields and context stack. Inputs use 16 px text and actions at least 44 px high. Tabs and navigation wrap. Native disclosures keep all required decisions reachable. Test focus visibility, Tab/Shift+Tab, Enter/Space, 200% reflow and guide Escape/focus return; hardware keyboard/phone and assistive-technology acceptance remain separate.

## Controls and exact workflow

Reused components: PageHeader, Field, Button/ButtonLink, Status, ReadState, RecordTabs/RecordPanel, ValidationFields, ErrorNotice and useCrmCommand. MaForm composes source/site/task controls with retained drafts and original-operation recovery. SourceCard discloses immutable evidence.

1. Create one claim for the current case/assessment with supplier, scope, integer minor-unit amount, currency/tax basis, owner and due date.
2. Record external submission evidence, then ordered supplier responses with approved amount and next owner/date.
3. Retain external Authorised → Received → Disposed evidence, or Not required before movement. Native SC-08 receiving is Unavailable.
4. Finance links an existing external credit to the exact approval, with explicit ERP company key, unique credit reference, date, amount and reconciliation state.
5. Record an independent unrecovered disposition where required; inspect claimed, approved, credited and unrecovered amounts separately.

Supplier approval is not credit, cash or custody. PPO sends no claim and posts no ERP transaction. SC-08 stock/returns receiving remains absent.

## Handovers and states

Exact case and evidence package → supplier claim/response → external physical-return evidence and separate Finance credit/unrecovered review.

Search, State, Order and Page live in the URL; a detail URL identifies selection and `view` identifies the open tab. Counts include only admitted rows from at most 200 source candidates; Partial is explicit. Required states: loading, empty, filtered empty, restricted/read-only, missing record/context, InvalidData, VersionConflict, source review required, saving, uncertain, recovered and accepted receipt. Drafts survive a guide open/close. A newer version never silently rebases a decision; compare it before Use current version after comparison. These workflows are online only.

## Source comparison and proposed departures

Exact source: [PPO-Warranty-and-Customer-Resolution-Workspace-r01.html](../../../reference/ui/warranty/PPO-Warranty-and-Customer-Resolution-Workspace-r01.html). The retained r01 HTML is unchanged. Page-specific approved desktop/mobile mockup images: **missing**. Application verification captures are evidence, not replacement mockups.

Native adaptations awaiting owner baseline adoption: current shell/tokens and route names; wrapped card register instead of the standalone dense desktop table; PostgreSQL/server commands instead of local storage; explicit exact-source controls instead of fictional default policy; native disclosures for long evidence; original-operation recovery through the existing command hook. No claim of pixel equivalence or owner acceptance.

## Evidence and review

See [implementation handover](../../../delivery/maintenance-warranty-handover.md) and [evidence index](../../../testing/evidence/maintenance-warranty/README.md). Source presence, automated proof, visual inspection, owner/device acceptance and deployment remain separately recorded. No review fingerprint is adopted by generation.
