# Support lifecycle and obsolescence - native design contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/equipment/lifecycle`. Owner: Dean Fiedler. Review: **Draft; owner visual acceptance pending**.
Starting implementation baseline: `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc`. Route: `/equipment/lifecycle`.

## Purpose and page type

Record dated supplier support evidence, support/software dates, affected component, replacement advice and uncertainty against the exact Asset.

Selected r20 family: **Register / worklist; supporting Document & evidence workspace**. The issued [Equipment r02 HTML](../../../reference/ui/equipment/PPO-Equipment-and-Installed-Base-Workspace-r02.html) remains the semantic/reference source. Its bytes are unchanged. No accepted native image is available; missing desktop/mobile approval images are explicit.

## Desktop

Use the existing PPO application shell, shared navigation and global information icon. Content has one page scroll owner and a 1440 px maximum content width with 16 px padding. The Equipment navigation wraps. Register and identity/location regions use two equal columns at 768 px and above; record evidence follows the selected RecordTabs panel. Forms use two equal columns with visible field labels and a full-width impact/consequence notice. Long source references and identifiers wrap; dense historical details expand in place.

Use existing Roboto/Verdana typography, semantic ink/surface/line/focus tokens, shared Button/ButtonLink variants and 44 px controls. Preserve words beside status colours. At 1440, 1280, 1024 and 768 px verify the full shell, long values, explicit Unknowns, source failures and action reachability.

## Mobile

At 430, 390 and 320 CSS px use one-column cards, stacked description lists and one-column forms. Inputs stay at 16 px, controls at least 44 px and tabs/navigation wrap. The physical location and served areas remain separate at every width. Keyboard order follows the document; shared tabs provide selected state and arrow navigation. Camera/manual alternatives and every decision remain reachable. Verify 200% zoom with no horizontal page overflow. Emulation is not physical-device or screen-reader acceptance.

## Controls and workflow

1. Select Equipment context and record a source/revision/date.
2. Choose an evidenced conclusion or retain Unknown; leave unavailable end dates Unknown.
3. Retain subsequent evidence separately and use source-owned follow-up or a governed physical replacement only when authorised.

Reuse Button/ButtonLink, Field, ValidationFields, ErrorNotice, ReadState, Status, RecordTabs/RecordPanel, LocalDateTimeField and the existing command/receipt pattern. Fixtures are synthetic Equipment tests and source-owned canonical seed records; no production export is used.

## Incoming and outgoing handovers

The supplier evidence portfolio links to canonical Equipment. Support advice can inform later Engineering, Sales or Service work without creating it automatically.

Supported, SupportEnding or Discontinued evidence does not change the Asset's physical lifecycle. Unknown is never inferred from absence as supported.

## States, recovery and proposed departures

Loading, no permitted records, filtered-empty, read-only, missing source, partial/bounded history, invalid input, stale source/version, saving, saved and uncertain outcome are distinct. Keep the original operation for recovery; do not submit a second intent when its outcome is uncertain. Stale proposals retain their original evidence basis and require explicit comparison/fresh proposal. A permission failure clears the sensitive read.

Proposed native adaptation: use the existing shared shell and responsive cards/tabs instead of copying the standalone HTML shell, scripted mock state or a new Equipment search/review/task master. This is an implementation proposal under ADR-0044, not adoption of a visual baseline.

## Evidence and review

The page guide `guide.route-equipment-lifecycle` describes current controls. [Completion handover](../../../delivery/equipment-native-completion-handover.md) records executed checks, screenshots, failure comparisons and publication status. Source presence, functional evidence, visual comparison, business acceptance and deployment remain separate. No review fingerprint is asserted.
