# Business policies — AD-02 working page contract

Stable entry: `route:/admin/policies`. Owner: Dean Fiedler. Status: Draft for visual review. r20 page type: Register or worklist.

## Purpose and task

List the scheduling family, published readiness policy, permitted working calendars and the adopted reference policy. Search filters the permitted rows; the name header sorts. Rows open records. No bulk operation or policy editor is implied.

Sources: [accepted Settings design](../../../decisions/settings-hub-figma-design.md), D1–D8 and Q1–Q6; [retained captures](../../../reference/ui/settings/settings-hub-design-r01/README.md). Incoming: More › Administration & support › Settings, then Business policies and record links. Outgoing: each permitted area and the native PL-04 workflow. Implementation host: `BusinessPoliciesRegister`. Scope remains AD-02; no parent ID is changed.

## Desktop

At 1440 and 1024 px use SecondaryMenuFrame, the shared shell/menu and semantic tokens. Root passes `data-ppo-workspace="shared"`; no page ID enters shared CSS lists. Hub: Needs attention above configuration cards, three columns when wide and two on tablet. Register: shared RegisterTable, labelled search, policy-name sort, horizontal overflow within the table. Record: shared header/state strip, details column, Terms/proposal workspace, readable terms and explicit review/publication actions. Propose and Publish use the existing WorkDialog and Button controls. One content scroll owner; no hidden data survives loading or failed reads.

## Mobile

At 390 × 844 and 320 CSS px use the compact shell header. The phone hub separates Business policies (All policies with the authorised count and Record references) from the permitted configuration-area list. Terms use full-width stacked rows. Waiting to publish filters the same authorised register read. Register rows become labelled summaries. Record content stacks, with one primary sticky action. Reuse the standard modal for commands; the unaccepted amendment phone sheets are excluded. Preserve readable input sizes, keyboard focus, Escape/close and focus return. No offline mutation support is claimed. Paired capture and 200% zoom review remain separate from source presence.

## Shared components and states

Application shell, SecondaryMenuFrame, SharedRecord, RegisterTable, RegisterChip, Button, Field, ReadState, ValidationFields, ErrorNotice and WorkDialog. The [consumer binding](../component-bindings/2026-10-31-settings-hub.md) records fixtures and alignment items.

Loading, denied, empty/no permitted areas, filtered-empty, failed read, proposal revision changes, proposer refusal, publication refusal, saving and uncertain outcome must be explicit. Unknown publication outcome retains the original operation; check its receipt or retry that unchanged original. Never submit an automatic replacement. An accepted receipt is not deployment or business approval.

## Design adaptations and evidence

See [implementation evidence](../../../testing/evidence/settings-hub/README.md) for executed checks and every identified difference. Dean chose to hide unavailable areas on 31 October 2026. The catalogue retains nine areas, but current main only supplies the opened destinations. Status labels follow current source, not the 22 October story. Counts, dates and people come from synthetic database reads; none is an operating rule.

History, Affected work, Used by as a separate tab, the amendment readiness layout and phone sheets are not built. Read-only seed records use the existing record/terms pattern. The original thirteen PNGs are unchanged. No HTML reference exists. Functional proof, visual review, owner acceptance and deployment are distinct; no acceptance fingerprint is copied.

The Waiting to publish menu item opens `/admin/policies?state=waiting-to-publish`, filtering the existing authorised family read. Its empty view links back to all policies; no extra endpoint or capability is used.
