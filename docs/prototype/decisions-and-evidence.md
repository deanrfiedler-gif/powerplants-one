# PP-01 — Decisions, assumptions and unresolved evidence

**Edition:** v01 · **Status:** Current design disposition, 5 September 2026. [Master decision register](../decisions/decision-register.csv) retains original questions and closure evidence.

## 1. Evidence hierarchy

UC: current user instructions, private prototype ownership and stated business/service problems. DG: guide behaviour inherited through the master; no fresh CREMS reconstruction audit in this package. PO: dated prior account samples only. ER: official technical sources cited in BP-02/ADR-0002, checked for this architecture assessment. PR: all new technical/UI/data/default design proposals. UQ: missing operational/tenant/policy facts.

The package is a future-state design. It does not certify the current CREMS solution, source code, Pipedrive usage, Smartsheet implementation, Finance data or actual MYOB/SharePoint configuration. Test actors/names/amounts/references are fictional. User direction authorises design work; it does not turn a candidate technical SLA or departmental role into an approved operational policy.

## 2. Decision disposition

| Master ID | Prototype treatment | Evidence needed before affected operational use |
|---|---|---|
| D-001 | Dean owns personal prototype; corporate mandate open | Named company sponsor/mandate if company programme proceeds |
| D-002 | Functional roles and capability matrix specified; no staff assigned | Actual delegations, separation/compensating controls, deputies |
| D-003 | Stable repository naming applied; GEN retained; SOL008 separate | Assigned formal programme reference if required |
| D-004 | Planned-service journey selected for requested package; synthetic fixture cohort defined | Real baseline, pilot cohort, benefit measures and acceptance owner |
| D-005 | MYOB facts unknown; fixtures only | Version, companies, licences/modules, approved environment |
| D-006 | Internal adapters/API contracts specified; no actual ERP endpoint asserted | Auth/endpoint/entity/command/delta/reversal/recovery proof |
| D-007 | PlatformSynthetic selected for simulation; ERP-owned alternative documented | Operational order/appointment/time owner and transaction map |
| D-008 | Published technical references only; native CAD retained | CAD product/dependency/storage/publishing constraints |
| D-009 | CREMS reconstruction deferred; no formula invented | Controlled calculation/Screen Systems/questionnaire source and accepted fixtures |
| D-010 | No invented pricing/variation/approval thresholds | Commercial routes, limits and exception authority |
| D-011 | Logical keys/effective history/unknown-state dictionary specified | Actual master ownership, source keys and duplicate/mapping evidence |
| D-012 | Exact manifest/issue/retention boundary specified; synthetic storage | SharePoint locations, consent/access, versions/retention/hold/restore |
| D-013 | Full CRM/Pipedrive parity remains later PPO-009 | Used feature/outcome/history inventory and transition acceptance |
| D-014 | Project-change request hook only; Smartsheet unchanged | Approved process/asset classification and migration scope |
| D-015 | Synthetic calendar/crew/conflict/exception rules specified | Real calendars, skills, travel, booking/delegation/contact policy |
| D-016 | Two-job/24-hour synthetic cache parameter; recovery scenarios defined | Actual devices/browsers, offline duration, quota/encryption/lost-device proof |
| D-017 | FD-10 and selected account fixtures; exact synthetic equality tests | Real field/sign/tax/currency/UOM/rounding/cutoff/tolerance and reconciliation definitions |
| D-018 | Manual coverage and owned follow-up; recurrence/warranty automation deferred | Agreements, entitlement/exclusion, warranty and response-term evidence |
| D-019 | Mandatory-control blocking and technical authority boundary specified | Applicable site/QHSE/biosecurity/shutdown procedures and competent reviewers |
| D-020 | Server capability/scope design; local-only demo identity proposed | Corporate identity/grants, privacy, device recovery and access review |
| D-021 | Measurable synthetic test conditions; operational targets remain candidates | Approved load/support/recovery/retention/accessibility baseline and measured tests |
| D-022 | Partially resolved: BP-02/ADR-0003 prototype stack/design recommendation | P01 feasibility; costed hosting selection and operational architecture approval |
| D-023 | No budget, team, hosting purchase or support commitment | Resource-based costs, responsible maintainer, funding and support agreement |
| D-024 | Three selected output contracts; draft presentation/response semantics | Approved brand/contact/templates/issue/acknowledgement wording |
| D-025 | In-app/manual/simulated communication tasks only | Approved channels, permissions, recipients, sending/delivery/consent rules |
| D-026 | Synthetic reset/restore/release plan; no migration | Source mapping/delta rehearsal, cutover/rollback and approved operational data |
| D-027 | Portals, AI, telemetry, workshop/fleet and optimisation deferred | Separate bounded case/priority/authority |
| D-028 | Owned follow-up model; no group-company operations | Actual aftercare, partner and intercompany responsibilities |
| D-029 | Private personal repository and stable naming confirmed; branch/PR workflow used | Future ownership/recovery, plan/protection capabilities and release/support controls |

Only D-003/D-004/D-022/D-029 are marked partially resolved in the current working register. Other rows may have useful design detail while their required operational closure evidence remains open. No decision is marked fully closed by this package.

## 3. Assumption register

| ID | Explicit assumption | If it proves false |
|---|---|---|
| PA-01 | One private workspace and internal users; no portal | Reassess tenant/customer isolation and external identity before expansion |
| PA-02 | TypeScript/Next.js/PostgreSQL is maintainable for the chosen builder | Supersede ADR-0003 before substantial feature implementation |
| PA-03 | Platform-owned synthetic service is sufficient to demonstrate the journey | Keep adapter boundary; change operational ownership only after D-007 proof |
| PA-04 | Manual Finance processing is an acceptable baseline to model | Specify and prove required API command before enabling automatic processing |
| PA-05 | Assigned-only browser offline capture can meet the real device need | Evaluate managed/native/offline alternatives after device tests; do not weaken data-loss controls |
| PA-06 | Exact issued content can be retained under the eventual document configuration | Choose approved issued-copy/retention storage before live issue |
| PA-07 | Calendar/travel/competency facts can be supplied by authorised owners | Keep booking constraints Unknown/Blocked; do not infer operational availability |
| PA-08 | Source adapters can expose complete/partial/as-at semantics | Label unverified views unavailable/incomplete and retain owned manual verification |

## 4. Design audit risks

Highest implementation risks: cross-booking crew concurrency; immutable document/source linkage during asynchronous generation; offline assignment/revocation and storage failure; Finance quantity conservation/unknown outcomes; operational master overlap. Each has a command guard, source reference, PT scenario and explicit P work package.

No discovery of actual customer network access, financial anomalies or departmental staffing is performed here. Do not import unrelated financial-health or personal information into this repository's synthetic product design.
