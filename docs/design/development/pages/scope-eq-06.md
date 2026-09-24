# Service bulletin applicability - native design contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `scope:EQ-06`. Owner: Dean Fiedler. Review: **Draft; owner visual acceptance pending**.
Starting implementation baseline: `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc`. Route: `/equipment/bulletins`.

## Purpose and page type

Record exact bulletin source/revision and supported manufacturer/model/serial/configuration criteria. Matches are candidates; an Asset-level review makes the disposition.

Selected r20 family: **Review / comparison; supporting Register / worklist**. The issued [Equipment r02 HTML](../../../reference/ui/equipment/PPO-Equipment-and-Installed-Base-Workspace-r02.html) remains the semantic/reference source. Its bytes are unchanged. No accepted native image is available; missing desktop/mobile approval images are explicit.

## Desktop

Use the existing PPO application shell, shared navigation and global information icon. Content has one page scroll owner and a 1440 px maximum content width with 16 px padding. The Equipment navigation wraps. Register and identity/location regions use two equal columns at 768 px and above; record evidence follows the selected RecordTabs panel. Forms use two equal columns with visible field labels and a full-width impact/consequence notice. Long source references and identifiers wrap; dense historical details expand in place.

Use existing Roboto/Verdana typography, semantic ink/surface/line/focus tokens, shared Button/ButtonLink variants and 44 px controls. Preserve words beside status colours. At 1440, 1280, 1024 and 768 px verify the full shell, long values, explicit Unknowns, source failures and action reachability.

## Mobile

At 430, 390 and 320 CSS px use one-column cards, stacked description lists and one-column forms. Inputs stay at 16 px, controls at least 44 px and tabs/navigation wrap. The physical location and served areas remain separate at every width. Keyboard order follows the document; shared tabs provide selected state and arrow navigation. Camera/manual alternatives and every decision remain reachable. Verify 200% zoom with no horizontal page overflow. Emulation is not physical-device or screen-reader acceptance.

## Controls and workflow

1. Record the supplier bulletin revision in its permitted company.
2. Choose candidate Equipment, record applicability evidence and Unknown, PotentiallyAffected, Affected or NotApplicable.
3. For unresolved/affected Equipment select an owned existing Activity or name an owner and due date. Close only after current definitive dispositions and completed affected follow-ups.

Reuse Button/ButtonLink, Field, ValidationFields, ErrorNotice, ReadState, Status, RecordTabs/RecordPanel, LocalDateTimeField and the existing command/receipt pattern. Fixtures are synthetic Equipment tests and source-owned canonical seed records; no production export is used.

## Incoming and outgoing handovers

Shared Reviews coordinates the bulletin; Activities supply ownership, My Work and shared notifications. Service, Sales and Engineering remain separate destination authorities.

Candidate matching never makes the final decision. Missing identity criteria stay visible for review and Unknown blocks closure.

## States, recovery and proposed departures

Loading, no permitted records, filtered-empty, read-only, missing source, partial/bounded history, invalid input, stale source/version, saving, saved and uncertain outcome are distinct. Keep the original operation for recovery; do not submit a second intent when its outcome is uncertain. Stale proposals retain their original evidence basis and require explicit comparison/fresh proposal. A permission failure clears the sensitive read.

Proposed native adaptation: use the existing shared shell and responsive cards/tabs instead of copying the standalone HTML shell, scripted mock state or a new Equipment search/review/task master. This is an implementation proposal under ADR-0045, not adoption of a visual baseline.

## Evidence and review

The page guide `guide.eq.06` describes current controls. [Completion handover](../../../delivery/equipment-native-completion-handover.md) records executed checks, screenshots, failure comparisons and publication status. Source presence, functional evidence, visual comparison, business acceptance and deployment remain separate. No review fingerprint is asserted.

## Implementation verification

Implementation checkpoint `cad07b414d1cd2deab95ce8d2b459e01ddbed8ab` was inspected on 24 September 2026. These are original synthetic runtime captures, separate from accepted design images: [eq-bulletins-1440.png](../../../testing/evidence/equipment-native/eq-bulletins-1440.png), [eq-bulletins-390.png](../../../testing/evidence/equipment-native/eq-bulletins-390.png), [eq-bulletin-closure-error-390.png](../../../testing/evidence/equipment-native/eq-bulletin-closure-error-390.png).

The [evidence index](../../../testing/evidence/equipment-native/README.md) and [manifest](../../../testing/evidence/equipment-native/manifest.json) retain exact dimensions, hashes and source provenance. Desktop/phone pairs, the seven-width family matrix, 1024 x 768 and the effective 200% viewport were inspected. The maintained browser proof passed all 38 Equipment cases, including all seven route-guide mappings and focus return; ten duplicate matrix/reference cases were intentionally skipped. Database, HTTP and actual application/database restart results are recorded separately. Owner/device acceptance, accepted-image baselines and deployment remain pending; no review fingerprint is asserted.
