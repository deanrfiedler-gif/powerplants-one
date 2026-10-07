# Renewals and relationship review detail — native design contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/maintenance/renewals/[id]`. Scope: **MA-05**. Owner: Dean Fiedler. Visual/business acceptance: **Pending**. Source baseline: `0f10b7fb46a8ab512e9b019573ece272cf5920b9`.

## Purpose and page type

Own the expiry review without changing contract terms. Destination: `/maintenance/renewals/[id]`. r20 page type: record/evidence workspace. Retain the complete native Service Operations shell; do not adopt historical `/service/agreements` links as route authority.

## Desktop

At 1440 × 960 and 1024 × 768, show module navigation, title/context, server-permitted actions, filters and the source worklist. Registers use two labelled card columns; detail uses shared RecordTabs and separately disclosed evidence/decisions. Long customer/site/source names and immutable identities wrap. Use the shell content pane as the sole vertical scrolling owner; no nested fixed-height record scroller.

## Mobile

At 390 × 844 and 320 CSS px, cards, fields and context stack. Inputs use 16 px text and actions at least 44 px high. Tabs and navigation wrap. Native disclosures keep all required decisions reachable. Test focus visibility, Tab/Shift+Tab, Enter/Space, 200% reflow and guide Escape/focus return; hardware keyboard/phone and assistive-technology acceptance remain separate.

## Controls and exact workflow

Reused components: PageHeader, Field, Button/ButtonLink, Status, ReadState, RecordTabs/RecordPanel, ValidationFields, ErrorNotice and useCrmCommand. MaForm composes source/site/task controls with retained drafts and original-operation recovery. SourceCard discloses immutable evidence.

1. Create a review for an exact agreement revision and covered site, with review window, owner and next action.
2. Inspect current agreement and permitted Service history before retaining a proposal and customer discussion.
3. Create a CRM relationship Activity and a separate Service technical Activity with their receiving owners.
4. Close the review only with its retained rationale and next action. Use the agreement successor workflow for new terms.

CRM owns relationship follow-up; Service owns technical follow-up. A proposal, conversation or Activity does not extend the agreement or invent opportunity value.

## Handovers and states

Exact agreement, Service history and unresolved work → owned renewal review → separate CRM/Service Activities; Sales Aftercare reads native sources.

Search, State, Order and Page live in the URL; a detail URL identifies selection and `view` identifies the open tab. Counts include only admitted rows from at most 200 source candidates; Partial is explicit. Required states: loading, empty, filtered empty, restricted/read-only, missing record/context, InvalidData, VersionConflict, source review required, saving, uncertain, recovered and accepted receipt. Drafts survive a guide open/close. A newer version never silently rebases a decision; compare it before Use current version after comparison. These workflows are online only.

## Source comparison and proposed departures

Exact source: [PPO-Service-Agreements-and-Maintenance-Workspace-r01.html](../../../reference/ui/maintenance/PPO-Service-Agreements-and-Maintenance-Workspace-r01.html). The retained r01 HTML is unchanged. Page-specific approved desktop/mobile mockup images: **missing**. Application verification captures are evidence, not replacement mockups.

Native adaptations awaiting owner baseline adoption: current shell/tokens and route names; wrapped card register instead of the standalone dense desktop table; PostgreSQL/server commands instead of local storage; explicit exact-source controls instead of fictional default policy; native disclosures for long evidence; original-operation recovery through the existing command hook. No claim of pixel equivalence or owner acceptance.

## Evidence and review

See [implementation handover](../../../delivery/maintenance-warranty-handover.md) and [evidence index](../../../testing/evidence/maintenance-warranty/README.md). Source presence, automated proof, visual inspection, owner/device acceptance and deployment remain separately recorded. No review fingerprint is adopted by generation.
