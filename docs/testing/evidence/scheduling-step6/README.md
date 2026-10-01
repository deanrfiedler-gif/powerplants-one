# Scheduling Step 6 execution record

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Started 1 October 2026. Technical execution in progress; independent acceptance remains pending. This working record does not mark a procedure passed before its results exist.

Baseline: refreshed `origin/main` `95c0887e35369aea90fc5d91b800b299784d19fa`. [PR #332](https://github.com/deanrfiedler-gif/powerplants-one/pull/332) merged at 2026-10-01T03:18:26Z; final checked head `c07ec122c9ba5e8eb70e8c7b09fad787fe3425e3` has 17 successful checks. No open PR existed at inspection. The isolated branch is `codex/scheduling-step6`; unrelated root and worktree edits, earlier databases and evidence remain untouched.

## Acceptance map

The definitions in [PT-28/PT-30 and exit criteria](../../prototype-acceptance.md) remain unchanged. Historical sources below retain their exact environments and limits. The current run will populate observed results here; inherited component counts are not continuous-procedure execution.

| Written obligation | Existing evidence and environment | Current execution and required observable result | Current disposition |
|---|---|---|---|
| PT-28 queued payload v1 | [Earlier update](../offline-compatible-update/README.md), `80b2f41` to `2faa3be`, Windows Chrome phone width, schema 49→50 | Old compiled UI stores accepted response-lost acknowledgements, unsent supported acknowledgement and delayed Start; exact original IDs/hashes retained | Not run |
| Application update and policy/template successor | Earlier update has no policy publisher; [Step 5](../scheduling-policy-interface/README.md) has separate native UI proof | Real compiled baseline `afce0d65` to candidate current main, actual registry 50→54; native scheduling successor is the selected policy alternative, not template publication | Not run |
| Backup/recovery instructions | [P12](../../../delivery/p12-recovery-runbook.md); PT-22 passed separately on `d28cfc25` / identical `aeaf966a` | Stop owned clients; retain private checkpoint, profile and exact store before migration. No restore or repeated PT-22 inferred | Not run |
| Deploy compatible update | Earlier local component only | Local compiled process switches; preserve installed migration rows, apply only registered 53/54 and seeds; ordinary worker update/activation or evidence of unchanged worker | Not run |
| Replay old payload; accept supported once | Earlier six receipt recoveries / one supported acceptance | Compare original receipts after update and rollback; supported unsent v1 gets one acceptance; unchanged retry creates no duplicate acknowledgement/attendance/effect | Not run |
| Try unsupported schema; retain original | Earlier schema-2 explicit fixture | Unsupported original stays intact and owned ReviewRequired; no payload rewrite, new ID or IndexedDB clearing | Not run |
| Publish changed scheduling rule | Steps [3](../scheduling-policy-commands/README.md), [4](../scheduling-policy-enforcement/README.md), [5](../scheduling-policy-interface/README.md) are separate component runs | Reviewer saves exact proposal/full server review; coordinator changes dependency; publisher gets stale refusal; fresh review publishes exact successor; lost response and unchanged retry return same receipt | Not run |
| Inspect issued content and future bookings | Historical return and separate Step 4 file checks | Retained return booking/crew/pin/reservations and HTML/PDF/PNG; immediate hold and typed owned Activity; explicit amendment/reissue only through existing workflow | Not run |
| Future affected work flagged; no silent changes | Step 4 readiness/start/offline enforcement | Policy handover, controlled move and fresh resolution; later real readiness change restores stale hold; old Start remains original and adjudicated by current authority | Not run |
| Software rollback preserves external outcomes | Earlier rollback predates policy enforcement and excludes Finance | Stop candidate; compiled `bfc4b78` retains Step 4 selectors/parsers/readiness/start/offline; same database/schema/files/browser data; exact publication recovery, held Start, reconciled synthetic Finance and reservations retained | Not run |
| PT-28 receipts, preserved payload, impacts, release note | Earlier component artifacts | Private originals plus safe hashes, comparison results and release/runbook handover | In progress |
| PT-30 fresh deterministic seed | [P11](../../../delivery/p11-handover.md), [P12](../../../delivery/p12-handover.md), [selected return](../field-timer-native/README.md#completed-service-return-follow-up) | New task-owned PostgreSQL `ppo_synthetic_test`, store and persistent profiles; installed source/seed identities recorded | In progress |
| Completed P01–P12 | P12 bounded implementation integrated via #166; historical full and component results remain source-bound | Current source ancestry/checks and applicable regressions; do not turn code delivery into acceptance | In progress |
| Previous PT findings dispositioned | P11/P12 historical ledgers and current STATUS | Itemised remaining findings including PT-27 and independent review; full closure requires every applicable prerequisite supported | In progress |
| Full customer-history → return/reservation/Finance narrative | `f1fa3fb` selected desktop/phone journeys; restart `83bccf1`, 61 tables/36 files | Reuse actual UI narrative and distinct Finance actors; pause prepared return through update/policy/restart/rollback, then complete same-order return and exact report | Not run |
| Restart app/database at safe saved stage | Historical actual restart; not PT-22 | Verify stopped/started task PIDs and PostgreSQL postmaster time; same records/files, then continue | Not run |
| Revisit next technician history | Earlier return component | Reopen earlier report, original response, return attendance/evidence/report and exact outputs after actual restart; no inherited Finance/customer closure | Not run |
| Complete persisted result; label limits | Existing independent lifecycle contracts | Work order remains Authorised, earlier AcceptedWithReservations response and Finance reconciliation unchanged; follow-up ownership retained; no live integration/customer message | Not run |
| Commit/environment/walkthrough/results/open defects | All prior sources are historical | Safe execution manifest, source/build/schema, comparisons, original failures/corrections, owner walkthrough and acceptance checklist | In progress |

PT-27's existing sixteen p95 misses (3.42–10.03 seconds against 3 seconds) remain findings in their compiled CI environment. No causal fix follows from a later successful journey. Physical-device, representative screen-reader, owner and visual review remain independent. Step 5's Reports browser timeout remains unexplained unless causal evidence is obtained. No assertion, conditional skip, timeout or performance target is relaxed.
