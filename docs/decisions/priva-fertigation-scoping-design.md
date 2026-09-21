# Priva Fertigation Scoping Workbench — standalone module r01

Status: **Proposed design; native visual review and owner acceptance pending.**

This package implements the requested specialist scoping module for commercial berry farms. It captures the farm, water system, fertigation requirements, existing Priva controls and delivery responsibilities as linked records, then exposes the calculated operating basis and unresolved technical evidence.

The deliverable is one self-contained [HTML file](../../reference/ui/priva-fertigation-scoping-workbench-r01.html). Open it locally in a modern browser. It contains CSS, JavaScript, SVG diagrams and embedded Roboto fonts, with no external runtime dependencies, global search bar or left navigation rail. The opening fixture is explicitly synthetic. **New project** starts an empty real-project scope.

## Scope and conformance

| Item | Declaration |
|---|---|
| Scope identity | Priva fertigation specialist scoping within the existing Fertigation equipment family; no new PPO module identifier allocated |
| Page type | Form / guided workflow, supported by planning and comparison workspaces |
| Theme | User-supplied Powerplants One r22 style board; navy `#242a37`, green `#62bb46`, neutral surfaces, embedded Roboto and shared form/card/table/selection patterns |
| Components reused | Module header, context bar, horizontal tabs, cards, summary tiles, table registers, bordered inputs, badges, right-side inspectors and short confirmation dialogs |
| Intentional boundary | Standalone module interior. The user explicitly excluded the shared navigation rail and global search section |
| Incoming handover | Project/sales brief, farm layout, crop/valve inventory, water analyses, equipment survey, controller audit and customer requirements |
| Outgoing handover | Revisioned technical scope, active operating scenario, calculation basis, evidence register, open questions, responsibility matrix and commissioning criteria |
| Product operations | No live Priva connection, controller writes, supplier approval, commercial quote, application database migration or production integration |
| Repository guidance | Root AGENTS.md, README, STATUS, PPO-STD-001, ADR-0005 and HTML module conformance reviewed; relevant source reference `460cf0b2655daa371cd35169b4a600e3c1af29b7` |

## Implemented workflow

1. **Overview:** active area, population, connected versus operating flow, crop water demand, system concept and actionable scope findings.
2. **Farm layout:** blocks, crop/emitter cohorts, mainline valves, irrigation valves and service allocations; live block schematics and SVG export.
3. **Water and hydraulics:** source/storage, laboratory results, pump/impeller/speed identification, imported curve points, separate required duty and measured duty, optional entered system curve, filtration and pipe transit estimates.
4. **Recipes and dosing:** recipe targets and EC basis, agronomic authorship, stock/product evidence and required injection per group/channel.
5. **Controls and I/O:** Compass, Compact CC, Connext or other/legacy; existing/expansion/replacement/proposed relationship, serial, firmware, licences, backups, compatibility references; physical I/O bank capacity by signal and location; sensors, start strategies and cause/effect schedule.
6. **Operating plan:** simultaneously open valves within each group, sequential scenarios, future-phase toggle, scenario duplication/comparison, preparation/delivery/flush timeline, dry intervals and raw-water inventory.
7. **Unit configurator:** NutriOne, NutriFit, NutriJet Inline, NutriJet Bypass and NutriFlex; explicit shortlist, entered exact-configuration constraints, conditional results and supplier evidence. Published range conflicts remain visible.
8. **Evidence and delivery:** photographs/PDFs or document references, shed/services, drainage/reuse, named scope responsibilities and commissioning criteria.
9. **Scope review:** automatic blockers/review items, owned actions, local revision acknowledgement, retained superseded reviews, named snapshots, snapshot comparison/restore and undo.

Portable JSON preserves record IDs, relationships, evidence and snapshots. CSV templates/import/export support registers with preview and full-candidate validation. Reports include the active basis, diagrams, pump data, all captured registers, open checks and sources. The print action uses the browser print/PDF dialogue; a separate readable HTML report can also be downloaded.

## Calculation and capability boundaries

- Unknown numeric values remain unknown. Explicit zero is distinct from a blank input. Actual counts take precedence over density estimates.
- Independent emitter/hub flow is counted once. Splitter outlet count describes distribution; it does not multiply shared hub flow. Valve allocations exceeding a cohort produce an issue without increasing the physical crop count.
- Connected demand, group unit throughput and pump demand are separate. Backwash/other consumers need a stated route and component-specific demand.
- The first release models a **single shared hydraulic/fertigation circuit** with sequential groups. It does not optimise arbitrary parallel systems or emulate live sensor-triggered scheduling. Multiple-circuit groups are flagged. Repeated dry-interval checks cover the operating window, not overnight coverage.
- Preparation and flush conservatively consume full entered pump flow. Preparation receives no crop credit. Flush receives crop credit only when its crop destination is declared. Additional downtime is reserved after the sequence; the tank graph ends at the last irrigation event.
- Tank inventory uses entered constant reliable refill and phase withdrawals, caps at usable capacity and tracks overflow. Negative inventory exposes unmet water demand rather than claiming physically available negative water.
- Stock injection is final delivered flow multiplied by entered stock dose. EC and pH do not generate chemical recipes or acid demand.
- Head uses entered pressure, elevation and losses at their stated design flow, with water density 998.2 kg/m³ and gravity 9.80665 m/s². Pipe loss, surge, suction/NPSH and pipe selection require engineering evidence.
- Pump curves are piecewise linear only within entered points. The required duty marker does not assert an actual operating point. Efficiency and power points can be retained; no automatic VFD/impeller scaling is applied.
- Product-family publications provide shortlist context only. Exact configuration limits, pressure conditions, channel capabilities and controller support require project-specific source evidence. **Within entered checks** is not supplier or construction approval.
- I/O is not pooled across signal types or locations. Used, reserved and faulty channels must be mutually exclusive; repeated physical bank IDs and unassigned universal channels are flagged. Physical I/O and software licence capacity remain separate.

