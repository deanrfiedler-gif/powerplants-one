# PPO Session Closeout — PPO — Products Catalogue r04 — Review

## Session metadata

- **Recommended chat name:** PPO — Products Catalogue r04 — Review
- **Alternative name (if any):** PPO — Products Catalogue r04 — Audit
- **Session date(s):** 12 September 2026
- **Primary topic / artefact:** Products catalogue design preview (`PPO-Products-Preview-rNN.html`), aligned with estimating increment E3
- **Domains touched (of the seven):** Estimating & Quotation (primary — catalogue, product detail, add-to-estimate). Shared product, document and identity capabilities were exercised as displayed surfaces only. Supply Chain Management appears only as read-only fields (supplier part number, lead time); nothing was built for it.
- **Repository state at close:**
  - Default branch head: `ff81f9cb376156e0cfb2b8a8daba6fe0915cae62`, 12 September 2026 08:13 UTC — "Merge pull request #134 from deanrfiedler-gif/design/ui-baseline-standard-and-harness"
  - Branches created this session: **none**
  - Open PRs: #133 `feature/crm-board-refinements`, #131 `design/crm-sales-rail-and-board-interaction` — **both pre-existing and unrelated to this session**
  - Check status for anything this session touched: **not applicable — this session touched nothing in the repository**
- **Repository access during this closeout:** available (authenticated as `deanrfiedler-gif`)
- **Overall session outcome:** Partially complete
- **One-line summary:** Verified the r02 Products preview against its audit, audited r03 from a master-data and CPQ perspective, and produced r03 and r04 with a 50-assertion headless verification harness — all delivered as files, none published to the repository, and none visually reviewed in a real browser.

---

## 1. Artefact catalogue

### Delivered and confirmable now

| Path / filename | Type | Purpose | Status | Repo ref | Location |
|---|---|---|---|---|---|
| `PPO-Products-Preview-r04.html` | new | Products catalogue design preview, r04. sha256 `bd2d8074…ff69fdbd`, 6,780,577 bytes | VERIFIED | none | delivered file |
| `PPO-Products-Preview-Harness.js` | new | Headless jsdom verification harness, 50 assertions. sha256 `55916341…ec666fd9` | VERIFIED | none | delivered file |
| `README-r04.md` | new | r04 change notes, harness instructions, deferred items. sha256 `5f0027ab…bed7e28b9f` | VERIFIED | none | delivered file |
| `PPO-Products-r03-to-r04.diff` | new | Normalised diff r03 → r04. sha256 `1855c1c8…41587828` | VERIFIED | none | delivered file |
| `PPO-Products-r04-Bundle.zip` | new | The four files above plus `make_r04.py` and `SHA256.json`. sha256 `34a462fd…103b1687` | VERIFIED | none | delivered file |
| `make_r04.py` | new | 66 asserted string replacements producing r04 from r03 | VERIFIED | none | inside r04 bundle |

### Delivered earlier in the session, then removed from the outputs directory

| Path / filename | Type | Purpose | Status | Repo ref | Location |
|---|---|---|---|---|---|
| `PPO-Products-Preview-r03.html` | new, **superseded by r04** | Preview r03. sha256 `58f4d3cf…47139d5f` | CLAIMED | none | file card issued mid-session; file subsequently deleted from the outputs directory when the r04 bundle was assembled |
| `README-r03.md` | new, superseded | r03 change notes | CLAIMED | none | as above |
| `PPO-Products-r02-to-r03.diff` | new, superseded | Normalised diff r02 → r03 | CLAIMED | none | as above |
| `PPO-Products-r03-Bundle.zip` | new, superseded | r03 bundle including `make_r03.py` | CLAIMED | none | as above |
| `make_r03.py` | new, superseded | 23 asserted replacements producing r03 from r02 | CLAIMED | none | was inside the r03 bundle only |

**Flag:** these five were presented as downloadable files earlier in the session and then deleted from `/mnt/user-data/outputs` so the directory would show only the current revision. If Dean downloaded them at the time, he has them. If not, the earlier file cards may no longer resolve. r03 is superseded by r04, so the loss is low impact with one exception: **`make_r04.py` transforms r03 into r04, so the reproduction chain r02 → r03 → r04 is broken without r03.** The r04 HTML itself is delivered and complete, so reproduction is not required to use it.

### Exists only as chat text — never written to a file

