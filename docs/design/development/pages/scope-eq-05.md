# Documents and Service timeline - native design contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `scope:EQ-05`. Owner: Dean Fiedler. Review: **Draft; owner visual acceptance pending**.
Starting implementation baseline: `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc`. Route: `/equipment/[id]?view=history`.

## Purpose and page type

Filter the source-owned timeline. Read reported symptoms, technical history, changes, Service requests, Work Orders, appointments, report links, exact document revisions, field evidence, Inspection attempts and Activities.

Selected r20 family: **Document & evidence workspace**. The issued [Equipment r02 HTML](../../../reference/ui/equipment/PPO-Equipment-and-Installed-Base-Workspace-r02.html) remains the semantic/reference source. Its bytes are unchanged. No accepted native image is available; missing desktop/mobile approval images are explicit.

## Desktop

Use the existing PPO application shell, shared navigation and global information icon. Content has one page scroll owner and a 1440 px maximum content width with 16 px padding. The Equipment navigation wraps. Register and identity/location regions use two equal columns at 768 px and above; record evidence follows the selected RecordTabs panel. Forms use two equal columns with visible field labels and a full-width impact/consequence notice. Long source references and identifiers wrap; dense historical details expand in place.

Use existing Roboto/Verdana typography, semantic ink/surface/line/focus tokens, shared Button/ButtonLink variants and 44 px controls. Preserve words beside status colours. At 1440, 1280, 1024 and 768 px verify the full shell, long values, explicit Unknowns, source failures and action reachability.

## Mobile

At 430, 390 and 320 CSS px use one-column cards, stacked description lists and one-column forms. Inputs stay at 16 px, controls at least 44 px and tabs/navigation wrap. The physical location and served areas remain separate at every width. Keyboard order follows the document; shared tabs provide selected state and arrow navigation. Camera/manual alternatives and every decision remain reachable. Verify 200% zoom with no horizontal page overflow. Emulation is not physical-device or screen-reader acceptance.

## Controls and workflow

1. Open Documents & service and select a source filter if useful.
2. Read occurred time, actor, source/revision, state, confidence, access and event-time location.
3. Open the owning source for full evidence, further bounded history or its next action.

Reuse Button/ButtonLink, Field, ValidationFields, ErrorNotice, ReadState, Status, RecordTabs/RecordPanel, LocalDateTimeField and the existing command/receipt pattern. Fixtures are synthetic Equipment tests and source-owned canonical seed records; no production export is used.

## Incoming and outgoing handovers

Each Service, Document, field, Inspection and Activity projection rechecks its owning access contract. SharePoint remains intended document authority; no live connector is used.

A historical manual revision is historical inclusion, not current applicability. Suspected causes remain suspected; missing event-time Facility is labelled instead of inferred.

The Documents & service tab opens the canonical Create follow-up form with this Asset, company and Site preselected. Identity uncertainty remains explicit and never authorises diagnostic work.

## States, recovery and proposed departures

Loading, no permitted records, filtered-empty, read-only, missing source, partial/bounded history, invalid input, stale source/version, saving, saved and uncertain outcome are distinct. Keep the original operation for recovery; do not submit a second intent when its outcome is uncertain. Stale proposals retain their original evidence basis and require explicit comparison/fresh proposal. A permission failure clears the sensitive read.

Proposed native adaptation: use the existing shared shell and responsive cards/tabs instead of copying the standalone HTML shell, scripted mock state or a new Equipment search/review/task master. This is an implementation proposal under ADR-0045, not adoption of a visual baseline.

## Evidence and review

The page guide `guide.eq.05` describes current controls. [Completion handover](../../../delivery/equipment-native-completion-handover.md) records executed checks, screenshots, failure comparisons and publication status. Source presence, functional evidence, visual comparison, business acceptance and deployment remain separate. No review fingerprint is asserted.
