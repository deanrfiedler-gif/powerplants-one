---
document_id: PPO-DK06-REPORT
title: DK-06 — Document & Form Template Management — Detailed Design Report
revision: r01
date: 2026-09-17
prepared_for: Dean Fiedler
project: Powerplants One
status: Proposed standalone design; owner acceptance, operational template approval and application integration separate
scope_id: DK-06
source_repository: deanrfiedler-gif/powerplants-one
source_branch: design/document-form-template-management-r01
authoring_commit: a5406a81c02d37c4a23e75c1b71c7653fcec0d80
build_plan: PPO-DK06-PLAN r01
language: en-AU
---

# DK-06 — Document & Form Template Management — Detailed Design Report

This report describes what the delivered artifact actually does, what was actually checked and what remains open. It is an account of a synthetic design prototype. It does not record an operational template approval, a runtime capability or a business acceptance.

**Artifact:** [PPO-Document-and-Form-Template-Management-r01.html](PPO-Document-and-Form-Template-Management-r01.html) · 324,285 bytes · SHA-256 `a8e76cf50dfd844f0bc84b2e16e9f5eb6d78efe2021642b43808e4beb46e6c3d`.
**Source:** [`docs/design/template-management/`](../../../design/template-management/README.md) · **Decision and receiving handover:** [document-form-template-management-design.md](../../../decisions/document-form-template-management-design.md) · **Verification:** [template-management-r01](../../../testing/evidence/template-management-r01/README.md).

**Contents**

