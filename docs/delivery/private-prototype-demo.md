# Private Prototype Demo package

**Document ID:** PPO-DEMO-PKG · **Revision:** r02 · **Date:** 8 September 2026 · **Owner:** Dean Fiedler — private prototype.

**State:** Definition and runbook prepared. Local instructions are checked against source; this package has not executed a demonstration, deployed a host or granted tester access. Hosted instructions describe the required implementation and subsequent operator sequence.

**Source baseline:** private repository `deanrfiedler-gif/powerplants-one`, `main` at `923bd9b90412c80782331b7085a6880750f12640`, application/source tree recorded in its commit. [Scope decision](../decisions/private-prototype-demo.md) · [Itemised cost model and source meters](private-prototype-demo-costs.json) · [Existing architecture](../architecture/BP-02-platform-architecture.md).

## 1. Purpose and boundaries

**Selected viewing method — 8 September 2026:** Dean prefers the private hosted demo so he can open PPO on his smartphone away from his computer and colleagues can use a link independently. Make authenticated hosted evaluation the delivery target. The host must run independently of Dean's computer, with persistent demo records and individual invited-user access. Local setup remains available for implementation checks and rehearsal; a local presentation or USB-connected preview is not a required user-facing milestone before hosting. The hosting account and actual cost remain unresolved; no live URL is claimed by this decision.

Let a small invited group experience real persisted customer context, opportunity follow-up and manual draft estimating, then give Dean specific desktop/phone feedback. Proposed evaluation: two weeks, five invited accounts including the presenter/maintainer, no more than three concurrent users. These are sizing assumptions; no colleague has been selected or invited.

Two delivery forms share this package:

- **Local presentation:** the existing loopback application on Dean's computer, with fictional records and screen sharing. A separate disposable demonstration database protects Dean's current development work.
- **Private hosted evaluation:** a later authenticated deployment with its own database and protected files. “Private” means invited-user access over an HTTPS internet endpoint; the design does not buy an office-only private network.

Use the current working application, not the design mockups, for behavioural demonstrations. The accepted r08 layout is present at the inspected baseline. Later mobile design proposals must not be described as deployed until their own publication is verified.

This package defines the demo; it does not implement cloud identity, seed an account, spend money or expose the application. P11/P12 work remains separately owned, and the existing plan's integrated/recovery prerequisites for remote sharing remain in force. This is not P13, a new parent requirement, or a company release. Follow-on hosting work must verify current P11/P12 evidence and use a new bounded implementation instruction. Local presentation can use the existing supported local mode.

## 2. Demonstration journeys

The labels DEMO-01–DEMO-04 below are package-local walkthroughs, not replacements for PT/EA/AT acceptance IDs. Timings are presentation allowances.

| Journey | Actor and starting point | Demonstration and expected result | Boundary |
|---|---|---|---|
| DEMO-01 — Customer context; 5 min | Local `coordinator`; hosted Commercial tester. Start `/customers`. | Open the organisation identified by UUID ending `0001` below; inspect its linked person, current site, equipment and recorded history. Explain the unresolved sensor and retained previous unsuccessful fix. Refresh and retain the same record identity. | Customer/site/equipment context; no new ERP customer, real customer information or service authorisation. |
| DEMO-02 — Opportunity to next action; 10 min | Same actor. Start `/crm/opportunities`. | Inspect six prepared opportunities in Board and List; apply the same search/filter and compare returned records. Create a seventh opportunity with an owner, known organisation/site/contact and initial Activity. Complete that Activity with an outcome; record qualification through the canonical form; plan the next Activity. Refresh and reopen the saved record. | Actual stages are Enquiry and Qualified; sales outcome remains Open. No drag-to-stage, close/win/loss, owner transfer or commercial value/close-date claim from unimplemented mockup fields. |
| DEMO-03 — Manual estimate and exact draft; 10 min | Commercial tester with the E1 estimating capabilities. Start `/estimating`, then `/estimating/new`. | Select an existing opportunity; enter the three manual lines below; save version 1. Change labour quantity to 12 with a reason and save version 2. Prepare a quotation from that exact saved version; keep labour included but uncheck its Print choice. Generate/recover the exact draft, reopen its HTML/PDF and inspect the retained version. | AUD excluding tax; fictional prices. Expected v2 sell total A$13,050.50. Labour appears as an included scope allowance of A$1,800.00. Internal costs/source notes must not appear in the draft. Quotation stays Draft; no email, issue, e-signature or ERP action. |
| DEMO-04 — Optional guided service tour; separate session | Presenter on the supported local application, using each appropriate synthetic actor. | Select a service request and work order, explain readiness and show an already verified pack/planner or field/report example. Use the relevant maintained service handover and rehearse that precise route beforehand. | Not included in hosted tester grants, the core timed walkthrough or a complete service-to-Finance acceptance claim. No offline or full PP-01 demonstration is promised by this package. |

