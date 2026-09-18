# Deals r38 application integration

**17 September 2026 · PPO-009 · CRM-02/03/08 · r01**

Dean supplied the latest Deals HTML and requested integration into the Powerplants One app for his subsequent Azure deployment. This contribution adapts the design into the existing React worklist at `/crm/opportunities`. The uploaded HTML remains a reference; its in-memory records and simulated save engine are not served as the application.

| Conformance item | Integration basis |
|---|---|
| Scope | Existing PPO-009 CRM Deals worklist; no new module or parent requirement |
| Page types | Register / worklist, with Planning workspace for Forecast and Record detail snapshots; existing forms remain shared |
| Reference | [Exact uploaded r38 HTML](../reference/ui/crm/ppo-deal-pipeline_r38.html), SHA-256 `eb16502a8cb6cb235a4abbc5ed56e836eaa31d7d2ecba81e594c66a37b1a3b65` |
| Reused components | Application Shell r17; `SalesWorklist`, `useCrmResource`, `useCrmCommand`, `DealDialog`, existing opportunity creation/detail, `ProductIcon`, scoped selectors, saved URL criteria and exact minor-unit totals |
| Incoming evidence | Authenticated current principal; permitted opportunity result page, current server stage definitions, version, owner/contact, amount/date and authorised activity projection |
| Outgoing handover | Existing versioned commands and operation receipts; canonical opportunity and Activity routes; Won retains its owned handover obligation, without ERP conversion or delivery release |
| Exceptions | Loading, denied, failed/changed reads, partial pages, unknown value/date, closed outcomes, command refusal and uncertain-save reconciliation retain their existing service boundaries |
| Authority | User-authorised application adaptation; synthetic fixtures remain test data. Publication does not establish production or owner acceptance |

## Implemented presentation and behaviour

- The top row contains Board, List, Forecast, Archive, a navy Opportunity action, scoped totals, pipeline selection, Help, Filters and Opportunity data options. The quieter second row contains Views, Add condition, removable filter chips, opportunity search, What changed, Triage, sorting and View options. The shared shell still owns global search and navigation.
- Cards use r38's title, organisation, primary contact, close date/value, activity, health and footer composition. Values retain cents. Deal owner and activity owner use separate overlapping initials. The whole body links to the canonical deal; the eye opens the docked snapshot. Footer shortcuts open existing linked activities, documents, activity review, stage movement and editing.
- The stage header contains a name and count. Five desktop stages share one vertical scroll surface, continuous grey columns, white gutters, chevron headers and collapse/expand controls. The existing phone stage selector remains the touch alternative. Comfortable/compact card density is a view preference.
- Dragging uses the existing server-backed stage command, expected version, receipt, original-operation recovery and controlled undo. The native stage button remains the keyboard/touch alternative. Lost/Won drop targets open the existing outcome decision form; a drop is not an accepted outcome. Delete is unavailable because there is no deletion service.
- List exposes separate organisation, primary contact, value, close date, stage/outcome, owner and activity columns. Pointer and keyboard resizing is presentation-only; the opportunity column remains sticky. Documents and activity links initialise the actual detail section.
- Forecast groups saved expected close dates by Brisbane calendar month, with overdue, later and undated buckets. The three/six/twelve-month horizon never removes out-of-horizon records. The date action opens the existing saved information form. Every monetary figure is unweighted, and unknown values remain distinct from zero.
- Archive reads Won and Lost through an additive `outcome=Closed` query option; server permission scope, signed cursor binding and changed-population protection remain intact. All closed/Won/Lost tabs share filters and the List. No schema migration is added.
- Filters and Add condition open the same full-height form. Current search/filter/sort/view settings survive reload and Back through the existing URL contract. Named Views retain criteria for the current visit only; they do not claim cross-device persistence.
- Triage shows open records with overdue, missing or undated activities. What changed lists the most recently updated records on the current result page and links to retained deal history; an updated timestamp is never represented as a historical stage movement.
- CSV export includes only the current permitted result page, with exact decimal strings, empty unknown fields, quoting and spreadsheet-formula neutralisation. Import, bulk cleanup and restore controls are unavailable and explained.

