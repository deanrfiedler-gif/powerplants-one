---
document_id: PPO-CS02-VERIFY
title: Contacts, Stakeholders and Relationships r01 verification evidence
revision: r01
date: 2026-09-18
owner: Dean Fiedler
status: Executed local verification on the pinned Chrome channel; CI execution and owner visual review pending
source_commit: 01b9824a63e468b393265b159fa681f83f6e668c
---

# CS-02 / CS-03 r01 — verification evidence

Evidence for the [design HTML](../../../reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-r01.html), SHA-256 `aa97680dadf459aa6fbeaf39c761df124adf6737fb68c62b106589c38eac9a52`, 254,547 bytes.

## Files in this folder

| File | Contents |
|---|---|
| `build-manifest.json` | The deterministic build: HTML hash and byte count, per-source hashes, the pinned contract-source hashes, the base commit and the declared theme edition |
| `model-results.json` | All 103 model groups with their names and results, bound to the HTML SHA-256 and the fixture manifest hash |
| `browser-results.json` | All 62 native browser groups, the browser channel and version, the four viewports, the captured images and the page-error list |

Screenshots are written to `verification-evidence/contacts/`, which `.gitignore` excludes from the repository; the workflow retains them as a build artefact for 14 days.

## Commands executed

From the repository root, on 18 September 2026:

```bash
npm run lint
python scripts/build-contacts-design.py --check
node scripts/check-contacts-model.mjs --write-evidence
node scripts/check-contacts-browser.mjs
python scripts/check_foundation.py
python scripts/check_prototype.py
python scripts/check_naming.py
git --no-pager grep -n -E "^(<<<<<<<|=======$|>>>>>>>)" -- docs
git diff --check
```

## Results

| Check | Floor | Result |
|---|---|---|
| `npm run lint` (`eslint .`) | pass | **Passed, 0 errors** |
| Deterministic rebuild | byte for byte | **Verified** |
| Model and contract fidelity | 45 groups | **103 groups, 103 passed, 0 failed** |
| Native browser | 25 groups | **62 groups, 62 passed, 0 failed** |
| Page errors, console errors, failed requests | zero | **Zero** |
| Horizontal overflow at 1440×960, 1024×768, 820×800, 390×844 | 0 px | **0 px on all six views at all four viewports** |
| Phone targets at 390 px | 44 px | **No interactive target under 44 px** |
| Keyboard-only completion | proposal and duplicate review | **Both completed; dialog and panel focus return confirmed** |
| `check_foundation.py` | pass | **Passed, 0 errors, 3,400 local links checked** |
| `check_prototype.py` | pass | **Passed, 0 errors** |
| `check_naming.py` | pass | **Passed, 0 errors; instructions 7,971 of 8,000 characters** |
| Conflict-marker scan over `docs` | no output | **No output** |
| `git diff --check` | no output | **No output** |

### Browser runtime

`browser-results.json` records `browser_channel: "chrome"` and `pinned_runtime_evidence: true`. The run used the repository's pinned Chrome channel, not a substitute. `PPO_BROWSER_PATH` is available for environments without that channel; a substitute run records `browser_channel: "substitute"` and `pinned_runtime_evidence: false`, and **is not evidence for the pinned runtime**.

## What the checks specifically assert

The model check is written against the real repository sources rather than a copy of them, so the design cannot drift from the rules the running application applies. Among the 103 groups:

- The Person projection is derived from `src/shared/reads.ts` itself and compared field for field, and its absence of `can_edit` and `company_id` is asserted against the Organisation branch that has them.
- `visibility("Person")` is checked clause by clause against the template literal in `reads.ts`, and `scopeSql` against `src/platform/permissions.ts`, including the specific fact that a site-scoped grant can never satisfy a call whose site argument is `NULL`.
- Eleven visibility cases cover both clauses, the site-primary-contact-only case and the cross-company case.
- The directory's sortable and non-sortable columns are derived from `sortSql` in `src/crm/directory.ts`, not asserted from memory.
- The affiliation exclusion constraint is exercised three ways: an overlapping same-label refusal, a different-label acceptance over the same period, and an adjacent-period acceptance.
- Restricted-versus-empty is asserted across every role × organisation × person combination, with zero occurrences of an empty state standing in for a denied one.
- Command honesty: the exported command list is read from `src/shared/commands.ts` and asserted to contain exactly `createPerson` and `addAffiliation` for this record type; a simulated apply is asserted to leave the fixture byte-identical.
- Authority honesty: a banned-phrase scan over the rendered page, permitting only an explicit short list of sentences that deny the claim, each asserted present.
- The theme claim is measured, not asserted: the r20 and r22 boards are parsed and compared, and the check fails unless r22 removes no token, changes no value and adds exactly 24, all of them `--nca-*` or `--ss22-*` aliases. A second group asserts this module declares the whole `--ss22-*` family with the board’s own values, and that every one of them resolves to a token already declared here or to a shadow built from the brand navy.

