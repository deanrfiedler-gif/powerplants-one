# Customers, contacts and sites — native server contracts

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Synthetic implementation under the authorised CS-01–CS-08 programme. Original source: merged main `25170bf83008727f005e36b5603841a7b9359027`, including PRs #283 and #284. This was the first of two dependency-ordered PRs: contracts merged in #285 and native receiving pages, navigation, guides and visual evidence merged in #287. The [completion handover](cs-native-completion-handover.md) records the combined outcome at main `5499df4`. This contract increment alone was not all-page delivery. No deployment or business acceptance is claimed.

## Outcomes and boundaries

- CS-01 projects canonical Organisation and permission-scoped CRM, Estimating, Service, Projects, Finance and Activity context. Exact source links, as-at/completeness and separate currency/measure populations are retained. Unconfigured MYOB orders and general document libraries are not replaced with fictional data or empty totals.
- CS-02/03 add versioned Person correction/active state, affiliation ending and Site primary-contact commands. Current scope, original operation identity, changed-retry refusal and before/after audit apply. Person maintenance requires every company context. Stakeholders are canonical relationships and source reliance, not a new master; recorded roles never imply customer authority.
- CS-04/05 retain Site and Facility identities, hierarchy, source history and installed-versus-served equipment. Existing CS-05 implementation is preserved.
- CS-06/07/08 add exact-scope readiness, account-plan and survey aggregates. [ADR-0042](../decisions/ADR-0042-customer-location-workflows.md) records model choices and alternatives. Immutable revisions, preparation/submission snapshots, reviews, original PNG evidence and caption successors retain prior evidence. Readiness acknowledgement grants no work authority. Planned visits create no booking/forecast/task. Survey handover binds the exact reviewed source without rewriting an Estimate or Engineering basis.

## Migration and authority

Migration 0044 follows the merged SH 0043. It adds three owning tables and five immutable child tables, extends existing identity/audit types, and flushes deferred identity-target events before ALTER. Seed 44 adds only the dedicated fictional `cs-reviewer` and four existing company-A shared/Activity duties. Existing users/grants remain intact. Registry expectations, hosted upgrade gate/counts and reseed allowlists include both 0043 and 0044. No new capability, dependency, ORM or framework is added.

Reads use existing `shared.read`; creation/maintenance use `shared.create/edit`, scoped by workspace, company and exact Site. Private photo reads recheck scope and bytes/hash. Independent review means another permitted editor; it is a synthetic safeguard, not a production role policy. Receiving owners need the existing Estimating/Engineering editing capability. No external business action is performed.

## API and SH integration

Customer workspace/stakeholder and Person workspace reads sit under existing `/api/v1/customers/[id]` and `/people/[id]`. Contact commands use `/people/[id]/revise`, `/customers/[id]/affiliations/end` and `/sites/[id]/primary-contact`.

Closed kinds `Readiness`, `Survey`, `AccountPlan` use `/api/v1/cs/[kind]` for register/create, `/options?context_id=...`, `/[id]`, `/[id]/save`, `/[id]/actions`. Survey private PNG originals/caption successors use `/[id]/photos`. Writes use schema 1, reason, operation UUID and expected version; retained receipts use the existing operation endpoint. CS register/search supports bounded pages and exact UUID cursors.

The merged SH search registry consumes scoped CS readers. The existing personal saved-view contract supports survey Site filters. Submitted/returned survey tasks project into the existing review queue and link back to the owning CS decision. Existing Activity links supply My Work and Activity notifications. No parallel search, notification, task, saved-view or review-decision store is introduced.

## Verification and open definitions

Focused behaviour tests: `tests/database/contacts-native.test.ts`, `tests/database/customer-location.test.ts`, `tests/unit/customer-readiness.test.ts`, `tests/http/customer-location.test.ts`. They cover direct permission failures, cross-Site refusal, concurrency, original operations, reviewed/captured evidence, seasonal and individual applicability, source invalidation, unknown/unit semantics, PNG originals/captions and exact retained handovers. Existing Facility and upgrade suites remain applicable. Actual reconciled results are recorded below before publication.

Optional segmentation, visit cadence, sales/health formulas, customer purchasing authority and operational reviewer policy remain undefined. The implemented fields preserve that uncertainty. PNG is the supported original photo format (4 MiB); content is bounded to 40 rows per collection and 50 exact reference IDs. Owner/device acceptance, live integration and deployment remain outside code assurance.

### Local receiving evidence

Publication successor: [contract PR #285](https://github.com/deanrfiedler-gif/powerplants-one/pull/285) passed all 20 checks and merged externally at `4c8fd6d`. Its broad CI proof passed 546/546 database tests and 44/44 HTTP tests, with Linux units 347/347 and Estimating upgrade 86/86. Native PR #287 subsequently passed all 20 checks at `e11e0b3` and merged externally as `5499df4`; final Linux proof passed 353 units, 546 database and 44 HTTP cases, and both full browser lanes passed 333 cases with 60 intentional skips each. The [native verification index](../testing/evidence/cs-native-completion/README.md) records exact jobs, receiving, main reconciliation and visual evidence. The following paragraph is the original local contract checkpoint, not the final publication status.

Post-#284 focused database command: `node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/contacts-native.test.ts tests/database/customer-location.test.ts` — 11/11 passed. `npm run lint` and `npm run typecheck` passed with the dependent native receiving work present. Readiness unit checks previously passed 3/3. Foundation and prototype checks passed. Full local unit run: 342/347; four Windows path failures reproduced on unchanged pre-SH main, plus a CLI startup timeout under concurrent load to be rerun independently. Upgrade, compiled HTTP/browser and final CI outcomes will be recorded before completion; no unexecuted check is claimed.