1. [What was built](#1-what-was-built)
2. [Scope and design conformance](#2-scope-and-design-conformance)
3. [Evidence labels used throughout](#3-evidence-labels-used-throughout)
4. [Identity and version model as delivered](#4-identity-and-version-model-as-delivered)
5. [Supported building blocks and rules](#5-supported-building-blocks-and-rules)
6. [Source bindings and disclosure control](#6-source-bindings-and-disclosure-control)
7. [Applicability and eligibility as delivered](#7-applicability-and-eligibility-as-delivered)
8. [The six views](#8-the-six-views)
9. [Preview and validation evidence](#9-preview-and-validation-evidence)
10. [Review, publication and recovery](#10-review-publication-and-recovery)
11. [Usage and change impact](#11-usage-and-change-impact)
12. [Preview profiles and what they can do](#12-preview-profiles-and-what-they-can-do)
13. [Synthetic fixture catalogue as delivered](#13-synthetic-fixture-catalogue-as-delivered)
14. [Exceptions and recovery as delivered](#14-exceptions-and-recovery-as-delivered)
15. [Accessibility, confidentiality and persistence](#15-accessibility-confidentiality-and-persistence)
16. [Verification actually executed](#16-verification-actually-executed)
17. [Local case coverage against the plan](#17-local-case-coverage-against-the-plan)
18. [Departures from the build plan](#18-departures-from-the-build-plan)
19. [Known limits and what is not claimed](#19-known-limits-and-what-is-not-claimed)
20. [Next bounded step](#20-next-bounded-step)

## 1. What was built

A self-contained interactive HTML workspace with six views over a synthetic catalogue of eight template families, eleven seeded definitions and eight use assignments. Two families have complete editing, preview, validation, review, publication and impact journeys:

- **Customer service report** (OUT-10) — a document template with repeating equipment and findings, a conditional measurement section, a protected standing note and customer-safe bindings.
- **Blank questionnaire / site survey capture form** (OUT-05, CS-08 receiving context) — a structured form definition with choice, yes/no/unknown, number-with-unit, evidence and conditional questions bound to sample answers.

The other six families have realistic register, detail, applicability and impact fixtures with their supported local actions stated on screen. They deliberately include a returned submission, a future-effective assignment, a retired definition, a definition whose source schema this build does not hold, two definitions overlapping on one scope, and a definition whose rendering profile is unsupported.

The workspace answers the five questions the build plan set: which definition is eligible; what it contains and where its information comes from; whether it behaves correctly across realistic samples; who reviewed and published this exact version and for what scope and period; and what happens to drafts, render jobs, issued documents and saved form responses when a successor appears.

**Publishing a template here approves and issues nothing.** Domain services retain the source information, business review, work authority, output issue and customer response. DK-03 retains output preparation, issue and distribution evidence. DK-06 supplies the exact eligible template definition and explains any hold.

## 2. Scope and design conformance

| Required declaration | DK-06 treatment as delivered |
|---|---|
| Existing scope | DK-06 — Document and form template management. No new parent requirement was created. |
| Parent requirements | DOC-01–DOC-06; all 78 parent requirement identities preserved. |
| Primary r20 page type | Form / guided workflow for preparing and validating a template successor. |
| Supporting page types | Register / worklist; document and evidence workspace; review and comparison; work queue with persistent detail. |
| Reused components | r20 typography and tokens, controls, form sections, tabs, tables, decision dialogs, status labels, focus treatment and responsive snapshots, taken from the pinned Supplier Pricing source family. |
| Source families | Theme r20 (`c68a499e…`), Supplier Pricing `fonts.css` (`3fc64b31…`) and `workspace.css` (`6b6b3bba…`), with the exact runtime template and renderer sources quoted as dependency references. |
| Incoming handover | Output or form family, domain owner, source schema, exact source/template/asset fingerprints, audience, applicability and proposed change rationale. |
| Outgoing handover | Exact reviewed definition, validation evidence, publication decision, eligible usage scope, policy reference and impact follow-up. Prepared locally as a DK-03 template-selection task. |
| New composition | Six coordinated views, a bounded field and section editor, a fourteen-case preview test matrix, and separate review, publication and applicability facts. |
| Source authority | SharePoint remains the intended business-document authority; native CAD retains authoring and dependencies; MYOB Acumatica remains the intended ERP authority. None is contacted. |
| Declared limitations | Local synthetic authoring and publication only; no arbitrary code execution, live provider write, document issue, operational form submission or runtime deployment. |
| Verification | 35 model groups and 38 native-browser groups executed; see §16. Owner and runtime acceptance are separate. |

Exact reused source paths and hashes are recorded in [`source-manifest.json`](../../../design/template-management/source-manifest.json). The builder refuses to assemble if any of them changes, so a shared source change is a reviewed event.

## 3. Evidence labels used throughout

The workspace and this report distinguish four things, and the on-screen wording keeps them apart:

- **Retained control** — behaviour that already exists in the inspected application code and must not be weakened, for example the exact supported template check before pack and report release.
- **Proposed behaviour** — this prototype's own design, for example the configurable field editor, the applicability resolver and the scheduled effective-use assignment.
- **Synthetic example** — every person, customer, site, equipment item, template, source value, policy, date, document and form answer in the file.
- **Receiving requirement** — work the eventual runtime implementation must do, for example database atomicity, trusted server time and real provider permissions.

No proposed review role, selection rule, date or validation constraint in the artifact is adopted Powerplants policy.

## 4. Identity and version model as delivered

The model keeps eight identities apart, because similar-looking revision labels are not shared identity.

| Identity | As delivered |
|---|---|
| Template family | `FAM-…` with a stable readable reference, for example `SYN-PPO-TPL-REPORT`. The title is editable metadata. |
| Template definition | `DEF-…` with a revision label `rNN` and a content fingerprint. Published and submitted snapshots are read-only; edits need a draft successor. |
| Existing runtime definition version | Preserved as an integer where one exists. `DEF-REPORT-R02` carries runtime version 2; every proposed successor carries **no supported runtime version**, and the register and snapshot say so. |
| Publication / use-policy version | A separate `PUB-…` assignment record with scope, effective interval, actor, time and originating operation. |
| Source schema version | `SYN-SCHEMA-SERVICE-REPORT@3` and `SYN-SCHEMA-SITE-SURVEY@2`, recorded on the definition and on every validation run. |
| Renderer and asset identity | A dependency manifest of path, SHA-256 and byte count, quoting the actual repository renderer, font and branding fingerprints. |
| Output content revision | Owned by its domain. Issued fixtures carry their own bytes, hash and acknowledgement and are never re-derived. |
| Captured form-response version | Stored with the original field identities, labels, types and units, so historical interpretation stays exact. |

The content fingerprint is a real SHA-256 over a canonical serialisation of the definition body — sections, fields, bindings, conditions, applicability and dependencies — computed in the page by a bundled synchronous implementation. A model group verifies that implementation against `node:crypto` for five inputs including multi-byte characters, and verifies that canonical form is key-order independent while remaining array-order sensitive. Review decisions, validation runs, publication assignments and usage records are linked evidence held outside the definition body.

An unedited successor has the same content fingerprint as its predecessor, because the fingerprint is of content. Identity, revision label and state are separate fields; the model check asserts both facts explicitly.

Delivered seeded fingerprints, which the stored-state validator re-derives on every load:

| Definition | Fingerprint |
|---|---|
| `DEF-REPORT-R01` | `9021e35cffab597112c2047b2672c08cb7bd6c1f4186ab27436254ef4d063ebe` |
| `DEF-REPORT-R02` | `39e03b483b8844655973eda1a7fe11102f367b8ea94f1b2fda3876849e6681c4` |
| `DEF-SURVEY-R02` | `02b56d4bca44ea01af26bc996cd89919b429617dda6c005e66676f0651842de4` |

## 5. Supported building blocks and rules

Eleven field types are supported: read-only bound value, short text, long text, choice, multi-choice, number with unit, date, date and time, yes/no/unknown, evidence reference and protected block. Adding a field opens a structured form with a supported type, label, help text, unit, source binding, requiredness, visibility condition and stable option identities. It never opens a code editor, and the attempt to add a protected block through ordinary editing is refused with the owner named.

Repetition is a section property bound to a `many` source path. Reordering sections renumbers sequences only; the model refuses the operation if field identities change, and a model group asserts the identity and binding list is byte-identical before and after a move. Keyboard **Move up** and **Move down** controls are the reorder mechanism, so there is no drag-only path.

Seven bounded operators are supported: equals, does not equal, is present, is not present, is one of, all of and any of. Conditions reference typed fields and permitted source paths only. There is no `eval`, no formula text, no network path and no executable markup, and no user-defined financial or engineering calculation engine is proposed.

Evaluation is three-valued.

| Input state | Result |
|---|---|
| Source path supplied with a value | True or False by the operator |
| Source path supplied as an empty collection or explicit blank | False for *is present* |
| Source path absent from the record | **Unknown**, with a diagnostic naming the path |
| Group with one false member (`allOf`) | False |
| Group with no false member and one unknown (`allOf`) | Unknown |
| Group with one true member (`anyOf`) | True |

Where an unknown condition controls a section or field that carries required content, the content is **not** hidden: the preview shows an explicit uncertainty and the run records a blocker. That behaviour is asserted in both the model and browser suites.

Definition validation refuses duplicate field identities, unsupported types and operators, orphan fields, unknown binding paths, retired source paths, type mismatches, unit mismatches, missing units, cardinality mismatches, unknown condition references, self-reference, dependency cycles, contradictory `allOf` equalities, missing choice options and forbidden bindings on protected blocks. It also warns where a conditionally shown input is required, and where a mandatory source path in the contract is not presented by the definition.

## 6. Source bindings and disclosure control

Each binding shows the owning domain, approved source path, type, unit, cardinality, confidentiality and schema version. An unbound read-only value shows **Mapping needed** and blocks the affected checks.

Four things are kept apart, and the on-screen note says so: source requiredness belongs to the business contract; entry requiredness determines what a person must type; display visibility determines what is presented; and audience permission determines what may reach the presentation at all.

Audience filtering happens **before** projection, not in presentation. A customer-audience definition bound to an internal or restricted source fails validation outright, with the message stating that hiding the field is not exclusion — and it still fails when the field carries a condition that would hide it. The restricted sample supplies `internal.labourCost`, `internal.technicianNotes` and `report.technicianName`; all three are removed from the projection before rendering for the customer definition, each with a named exclusion diagnostic, and the model check asserts that neither the values nor the paths appear anywhere in the produced HTML.

Every rendered label, value and item identity is escaped. A model group sets a field label to `Owner <img src=x onerror=alert(1)>`, renders it and asserts that no `<img>` element exists and the text appears escaped. The native suite recorded zero page and zero console errors across all 38 groups.

Numeric presentation preserves the source value and its unit; no conversion is applied anywhere, and a unit disagreement is a validation failure rather than a silent conversion. DK-06 calculates no quote total, margin, engineering quantity or Finance treatment.

## 7. Applicability and eligibility as delivered

A use assignment carries a scope of company, output or form family, purpose, audience and locale, plus an effective interval that is **start-inclusive and end-exclusive**, with an open end represented explicitly as `null` rather than a far-future date.

The resolver returns exactly one of five outcomes:

| Outcome | When | Delivered behaviour |
|---|---|---|
| **Eligible** | One active assignment covers the complete context at the stated instant and the definition is supported | Returns that definition and names the assignment |
| **No match** | No assignment covers it | States so, and where a later-effective assignment exists it says that it is not eligible before its instant |
| **Ambiguous match** | Two or more definitions are assigned to the same scope and interval | Lists both candidates and states that no precedence rule is configured, so the request is refused |
| **Missing context** | Any of the five dimensions is not supplied | Names the missing dimensions and assumes no default |
| **Unsupported** | The resolved definition's profile or schema is not supported | Names the reason |

Nothing selects the newest, the first alphabetical or the apparently most specific candidate. A cross-entity request (`RTF-AU-DEMO`) against the report scope returns **No match**; there is no branding or data fallback between entities. A selection probe in the Review and publication view lets a reviewer ask for any context and see exactly which of the five outcomes comes back; all five are exercised in the browser suite.

## 8. The six views

| View | Delivered content |
|---|---|
| **Template register** | Nine rows in the default *Current and proposed* projection over eleven definitions, with title, domain and output family, definition revision and state, fingerprint, runtime version, purpose and audience, applicability, review and publication state, eligible-use state, owner and next action. Search across title, reference, revision, output family, domain, purpose and owner, plus nine filter projections. Four metrics stating the permitted population. The empty state says explicitly that it is a filtered view and not evidence that the register is empty. |
| **Template & rules** | Identity and ownership, applicability, sections and fields with a per-section editor, source bindings with their contract facts, protected content with its owner, change rationale, live definition checks, evidence currency and the dependency set. A published, submitted, approved or retired definition is read-only, and the banner says why and what to do instead. |
| **Preview & validation** | Context strip of exact fingerprint, sample, audience, source-as-at, profile and suite version; sample selector; document and form preview; findings panel with go-to-field navigation; the fourteen-case scenario matrix with per-case result and output evidence; and a run evidence block. |
| **Review & publication** | Policy statement or an explicit *Policy not configured* hold; the review queue with exact snapshots and decisions; findings with author responses and reviewer disposition; a decision form; a six-item publication readiness list; the intended assignment; the selection probe; and the family's assignments with their intervals, eligibility state and withdrawal action. |
| **Usage & change impact** | Consumers grouped by stage with their planned treatment and owner; a business-language difference list with an optional technical summary; shared dependency impact; form response compatibility; usage source completeness with as-at times; and prepared tasks. |
| **History & recovery** | Definition lineage; issued documents with their retained bytes, hash, template identity and acknowledgement, and a clearly labelled reconstruction; publication operations with outcome and receipt; and the retained event history. |

The workspace frame is workspace-only: title, purpose, **Synthetic preview** marker, demonstration time with **Advance demo time**, Review guide, Export review copy, preview profile and the six tabs. The live application shell retains its rail, logo, global search, account controls and navigation.

## 9. Preview and validation evidence

The document preview renders real local HTML from the exact definition and the audience-filtered sample. It is not a static image: changing a field, a condition, a unit, an audience or a sample changes the output and its hash. The preview reports its own output SHA-256 and byte count; a model group asserts both against `node:crypto` and `Buffer.byteLength`.

The form preview lets a reviewer enter sample answers and see input validation and conditions. Completing it writes only to the sample fixture; the footer says so, and no operational record is created. Unanswered, Unknown, No, zero, not applicable and unavailable evidence are six distinct presentations, and the required-answer message states in words that unanswered is not No and not zero.

Every result belongs to one exact definition fingerprint, dependency fingerprint, sample identity and version, schema version, audience, renderer profile, validation suite version and time. Changing any of those marks the earlier run **out of date**, and the affected checks must be re-run before submission or publication. Six separate currency conditions are asserted in the model suite, and the browser suite demonstrates the transition by editing a field after a passing run.

The scenario matrix reports **passed**, **failed**, **blocked**, **not run** or **not applicable** per case. *Not applicable* is used where the construct genuinely does not exist — the repeated-item cases against a definition with no repeating section — rather than reporting a pass that was never executed.

| Case | What it asserts against the delivered fixtures |
|---|---|
| SC-01 Normal complete record | Correct identity, values, section order and required content |
| SC-02 Missing mandatory source | A blocker naming the source binding; no invented placeholder |
| SC-03 Optional field empty | Clean presentation; an explicit blank is presented as recorded blank |
| SC-04 Zero, false and unknown | `0 h`, `0 °C`, `No` and `Unknown` each rendered distinctly |
| SC-05 Conditional branch unknown | At least one condition evaluates Unknown with an explicit diagnostic |
| SC-06 Long names and notes | Long identity and long notes render without a blocker |
| SC-07 Repeating group with none | Explicit empty treatment; not applicable where no repeating section exists |
| SC-08 Repeating group with many | Every repeated item identity distinct |
| SC-09 Unit or type mismatch | No remaining unit, type or missing-unit error in the definition |
| SC-10 Restricted source present | Restricted and internal sources removed before rendering, with no leak |
| SC-11 Wrong company or audience | Cross-entity request returns No match |
| SC-12 Missing or overlapping applicability | Incomplete context returns Missing context |
| SC-13 Changed shared asset or renderer | Names the changed dependency and the other families that reference it |
| SC-14 Unsupported definition or profile | Blocked with the reason; no rendered success |

## 10. Review, publication and recovery

Draft, submitted, findings and returned, approved, published, future effective, eligible now, superseded for a scope, retired and outcome unknown are ten distinct states, and the register, snapshot and review view keep them apart.

Submission freezes the exact definition, its dependency manifest and its validation run. It is refused when no policy is configured, when the definition still has an error, when the validation evidence is not current and complete, or when no review purpose is stated. A submitted definition is read-only; the model asserts that an edit attempt is refused.

A finding can be answered by the author, and the answer alone does not close it. The reviewer must accept the response or return the work. Approval is refused while a finding is open, is refused where the submitted snapshot no longer matches the definition, requires a recorded reason, and is refused for the author's own submission under the policy's `allowSelfReview: false`. The self-review rule is exercised through a preview profile that holds both capabilities, so it is a real refusal rather than a decorative statement.

Publication requires six checks to pass: an approved decision on this exact definition, a configured review policy, a supported profile and known schema, current and complete validation, a conflict-free use assignment, and no unreconciled publication operation. Succession over an open-ended earlier assignment is possible but must be confirmed explicitly; an overlap that succession cannot resolve is refused outright with no arbitrary winner.

Publication records the definition, the assignment and a durable operation together. The **Lose next publication response** control produces an operation whose outcome is `unknown`: the assignment is held as `pending-unknown`, the definition stays **approved** rather than published, the resolver keeps returning the earlier definition, and a repeated publish of the same intent is refused by name. Reconciling the original operation resolves it to one outcome with one receipt, activates the single assignment, closes the predecessor's interval at the new effective instant and promotes the definition to published. The model asserts that exactly one operation and one assignment exist afterwards.

Retirement withdraws an assignment from new use with a recorded reason, actor and time. It deletes no definition, erases no approval, invalidates no issued acknowledgement and removes no historical access; the model asserts that submissions, operations, seeded fingerprints and the issued acknowledgement are unchanged after a withdrawal.

## 11. Usage and change impact

Ten consumer fixtures cover seven stages: draft document, reserved render request, generated unissued output, issued document, active capture form, submitted form response, and scheduled work without a reserved output. Each carries its planned treatment in business language:

- A **draft** shows both definitions; the owning domain decides whether to reselect and re-prepare.
- A **reserved render request** is revalidated against the original template, policy and source at finalisation; a mismatch stays a stale, owned operation.
- A **generated bundle** is never template-swapped in place; re-preparation is a new checked intent.
- An **issued document** stays attached to its original exact template and content, with its bytes, fingerprints and recipient response unchanged.
- An **active capture form** keeps the entered evidence and its original definition and schema.
- A **submitted response** keeps its exact historical interpretation; corrections and migrations are separate linked operations.
- **Scheduled work** re-evaluates the eligible definition at the domain's defined selection point.

Actions prepare tasks. Preparing the DK-03 template-selection handover and preparing owned follow-up are each possible exactly once per exact target, and both state on screen that nothing is issued, sent, upgraded, rewritten or regenerated.

Differences are classified as new content, removed content, wording only, changed meaning, changed source, changed requiredness, changed conditions, reordered, dependencies and applicability, with a technical summary toggle for the receiving developer. A unit or type change is classified as **changed meaning**, and the form-response comparison marks the affected answer **incompatible** while preserving its original label, type and unit. The report states in place that classification helps assessment and does not approve a change as harmless.

The shared dependency case is real: `src/documents/render.ts`, `public/brand/Roboto-variable.woff` and `public/brand/powerplants-logo-green-white.png` are referenced by the report, pack, quotation, transmittal, handover and Finance families. Referencing a successor branding asset — as a **new exact dependency reference**, never a modification of the original bytes — marks the earlier validation out of date and lists the other affected families by name.

The Projects usage lookup is deliberately partial. The view says **Impact incomplete**, gives the source-as-at time and states that zero rows from a failed lookup is not evidence of zero usage and cannot justify publication.

## 12. Preview profiles and what they can do

Seven illustrative profiles are provided. They are proposals; they appoint nobody and establish no operational approval authority.

| Profile | Permitted demonstration actions |
|---|---|
| Template author | Create a successor, edit allowed sections and fields, run the scenario matrix, record sample answers, submit for review, answer findings, export |
| Domain template reviewer | Record findings, accept a response, approve or return the exact submission, export |
| Author and reviewer (same person) | Both sets — used to demonstrate that the policy's self-review prohibition is enforced rather than assumed |
| Template publisher | Configure a fictional policy, publish with a use assignment, reconcile an original operation, withdraw from new use, export |
| Document coordinator | Prepare the DK-03 template-selection handover and owned follow-up, export |
| Restricted Finance reviewer | Inspect the Finance family only; the register shows one row and the other families are not enumerated |
| Read-only user | Inspect permitted definitions and previews; no editing, submission, decision or publication control is rendered |

Reading metadata, editing, submitting, reviewing, publishing, assigning use, retiring, exporting and recovering are separate capabilities, and every command re-checks them server-side of the model rather than relying on a hidden button. The staged handover family ships with **no configured policy**: submission, review decisions and publication are all held until a publisher selects a fictional configured policy, and even then its unknown source schema keeps the profile check failing.

## 13. Synthetic fixture catalogue as delivered

Eight families, eleven definitions, eight assignments, sixteen samples, ten consumers and four usage sources.

| Family | Output relationship | Delivered scope |
|---|---|---|
| Customer service report | OUT-10 | Full structured editing, customer-safe preview, fourteen-case validation, exact review, publication, in-flight and issued impact |
| Blank questionnaire / site survey | OUT-05, CS-08 receiving | Full field and condition editor, sample form entry, units and unknown states, version-bound response compatibility |
| Technician job pack | OUT-09 | Existing section requirements, crew context, protected instructions, a returned submission and shared dependency impact |
| Customer quotation | OUT-06 | Protected accepted presentation and terms reference; two published definitions overlapping one scope |
| Design transmittal | OUT-08 | Exact document-set reference and a future-effective assignment |
| Commissioning and test record | OUT-12 | A retired definition with its history preserved |
| Staged handover pack | OUT-13 | Unconfigured policy and an unknown source schema |
| Finance supporting evidence | OUT-14 | Restricted field inspection, an unsupported PDF profile and shared renderer dependency impact |

Nine report samples cover complete, missing mandatory, explicitly blank optional, zero/false/unknown, controlling values absent, long content, repeating groups empty, repeating group with five items, and restricted sources present. Seven survey samples cover the same shapes that apply to a form, each with its own answer set.

All people, customers, sites, equipment, dates, answers, policies and content are clearly synthetic. No manufacturer instruction, CREMS formula, company legal term, approval, compliance claim or operational retention period is invented.

## 14. Exceptions and recovery as delivered

| Condition | Delivered treatment |
|---|---|
| Required binding missing | **Mapping needed**; affected checks blocked; the unresolved draft is preserved |
| Unknown, retired or incompatible source path | Explicit definition error naming the field and the path |
| Condition input unknown | Explicit Unknown diagnostic; mandatory content is not hidden |
| Unsupported field, operator or profile | Refused at the command, or reported as **blocked** by the matrix; no false rendered success |
| Cyclic or self-referential rule | Rule validation error naming the offending field |
| Protected content edit attempted | Refused with the block's owner and revision named |
| Definition, asset, sample or suite change after validation | Earlier run retained and marked **out of date** |
| Review basis changed after submission | Approval refused; the exact snapshot must be refreshed |
| Publication overlap | Refused, or succession offered and confirmed explicitly |
| Missing effective context or timezone | Refused; the effective instant is entered explicitly and interpreted in Australia/Sydney |
| Publication response lost | **Outcome unknown**; a repeat of the same intent is refused until the original operation is reconciled |
| Concurrent change | A stale expected version refuses the save and leaves the earlier state byte-identical |
| Cross-tab write | Detected through the storage event; the notice offers **Reload saved work** and retains unsaved form entries |
| Local save failure | **Local save failed**; nothing is written, the entry stays in the form, and a retry saves exactly once |
| Malformed local state | Retained unchanged, writes paused, and the notice says it has not been overwritten |
| Partial usage lookup | **Impact incomplete** with its source-as-at time |

No diagnostic exposes a stack trace, a credential, a private provider path or unredacted sample data.

## 15. Accessibility, confidentiality and persistence

Semantic controls, labelled fields, visible keyboard focus and accessible validation messages are used throughout. Section reordering has keyboard buttons rather than a drag-only control. Dialogs and the snapshot drawer trap focus, return it on Escape and Close, and preserve the invoking context. A keyboard-only journey — create a successor, run the scenario matrix, submit for review — is executed in the browser suite without a pointer.

All six views were checked at 1440, 1024, 820, 390 and 320 px. In every combination the document scroll width did not exceed the client width, the page heading was not obscured by the sticky tool bar, and the skip link stayed hidden until focused. At 390 and 320 px the layout becomes labelled cards with one editing task at a time, and the snapshot drawer fills the full 320 px width.

Persistence uses a dedicated namespace `ppo.template-management.r01` with a separate `.view` preference key. The footer states **Saved in this browser** or that nothing has been saved yet. Reset clears only those two keys after an explicit confirmation that names what cannot be recovered; a model-scoped browser group verifies that an unrelated key survives it.

Local storage is not an ACID database, a secure audit log or a multi-user concurrency solution, and the report says so rather than implying otherwise. Stored state is validated on load: the schema version, every array, the clock, every definition's re-derived fingerprint, every seeded definition's original fingerprint, publication intervals and states, operation outcomes, finding states and event times. A tampered seed, a relabelled fingerprint, an invalid operation outcome and a malformed event are each rejected.

Export contains the selected definitions, assignments, submissions, findings, operations, runs, tasks, events and policies with a synthetic notice stating that it is a review copy and not a production backup, template installer or automatic import contract.

## 16. Verification actually executed

Executed on the authoring commit `a5406a81c02d37c4a23e75c1b71c7653fcec0d80` against the delivered artifact `a8e76cf50dfd844f0bc84b2e16e9f5eb6d78efe2021642b43808e4beb46e6c3d`.

| Check | Result |
|---|---|
| Deterministic assembly | `scripts/build-template-management.py` reproduces the same 324,285-byte artifact from the same inputs; all seventeen pinned source hashes verified before assembly |
| Focused lint | `npx eslint docs/design/template-management/*.js scripts/check-template-management-*.mjs` — clean |
| Model and rule suite | `scripts/check-template-management-model.mjs` — **35 groups passed** |
| Native browser suite | `scripts/check-template-management-browser.mjs` — **38 groups passed**, 43 captures recorded by identity, **zero page errors and zero console errors** |
| Repository documentation | `check_foundation.py`, `check_prototype.py`, `check_naming.py` — all passed; 78 parent requirements preserved |
| Conflict markers | `git --no-pager grep -n -E "^(<<<<<<<|=======$|>>>>>>>)" -- docs` — no match |

The local authoring environment ran Node 22.22.2 and Chromium 141.0.7390.37 through `PPO_CHROMIUM_PATH`, not the repository's pinned Node 24.21.0 and Chrome channel. That is a real difference and the run manifest records the launch method and Node version rather than implying the pinned runtime. The pinned runtime result comes from the focused workflow on the contribution; until that run completes, the pinned-runtime pass is **not claimed**.

Exact per-group names, capture hashes and the run manifest are in [the evidence directory](../../../testing/evidence/template-management-r01/README.md).

## 17. Local case coverage against the plan

| Case | Covered by |
|---|---|
| DK06-T01 | Model: register projections. Browser: search, nine filters, empty state, snapshot |
| DK06-T02 | Model and browser: successor preserves the published definition, dependencies and lineage |
| DK06-T03 | Model and browser: reorder retains field identities and bindings; keyboard buttons |
| DK06-T04 | Model: unsupported type, duplicate identity, orphan section, unknown reference, self-reference, cycle, unsupported operator |
| DK06-T05 | Model and browser: zero, false, unanswered, unknown, not applicable |
| DK06-T06 | Model and browser: true, false and unknown branches; unknown cannot hide required content |
| DK06-T07 | Model: hidden restricted binding still fails; unbound mandatory source still warns |
| DK06-T08 | Model and browser: unit mismatch, type mismatch, cardinality mismatch, retired path |
| DK06-T09 | Model and browser: preview bytes and hash verified against `node:crypto` |
| DK06-T10 | Model: six currency conditions. Browser: edit after a passing run |
| DK06-T11 | Model and browser: long content and 0, 1 and many repeating items |
| DK06-T12 | Model and browser: restricted exclusion before rendering, with no leak |
| DK06-T13 | Model and browser: protected block cannot be edited or removed |
| DK06-T14 | Model and browser: immutable submission; a response does not close a finding |
| DK06-T15 | Model and browser: changed content resubmission; unconfigured policy; self-review refused |
| DK06-T16 | Model and browser: approved, published, future effective and eligible now |
| DK06-T17 | Model and browser: no match, missing context, ambiguous match |
| DK06-T18 | Model and browser: cross-entity and audience mismatch expose nothing |
| DK06-T19 | Model and browser: lost response, refused repeat, reconciliation to one effect |
| DK06-T20 | Model: stale expected version refuses the save. Browser: cross-tab conflict |
| DK06-T21 | Model and browser: reserved render revalidation and no template swap |
| DK06-T22 | Model and browser: issued bytes, hash, identity and acknowledgement unchanged |
| DK06-T23 | Model and browser: response labels and units retained; unit change incompatible |
| DK06-T24 | Model and browser: shared dependency change lists affected families and stales evidence |
| DK06-T25 | Model and browser: withdrawal prevents new use and preserves history |
| DK06-T26 | Model and browser: unsupported profile, unknown schema and partial usage are explicit |
| DK06-T27 | Model: malformed and tampered state. Browser: failed save, malformed state, cross-tab, scoped reset |
| DK06-T28 | Browser: keyboard-only successor, validate and submit journey; tab semantics; focus trap |
| DK06-T29 | Browser: six views at 1440, 1024, 820, 390 and 320 px |
| DK06-T30 | Deterministic assembly; no network request; export claims match behaviour |
| DK06-T31 | Model: escaped active markup. Browser: zero page and console errors |

Every case has executed evidence. None is recorded as planned-only.

## 18. Departures from the build plan

| Plan | Delivered | Reason |
|---|---|---|
| Separate `model.js`, `schema.js`, `preview.js`, `validation.js`, `workspace.js`, `workspace.css`, `template.html`, `source-manifest.json`, `README.md` | As planned | — |
| Preview profiles listed as author, reviewer, publisher, coordinator, restricted Finance and read-only | A seventh profile, *Author and reviewer (same person)*, was added | The plan's self-review prohibition cannot be demonstrated where the two capabilities can never coincide. The extra profile makes the refusal real |
| Publication "atomically records the definition and the intended use assignment" | Also requires an explicit succession confirmation where an open-ended earlier assignment for the same scope exists | Closing a predecessor's interval is a decision, not a side effect. Overlaps that succession cannot resolve are still refused outright |
| Scenario matrix results of passed, failed, not run, blocked or out of date | A sixth result, **not applicable**, was added | A definition with no repeating section cannot execute the repeated-item cases. Reporting them as passed would be false and as not-run would block submission indefinitely |
| Exact definition fingerprint | A real SHA-256 over canonical JSON, computed by a bundled synchronous implementation | Web Crypto is asynchronous and cannot be used in a render path. The implementation is verified against `node:crypto` in the model suite rather than asserted |
| Deferred capabilities include PDF | No PDF bytes are produced and the preview footer says so | Unchanged from the plan; recorded here because the Finance family's `pdf-ua-r1` profile makes the limit visible in the artifact |

No departure changes an adopted standard, an existing requirement identity or an accepted acceptance case.

## 19. Known limits and what is not claimed

- **Nothing here is an operational template.** The proposed revisions exist only in this prototype's declared fixture engine. `supportedTemplateDefinition` in the application still recognises versions 1 and 2 for OUT-09, OUT-10 and OUT-14 only, and no definition in this file is registered there.
- **No PDF.** No PDF bytes are produced. Browser print is an informal preview and is not a controlled PDF or a PDF/UA proof.
- **Preview profiles are not security.** They demonstrate intended interface behaviour. Anyone holding the file can read every fixture in it. Real authorisation, record scope, tenant and company boundaries and retention require server and provider enforcement.
- **Local storage is not a database.** Cross-tab checks refuse stale saves and preserve recoverable input, but no ACID, audit-log or multi-user concurrency guarantee is claimed.
- **The demonstration clock is local.** Runtime effective-time selection must use trusted server time and the adopted policy.
- **Source registration is simulated.** An existing Word, Excel, PDF or native design file can be represented as a source reference in a fixture; unrestricted file import and automatic conversion to structured fields are deferred.
- **The pinned runtime pass is not yet claimed.** Local verification ran on Node 22.22.2 and Chromium 141, not the repository's Node 24.21.0 and Chrome channel.
- **Owner acceptance, physical-device and screen-reader review, database atomicity, restart recovery, real source, renderer, provider and retention behaviour, operational form migration and application integration all remain separate outcomes.**

## 20. Next bounded step

The receiving plan in the [decision record](../../../decisions/document-form-template-management-design.md) proposes **R1 — a read-only template catalogue, exact definition and dependency inspector and usage view over the existing supported pack, report and Finance template records**. That establishes trustworthy visibility before any managed authoring or publication, and it needs no new schema, endpoint or migration.

R1 should not begin until the owner has walked the primary journey in this artifact and any ambiguity or unnecessary effort observed during that walkthrough has been recorded as a refinement.