Allow five further minutes to capture feedback: task attempted, expected result, actual result, route, device/browser, severity and screenshot if useful. Keep feedback in the existing private repository issue/PR process; avoid creating a new feedback application. Do not include personal or operational records in screenshots.

### Presenter script and useful refusal examples

Start with “This is a working prototype using fictional records. These three journeys are available for evaluation.” Explain current limitations once, then work through the tasks. At the end, ask whether staff could find the customer, understand the next action and prepare/review the draft without assistance.

Use two brief refusal examples: a missing Activity due date is shown as needing a date, and an invalid estimate amount leaves the proposal unsaved with an explanation. A maintainer separately checks cross-company access and expired sessions; ordinary testers are not given administrator or test-isolation identities to demonstrate denials.

## 3. Example dataset and preparation recipe

### Existing baseline records

Keep the standard seed and issued source bytes unchanged. The standard seed includes negative/isolation fixtures and more service records than the visible demo set; these are not all intended for testers. Names are not unique, so select by UUID and context.

| Purpose | Exact existing identity | Display/context |
|---|---|---|
| Demo workspace | `10000000-0000-4000-8000-000000000001` | SYN PPO development |
| Company A | `20000000-0000-4000-8000-000000000001` | External synthetic key `SYN-A`; SYN Greenhouse Demonstration |
| Primary organisation | `50000000-0000-4000-8000-000000000001` | SYN-PPO-ORG-000001 — SYN Greenhouse Demonstration; Company A |
| Previous operator | `50000000-0000-4000-8000-000000000002` | SYN-PPO-ORG-000002 — SYN Previous Operator; retained history |
| Contact | `60000000-0000-4000-8000-000000000001` | SYN Avery Contact; `avery@example.invalid` |
| Current site | `70000000-0000-4000-8000-000000000001` | SYN-PPO-SITE-000001 — SYN Q01 Demonstration Site; Australia/Brisbane |
| Main equipment | `80000000-0000-4000-8000-000000000001` | SYN-PPO-AST-000001 — SYN irrigation controller |
| Unresolved equipment | `80000000-0000-4000-8000-000000000002` | SYN-PPO-AST-000002 — SYN unidentified sensor |
| Local commercial actor | `30000000-0000-4000-8000-000000000001` | `coordinator` — SYN Coordinator |

Sources: [base seed](../../db/seed.sql), [P03 additions](../../db/seed-p03.sql), [CRM seed](../../db/seed-crm-i1.sql), [E1 seed](../../db/seed-estimating-e1.sql). Company B and the second workspace remain inaccessible to ordinary Company A testers. The duplicate-name organisation ending `0005` is not the primary demo organisation.

### Six opportunities to prepare before the meeting

**Standard `db:seed` creates no opportunities or estimates.** The records below are a preparation recipe, not a claim that they already exist or a new executable seed script.