| Artefact | Purpose | Status | Flag |
|---|---|---|---|
| **Master-data / CPQ audit of r03** | Ten findings across five priority and five secondary items, plus six deferred to E3, with measured evidence (money-parser round-trips, contrast ratios, role-leakage results) | CLAIMED — chat text only | **This is the most significant unfiled artefact of the session.** Its findings are summarised in `README-r04.md` under "What changed in r04", but the evidence, the deferred-item reasoning and the "what is already right" section exist only in the transcript. |
| **r02 verification review** | Independent re-derivation of the eight r01 audit findings against r02, with evidence per finding | CLAIMED — chat text only | Superseded in substance by the harness (group A), which encodes the same eight findings as executable assertions. |
| **Next-step assessment** | Sequencing recommendation and four open decisions | CLAIMED — chat text only | Reproduced in section 7 below. |

### Scratch — never delivered, no longer exists outside the session container

`harness.js`, `probe2.js`, `audit.js`, `sample.js`, `diff.txt`, `r01.js`, `r02.js`, `r03.js`, `r04.js`, `r02.stripped.html`, `PPO-Products-Preview-r01.stripped.html`, `r01/` (unzipped r01 package), `package.json` / `package-lock.json` (jsdom install) — all **LOST**. Intermediate analysis and test scaffolding; the useful content was consolidated into `PPO-Products-Preview-Harness.js`, which was delivered.

### Inputs (pre-existing, unchanged)

`PPO-Products-Design-Package-r01.zip` (uploaded; contains `PPO-Products-Preview-r01.html`, `PPO-Products-Design-Package-r01.pdf`, `PPO-Products-Design-r01.patch`, `SHA256.json`, `START-HERE.txt`) and `PPO-Products-Preview-r02.html` (uploaded). The r01 package `SHA256.json` was verified against its contents.

### Merge conflict markers / known-broken content

**None.** No repository documentation was edited, so the `docs` conflict-marker grep did not apply. The r04 HTML was syntax-checked (`node --check`) and runs clean under jsdom.

---

## 2. What was done

**Outcome: the Products preview advanced from r02 to r04, with a reusable verification harness, and remains unpublished and un-reviewed visually.**

**Workstream 1 — verification of r02 (fact).** r02 was hash-compared against r01 (`d7651c3d…` vs `8ce2902a…`; r01 matched its package `SHA256.json`). Each of the eight r01 audit findings was re-derived against r02 behaviour in jsdom. All eight were confirmed closed. Two new minor defects and two E3-brief items were found. Note: the session prompt restated "The HTML remains unchanged" alongside the r02 upload; this was read as a paste artefact from the earlier audit turn and r02 was confirmed to differ from r01 by hash.

**Workstream 2 — r03 build (fact).** Four fixes applied by asserted string replacement: revision labels derived from the record at six sites; step-2 validation error cleared on the back transition; the access-denied state made to clear what its banner claims; the product panel given an accessible name independent of the CSS-hidden tab list. One defensive change (null-guarded document dereferencing). 23 edits, each asserted present in the written file. Embedded assets byte-identical to r02.

**Workstream 3 — consolidated harness (fact).** 35 assertions across three groups: audit findings (A), behavioural invariants (B), r03 refinements (C). Run against r01, r02 and r03 to confirm discrimination: 15/35, 29/35, 35/35.

**Workstream 4 — master-data / CPQ audit of r03 (fact, chat text only).** Ten findings. The through-line: the data model is richer than the presentation, and hardcoded literals stand in for fields that already exist — the same defect class as the r01 revision literals, of which r03 fixed the six reported instances and left the currency, tax, applicability and file-type instances in place.

**Workstream 5 — r04 build (fact).** 66 asserted string replacements covering all five priority findings plus five of the secondary ones. Substantive changes: currency and tax basis read from the record throughout with a mixed-currency guard; the specification badge moved to `technical_revision` with both revision axes surfaced; document applicability, type and size made visible; supplier part number removed from the technical reader's search index and pricing-derived badges, filters and sorts made commercial-only; `cents()` given an explicit two-decimal contract with a render-time data-integrity gate; pricing state derived rather than stored; `document_revision: "r01"` corrected to `fixture_revision: "r02"` and surfaced in the footer; dates changed to dd Month yyyy with three hardcoded dates replaced by record fields; both margin calculations moved off floating point; card headings raised from H3 to H2 with CSS added for visual parity.

**Workstream 6 — harness extension (fact).** Fifteen D-group assertions added for the r04 work; C1 and C7 rewritten because r04 changed what they mean. Final: 50 assertions. Discrimination re-confirmed across all four revisions: r01 15/50, r02 29/50, r03 34/50, r04 50/50.

**Not done.** No repository change, no branch, no PR. No application integration. No visual review at any viewport. No real-browser execution.

