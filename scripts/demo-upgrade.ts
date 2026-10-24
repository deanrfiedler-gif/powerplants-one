import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { transaction } from "../src/platform/database";
import { migrationFiles, seedFiles, latestMigrationVersion, demoMigrationFiles, latestDemoMigrationVersion, existingDemoChecksumMatches } from "./migration-registry";
import { demoWorkspace, demoCompany, grantRuntimePrivileges } from "./demo-runtime";
import { ensurePackReviewer } from "./demo-reviewer";
import { bootstrapDemoSchedulingPolicy } from "./demo-policy-bootstrap";

const additions = ["crm.lead.read", "crm.lead.create", "crm.lead.edit", "crm.lead.convert",
  "project.read", "project.create", "project.edit", "engineering.read", "engineering.create", "engineering.edit",
  "email.connect", "schedule.read", "service.work_order.read", "service.ticket.read", "service.work_order.edit",
  "service.readiness.assess", "schedule.contact", "schedule.manage", "cpq.read", "cpq.author", "cpq.calculate"];
const gmailTables = ["ppo.mail_connections", "ppo.provider_messages", "ppo.mail_message_links", "ppo.mail_sync_checkpoints"];
const read = (file: string) => readFile(new URL(`../db/${file}`, import.meta.url), "utf8");
const hash = (sql: string) => createHash("sha256").update(sql).digest("hex");

// Retained for existing callers; the shared implementation lives with the registry.
export { existingDemoChecksumMatches } from "./migration-registry";