Define `D` as the preparation date in Australia/Brisbane. Resolve relative dates once at preparation, store actual instants and record `D` in the session manifest. At 10:00 Brisbane, the UTC instant is 00:00Z on that date. Existing historical fixture dates remain unchanged. Refresh the demo epoch before later sessions if date-sensitive examples have aged.

For all six: use Company A, the primary organisation, current site and contact above; local owner/Activity owner `coordinator`; pipeline `c1000000-0000-4000-8000-000000000001`; source channel Meeting; source basis “SYN internal demonstration scenario; no customer request”. Enter a relevant need summary and reason. Use the existing UI/domain commands so permissions, operation receipts and audit history are preserved. Let the application allocate readable opportunity references; record the returned UUID/reference mapping instead of guessing counters.

| Local scenario key | Opportunity title | Prepared stage | Activity state at demonstration start |
|---|---|---|---|
| O1 | SYN DEMO — Irrigation controls enquiry | Enquiry | CustomerContact: “Confirm the fictional controls scope”; due D+1 at 10:00. |
| O2 | SYN DEMO — Controls package for draft estimating | Qualified | RelationshipReview: “Review the fictional estimate assumptions”; due D+2 at 10:00. |
| O3 | SYN DEMO — Sensor follow-up overdue | Enquiry | CustomerContact: “Follow up the fictional sensor enquiry”; due D-2 at 10:00. |
| O4 | SYN DEMO — Qualified scope needs its next action | Qualified | Create the mandatory initial Activity, then complete it with “SYN requirements discussed; next review not yet planned”. Do not plan a successor; show Next action needed. |
| O5 | SYN DEMO — Site meeting date to be agreed | Enquiry | CustomerContact: “Agree the fictional site meeting date”; due date unknown with Date needed selected. |
| O6 | SYN DEMO — Propagation greenhouse controls and irrigation review with a deliberately long opportunity title | Qualified | RelationshipReview: “Review the fictional greenhouse controls proposal”; due D at 10:00. |

Create each in Enquiry with its required initial Activity. For O2/O4/O6, use the canonical qualification action, a confirmed need summary and the note “SYN known organisation/site/contact; suitable for a fictional scoping discussion; no purchase authority asserted”. Do not edit stage directly in SQL. The planned baseline is three Enquiry and three Qualified opportunities, all Open; five active Activities and one completed initial Activity after O4 completion. Verify the actual counts and record any additional required workflow steps rather than hiding a discrepancy.

Prepare one saved estimate on O2 and one Ready **Draft** quotation before the meeting as a fallback. DEMO-03 then creates a separate estimate during the presentation. The following values are fictional manual inputs, not supplier prices, company margin policy or an approved quotation.

| Category and description | Quantity / unit | Unit cost AUD | Unit sell AUD | Extended cost / sell AUD |
|---|---|---:|---:|---:|
| Product — SYN Controls package | 1.000 each | 8,000.00 | 10,000.50 | 8,000.00 / 10,000.50 |
| Labour — SYN Installation labour | 10.000 hour | 100.00 | 150.00 | 1,000.00 / 1,500.00 |
| Freight — SYN Freight allowance | 1.000 lot | 900.00 | 1,250.00 | 900.00 / 1,250.00 |
| **Version 1 totals** | | | | **9,900.00 / 12,750.50** |
| **Version 2: labour becomes 12.000 hours** | | | | **10,100.00 / 13,050.50** |

For every line, Source = “SYN manual demonstration assumption”; Source date = D. Included scope = “SYN supply one controls package, installation labour and freight to the fictional site”; Excluded scope = “Civil works and electrical upgrades”; Assumptions = “Fictional prices; access and technical suitability require later review”. Preserve `SYN-EST-ARITHMETIC-01`, three-decimal quantities and two-decimal unit amounts. Tax is not calculated. Cost/sell differences are A$2,850.50 and A$2,950.50 respectively.