---

## 3. Decisions made

All of the following exist **only in this chat and in `README-r04.md`**. None is recorded in the repository, and none has been ratified as a design decision.

1. **Decision — the specification badge reads `technical_revision`, not `revision`.** Rationale: the badge sits on the Specifications card, so the specification revision is the semantically correct axis; `technical_revision` was otherwise written to the export but never displayed. Alternative considered: leave the badge on the record revision and surface the technical revision elsewhere. **This reverses a change I made in r03**, where I wired the badge to `revision` because that is what the pre-existing literal implied. **Constraint created:** the rule for what increments each axis does not exist. Until it does, the badge is correct by assertion, not by definition.

2. **Decision — mixed currencies are blocked, not converted.** Rationale: conversion requires an FX rate, a rate date and a policy on which rate applies, none of which exist and none of which is a design-preview decision. Alternative considered: convert at a fixture rate. **Constraint created:** if E3 later converts, this guard must be replaced, not extended.

3. **Decision — pricing state is derived at render from `cost`, `sell`, `valid_until` and `as_at`; the stored `pricing` field is no longer read.** Rationale: the stored value is a denormalisation of derivable state and was consistent across all fourteen records only by luck of authoring. The field was left in the fixture rather than removed, to avoid rewriting the embedded JSON block. **Constraint created:** the field should be removed from the schema in E3; until then there are two values where there should be one.

4. **Decision — the export envelope was deliberately not extended.** `exported_at`, exporting role, estimate reference and customer were identified as missing in three separate reviews and left out each time. Rationale: the full evidence envelope is an E3 decision about what the artefact must contain, and adding half of it would create a `snapshot_schema_version: 3` that E3 immediately supersedes. `snapshot_schema_version` remains 2.

5. **Decision — `document_revision: "r01"` renamed to `fixture_revision: "r02"`.** Rationale: the value was stale (the fixture last changed at r02) and the key was ambiguous against the design revision. Verified unreferenced in the script before renaming. **Constraint created:** any other session or tool reading `document_revision` from this fixture will now find nothing.

6. **Decision — `schema_version` and `snapshot_schema_version` are independent and are not expected to track each other.** Recorded in `README-r04.md` only.

7. **Observation, not decision — activity labels.** The session applied no repository naming standard to any artefact, because STD-001 was not loaded. Filenames follow the pre-existing `PPO-Products-Preview-rNN` series; the harness, README, diff and bundle names are mine and were flagged as needing to be set from the standard.

---

## 4. Verification performed

### Run, with results

| Check | Result |
|---|---|
| `PPO-Products-Preview-Harness.js` against r04 | **50/50 passed.** Re-run against the delivered copy in the outputs directory at close: 50/50, sha256 `bd2d8074…ff69fdbd` |
| Same harness against r03 / r02 / r01 | 34/50, 29/50, 15/50 — confirms the assertions discriminate rather than pass everything |
| Per-edit assertion, r03 (23 edits) and r04 (66 edits) | Every edit asserted for an exact pre-change occurrence count, then re-verified present in the written file. Residual-literal scans for `AUD excluding GST`, `p.pricing`, `Product r01`, `document_revision`, hardcoded dates: all zero |
| Embedded asset integrity | Five base64 assets byte-identical across r02 → r03 → r04 |
| Script syntax | `node --check` clean on r03 and r04 |
| File hygiene | Zero inline event handlers, zero external resource references in r04 |
| Hashes recorded | r03 `58f4d3cf…47139d5f`; r04 `bd2d8074…ff69fdbd`; `SHA256.json` in each bundle |
| Colour contrast (computed, WCAG relative luminance) | muted 5.35:1, blue 7.70:1, warning 6.46:1, good 6.37:1, navy 14.37:1 against white — all pass AA for text. Brand green 2.41:1, used for non-text borders only |
| Data-model inspection | All fourteen fixture records checked for stored-vs-derived pricing consistency, identifier scheme, relationship types, unit set, currency set, MOQ/pack-size absence |
| Repository state (this closeout) | Default branch head, full branch list and open PRs read live from GitHub |

### Explicitly NOT verified

