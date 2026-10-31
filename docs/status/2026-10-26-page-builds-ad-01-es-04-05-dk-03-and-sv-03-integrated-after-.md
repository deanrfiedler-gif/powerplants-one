---
title: Page builds AD-01, ES-04/05, DK-03 and SV-03 integrated after #690
date: 2026-10-26
---

Dean decided on 26 October 2026, answering Claude's two questions: "Yes, merge #690 now" and "One integration PR". Under the [Codex build limit](../decisions/parallel-contribution-rules.md#amendment--26-october-2026-codex-build-limit), the six implemented builds had to land before Codex could start another.

- **#690 merged.** [Field readiness P4/P5](https://github.com/deanrfiedler-gif/powerplants-one/pull/690) (migration 0120) merged at `923f1284` from head `58273367`. That head was integrated with main `0a69f685`; 78 checks passed, including all seven required checks, and PT-27 was skipped by design. Dean had waived independent review for #690 only.
- **Four page builds integrated.** This pull request merges, onto main `923f1284`, the unchanged heads of [#696](https://github.com/deanrfiedler-gif/powerplants-one/pull/696) AD-01 identity register (`d94b119a`), [#700](https://github.com/deanrfiedler-gif/powerplants-one/pull/700) Reviews & approvals (`3527e788`), [#701](https://github.com/deanrfiedler-gif/powerplants-one/pull/701) DK-03 Outputs (`26825e43`) and [#697](https://github.com/deanrfiedler-gif/powerplants-one/pull/697) SV-03 Work orders (`1b87f546`). It adds no application code of its own. Every pair of these builds conflicted, and main requires a pull request to be up to date before merge, so landing them one by one would have needed four rounds of rebuilding and full CI.
- **How the conflicts were resolved.** All of them were both sides appending to the same shared list, and every resolution keeps both:
  - CSS `:is()` selector lists in `figma-shell.css` and `my-work.css`, merged one selector at a time; removing either build's scope ID gives back the other build's file exactly.
  - `components.json`, `guides.json`, `register.json` and `ui-baselines.json`, merged as data by entry key. No value was changed differently by two builds, and a line-level cross-check found nothing lost or invented.
  - Component pages and `service-api.md`, where each build's new section follows the earlier ones. #690's P4/P5 subsection stays under its heading.
  - `module-workspaces.ts`, where every build's route rows are kept.
- **Not yet done.** #696 waits for the independent review Claude recommended, because it lists every identity in the workspace through `/api/v1/admin/access`; this pull request is not merged until that review is clear. #695 (migration 0121) now conflicts with main in 69 files that list migration versions; Codex must re-integrate it, and it still needs its own independent review. When this pull request merges, GitHub should mark #696, #697, #700 and #701 merged, provided their heads do not change first.

Checked locally on the integrated tree, with Node 24.21.0 and npm 11.19.0: foundation, naming, prototype, migration numbering, status sources and documentation scope checks, plus the results recorded in the pull request. Database, HTTP and browser proofs run only in CI on the exact head. Automated proof, independent review, owner visual acceptance and production readiness remain separate.