Save a private session manifest alongside recovery files: source commit, schema versions, dataset revision, demo epoch, D/timezone, scenario-to-UUID/reference mapping, owner IDs, expected counts, estimate/quote versions and document hashes. It contains only synthetic record mappings; the real tester allowlist is stored separately from Git. A future automated preparer must be idempotent within an epoch, refuse a mismatched dataset and never replay demo operations from an old epoch into a reset database.

## 4. Tester access proposal

Propose up to five individual accounts: Dean/presenter plus up to four invited colleagues or a maintainer. Assign at most three simultaneous hands-on users for the cost/performance assumption. Actual names, Entra tenant and administrator are unresolved; this document creates no invitation or grant.

| Role | Permitted evaluation | Restrictions |
|---|---|---|
| Presenter / Commercial tester | Company A permitted customer context; CRM create/read/edit and owned Activities; E1 estimate and draft preparation. | Separate actor per signed-in human. No generic coordinator identity shared among testers, and no Finance/system/other-company grants inherited from the broad local fixture actor. |
| Customer-context reviewer | Scoped shared customer/site/equipment reads suitable for DEMO-01. | CRM/estimating reads require explicit additional grants; the existing local Observer is not assumed to have them. |
| Technical maintainer | Deployment, recovery and access administration through separate operator credentials. | Infrastructure access does not automatically confer business approval authority. No reset control in ordinary tester screens. |

Implement Entra sign-in for one selected tenant with **assignment required** and a named allowlist. Authentication alone does not mean every tenant member is invited. Map verified issuer/tenant/subject to a distinct PPO actor and Company A grants. Use maintained OIDC or a correctly validated hosting identity boundary, secure HttpOnly/SameSite cookies, HTTPS origin/CSRF checks, revocation and session expiry. Anonymous requests, unassigned users and forged identity headers must fail at the app, APIs and file endpoints. Disable local profile-selection routes in hosted mode.

The hosted role is a narrowly reviewed subset of existing capabilities, not a copy of every SYN Coordinator grant. Require `shared.read`, relevant internal/service-history scope for DEMO-01, `activity.read/edit`, CRM read/create/edit and E1 read/edit/quote read/prepare only where the chosen role needs them; prove the precise set against current services. Retain direct server denials for Finance, scheduling changes, pack/report issue, other companies/workspaces and reset. Unexposed navigation is not an access control.

Keep access until the two-week evaluation ends, then remove assignments and invalidate sessions. Re-entry needs a current assignment. The hosted demo is online-only: do not enable the field offline shell, recovery-capability issuance or private browser caching for testers. No customer portal or external-customer identity is included.