- **No visual inspection at any viewport, in any browser, at any point in this session.** Earlier claims in the transcript of "desktop and phone layouts visually reviewed" relate to r01 and r02 and were not made by me in this session.
- **All behavioural testing was jsdom, not a real browser.** jsdom required shims for `structuredClone`, `crypto.randomUUID`, `HTMLDialogElement.showModal/close`, `matchMedia`, `scrollTo` and `URL.createObjectURL`. The dialog shim in particular means modal focus trapping, the top layer and native ESC handling were **not** exercised. Node and Chrome also ship different ICU data — `USD` in `en-AU` renders `USD 3,250.00` here and `US$3,250.00` in Chrome — so two assertions (D1, D15) compare against the formatter's own output rather than a fixed string.
- **The H3 → H2 heading change was verified semantically, not visually.** CSS was added to hold size and spacing constant. Pixels were not compared.
- **`python3 scripts/check_foundation.py`, `check_prototype.py`, `check_naming.py` were not run**, and the `docs` conflict-marker grep was not run, because nothing entered the repository. This is correct, not an omission, but the consolidation should not read their absence as a pass.
- No accessibility testing with a real screen reader; no print output; no performance measurement; no integration with the application, MYOB, SharePoint or any live data.
- **Document completion, code completion, test results and acceptance are four different things here.** The preview is complete as a design artefact. The harness passes. Neither constitutes acceptance, and no application code exists.

---

## 5. Open issues and risks

1. **The r01 specification PDF has not been reissued and is now three revisions out of date.** It describes the r01 interaction model. Signing off r04 against it would make the authoritative document wrong at the moment of signature. Raised at r03 and again at r04; still outstanding. **This is the highest-value loose end in the session.**
2. **The r03 file cards may no longer resolve** (see section 1). Low impact because r04 supersedes r03, except that the r02 → r03 → r04 reproduction chain is broken without r03.
3. **The master-data / CPQ audit exists only as chat text** and will be lost when this transcript ages out unless it is filed.
4. **GitHub publication has been paused since r01**, following an automatic approval rejection described before this session. Four revisions of unpublished change are now carried as bundles. This is traceability debt and it is compounding.
5. **The heading change is the one thing in r04 that could have moved pixels** and has not been looked at.
6. **Two values now exist for pricing state** (stored `pricing`, derived `pricingState()`) until the field is removed from the schema.
7. The fixture exercises document applicability only partly — both synthetic documents apply to the same two F300 variants, so the negative path is asserted in the harness but thin in the data.

---

## 6. Assumptions made and not confirmed

1. **Assumption** — the restated audit text in the opening message, with r02 attached and "The HTML remains unchanged", was a paste artefact rather than a claim that r02 was identical to r01. Proceeded on that basis after hash-checking. Not confirmed by Dean.
2. **Assumption** — the Specifications card means the specification revision, so the badge should read `technical_revision`. No rule exists defining the two axes; this is my reading, not a recorded decision.
3. **Assumption** — a technical reader has no legitimate need to resolve a supplier part number or to see pricing state. Removed both. Defensible against the original brief's own rule about protecting supplier terms in search results, but not confirmed with any actual technical reader.
4. **Assumption** — `taxNote()` should preserve a leading acronym (so "GST-free supply" is not mangled) but lowercase an ordinary capitalised word. Implemented by a two-character pattern test. Works for the two forms present; untested against other phrasings.
5. **Assumption** — blocking mixed currencies is preferable to converting them in a design preview. Reasoned, not ratified.
6. **Assumption** — continuing the `PPO-Products-Preview-rNN` filename series is correct, and only the new artefact names (harness, README, diff, bundle) need setting from STD-001. The standard was not available to check.

---

## 7. Open questions requiring a decision from Dean

1. **What increments `revision` versus `technical_revision`?** Until this rule exists, the second axis is decoration and the r04 badge decision rests on my reading. *Blocks: specification reissue.*
2. **What is the real role model?** The preview has two roles because the demo needed two; the original scope named sales, estimating, engineering, purchasing and service. Permissions must be defined before any live data is connected. *Blocks: E3 implementation brief.*
3. **Mixed currencies — block or convert?** r04 blocks. Converting is equally defensible and needs an FX rate source, a rate date and a policy. *Blocks: nothing immediately; constrains E3.*
4. **Does MYOB or PPO own price, cost and stock, field by field?** Flagged in the original Products proposal as needing agreement before integration; not settled since. *Blocks: E3 implementation brief.*
5. **What does the review snapshot have to contain to be the E3 evidence artefact?** Deferred three times. *Blocks: `snapshot_schema_version: 3`.*
6. **Does GitHub publication resume, move to a private repository, or stay paused?** *Blocks: any repository landing of the Products work.*

---

## 8. Dependencies and cross-session conflicts

**This session depended on:** the r01 Products design package and the r02 preview, both supplied as uploads; the r01 HTML audit (eight findings), referenced from the transcript, **not read as a file** — `PPO-Products-HTML-Audit-r01.md` was not in the uploaded package and the findings were worked from the summary in the opening message.

