# P04 — SC-05 visual component evidence

Original PNGs from [application run 33956562610](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33956562610), artifact `9966628731`. Source PR head `39cdf6acb3188c754046c2363697743ac53537ff`, implementation tree `9481112dfba25cca3e989a0c8d02877555f58836`. No image content was edited. [manifest.json](manifest.json) records source paths, dimensions, SHA-256 hashes and archive provenance.

The implementing agent manually inspected all **48 captures** on 5 September 2026 using full-page overviews and readable critical-region inspection, followed by the refreshed final shell captures. Desktop viewport **1440×1000**; phone viewport **390×844**. Navy/green design, synthetic context, labelled states, focus, error recovery and the read-only/successor distinction remain clear. No blocking overlap or horizontal page clipping was found. Long pages/forms use normal vertical scrolling; long selected values can clip inside native selects while remaining keyboard accessible. Native date controls use browser formatting. The inherited P03 shell badge was corrected to Service workspace during visual review.

These are implementation self-review and automated viewport components. They do not claim independent review, screen-reader/real-device testing, offline capability or full PT/AT acceptance. Injected browser conflicts prove presentation; real concurrency is independently tested in PostgreSQL. Accepted-unreadable response recovery and the full scope/readiness/authorise/propose/successor browser flow use actual server commands.

| Scenario | Desktop | Phone | Inspection result |
|---|---|---|---|
| List | [PNG](desktop-list.png) | [PNG](mobile-list.png) | Distinct work-order references, state, site and current revision; scoped search/filter and clear entry to creation. |
| Draft | [PNG](desktop-draft.png) | [PNG](mobile-draft.png) | Ready saved scope still needs an explicit authorised reviewer decision; exclusions and owner remain visible. |
| Authorised | [PNG](desktop-authorised.png) | [PNG](mobile-authorised.png) | Seeded approved scope is read-only; visits remain Proposed and later mandatory criteria Unknown. |
| Authority missing | [PNG](desktop-authority-missing.png) | [PNG](mobile-authority-missing.png) | Missing authority is named at the authorisation stage while the Draft stays owned and visible. |
| Authorisation refusal | [PNG](desktop-authorisation-refusal.png) | [PNG](mobile-authorisation-refusal.png) | Focused server refusal explains the missing evidence and retains the saved Draft. |
| Disputed | [PNG](desktop-disputed.png) | [PNG](mobile-disputed.png) | Coverage remains Disputed alongside Finance review pending; no billability or invoice is implied. |
| Unresolved | [PNG](desktop-unresolved.png) | [PNG](mobile-unresolved.png) | Unresolved equipment identity and missing bounded plan remain visible; no guessed serial. |
| Identification plan | [PNG](desktop-identification-plan.png) | [PNG](mobile-identification-plan.png) | Identification method and limits are explicit; identity remains Unresolved while scope approval is pending. |
| Mandatory blocker | [PNG](desktop-mandatory-blocker.png) | [PNG](mobile-mandatory-blocker.png) | Site access is Blocked with text, and urgent priority bypasses no control. |
| Permitted exception | [PNG](desktop-permitted-exception.png) | [PNG](mobile-permitted-exception.png) | The documented tool preparation exception remains distinct from mandatory unknown crew/dispatch criteria. |
| Successor | [PNG](desktop-successor.png) | [PNG](mobile-successor.png) | Current r02 Draft and previous authorised scope are distinguishable; history and proposal review hold are visible. |
| Scope form focus | [PNG](desktop-scope-form-focus.png) | [PNG](mobile-scope-form-focus.png) | Long multiline scope input retains a visible focus ring and structured task/evidence sections. |
| Validation retained | [PNG](desktop-validation-retained.png) | [PNG](mobile-validation-retained.png) | Focused error summary and associated task-field error retain all proposal text. |
| Conflict retained | [PNG](desktop-conflict-retained.png) | [PNG](mobile-conflict-retained.png) | Conflict message retains the proposal and points to explicit comparison of the saved version. |
| Preparation review form | [PNG](desktop-preparation-review-form.png) | [PNG](mobile-preparation-review-form.png) | Visit-specific criterion/decision/reason/source-time/evidence fields support the permitted exception. |
| Proposed visit form | [PNG](desktop-proposed-visit-form.png) | [PNG](mobile-proposed-visit-form.png) | Proposed interval, optional window, bounded commitment/preparation and device-timezone wording are visible. |
| Create form | [PNG](desktop-create-form.png) | [PNG](mobile-create-form.png) | Company/site/customer/owner and explicit linked requests fit both widths; focused input remains visible. |
| Uncertain retry | [PNG](desktop-uncertain-retry.png) | [PNG](mobile-uncertain-retry.png) | Accepted but unreadable response is explicitly uncertain; entries remain for an identical retry. |
| Created empty scope | [PNG](desktop-created-empty-scope.png) | [PNG](mobile-created-empty-scope.png) | New order has a permanent reference and explicit scope-needed blocker with useful empty authoring state. |
| Empty | [PNG](desktop-empty.png) | [PNG](mobile-empty.png) | A confirmed filtered empty result is distinguished from inaccessible or failed data. |
| Systems refusal | [PNG](desktop-systems-refusal.png) | [PNG](mobile-systems-refusal.png) | Previous business records disappear; Systems has no business access and a visible refusal/retry. |
| Authorised through ui | [PNG](desktop-authorised-through-ui.png) | [PNG](mobile-authorised-through-ui.png) | Actual browser approval produces read-only scope; disputed coverage stays separate from Finance. |
| Visit saved through ui | [PNG](desktop-visit-saved-through-ui.png) | [PNG](mobile-visit-saved-through-ui.png) | Actual saved attendance intent remains Proposed with no crew booking or dispatch. |
| Successor saved through ui | [PNG](desktop-successor-saved-through-ui.png) | [PNG](mobile-successor-saved-through-ui.png) | Actual successor save preserves the approved original and holds proposal context for review. |
