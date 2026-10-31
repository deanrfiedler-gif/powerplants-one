# Document library consumer bindings

Owner: Dean Fiedler. Implementation review and owner acceptance remain pending. Shared component rules are unchanged. The [workspace evidence](../../../testing/evidence/document-library/workspace/README.md) identifies fixtures, captures and test limits.

## buttons

Register/Revise use the primary action, Withdraw uses danger, and download/refresh/retry use secondary actions. Busy commands block duplicate submission. Uncertain results retain their operation and disable Cancel.

## register-table

The document table uses exact revision links, Number/Updated SortHeader controls and separate current-use/review/content/source columns. Load 25 more rechecks visible rows. Empty and denied reads do not manufacture totals.

## fields

Native forms reuse Field and ValidationFields for metadata, reasons, review rationale and exact source text. Permitted-choice selects bind stable IDs, page/search their authorised choices and expose validation targets. Customer/site changes clear dependent selections.

## tabs

RecordTabs owns keyboard selection for Overview, Revisions, Findings, Links and History. Panels retain matching accessible IDs; the phone tab strip scrolls without widening the viewport.

## menu

WorklistMenu groups lower-frequency record commands; the accepted SecondaryMenuFrame provides document views and the shared phone header. The snapshot is a nonmodal aside with Escape and focus return. Register quick views contain no Outputs shortcut; the shell owns that separately permission-gated destination.

## dialog

WorklistPanel renders register/revision/finding/link/recovery drawers and a centred review decision. Dirty navigation warns; pending unknown commands cannot close until confirmed.

## read-state

ReadState handles loading, denied and failed reads with retry. Same-context refresh retains the mounted rows and record until success, marking the read busy; denied or failed reads clear them. Query changes clear the result window but keep filter/menu state and focus. Loading more focuses the first newly shown row. Record tabs survive refresh and commands. Content failure never substitutes another revision.

## status

Status labels keep review distinct from availability and source currency. Current use, content availability and source currency use labelled status chips. Findings use Open, Awaiting review and Closed; a response is not closure. Eligibility renders the five server-derived facts with text as well as colour.

## application-shell

The Documents shared destination opens DK-01 while preserving the current department rail. DK-02 publishes RecordIdentity and compact phone actions. The issued job-pack route stays separate; no component specification or shell-wide styling is changed.