**What now waits on this session:** the specification reissue; the E3 implementation brief; any decision to publish the Products work.

**Possible collision — low confidence, worth checking.** The repository head at close is a merge of `design/ui-baseline-standard-and-harness` (PR #134), whose commit message describes a **UI design baseline standard and verification harness**: self-contained HTML baselines, a `#ppo-<surface>` scope container, declared tokens, four audit viewports, a change record carrying both hashes, and a registered baseline harness that checks file integrity against a recorded SHA-256 and token agreement across baselines. That work landed on 12 September 2026, in parallel with this session.

**This session's Products preview does not conform to it**, and my harness is a different and overlapping thing:

- The Products preview has no `#ppo-<surface>` scope container and declares tokens on `:root`-adjacent selectors, not on a scope container.
- My harness verifies **behaviour**; the baseline harness verifies **visual token agreement**. The commit message for the baseline harness is explicit that it measures visual token agreement, not behaviour, permissions or acceptance. They are complementary, but two harnesses now exist and neither knows about the other.
- The baseline standard requires a change record carrying both hashes and the four audit viewports. This session produced hashes and diffs but not that change-record form, and did not render at the four viewports.

**The consolidation should treat this as the main cross-session item.** If the Products preview is to become a registered baseline, r04 needs restructuring to the section 7 requirements, and that is a larger change than anything in this session. I did not read PR #134's content — this assessment is from the commit messages on `main` only.

**Also noted:** two open PRs (#133, #131) are CRM work and do not touch anything here.

---

## 9. Next bounded step

**Reissue the Products specification to r04.**

- **Precondition:** open questions 1 and 2 answered (revision-axis rule; role model), because the specification has to record them rather than describe behaviour that rests on my assumptions. Question 6 is not a precondition — the specification can be drafted while publication stays paused.
- **Done means:** a specification document describing the r04 interaction model, carrying the revision-axis rule and the role model as stated decisions, with the acceptance cases lifted from the 50 harness assertions, the deferred E3 items from `README-r04.md` section "Still carried into the E3 implementation brief" recorded as open scope, and the r04 hash recorded. Named to STD-001.
- **Not in scope:** application code, publication, and any change to r04 itself.

**Separately and in parallel, not blocking:** Dean's visual pass on r04 at desktop and phone widths, specifically the H3 → H2 heading change. If it holds, r04 is design-signed-off. If it does not, it is a CSS-only r05.

---

## 10. Manual actions outstanding for Dean

| Action | Asked when | Confirmed? |
|---|---|---|
| Visual pass on r04 at desktop and phone widths, with attention to the card heading change | End of the r04 build | **No** — requested, not confirmed |
| Set the harness, README, diff and bundle filenames from STD-001 | Stated at r03 and again at r04 | **No** |
| Decide the six open questions in section 7 | Raised in the next-step assessment | **No** |
| Decide whether the r03 bundle needs re-issuing (see section 1) | Raised in this closeout | **No** — new |
| Nothing was asked of Dean in GitHub Desktop, on github.com, in a terminal or on his file system during this session | — | n/a |

---

## 11. Confidence statement

**Verified against the live repository just now:** the authenticated account, the default branch head SHA and date, the full branch list, the two open PRs, and the absence of any Products branch or Products file in the repository. A code search for `PPO-Products-Preview-r04.html` in the repository returned zero results.

**Verified by reading files I can still read:** every hash, byte count and assertion result in sections 1 and 4 for the five delivered r04 artefacts. The 50/50 harness result was re-run against the delivered copy during this closeout, not recalled.

**Recalled from the session only, not confirmable now:** the content of the r02 verification review, the master-data / CPQ audit and the next-step assessment, all of which exist only as chat text. The r03 artefacts' delivery — they were presented, and the files still exist in the session container, but whether the earlier file cards resolve for Dean is outside what I can check.

**Uncertain:** the cross-session collision in section 8. It is inferred from commit messages on `main`, not from reading PR #134's contents or `docs/STATUS.md`, and it may be less or more serious than described. **The consolidation should verify it directly before acting on it.**

**One clock discrepancy worth knowing:** file modification times in the session container read 11 September 2026 while the session date and the repository head are 12 September 2026. The container clock appears to lag. Dates in this report follow the session and repository, not the container.

---

*All product, price, specification, document and history data referenced in this session is synthetic (`SYN-PPO` references). Nothing in this session touched MYOB Acumatica, SharePoint, live quotations or any customer record. Monetary values are AUD excluding GST; the preview performs no tax calculation.*