## Defects found by these checks

Five defects were found during verification and fixed before issue. They are recorded because a check that has never failed has not been tested:

1. `simulateApply` reached its state gate before its idempotency guard, so a repeated apply was refused instead of reporting itself as already simulated.
2. A simulated save failure was masked, because the transient `saving` status overwrote the configured outcome before the write was attempted.
3. A failed or refused dialog submission left the raised proposal in state. The submit handler now snapshots the record collection and restores it on any error.
4. `<label for>` on two toolbar buttons overrode their accessible names.
5. The record-opening name button (26 px) and the pagination controls (38 px) were below 44 px at 390 px width.

Two further defects survived every automated check and were found by the owner opening the page. Both are fixed and both now have checks that fail when they return:

6. No icon-only control rendered its icon: the template's four static `data-icon` placeholders were never painted, so the page-guide button was a blank square and the close controls were empty boxes carrying only an `aria-label`. One placeholder also named an icon absent from the set. Three new groups assert the fix.
7. Only the selected row had column rules, because the r22 ring was applied per cell rather than per row, so adjacent per-cell halos read as column separators. The ring now sits on the row and column rules are drawn on every row. Two new groups assert the fix.

A further issue was found before the checks could run: the source file carried literal control bytes where escape sequences were intended, which broke a regular expression at page load. The control-character test is now written as an explicit code-point comparison, and the builder output is asserted free of stray control bytes.

## What the first CI run found

The focused workflow had never executed when this package was first committed, and its
first run on PR #241 found two things the local checks had not:

8. **`eslint .` failed on seven unused bindings in this package** — an unused workspace-id
   constant in `model.js`, five catch clauses in `workspace.js` that deliberately ignore
   the error, and one in the browser check. The repository lints everything, and that lint
   is a shared step in six workflows, so seven errors in this package turned six unrelated
   checks red: the CRM, E1, Email Calendar and three P11 proofs. **None of those failures
   was caused by a change to the application; all of them were caused by this package.**
   Fixed by removing the unused constant and using the optional catch binding where the
   error is genuinely not read. `npm run lint` is now part of the recorded command list
   above, which it should have been from the start.

9. **The skip-link group failed on the runner but not locally.** The fragment navigation
   moved the hash and did not move focus, which browsers are inconsistent about. The page
   now moves focus to the content itself rather than relying on the browser, which is the
   established pattern for exactly this reason, and the check waits for that outcome
   instead of sampling it. The group is also exercised on a fresh load, because the dialog
   in the preceding group restores focus asynchronously as it closes and could steal it
   back mid-group. Three consecutive local runs pass.

## What is not evidence here

- **Native visual review.** Desktop geometry, top-layer dialog rendering, physical 320/390 devices, zoom and print are **not claimable from this environment**. The captured screenshots were reviewed by the agent that took them; that is not owner acceptance.
- **CI execution.** `.github/workflows/contacts-design.yml` is committed but has not run, because this branch has not been pushed. No run ID exists.
- **Business acceptance.** These are component checks against a synthetic fixture. They establish no owner acceptance, no application integration, no accessibility certification and no production readiness.
- **The theme edition is no longer unverified.** PR #239 merged during this work and `origin/main` `be219114` was merged into this branch, bringing the r22 board into the repository. Its SHA-256 is `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0`, matching the build plan and the AD-03 pin, and the measurement confirms the plan’s claim exactly. See report §9.
