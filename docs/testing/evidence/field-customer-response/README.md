# FI-07 executed evidence

Owner: Dean Fiedler. Synthetic technical verification in progress; this working ledger is updated with executed results before PR delivery. No owner/device/screen-reader/independent visual acceptance or deployment is claimed.

## Starting point and retained evidence

Refreshed main cc27e1e42b04954a33547c98f19ab245b0a1d3ae is FI-06 PR #335's merge. GitHub reports merged 2 October 2026 04:41:08 UTC, final source ace43bdbe3ceb489a085831731b022a1bb2cb683, all 23 checks successful. No overlapping open PR existed at preflight. Root working tree/untracked worktrees and other sessions were preserved. Isolated codex/field-customer-response began at that merge.

Read current instructions, live schema and existing commands. Baseline P09 database all-five responses and separate actual crew acceptance passed 2/2; baseline compiled complete P09 UI return/correction/partial acceptance/return proposal/controlled revisions/all-five response journey passed 1/1 desktop. Original captures, exact outputs, schema dump and baseline database dump are retained in the task-private evidence directory outside Git.

Historical P07/P08/P09, #334 Service inspection and #335 incident evidence retain their original source and claims. This increment does not rewrite them or relabel technical execution as owner acceptance.

## Infrastructure and original failures

Task-owned PostgreSQL 16.15 clusters on loopback 55707 (retained compiled journey) and 55708 (resettable domain verification), each database named ppo_synthetic_test, with max_locks_per_transaction=256. Compiled app loopback 3000. Private credentials, profiles, original queued payloads, databases and raw logs remain outside Git.

Baseline browser startup attempted a second server before the task-owned server was ready (EADDRINUSE); the intended compiled server then served the passing journey. Subsequent proof uses explicit existing-server configuration.

First FI-07 type check exposed the expected 0057 hosted-upgrade review gate, an unsupported Button ref and nullable predecessor typing; corrected without broadening the gate or changing Button. First domain run passed 6/7; FI07-03 incorrectly requested nonexistent coordinator-b identity. Corrected fixture uses existing second-company and its targeted rerun passed 1/1. No product failure is attributed to that fixture error.

## Execution results

Nine new persisted FI-07 cases have passed across the corrected runs (8/9 in fi07-db-03 plus FI07-08 passing in fi07-db-05). FI07-08 originally tried to mutate an accepted attachment's status; the immutable-byte trigger correctly rejected this fixture. It now revokes actual field-read authority. A concurrent local build/test attempt stalled and the 120-second test limit fired; the task-owned build was stopped and retried, with no timeout or assertion changes. The corrected case passed at the unchanged limit.

Compiled baseline build and FI-07 builds passed. One intermediate build was stopped after no progress; its log remains separate. The first new browser journey used a date beyond the seeded policy selection window and was correctly refused. Dates now stay within that policy. The next run exposed heading focus before React commit; focus now follows committed presentation state. The subsequent label-based browser test exposed the wrapped Response concerns selector's ambiguous label text; it now uses an explicit label association. Original traces/captures remain private. Reference comparisons passed on desktop and phone before the journey corrections.

Local unit suite: 566/570; an unchanged detached checkout of refreshed main reproduced exactly the same four failures across its full 570 tests: two P06 Windows private-storage checks, P12 private-root/links and Windows route-source paths. No assertions or environment guards were weakened. Foundation and prototype assurance passed; naming passed after trimming the copy-ready instructions to 7,993 characters. Studio passed with 326 entries, 172 routes, 33 components and no integrity errors; all reviews remain pending. Lint passed.

Desktop and phone native FI-07 journeys passed 2/2 after those corrections. The journey records a marked attendance acknowledgement, loses the HTTP receipt after commit, recovers the unchanged original after reload, issues exact output, records a reservation and a linked clarification, updates/completes the real Activity and preserves all original response facts. The first browser receipt assertion expected 200 although the command correctly returned 201; the fixture now asserts 201. Four-width geometry and actual Chrome 200% zoom passed; reviewed local captures are technical inspection, not independent visual acceptance.

The final offline-correction rejection and populated 0056→0057 preservation cases passed 2/2. Their first additional cluster was accidentally initialised with Windows-1252 encoding and refused existing seed text before reaching FI-07. That failed cluster/log is preserved; the passing rerun uses a separately owned UTF-8 cluster on 55710. The incomplete 55709 attempt is not a product regression. No existing database was replaced.

Final source, remaining regressions, restart/layout evidence and final-head CI are appended as performed.