## Portability, resilience and limits

The file performs no automatic network requests. Official reference links open only when selected. External URLs are restricted to HTTP(S). Captured text is escaped; imported IDs and relationships are validated; CSV formula text is guarded.

Browser storage is best effort. Quota/permission failure leaves the working project in memory with a visible warning and JSON export available. Cross-tab conflicts block automatic overwriting. Unreadable recovery data is retained for download until the user explicitly replaces it. A download-start message does not certify disk persistence.

Supported embedded evidence is PNG/JPEG/WebP/PDF, up to 4 MB each and 16 MB total. The portable project budget is 28 MB, including up to five snapshots. External backups/large documents are references. Scenarios are limited to 20, and a simulation to 5,000 group events. These bounds prevent unsupported large imports from producing unbounded work; they are not performance benchmark claims.

Local review records are unauthenticated acknowledgements. Editing the scope invalidates the current acknowledgement and retains its reviewer, conditions and invalidation reason. Parent-system authentication, formal approval, integrations, CAD/GIS, arbitrary concurrent-resource optimisation, native XLSX export, general unit-switching UI and automated nutrient-mass calculations remain outside this standalone release.

## Executed verification

**51 of 51 focused calculation, integrity and DOM interaction checks pass**, with zero captured DOM execution errors. The [verification output](../testing/evidence/priva-fertigation-scoping-r01/results.json) records individual cases; the [test script](../../scripts/check-priva-fertigation-scoping.cjs) operates on the actual issued HTML.

The checks include independent expected values for the synthetic 3 ha / 11,000-plant / 44 m³/h connected / 28 m³/h peak case, splitter counting, unknown propagation, 56 L/h dosing against a hypothetical 50 L/h channel, typed I/O deficits, 24-minute cycles with 21-minute dry intervals, pipe displacement, tank balance, source EC feasibility, backwash paths, imported identities/references, CSV quoting/formula handling, all nine section renders, all capture inspectors, editing, revision changes, undo, referenced-delete protection, snapshots, report content, blocked reviews and storage failure.

Executed runtime: **Node 24.19.0 and JSDOM 30.1.0**. This is a declared substitute for the repository's pinned native runtime. JSDOM dialog, scrolling, object-URL and print methods are stubs solely to allow DOM event verification. Their browser behaviour is **not** established by these tests.

Native Chromium launch was blocked by the execution environment's socket policy. The available Browser skill separately rejected local `file:` navigation. No security-policy workaround was used. Consequently these remain **not run**: native screenshots, desktop/mobile overflow and 200% zoom, full keyboard/focus behaviour, actual file picker/download/reload behaviour across browsers, real localStorage quota behaviour, print/PDF pagination and the 100-block/1,000-valve responsiveness benchmark. Owner visual acceptance remains pending. Broad application/database suites were not relevant to this additive standalone design package and were not run.

To repeat the focused verification without changing repository dependencies:

```bash
PPO_FERTIGATION_QA="$(mktemp -d)"
npm install --prefix "$PPO_FERTIGATION_QA" --no-audit --no-fund jsdom@30.1.0
PPO_JSDOM_PATH="$PPO_FERTIGATION_QA/node_modules/jsdom" \
PPO_FERTIGATION_RESULTS=/tmp/ppo-fertigation-results.json \
node scripts/check-priva-fertigation-scoping.cjs
```

## Source and output identities

| Item | SHA-256 |
|---|---|
| Supplied build plan `PPO-Priva-Fertigation-Scoping-Workbench-Build-Plan-r01.md` | `7eb6a7174ca4a4cc222dea73bb0c54bf4853dbab68b9abbe94b5d64ef1391a41` |
| Supplied theme `powerplants-one-theme-style-board-r22(6).html` | `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0` |
| Issued standalone HTML | `f3b18fa6bdc59e64224075d9a8b3517b28485813207a6ca4e4bd77a5efa4807f` |

The build plan and theme originals remain preserved. Research references and their interpretation are embedded in the module's **Calculation basis & module information** view and the exported report. No Priva endorsement, technical sign-off, owner design acceptance or runtime integration is implied by this package.