// A deliberately bounded existing-demo upgrade, not a second bootstrap path.
// Every database change shares one transaction, including grants and receipts.
export async function upgradeExistingDemo(databaseName: string, tenant: string, apply: boolean) {
  // Reviewed for 0031 (EN-08 commissioning basis and as-built release): twenty-four new ppo.inspection_* and
  // ppo.commissioning_* tables with their guard functions. Four shared CHECK constraints are widened by the 0020
  // OR-append idiom and identity_has_typed_record() is extended in place, inside the AGENTS.md SET CONSTRAINTS pair, so
  // no existing row is rewritten and no value accepted before is refused. The new tables take ordinary privileges from
  // the generic table grant below. Seed 31 runs here because it is above 17: it inserts one PPO-LocalSynthetic user
  // that the hosted sign-in can never select, copies Company A read grants to it from the synthetic coordinator where
  // that identity exists, grants one commissioning duty each and My Work activity.read/edit to existing fictional
  // profiles only, and adds one fictional policy row and four fictional calibration records whose actor list is plain
  // JSON, so a missing fixture identity cannot fail it. It rewrites nothing. No capability is added to `additions`:
  // invited testers keep engineering.read/create/edit, so the commissioning workspace opens for them as preparers with
  // no capture, review, issue or receiving authority. With no policy-named performer, reviewer or issuer among them a
  // hosted package cannot be tested, approved or released. That is a deliberate hosted limit, not a gap to close here;
  // tests/demo/upgrade.test.ts accounts for the one user and asserts that limit. Outputs use the existing document
  // store under their own reserved identities and change no OUT-09/10/14 template definition.
  // Reviewed for 0030 (EN-07 engineering change-impact review): sixteen new tables (ppo.engineering_changes
  // and fifteen ppo.change_*), nine guard functions and their triggers. Five CHECK constraints are widened by the
  // 0020 OR-append idiom, including 0029's material_sources kind, and identity_has_typed_record() is extended
  // in place, so no existing row is rewritten and no value accepted before is refused. The new tables take
  // ordinary privileges from the generic table grant below. Seed 30 runs here because it is above 17: it
  // inserts three PPO-LocalSynthetic users that the hosted sign-in can never select, copies Company A read
  // grants to them from the synthetic coordinator where that identity exists, grants one change duty each to
  // fictional profiles only, and adds one fictional policy row whose actor list is plain JSON, so a missing
  // fixture identity cannot fail it. It rewrites nothing. No capability is added to `additions`: invited
  // testers keep engineering.read/create/edit, so the change workspace opens for them as authors with no
  // review, decision, receiving, verification or closure authority. With no policy-named reviewer among them
  // a hosted change cannot leave "In review". That is a deliberate hosted limit, not a gap to close here;
  // tests/demo/upgrade.test.ts accounts for the three users and asserts that limit.
  // Reviewed for 0029 (EN-06 released materials): eleven new ppo.material_* tables, two guard
  // functions and one deferred allocation trigger. Four shared CHECK constraints are widened by
  // the 0020 OR-append idiom and identity_has_typed_record() is extended in place, so no existing
  // row is rewritten and no value accepted before is refused. The new tables take ordinary
  // privileges from the generic table grant below. Seed 29 runs here because it is above 17: it
  // inserts six PPO-LocalSynthetic users that the hosted sign-in can never select, copies Company A
  // read grants to them from the synthetic coordinator where that identity exists, grants the
  // synthetic source adapter to the two synthetic coordinators, and adds one fictional policy row.
  // It rewrites nothing. No capability is added to `additions`: invited testers keep
  // engineering.read/create/edit, so the materials workspace opens for them with no source adapter
  // and no review, release or receiving authority. That is a deliberate hosted limit, not a gap to
  // close here. tests/demo/upgrade.test.ts accounts for the six users and asserts that limit.
  // Reviewed for 0028: three activity columns arrive with catalogue defaults, so no
  // existing activity row is rewritten and the closed-activity guard is never fired;
  // both new checks hold for every existing row (no start, not date-only). The partial
  // index and the personal ppo.work_view_preferences table take ordinary privileges from
  // the generic table grant below; the table holds criteria only and no authority. No
  // seed, capability, tester grant or hosted identity change is introduced, and My Work
  // reads use capabilities invited testers already hold (activity.*, crm.*).
  // Reviewed for 0027: roots/bases use ordinary typed-table grants and deferred
  // graph checks, with no seed, capability or hosted identity change. Original
  // estimate/version/quote rows and checksums are not rewritten. One estimate
  // per option replaces Opportunity uniqueness only for exact typed E2 roots;
  // legacy creation still materialises its constrained A identity. Existing
  // upgrade tests must exercise both old originals and restricted-role writes.
  // Reviewed for 0026: new typed discovery groups preserve existing E1 A/r01
  // UUIDs and source rows. No seed, grant or quote/price mutation is introduced.
  // Existing generic table/sequence grants cover the new schema; authority tables
  // remain read-only to the runtime role. The new triggers use the same workspace
  // row lock and ordinary table privileges as existing E1 commands. Upgrade
  // compatibility and repeat application require the actual retained DB proof.
  // Reviewed for 0025: the additive format discriminator defaults old records to 1;
  // old line JSON, hashes and outputs are unchanged. The installed arithmetic guard
  // is extended only at its exact known predicate, with no new seed or grant.
  // Retained 0024 review: immutable original-owner capture and transfer companions; no old row,
  // seed, grant or receipt is changed. Seed 24 adds only a local synthetic receiver
  // and a local coordinator own-transfer grant; invited tester grants remain unchanged. The generic migration loop and role grants
  // cover the new functions and tables; the fixed definer function grants only
  // row locks on authority tables, without granting the runtime role write access. Existing-data compatibility stays under the retained
  // upgrade tests. The accepted five-stage demonstration uses a separately prepared
  // database/storage epoch; this function neither resets nor activates that epoch.
  // 0032 review: acceptance tables, Project lifecycle default Active and typed Project Activity
  // links are additive. Seed 32 grants only existing local synthetic profiles; invited testers
  // gain no acceptance authority. No source/receipt is rewritten and no hosted action is run here.
  // 0033 preserves the exact Project event-chain gate with a named acceptance event; no new grants or seed.
  // 0034–0037 add recipient FKs, immutable responses, actor-private recovery and scope disposition history.
  // No further seeds/grants, no replacement of existing issues, identities or receipts.
  // 0038 corrects the EN-08 change trigger variable only; no data or grants change.
  // Reviewed for 0039: ES-02 immutable configuration ownership and revision checks;
  // no backfill, identity-table ALTER, seed, grant or output rewrite. The existing
  // aggregate runtime grants cover this ledger; retain all PJ-09 upgrade guards.
  // Reviewed 0040: additive specialist evidence and immutable policy manifests.
  // No old content, grants or users change. Identity trigger events are flushed
  // before type widening; runtime policy writes are revoked after generic grants.
  // 0041 review: nullable typed Facility columns, immutable reported sources and explicit Asset service links.
  // Existing identity rows, grants and output bytes are untouched; no new seed users or hosted duty.
  // Existing Asset site-move rejection remains. Generic grants cover the two added tables/functions.
  // 0042 review: additive immutable Fertigation source-bound scopes, outputs and evidence.
  // No backfill, seed, users, grants or issued document changes. Pending identity events
  // are flushed before widening the identity registry. Existing generic table grants apply.
  // Schema downgrade is unsupported; old application images ignore these additive tables.
  // 0043 review: four additive personal coordination tables, no seeds/grants/backfill or identity ALTER.
  // Existing grantRuntimePrivileges covers them; rollback leaves unused personal tables intact.
  // 0044: additive CS aggregates, retained snapshots and private photo references.
  // Seed 44 adds one dedicated synthetic CS reviewer with four existing shared/Activity read/edit duties.
  // No existing profile or invited-tester duty, backfill or source changes; identity events are flushed.
  // Existing generic runtime grants cover the new tables. No hosted deployment is run here.
  // 0045 review: typed Equipment evidence and append-only configuration succession.
  // No seed, grants, users, external adapter or historic content rewrite. Historical
  // Asset links keep their Site while new links must match current context.
  // Runtime writes remain checked by current scope and exact applied review.
  // 0046: additive Sales workflow aggregates and immutable review events; 0045 Equipment is included.
  // No seeds, new users, grants or existing source changes. Deferred identities are flushed
  // before ALTER; generic runtime grants cover the new tables. No hosted upgrade is run here.
  // 0047: additive Engineering control children, immutable exact review/issue history and four narrow
  // capabilities. Seed 47 grants four duties only to existing fictional users and adds one synthetic
  // Company A policy. No invited tester receives review, issue, distribution or source authority;
  // no new user, historical migration rewrite, external transaction or identity-table ALTER occurs.
  // 0048 adds synthetic cost-source headers, immutable revisions/reviews and
  // exact estimate-line source bindings. Shared checks are extended with the
  // deferred identity-event flush; old rows, hashes and output bytes are not
  // rewritten. Seed 48 adds one local-only fictional reviewer and three grants
  // copied from the coordinator's Company A scope/validity. Hosted identities
  // gain no source-review or commercial approval duty. Generic table grants
  // cover the additive records; upgrade/reseed proofs retain revoked grants.
  // 0049 adds synthetic Supply Chain coordination and immutable history/evidence.
  // Seed 49 grants only existing local synthetic users, preserves revoked rows on conflict,
  // and adds no hosted user or authority. No inventory/ERP effects; generic table grants apply.
  // 0050 adds personal timer projections/events, a report-freeze guard and narrow
  // offline factual recovery commands. It rewrites no existing evidence, identity,
  // seed or grant. Generic runtime privileges include the additive tables.
  // Existing reports without timers retain their original submission contract.
  // 0051 uses the reserved Maintenance/Warranty slot, including an already-current database.
  // It appends typed records and existing checks after flushing deferred identity events.
  // Seed 51 adds 22 scoped duties to existing fictional principals only; no user or hosted
  // invitation changes. Generic runtime table grants apply. Original rows, ledger hashes,
  // outputs and revoked grants must survive both the ascending and late-slot upgrade.
  // 0053: additive scheduling family, immutable proposals/reviews/publications/impacts
  // and typed Activity companions. Only publication has an identity because the existing
  // receipt FK requires it; pending identity events are flushed before the additive CHECK.
  // Seed 53 binds the exact trusted root and never resets a head or adds users/grants.
  // Runtime grants cover the new tables; immutable triggers and deferred graph checks
  // remain in force. No policy command, tester duty, audit/outbox enum or dispatch change.
  // Former reserved gaps 0051/0052 are reviewed additive installations below.
  // 0054 adds internal-only command evidence and two distinct local synthetic duties.
  // Typed identities flush pending 0026 events; issued sources remain unchanged.
  // Seed replay preserves revoked grants and adds no hosted tester authority.
  // Commands stay unregistered until Step 4 enforcement is proved.
  // 0055 adds immutable Service template/binding/event/output tables only. Seed
  // 55 supplies fictional catalogue versions and an instrument, with no users or grants. Shared
  // attempts and installed SQL/seed bytes remain intact; 0051 and 0052 now install their separate additive domains.
  // 0056 adds isolated incident storage. Seed 56 grants only the three named
  // local synthetic profiles, never hosted testers; existing rows and revoked
  // grants remain unchanged. Populated upgrade/reseed proof is required.
  // 0057 adds one immutable response-context companion and its exact-binding
  // trigger. No existing row, identity, template, seed, grant or user changes.
  // Generic runtime grants cover the companion; invited testers gain no duty.
  // Populated P09 and hosted-upgrade proofs retain originals and ledger hashes.
  // 0058 adds immutable subordinate estimate-review evidence and three explicit
  // local-only grants to the existing source reviewer; no hosted roles, users or
  // original estimate/quotation/output rows change. Generic runtime table grants
  // cover the sidecar; populated upgrade and exact grant assertions cover the seed.
  // 0059 adds subordinate synthetic release facts and two local-only fixtures; no hosted command duty.
  // 0060 adds immutable subordinate staff response evidence and an internal outbox kind.
  // No seed, identity, grant or hosted user changes; existing generic table privileges apply.
  // Original release/Draft bytes and ledgers are covered by populated and hosted upgrade proof.
  // 0061 adds immutable receiving/plans and native demand links; no seeds or grants.
  // Existing runtime privileges and Supply duties apply; populated upgrades preserve originals.
  // 0062 adds immutable completed-conversion disposition; generic privileges cover it.
  // No seed/grant/user/identity rewrite; exact populated 0061 and hosted upgrades are required.
  // 0064 extends immutable Supply evidence guards, with no seeds, grants or identity changes.
  // 0063 adds subordinate Supply referral/outcome evidence; no seed, grant or identity changes.
  // Generic runtime privileges apply; populated native and hosted upgrades prove preservation.
  // 0065 adds subordinate Receipt correction receiving; no seeds, grants, users or identities.
  // 0066 adds independently received allocation reductions and immediate statement conservation.
  // Reviewed hosted upgrade: no new seed/grant/user; generic runtime privileges include the new table.
  // Native receipts and earlier evidence remain intact on populated upgrades.
  // 0067 adds material receiving/outcomes and guards two existing native commands.
  // No seeds, grants, users, identities or adapters change; generic runtime privileges apply.
  // Populated upgrades preserve earlier evidence, histories, receipts and issued bytes.
  // 0068 adds an optional successor command/receiving role, no grants, seeds or identities.
  // Existing generic PPO table privileges suffice; migration ledger stays unavailable.
  // 0069 adds only optional third-task evidence and guards on the existing material table.
  // Generic table privileges suffice; no grants, seeds, identity ALTER or ledger access.
  // Both earlier payload families and populated native effects must survive this upgrade.
  // 0070 adds optional branch-command evidence and a separate receiving role. No seeds,
  // grants, identities or business-row rewrite. Existing runtime table grants apply;
  // current catalog shape isolates prepared plans. Populated 0069 and hosted upgrades prove preservation.
  // 0071 adds exclusive merge evidence and two receiving roles on the existing table.
  // Earlier columns/payloads remain; no seed, grant, identity or table privilege change.
  // The generic runtime grants remain sufficient; the migration ledger stays restricted.
  // Reviewed 0052: additive typed Products tables; extend live identity/audit/outbox/capability
  // constraints without replacing later definitions. Deferred identity events are drained before ALTER.
  // Seed 52 adds four local-only fictional duties and exact Company A grants. It adds no hosted
  // profile, invitation or capability to additions. Existing hosted testers receive no Products access.
  // Reserved 0052 remains additive when installed after 0072; exact originals are retained.
  // 0072 adds nullable explicit diamond commands and distinct receiving roles.
  // Earlier rows acquire null only; old position overloads, payloads and original outcomes remain.
  // No seed, grant, user, identity type or output change. Generic runtime grants cover the
  // added functions; no migration-ledger read privilege is introduced. Populated upgrades
  // must prove earlier topology recovery and complete preserved records.
  // 0073 adds empty immutable Lead resolution/transfer companions and guarded
  // owner transitions. Existing capture rows, event/receipt bytes, identities and
  // grants are unchanged; no seed or user is added. Generic table privileges
  // cover the companions. Current-owner editing and target visibility remain
  // application checks; populated upgrades must preserve original recovery.
  // 0074 adds an empty immutable Sales-to-Estimating binding companion.
  // Existing accepted brief hashes, native Discovery/cost rows, receipts and
  // grants are preserved. No seed, user or identity type is added. Generic
  // table/function grants cover the bridge; populated and runtime-role upgrade
  // proofs must verify the new retained evidence and original recovery.
  // 0075 adds an empty immutable Deal outcome-source companion with typed native
  // quote/issue/response references. Historical narrative outcomes, grants, seeds,
  // users and receipt hashes remain unchanged. Generic runtime table/function
  // privileges cover this additive evidence; populated and runtime-role upgrade
  // proofs must retain old outcomes and original recovery.
  // 0076 adds an empty exact accepted Won-to-native-delivery companion. Existing
  // Project/Service source rows, accepted Sales hashes, receipts and authorities
  // remain unchanged. There is no seed, user or grant addition; generic runtime
  // table/function privileges cover it. Preserve original receiving and native
  // creation receipts in populated and restricted-role upgrade proofs.
  // 0077 adds an empty per-person working-company table (NR-18). No seed, user, grant,
  // identity type or existing row changes. Generic runtime table privileges cover it, and
  // users/permission_grants stay read-only to the runtime role. A row only narrows record
  // access to a company the person's grants already reach; it never widens access.
  // 0078 extends the grant catalogue for read-only AD-01 inspection. Seed 78 adds
  // exactly one existing local Systems grant, no users or hosted grants. Runtime
  // users/grants remain read-only; no access-changing command or table is added.
  // 0079 adds request/decision evidence only. Its commands explicitly refuse hosted
  // mode; seed 79 adds three duties to existing local fixtures only, no users.
  // Runtime users/grants remain read-only. No external task or grant apply exists.
  // 0080 installs only a separately authorised local grant application. The application
  // refuses hosted mode, and the runtime still cannot write users/grants. Nullable
  // application columns and extended guards retain original v1/v2 evidence unchanged.
  // Seed 80 adds one duty to the existing local Systems identity; no user or hosted
  // duty. Preserve exact hosted tester grants and all upgrade originals in the proof.
  // 0081 adds empty immutable Projects baseline evidence, no seed, identity or grant.
  // Preserve both AD-01 local duties and all prior hosted rows and receipts.
  // 0082 extends only local request closure and immutable evidence. It introduces
  // no seed, user, grant or hosted command; preserve all existing runtime revocations.
  // 0083 adds immutable local team/roster evidence and one creation duty for the existing
  // local Systems fixture only. Team APIs refuse hosted mode; no tester user/grant
  // changes or authority-table write permissions. Generic table grants add no API authority.
  // 0084 adds immutable local single-grant attestations and one existing-local duty.
  // Review APIs refuse hosted mode; no hosted users/grants or runtime authority writes.
  // 0085 adds the opt-in ES-02 r02 catalogue guard and extends the installed
  // configuration trigger. No backfill, table, seed, user, permission, identity
  // ALTER or output change. Existing r01 writes and hosted grant boundaries remain.
  // 0086 adds CPQ tables and capabilities with no seeded grants/users.
  // 0087 adds empty typed RAID entries and immutable revisions, no seed/user/grant.
  // Existing project.read/edit duties apply; no hosted authority or schedule changes.
  // 0088 adds empty calendar/actual revision tables and baseline companions; existing
  // rows and grants remain unchanged. Runtime table privileges are granted below.
  // Populated/repeated local and hosted upgrades remain required verification.
  // Adapters remain synthetic. CPQ viewing/authoring/calculation is provisioned only
  // by the explicit hosted upgrade below, under the existing bounded tester checks.
  // 0089 adds empty CPQ drafts, rule membership and seal evidence. No seed,
  // grant, user or backfill; schema-1 releases/runs and current head remain intact.
  // The live UI request additionally enables three CPQ tester duties in Company A.
  // Existing revocations are never replaced, invitation/grant expiry is not extended,
  // and disabled/expired/inactive testers receive nothing. Review and publish are
  // deliberately absent: an author cannot approve or activate their own release.
  // 0090 adds empty library tables and three default-denied capabilities. No seed,
  // user, grant or provider integration is added; existing runtime privileges apply.
  // 0091 adds empty retained distribution attempts/events and native-route guards.
  // Three additive outbox kinds preserve existing jobs; no seed, grant, user or
  // identity change. Generic runtime table privileges below cover the new tables.
  // 0092 adds four empty template-proposal/evidence tables with ordinary runtime
  // privileges and three default-denied capabilities. It widens identity/audit
  // constraints using the deferred-identity flush pair. No seed, tester grant,
  // runtime template, policy, existing output or source bytes change.
  // 0093 adds empty immutable publication evidence and denied template.publish.
  // Existing runtime privileges apply; no seed, tester grant, template or policy
  // changes occur during upgrade. Publication later requires explicit scope and
  // pack.check approval; legacy renderer bytes remain unchanged.
  // 0094 adds empty scoped use-policy heads and immutable assignment intervals.
  // No old pointer, grant, seed, user or output changes. Identity extension uses
  // the deferred-event flush. New render guards are inert without an adopted site
  // policy; the generic grants cover the two tables/view and guard functions.
  // template.assign remains default-denied; this is not hosted use adoption.
  // 0095 adds empty, immutable Excel import evidence and line maps. Existing
  // Estimate identity, receipts, outbox kind and runtime privileges are reused.
  // No seed, grant, user or source bytes change; 0093/0094 are integrated.
  // 0096 adds empty successor evidence and read views; no existing rows or seeds change.
  // 0097 widens the Excel-only envelope and replaces repeated full line checks.
  // It rewrites no originals, grants, seeds or identities. The deferred Excel
  // evidence guard prevents large unbound native versions. Existing privileges
  // cover its functions; the populated 0096 upgrade proves preserved rows.
  // 0098 adds empty immutable pricing evidence and extends the Excel guard.
  // Existing native identities, receipt kinds and runtime table grants are reused;
  // no new seed/user/grant or original-row rewrite. Populated 0097 is tested.
  // 0099 adds FX-only conversion/review/binding guards to existing tables.
  // No backfill, table privilege, seed or grant changes; populated 0098 is preserved.
  // 0100 adds nullable landed binding evidence and exact allocation guards.
  // Original values, identities, seeds and grants are retained; existing table privileges apply.
  // 0101 adds isolated synthetic commercial records and identities. No backfill,
  // seed or automatic commercial grants. grantRuntimePrivileges includes the new
  // tables; native source authority and evidence guards remain enforced.
  // 0102 adds empty package records and a nullable immutable release manifest.
  // No seed/grant/backfill; existing schema-wide runtime privileges cover the tables.
  // Deferred identity events are flushed before extending the live type constraints.
  // 0103 adds empty immutable specialist coordination records, no seed/grant/backfill.
  // Existing schema-wide grants cover them; source services retain decision authority.
  // 0104 adds one immutable SQL function naming the DK06-OUT09-2 renderer contract and
  // replaces the insert-only publication guard. No table, row, seed, grant or identity
  // changes; existing publications are untouched and PUBLIC execute covers the function.
  // 0105 adds nullable exact specialist-event references to existing native handovers
  // and guards only opted-in payloads. No old payload/hash, receipt, grant, seed or
  // identity is rewritten. Existing table/function runtime privileges cover the
  // addition; populated 0103/0104 and reserved-Products upgrades prove preservation.
  // This admission does not execute an upgrade or grant hosted specialist authority.
  // 0106 adds immutable work-evidence tables and a default-denied review duty.
  // No data, hashes, grants or seed receipts are rewritten; existing all-table
  // runtime privilege admission covers these objects without assigning the duty.
  // Populated 0025/0105 and reserved-Products proofs retain exact earlier rows.
  // 0107 (field readiness gate) adds empty immutable return, answer and follow-up mappings,
  // widens the outbox kind, pack issue event and two readiness-criterion CHECKs, and replaces
  // validate_readiness_policy, guard_pack_dispatch and pack_owned_follow_up at their known
  // bodies. Seed 107 adds readiness policy SYN-PPO-P04 v2 only: no grant, user or identity.
  // Existing scopes and appointments keep v1, so no hosted booking changes its dispatch rules;
  // only scope revisions saved after the upgrade bind v2. Existing runtime privileges apply.
  // 0108 (Conversations T1b) adds empty thread, message, mention, participant and ask tables, three identity
  // types, two capabilities and one outbox kind, and replaces the notice source CHECKs with a per-source guard.
  // No original row, hash or receipt is rewritten. Seed 108 copies live crm.opportunity.read/project.read grants
  // of PPO-LocalSynthetic users only as conversation.read/post, so no hosted tester (PPO-EntraDemo) gains either
  // capability and exposure there stays a separate decision. Existing runtime privileges cover the new objects.
  // That decision (Dean, 18 October 2026; PPO-CONV-T1C-DESIGN 10.3) is the tester-conversations stage below: it adds no
  // migration, seed or user, and copies an enabled invited tester's live deal/project read grants as the two duties.
  // 0109 (D-025 S2 customer communication core) adds empty immutable communication, ledger,
  // follow-up, preference, switch, template and synthetic-mailbox tables, the binding allowlist
  // rows, four identity types, eight outbox kinds and two default-denied duties. No seed, grant,
  // user or existing row changes; every class stays Off, and the hosted worker does not drain the
  // synthetic queue. Existing all-table runtime privileges cover the new tables.
  // 0110 (Conversations T2b) adds empty agent-turn, answer-part and budget-ledger tables,
  // nullable agent message columns, the AssistantTurn identity and conversation.agent.ask.
  // Seed 110 replays as the owner: it copies only active PPO-LocalSynthetic posters' live grants
  // and inserts the workspace ceiling. Hosted testers gain no ask duty. Carl remains off there;
  // existing all-table runtime privileges cover these objects, with no provider or hosted worker.
  // 0111 adds two initially empty Activity extension/binding tables and a binding
  // validator. Existing rows, identities, grants, seeds and hosted users are unchanged;
  // all-table runtime privileges cover both new tables. No external worker is added.

  // 0112 adds an empty immutable customer-statement table and one outbox kind.
  // No identity, grant, seed or existing row changes; all-table runtime privileges cover it.
  // 0113 replaces the deferred Sales/Estimating binding guard only. It preserves the existing
  // link command and permits exact evidence from reviewed workspace creation. No tables, rows,
  // grants, users or seeds change; existing runtime privileges and historical receipts remain.
  // 0114 shortens newly allocated synthetic references while continuing existing counters.
  // Existing assigned references, evidence hashes and seeds remain unchanged. Only unnumbered
  // surveys receive a first reference; photos gain original-format facts with historical PNG defaults.
  // No capability, grant, identity provider or operational namespace is enabled. Existing table
  // privileges cover the additive fields; the migration flushes deferred identity constraints.
  // 0115 adds explicit reading attribution. Existing attempts gain only a zero contract
  // marker: hashes, readings, snapshots and issued output bytes are unchanged. The empty
  // attribution table uses existing all-table runtime grants; no seed, user or grant changes.
  // 0116 adds empty Nursery discovery history, using existing all-table runtime grants.
  // It changes no existing rows, identities, users, seeds or permissions.
  // 0117 adds empty immutable assessment history and retained HTML outputs under the
  // same runtime table grants. No existing rows, seeds, identities or permissions change.
  // 0118 adds the call core using existing all-table runtime grants. No existing rows, users, seeds
  // or permissions change; CallEvent becomes an identity type under the identity_target rule, and
  // each non-blank Person phone is copied, unread and flagged as needing checking, into contact numbers.
  // 0120 adds immutable preparation terms and deadline-task mappings, plus typed
  // SiteReadiness evidence. Existing contacts gain DateAgreement/null defaults;
  // old receipts, scheduling policies, issued snapshots and hashes are preserved.
  // Seed 120 adds P04 v3 and synthetic preparation terms only. Existing scopes
  // remain pinned; no user, identity, capability or grant is added. Existing
  // all-table runtime privileges cover the new objects; no external sender is enabled.
  if (latestMigrationVersion !== 120) throw Error("Review the existing-demo upgrade for this release.");
  console.log("Demo upgrade stage: load-release");
  if (latestDemoMigrationVersion !== 3) throw Error("Review the existing-demo upgrade for this release.");
  const migrations = await Promise.all(migrationFiles.map(async file => ({
    version: Number(file.slice(0, 4)), sql: await read(`migrations/${file}`),
  })));
  const demoMigrations = await Promise.all(demoMigrationFiles.map(async file => ({
    version: Number(file.slice(0, 4)), sql: await read(`demo/${file}`),
  })));
  console.log("Demo upgrade stage: connect");
  await transaction(async db => {
    console.log("Demo upgrade stage: validate-target");
    if (!apply) await db.query("SET TRANSACTION READ ONLY");
    await db.query("SELECT pg_advisory_xact_lock(10001)");
    const role = `${databaseName}_app`;
    if ((await db.query("SELECT current_database() AS name")).rows[0].name !== databaseName ||
        !(await db.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount)
      throw Error("The existing database and runtime role must match.");
    console.log("Demo upgrade stage: migration-history");
    const installed = await db.query("SELECT version,sha256 FROM public.ppo_migrations ORDER BY version");
    if (installed.rows.some(row => !migrations.some(m => m.version === row.version)))
      throw Error("Unknown migration history; preserve and review this database.");
    for (const m of migrations) {
      const prior = installed.rows.find(row => row.version === m.version);
      if (prior ? !existingDemoChecksumMatches(m.sql, prior.sha256, m.version <= 17) : m.version <= 17 || !apply) {
        const stored = prior ? (/^[a-f0-9]{64}$/.test(prior.sha256) ? prior.sha256 : "invalid") : "missing";
        console.error(`Demo migration mismatch: version=${m.version} expected=${hash(m.sql)} stored=${stored}`);
        throw Error("Missing baseline or incompatible migration; preserve and review this database.");
      }
    }
    console.log("Demo upgrade stage: identity-history");
    const identities = await db.query("SELECT version,sha256 FROM public.ppo_demo_migrations ORDER BY version");
    if (identities.rows.some(row => !demoMigrations.some(m => m.version === row.version)))
      throw Error("Unknown hosted migration history; preserve and review this database.");
    for (const m of demoMigrations) {
      const prior = identities.rows.find(row => row.version === m.version);
      // Version 1 is the issued baseline and must already be recorded; later hosted
      // migrations may legitimately be pending, but only an explicit apply installs them.
      if (prior) {
        if (!existingDemoChecksumMatches(m.sql, prior.sha256, m.version === 1))
          throw Error("Existing hosted identity migration must match.");
        continue;
      }
      if (m.version === 1) throw Error("Existing hosted identity migration must match.");
      if (!apply) throw Error("Pending hosted migration; use the explicit upgrade-and-deploy operation.");
    }
    console.log("Demo upgrade stage: seed-history");
    const receipts = await db.query("SELECT version FROM ppo.seed_receipts");
    if (receipts.rows.some(row => !seedFiles.some(([version]) => version === row.version)) ||
        receipts.rows.some(row => !installed.rows.some(m => m.version === row.version)) ||
        seedFiles.some(([version]) => (version <= 17 || !apply) && !receipts.rows.some(row => row.version === version)))
      throw Error("Missing baseline or unknown seed receipts; preserve this database.");
    if (apply) {
      for (const m of migrations.filter(m => !installed.rows.some(row => row.version === m.version))) {
        console.log(`Demo upgrade stage: apply-migration-${m.version}`);
        await db.query(m.sql);
        await db.query("INSERT INTO public.ppo_migrations(version,sha256) VALUES($1,$2)", [m.version, hash(m.sql)]);
      }
      // Only the additive fixture-grant seeds; never replay old fixture data.
      for (const [version, file] of seedFiles.filter(([v]) => v > 17)) {
        if (receipts.rows.some(row => row.version === version)) continue;
        console.log(`Demo upgrade stage: apply-seed-${version}`);
        // Seed 53's issued SQL describes the later fresh fixture. Older hosted
        // P05 roots retain their original expiry; bind only the reviewed exact
        // root variant, without changing installed SQL, policy rows or pins.
        if (version === 53) await bootstrapDemoSchedulingPolicy(db, await read(file));
        else await db.query(await read(file));
        await db.query("INSERT INTO ppo.seed_receipts(version) VALUES($1)", [version]);
      }
      // Hosted-only schema before the grants below, so new tables are covered by them.
      for (const m of demoMigrations.filter(m => !identities.rows.some(row => row.version === m.version))) {
        console.log(`Demo upgrade stage: apply-hosted-migration-${m.version}`);
        await db.query(m.sql);
        await db.query("INSERT INTO public.ppo_demo_migrations(version,sha256) VALUES($1,$2)", [m.version, hash(m.sql)]);
      }
      console.log("Demo upgrade stage: runtime-grants");
      await grantRuntimePrivileges(db, databaseName, role);
    }
    console.log("Demo upgrade stage: tester-capabilities");
    const missing = await db.query(`
      SELECT t.user_id,cap,least(t.expires_at,g.valid_to,r.valid_to) AS expires_at
      FROM ppo.demo_testers t
      JOIN ppo.users u ON (u.workspace_id,u.id)=(t.workspace_id,t.user_id)
      JOIN ppo.permission_grants g ON (g.workspace_id,g.user_id)=(t.workspace_id,t.user_id)
        AND g.capability='crm.opportunity.edit' AND g.company_id=$2 AND g.scope_type='Company' AND g.scope_id=$2
      JOIN ppo.permission_grants r ON (r.workspace_id,r.user_id)=(t.workspace_id,t.user_id)
        AND r.capability='shared.internal.read' AND r.company_id=$2 AND r.scope_type='Company' AND r.scope_id=$2
      CROSS JOIN unnest($4::text[]) AS cap
      WHERE t.workspace_id=$1 AND t.tenant_id=$3 AND t.enabled AND u.active
        AND u.issuer='PPO-EntraDemo' AND u.subject_id=t.tenant_id::text||'/'||t.object_id::text
        AND t.expires_at>clock_timestamp() AND g.valid_from<=clock_timestamp() AND r.valid_from<=clock_timestamp()
        AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp()) AND (r.valid_to IS NULL OR r.valid_to>clock_timestamp())
        AND NOT EXISTS(SELECT 1 FROM ppo.permission_grants old WHERE old.workspace_id=t.workspace_id
          AND old.user_id=t.user_id AND old.capability=cap AND old.scope_type='Company' AND old.scope_id=$2)`,
    [demoWorkspace, demoCompany, tenant, additions]);
    if (!apply && missing.rowCount) throw Error("Existing testers need the explicit upgrade-and-deploy operation.");
    for (const row of missing.rows) await db.query(`
      INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_id,valid_from,valid_to)
      VALUES($1,$2,$3,$4,$3,clock_timestamp(),$5) ON CONFLICT DO NOTHING`,
    [demoWorkspace, row.user_id, demoCompany, row.cap, row.expires_at]);
    console.log("Demo upgrade stage: tester-conversations");
    // Rule T1-1 for invited testers, as seed 108 does for local profiles: each live crm.opportunity.read or project.read
    // grant becomes conversation.read and conversation.post in exactly its scope and validity. A duty already held in that
    // scope, live or revoked, is left alone, so a later revocation survives a retry. Pack reviewers hold neither read.
    const conversations = await db.query(`
      SELECT DISTINCT ON (g.user_id,duty,g.scope_type,g.scope_id)
        md5('ppo-conversations-t1c2:'||g.id::text||':'||duty)::uuid AS id,g.user_id,g.company_id,duty,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
      FROM ppo.demo_testers t
      JOIN ppo.users u ON (u.workspace_id,u.id)=(t.workspace_id,t.user_id)
      JOIN ppo.permission_grants g ON (g.workspace_id,g.user_id)=(t.workspace_id,t.user_id)
        AND g.capability IN ('crm.opportunity.read','project.read')
      CROSS JOIN unnest(ARRAY['conversation.read','conversation.post']) AS duty
      WHERE t.workspace_id=$1 AND t.tenant_id=$2 AND t.enabled AND u.active
        AND u.issuer='PPO-EntraDemo' AND u.subject_id=t.tenant_id::text||'/'||t.object_id::text
        AND t.expires_at>clock_timestamp() AND g.valid_from<=clock_timestamp()
        AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
        AND NOT EXISTS(SELECT 1 FROM ppo.permission_grants old WHERE old.workspace_id=g.workspace_id AND old.user_id=g.user_id
          AND old.capability=duty AND old.scope_type=g.scope_type AND old.scope_id=g.scope_id)
      ORDER BY g.user_id,duty,g.scope_type,g.scope_id,g.capability,g.id`,
    [demoWorkspace, tenant]);
    if (!apply && conversations.rowCount) throw Error("Existing testers need the explicit upgrade-and-deploy operation.");
    for (const row of conversations.rows) await db.query(`
      INSERT INTO ppo.permission_grants(id,workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING`,
    [row.id, demoWorkspace, row.user_id, row.company_id, row.duty, row.scope_type, row.scope_id, row.site_id, row.valid_from, row.valid_to]);
    console.log("Demo upgrade stage: tester-role-profiles");
    const missingReviewers = await db.query(`
      SELECT t.object_id,t.expires_at
      FROM ppo.demo_testers t
      JOIN ppo.users u ON (u.workspace_id,u.id)=(t.workspace_id,t.user_id)
      JOIN ppo.permission_grants g ON (g.workspace_id,g.user_id)=(t.workspace_id,t.user_id)
        AND g.capability='crm.opportunity.edit' AND g.company_id=$2 AND g.scope_type='Company' AND g.scope_id=$2
      JOIN ppo.permission_grants r ON (r.workspace_id,r.user_id)=(t.workspace_id,t.user_id)
        AND r.capability='shared.internal.read' AND r.company_id=$2 AND r.scope_type='Company' AND r.scope_id=$2
      WHERE t.workspace_id=$1 AND t.tenant_id=$3 AND t.enabled AND u.active
        AND u.issuer='PPO-EntraDemo' AND u.subject_id=t.tenant_id::text||'/'||t.object_id::text
        AND t.expires_at>clock_timestamp() AND g.valid_from<=clock_timestamp() AND r.valid_from<=clock_timestamp()
        AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp()) AND (r.valid_to IS NULL OR r.valid_to>clock_timestamp())
        AND NOT EXISTS(SELECT 1 FROM ppo.demo_tester_roles dr WHERE dr.tenant_id=t.tenant_id
          AND dr.object_id=t.object_id AND dr.role_key='pack-reviewer')`,
    [demoWorkspace, demoCompany, tenant]);
    if (!apply && missingReviewers.rowCount)
      throw Error("Existing testers need the explicit hosted-role upgrade-and-deploy operation.");
    for (const row of missingReviewers.rows)
      await ensurePackReviewer(db, tenant, row.object_id, row.expires_at);
    console.log("Demo upgrade stage: verify-privileges");
    for (const table of ["ppo.lead_candidates", "ppo.projects", "ppo.engineering_packages", ...gmailTables]) {
      for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
        const access = await db.query("SELECT has_table_privilege($1,$2,$3) AS allowed", [role, table, privilege]);
        if (!access.rows[0].allowed) throw Error("Runtime role needs the explicit database upgrade.");
      }
    }
    // Exercise the restricted role: the upgrade must not make identity writable.
    for (const table of ["ppo.demo_testers", "ppo.demo_tester_roles", "ppo.users", "ppo.permission_grants"]) {
      const identityAccess = await db.query("SELECT has_table_privilege($1,$2,'UPDATE') AS allowed", [role, table]);
      if (identityAccess.rows[0].allowed) throw Error("Runtime role has unexpected identity privileges.");
    }
    console.log("Demo upgrade stage: exercise-runtime-role");
    await db.query(`SET LOCAL ROLE ${pg.escapeIdentifier(role)}`);
    await db.query("SELECT id FROM ppo.lead_candidates LIMIT 0");
    await db.query("SELECT id FROM ppo.projects LIMIT 0");
    await db.query("SELECT id FROM ppo.engineering_packages LIMIT 0");
    await db.query("SELECT id FROM ppo.mail_connections LIMIT 0");
    await db.query("SELECT id FROM ppo.provider_messages LIMIT 0");
    console.log("Demo upgrade stage: commit");
  });
}
