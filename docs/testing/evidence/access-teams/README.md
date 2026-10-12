# AD-01 team proposal inspection evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: local bounded verification passed; CI, owner acceptance and deployment remain separate.

## Source and boundary

[Decision](../../../decisions/access-team-inspection.md). Branch `codex/ad01-team-inspection` starts from requester withdrawal #423 at `988a7343f262d4c083200337b7be344b0bb3dbbd`, stacked on #417 at `2579bd9`. Implementation, test and capture source: **17c4827e1d9afe51058a721aa115c8a0fd5eca36**. Later edits are evidence/register/documentation only. No migration, seed, capability, dependency, hosted configuration or deployment changes. All parent IDs and issued `docs/reference` bytes remain unchanged.

The role catalogue now shows the two exact retained team examples with source names/dates, separately resolved current local identities and explicit design-only/unavailable gaps. Membership and lead proposals confer no grant or review authority. Canonical teams, routing and campaigns remain open.

## Executed validation

| Check | Actual result |
|---|---|
| Application | [Build](build.txt), [type check](types.txt) and [changed-file ESLint](lint-final.txt) pass. No source change followed the build. |
| Database | [28 reported tests pass](database.txt), including prior inspection/catalogue/role coverage and five new nested team proofs. Exact source IDs, renamed/inactive local identities, design-only ID collision, hosted ID refusal, another workspace with inspection authority and unchanged users/grants/sessions/request/audit evidence are covered. Existing authority-expiry/working-company refusals cover the extended read. The suite exercises its existing populated 0077→0078 preservation proof and applies the unchanged registry through 0081 for team reads. No migration-pin changes were needed. |
| Browser | [33 checks pass](browser.txt) in compiled Chrome at 1440×960, 390×844 and 320×740. Nine new team scenarios cover keyboard disclosure/provenance, exact person handover, loading/unavailable/denied/working-company clearing and retry, plus inactive/unavailable presentation. The latter presentation and failure states use labelled intercepted responses; actual database authority, issuer and workspace boundaries are tested separately. Existing person/capability/role flows remain covered. |
| Unit | [13 tests pass](unit.txt), including exact retained-model team field/date/ID equality, role proposal provenance, navigation and migration-registry checks. |
| Retained design | [Model assertions](design-model.json) pass. No retained HTML/model source changed; its browser automation was not rerun. This design preview is not native enforcement proof. |
| Register and documentation | [Studio](studio.txt), [foundation](foundation.txt) and [naming](naming.txt) pass. Studio retains 358 entries, 204 routes, 42 component reviews pending, 330 unreviewed and 28 stale page reviews. No accepted fingerprints were assigned. Final evidence additions are followed by the final assurance records below. |

Database execution used only `ppo_synthetic_test`; browser proof used the separate existing local `ppo_synthetic` fixture. Both used the inspected private configuration outside Git, Node 24.21.0, PostgreSQL 16.15 and compiled Chrome 155.0.8059.40. Commands: `npm run build`, `npm run typecheck`, ESLint on the six changed source/test files, Node/tsx test runner for `tests/database/access-inspection.test.ts` (serial, unchanged 120-second limit), the two access inspection/role browser files with one worker, the four selected unit files, and the listed repository assurance scripts. Credentials and connection strings are excluded. Output text is retained as UTF-8/LF with trailing whitespace trimmed; hashes are in [checks.json](checks.json).

## Setup and capture corrections

All application test blocks passed on their first run. [Setup record](setup.txt) retains the initial default-port PostgreSQL startup refusal and its correction to the inspected task-owned loopback port. It was a launcher omission, before tests, not an application failure.

The first two phone element screenshots clipped content inside the app's scrolling main container. They are retained as [initial capture evidence](initial-capture-attempt.json), explicitly unusable for layout acceptance. They were replaced with viewport captures at the actual main scroll positions. No application code or layout was changed to make these captures. [Initial capture output](capture.txt) and [recapture output](capture-phones.txt) remain separate.

## Visual observations

[Eight final captures](captures.json) are bound to source and SHA-256: a desktop native section, two native viewport states at each phone width, and the retained Teams section at all three widths. The implementer inspected all eight. SVG icons were replaced with plain square placeholders in the capture DOM only; the product, source reference and test behavior were unchanged. Native phone viewport framing differs from the full retained sections, so these are not pixel-equivalence comparisons.

The native desktop uses the existing two-column catalogue cards instead of the retained team's stacked tables/support column. Phones stack the same cards with explicit source/current identity text. Dates, names and links wrap; no page-wide horizontal overflow was observed. Rosters extend below the phone fold and require scrolling, and the existing shell title truncates at narrow widths. Unlike the retained preview's Current/Ended membership tags and routing description, native text keeps the historical clock and does not calculate current membership or route reviews. Source-only lead/former-member entries have no application link. The retained separation warnings remain on their original source; no new team-based authority is introduced.

This small existing-page refinement uses ADR-0053 rule 6 and the current component catalogue. No new page/layout choice/Figma design was adopted. Accepted native mockups remain missing. Physical-device, 200% zoom, screen-reader, owner visual and independent security acceptance are still open. This ledger is implementer observation, not owner acceptance.

## Remaining work

Persisted team membership/lead lifecycle, review routing, attestation campaigns and attester/reviewer independence for resulting requests need subsequent bounded contracts and proof. Grant revocation/editing and operational D-020 remain open. CI on the PR stack and owner acceptance are separate from these local passes. No merge or deployment was performed; task-owned application/PostgreSQL services were stopped.

## Final assurance and parent checkpoint

The [final studio](studio-final.txt), [final foundation](foundation-final.txt) and [final naming](naming-final.txt) runs pass after the guide, register and capture additions. Foundation retains all 78 requirements and reports no errors; naming records 7,993 instruction characters. The [parent checkpoint](parent-checkpoint.json) still has #423 at `988a734`, with 11 successful, eight running, 32 queued and one skipped check, no reviews/comments. The [ancestor checkpoint](ancestor-checkpoint.json) retains #417 at `2579bd9`, with 102 cancelled and two skipped checks. Inline comment counts were also zero. These are recorded checkpoints, not final CI passes; the draft PR exposes subsequent status.

Evidence packaging correction: the initial staged-byte audit found CRLF/LF hash mismatches in `initial-capture-attempt.json` and `setup.txt`. The original attempt remains in Git history (`dce4a8b`); checks.json now binds the normalized committed bytes, verified against Git. Application test results and PNG hashes were unaffected.

Publication: [draft PR #427](https://github.com/deanrfiedler-gif/powerplants-one/pull/427), stacked on #423. At initial publication `65a7df4`, CI had one running, 46 queued and one skipped check, with no reviews/comments. Later documentation-only commits do not replace the recorded application/test source; consult the PR for current-head CI.