Microsoft documents [Container Apps authentication](https://learn.microsoft.com/en-us/azure/container-apps/authentication) and [Entra configuration](https://learn.microsoft.com/en-us/azure/container-apps/authentication-entra). Tenant/licence checks and actual grant configuration remain implementation prerequisites.

## 5. Hosting configuration and cost

Recommended assessment configuration: Azure Container Apps Consumption in Australia East; one web replica at 1 vCPU/2 GiB; maximum one replica for this bounded demo; scheduled/on-demand worker jobs from the same image, 1 vCPU/2 GiB; PostgreSQL Flexible Server B1MS with 32 GB storage; private Blob storage; Basic image registry; small monitored logs and secrets store. Use the provider HTTPS hostname initially. A warm web instance improves walkthrough responsiveness; this is best-effort availability with no operational SLA.

Use a VNet/delegated-subnet/private-DNS design for database connectivity and verify that the selected services/SKUs support it. The web endpoint remains HTTPS and login-required. Blob containers prohibit anonymous access and are accessed with restricted workload identity. Consumption-only operation here excludes paid private endpoints, NAT, Front Door, dedicated profiles and planned-maintenance add-ons. If the actual network/identity design needs any of these, reprice before provision.

The current local document store requires POSIX permissions, hard links and directory fsync; attaching a generic file share is not evidence of compatibility. Preferred hosted implementation uses the existing document adapter boundary with protected Blob objects, exact hashes and conditional create/retry semantics. The database stores durable object identity; temporary signed download URLs are not permanent keys. No SharePoint or live ERP integration is necessary for fictional demo files.

### Monthly model

Source rates: Azure public **USD** retail API, Australia East, retrieved 7 September 2026. AUD conversion is an explicit budgeting assumption of **A$1.50 per US$1**, not a quoted exchange rate. All values below exclude GST. Free allowances/credits are deliberately not deducted because they may be shared with other subscription workloads. [Machine-readable model](private-prototype-demo-costs.json) retains all 17 quantities, unit rates, meter IDs, effective dates, source URLs and calculations.

| Item | Monthly assumption | USD estimate |
|---|---|---:|
| Web compute | 120 active + 610 idle hours; 1 vCPU/2 GiB | 44.50 |
| Worker compute | 5 aggregate hours; 1 vCPU/2 GiB | 0.76 |
| Requests | 100,000 at paid marginal rate | 0.04 |
| PostgreSQL B1MS | 730 hours at US$0.026/hour | 18.98 |
| Database storage | 32 GB at US$0.138/GB-month | 4.42 |
| Extra backup capacity | 32 GB above included allowance at US$0.095/GB-month | 3.04 |
| Basic image registry | 730/24 days at US$0.1666/day | 5.07 |
| Blob capacity and operations | 5 GB; 100,000 writes and 100,000 reads | 0.69 |
| Log ingestion | 2 GB at paid marginal rate | 6.68 |
| Secrets operations | 10,000 standard operations | 0.03 |
| Network egress | 10 GB at paid marginal rate | 1.20 |
| **Total, rounding after summing exact values** | | **85.40** |

The base converts to **A$128.10**. With **25% contingency**, budget **A$160.12/month excluding GST** (A$176.14 with an illustrative 10% GST addition). Propose a **A$200/month review budget**, subject to an actual subscription quote and purchase authority. This is a demo estimate, not the earlier production allowance or a spending guarantee.

Sensitivity with the same contingency: all 730 web hours active gives **A$283.65/month**; replacing B1MS with B2S gives **A$266.89/month**. At AUD/USD assumptions of 1.40 and 1.70, the base-with-contingency is A$149.45 and A$181.47. Sizing is unbenchmarked: PDF memory, DB burst credits, concurrent saves and page response times must be measured before inviting testers.

Development/support labour, new Microsoft licences, CI overages/artifact storage and extra networking are outside these totals. Local presentation adds no cloud hosting charge. Provider charges continue for database/storage even when the web app is stopped. Set review alerts at A$100/A$150/A$200 and an owner review at the two-week end date; **alerts are not a hard spending cap**. Obtain a fresh quote before purchase and after any sizing change.

The AUD API returned rounded-zero values for very small compute meters; these were not treated as free. USD preview API rates were used. Microsoft says non-USD API values are reference estimates. [Retail API](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices), [billing rules](https://learn.microsoft.com/en-us/azure/container-apps/billing), [PostgreSQL pricing](https://azure.microsoft.com/en-us/pricing/details/postgresql/flexible-server/). Paid environment/private-endpoint/maintenance features incur additional charges; their appearance in the catalogue does not make them part of this baseline configuration.

## 6. Local deployment instructions — existing supported mode

These instructions require a full checkout on the presenting computer, not the partial inspection snapshot used to author this package. Do not reset Dean's ordinary development database. Use a dedicated checkout and the allowed disposable database `ppo_synthetic_test`, provided no tests or other session currently use it. If it is occupied, provision a separate loopback PostgreSQL instance on a different local port rather than renaming the database to a value rejected by the current guard.

1. Select and record a known verified application commit. This package's inspected commit is evidence of source state, not a claim that all its current CI is green. Confirm the current focused CRM/E1 results and unresolved issues before the meeting. Preserve unrelated local changes.
2. Use the exact selected release toolchain. At the inspected baseline: Node 24.20.0, npm 11.19.0 and PostgreSQL 16.15; install from its lockfile. Do not weaken engine checks to use a different installed version.
3. Create a local PostgreSQL role/database following the maintained setup. Copy `.env.example` to ignored `.env.local` in the dedicated checkout and privately set its connection string to `127.0.0.1` and `/ppo_synthetic_test`. Keep `PPO_ENV=local-synthetic`, `PPO_EXPOSURE=loopback`, `PPO_IDENTITY=synthetic`. Set `PPO_DOCUMENT_DIRECTORY` to a new absolute private directory outside every checkout, dedicated to this demo. On POSIX it must have mode 0700; Windows needs appropriate user ACLs.
4. In the project directory, run:

```sh
npm ci
npx playwright install --with-deps chromium
npm run db:migrate
npm run db:seed
npm run db:health
npm run dev
```

5. Open `http://127.0.0.1:3000`, choose `coordinator` and prepare section 3 through the supported forms. The inspected runner applies migrations 0001–0012; `db:health` should show the selected disposable database and 12 migrations at this exact source. Seed receipts are 2,3,4,5,6,7,9,10,11,12; gaps in receipt numbering are intentional. Later releases may add versions; use their declared manifest.
6. Use Generate or recover exact draft for E1 output. A separate terminal can run `npm run documents:worker` to process pending renders; the current command processes a batch and exits, rather than maintaining an always-running service. Confirm exact HTML/PDF can reopen after application restart.
7. Record the session manifest, take a paired DB/file recovery checkpoint and rehearse DEMO-01–03. Use a fresh dedicated browser profile for the demo. Present locally or share the application window; do not tunnel, port-forward or rebind the local launcher for remote access.

The current `npm start` deliberately refuses startup. `npm run build` is a build check, not a hosted launch instruction. Sources: [launcher](../../scripts/local-server.ts), [configuration guard](../../src/platform/config.ts), [database lifecycle](../../scripts/database.ts), [local identity](../../src/platform/identity.ts), [document store](../../src/documents/store.ts), [maintained setup](p08-handover.md#runtime-setup-and-recovery).

## 7. Hosted deployment instructions — implement prerequisites first

No cloud-ready Dockerfile, remote configuration or remote reset command is delivered by this documentation change. The following is an operator runbook whose implementation dependencies are explicit; it must not be converted into a claim that the current local launcher can be uploaded unchanged.

### Required implementation

| Work | Required result and evidence |
|---|---|
| Remote entry point/configuration | Separate authenticated demo mode, production-built Next application, trusted origin/proxy handling, remote TLS database connection and secure sessions. Preserve refusal of the synthetic adapter in shared mode. Local-only tests remain intact. Do not strip host environment markers or forge local gateway headers. |
| Identity and grants | Implement section 4 with individual actor attribution and expiry/revocation; migration/seed credentials separate from restricted web/worker database roles. Disable synthetic identity switching and unsupported mutation surfaces. |
| Files and renderer | Hosted document adapter selected/tested; exact-content retries and hashes preserved; matching Chromium/system dependencies packaged; required template/logo sources included; seed fixtures and renderer durable writes work after restart. |
| Preparation/reset tooling | Implement an epoch-bound demo overlay through domain commands with receipts/IDs and section 3 assertions. Operator-only reset rejects production or ambiguous destinations, revokes stale sessions/intents and separates file namespaces. No raw rewrite of issued fixtures. |
| Packaging and delivery | Image built from an identified commit/lockfile; schema/seed versions and image digest recorded; GitHub/manual authenticated release path documented. A cloud build succeeding is not a journey pass. |
| Readiness | Recheck current P11/P12 prerequisites and demonstrate focused online access, customer/CRM/E1, durable draft, restart and reset cases on the actual hosted environment. All results initially Not run. |

### Operator sequence after prerequisites and hosting authority exist

1. Confirm subscription owner, Entra tenant/admin, five-or-fewer named tester assignments, region/SKU availability, actual quote, evaluation dates and operator. Keep account IDs/allowlists in the approved private configuration store. Record the release commit/image digest and rollback image.
2. Provision one isolated demo resource group/environment, Consumption web app/jobs, image registry, PostgreSQL, private file storage, secrets and bounded monitoring. Initially keep external tester entry closed. Use a default HTTPS hostname; avoid paid optional services absent from the quote.
3. Configure PostgreSQL 16 on a compatible supported patch, required extensions and private connectivity. Verify `btree_gist`/other required migration extensions against the chosen host and run migration/constraint probes with the migration role. Enforce verified TLS; do not disable certificate verification. Application credentials have no schema-reset privilege.
4. Build/push the approved immutable image; configure authenticated demo startup and private storage identity. The new start/migrate/prepare commands must be supplied by the implementation PR; `npm start` from this baseline is not one of them. Create the isolated demo database/schema, seed the unmodified base fixtures, bind tester actors/grants, then prepare the overlay once for the new epoch.
5. Configure HTTPS-only authentication, required user assignment, app-level scope and protected file endpoints before making tester entry available. Verify unauthenticated and unassigned access fails, including direct API/file URLs and attempted identity-header forgery.
6. Run DEMO-01–03 and the focused checks below using the assigned roles. Generate/reopen a draft, restart web/worker and verify retained records/hashes. Prove a clean reset in an isolated rehearsal before the first invitation. Disable outbound business adapters and validate that no real email/ERP/SharePoint command is possible.
7. Record actual evidence and only then enable the selected tester assignments. Dean distributes the reviewed link/instructions through an authorised channel; this package sends no invitations. Keep the prototype banner, version/date, known limitations and support contact visible.
8. Monitor failures/latency/cost during the evaluation. At its end, close entry, retain agreed feedback/checkpoints and remove approved disposable resources. Verify residual database/storage/registry charges. Extend the evaluation only with an updated date and budget review.

See [PostgreSQL extension support](https://learn.microsoft.com/en-us/azure/postgresql/extensions/concepts-extensions-by-engine), [allowing extensions](https://learn.microsoft.com/en-us/azure/postgresql/extensions/how-to-allow-extensions) and [Container Apps storage lifecycle](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts). A provider-supported extension or storage option still requires PPO's own compatibility proof.

## 8. Reset and recovery procedure

Reset discards evaluation changes; restore recovers a prior checkpoint. Neither operation is a software update. Retain one coherent pre-reset checkpoint of DB, files and session manifest for a proposed seven-day recovery window; confirm this retention before an actual reset. Keep real identity configuration and collected feedback separately so they are not lost or re-granted by seed.

### Local reset on the dedicated disposable instance

1. End the session, save feedback and stop web plus all render workers. Check all PPO browser profiles/tabs for unsent evidence. If any exists, recover or deliberately retain it under its original ownership; do not clear it as an incidental cleanup.
2. Verify `.env.local` points to the dedicated instance and `ppo_synthetic_test`; verify its private document directory and release/epoch manifest. Save a database backup and copy the entire matching private file directory to a protected recovery location. Record hashes and the backup tool version. Do not put either in Git.
3. Move/retain the old demo-only document directory and choose a new empty private absolute directory for the new epoch. Preserve Dean's other document directories. Update `PPO_DOCUMENT_DIRECTORY` only in this dedicated checkout. Existing `db:reset` does **not** remove old document files or browser storage.
4. In PowerShell, from the dedicated project directory, run the existing guarded command:

```powershell
$env:PPO_ALLOW_RESET = 'dispose-synthetic'
$env:PPO_RESET_DATABASE = 'ppo_synthetic_test'
try {
    npm run db:reset
    if ($LASTEXITCODE -ne 0) { throw 'Demo reset failed; keep the application stopped.' }
} finally {
    Remove-Item Env:PPO_ALLOW_RESET -ErrorAction SilentlyContinue
    Remove-Item Env:PPO_RESET_DATABASE -ErrorAction SilentlyContinue
}
npm run db:health
```

5. The reset recreates the schema/migrations and standard seed. It does not recreate section 3's opportunity/estimate overlay. Start the local app, use a new dedicated browser profile, log in, rerun the recipe and record a new epoch/manifest. Clear/delete an old demo browser profile only after its unsent-state check; ordinary work profiles are untouched.
6. Verify the named database and expected migration/seed versions; six prepared opportunities with a 3/3 stage split; O3 overdue/O4 next-action-needed/O5 due-date-needed; the selected estimate totals; fresh draft hashes and working file links. Old sessions/old draft URLs must not reveal previous-epoch data. Stop and investigate any mismatch.

### Hosted reset after the new reset tooling exists

Close tester entry and quiesce web/workers; retain the paired checkpoint/feedback; verify the operator-only demo marker, subscription/resource/database identity and expected epoch. Prefer rebuilding a new isolated demo database/file namespace from the pinned release, seed and overlay, then switching only after checks pass. Carry across the currently approved allowlist/role assignments; never resurrect a revoked tester from an old seed or backup. Invalidate sessions and reject old-epoch mutation IDs before reopening.

If reset fails, keep entry closed. Restore the paired pre-reset DB/file/config checkpoint into isolation with outbound workers disabled, verify record mappings, exact document hashes and pending jobs, then select that recovered epoch. Do not automatically retry an unknown external effect. The demo has no live integrations, but the retained operation model still matters.

## 9. Focused verification and handover

| Check | Evidence required before hosted evaluation | Current package status |
|---|---|---|
| Access | Anonymous/unassigned/revoked user rejected; other company/workspace denied; hosted profile selector and privileged routes unavailable; five distinct users retain distinct attribution. | Not run |
| Customer/CRM | DEMO-01/02 completed; Board/List query agreement; retained save/qualification/Activity results after reload and restart; refused validation leaves proposal intact. | Not run |
| Estimate/draft | Exact v1/v2 totals, retained saved predecessor, correct included-but-unprinted allowance, internal-cost exclusion and identical HTML/PDF on reopen. | Not run |
| Storage/restart | App/worker restart and failed render recovery preserve correct file identity and job receipts. | Not run |
| Reset | Paired backup/restore rehearsal; new epoch with correct counts; old sessions/URLs/intents blocked; no unsent browser evidence silently erased. | Not run |
| Devices/performance | Desktop plus actual intended phone browser; 320/390px reflow, keyboard/focus, save status and readable PDF; three concurrent users measured on chosen SKU. | Not run |
| Isolation/cost | Outbound business effects disabled; selected services and alert owner verified; initial observed consumption compared with this model. | Not run |

These focused demo checks supplement existing suites and do not promote parent AT/PT/EA statuses. Record release commit, actual executed environment, date, actor, expected/observed result and screenshot/hash where useful. No independent review or owner acceptance is inferred from documentation checks.

Source inspection covered the root guidance, README/STATUS, BP-02, ordered plan, current CRM/E1 handovers, seeds, runtime/identity/database/document guards and estimating validation/arithmetic. Package arithmetic and source-link validation are recorded with the publication PR; full foundation/prototype/naming assurance uses the repository's existing Documentation assurance workflow. No new application tests or weakened CI gates are introduced by this documentation-only contribution.

## 10. Smallest next implementation and outstanding inputs

Next: implement the private-demo runtime, restricted identity, protected document adapter and epoch-based preparation/reset against the currently verified base, then execute section 9. This package is a concrete input to that bounded task, not its invocation. Keep P11, mobile UI, Projects and portal work under their existing owners/scopes.

The remaining account-specific inputs are: subscription/billing owner; Entra tenant/admin and named tester list; supported region/SKUs and actual quote; evaluation dates; technical operator and agreed checkpoint retention. These do not prevent completing this package. The new implementation PR must supply executable remote build/start/migrate/prepare/reset instructions and actual verification before a hosted link is described as ready.