## Deliberate differences from the standalone design

These preserve actual application authority rather than silently adopting the HTML's demonstrations:

| Design area | App treatment |
|---|---|
| Stage identities and configuration | Current server definitions, including Discovery and legacy I1, remain unchanged. Pipeline creation/editing, stage deletion/remapping and probability/rotting configuration need their own versioned services |
| All-pipeline and weighted totals | Totals use the current authorised query page and disclose filters/completeness. No invented probabilities or unfiltered whole-pipeline claim |
| Manual Archive / restore / Delete | Archive currently covers saved Won/Lost only. No deletion, manual archive or restoration service is introduced |
| Rotting and richer health signals | Existing missing/undated/overdue activity signals only; no arbitrary inactivity, quotation expiry or internal-task thresholds |
| Tasks and email | Footer links to existing Activities and Files. Separate internal Tasks and outbound email actions remain outside the available CRM runtime |
| New opportunity | Continues to the existing atomic opportunity + initial Activity form, including required source and qualification evidence |
| Snapshot interaction | Docked right-side presentation retains the existing modal focus/unsaved-change protection |
| Mobile | Retains the app's established phone stage navigation rather than forcing r38's List-only fallback |
| Review history and views | Last-updated records and visit-only named views are labelled accordingly; no fabricated stage history or durable preference service |

## Validation and Azure handover

Local verification used the exact Node 24.21.0 and npm 11.19.0 declared by the repository. All 115 unit tests and the optimized Next.js build passed. The build retained the existing report-template dynamic tracing warning. TypeScript passed. Lint is run on source, excluding generated local review output by moving that output outside the checkout.

Native Chrome 153.0.8010.47 was downloaded, but this workspace refuses Chrome's required `socket()` operation. No successful local browser rendering or visual acceptance is claimed. The unchanged CRM assurance workflow runs the retained component, persistence and restart suites plus new r38 responsive/filter/snapshot/forecast/archive/view checks. A focused database case exercises closed-only pagination, invalid cursor reuse and revoked permission. The corrected native component suite passed on `a5fc3d1`: desktop 1440/1280/1024px and phone 390/320px layouts, filter/snapshot/forecast/archive behaviour, named views, resizing and contextual controls. Original screenshots are retained in [run 35220608647](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35220608647). Initial CI also exposed presentation-switch pagination reset and lost keyboard Activity-owner help; both were corrected while retaining the existing integration assertions. The new Archive denial assertion now checks the actual `Forbidden` service contract. Drag journeys explicitly start on card padding because the r38 card centre contains an independent Activity button. Exact final CI and publication status belong to [PR #233](https://github.com/deanrfiedler-gif/powerplants-one/pull/233).

All six configured required checks passed on `1e34a0a`: 115 unit tests, 54 CRM/shared-shell database tests, 23 CRM workflow browser tests, 17 I2 keyboard/URL/pagination tests, 30 native layout checks, 186 compiled application browser tests and actual application/PostgreSQL restart verification. Required Estimating and Email/Calendar gates passed. Final native screenshots at 320/1024px were reviewed again. Main then advanced with the recovered Sales Aftercare design package (`6770bc5`); its documentation is preserved through a second merge. This reconciliation changes no application source from the fully checked revision. Fresh checks and final merge status remain on PR #233.

This change adds no database migration, dependency, Azure resource, workflow, identity, credential or live integration. The current main-only [Update Azure private demo workflow](../../.github/workflows/azure-demo-deploy.yml) is retained. After this PR is merged and its required checks pass, Dean can select **main**, run operation **check**, then **deploy**. Deployment builds that run's entire main commit; the existing database verification gate must pass for all included source. If the hosted database lags other migrations, review that separate upgrade requirement rather than bypassing verification or choosing an upgrade solely for this UI change. No Azure deployment was run for this contribution.
