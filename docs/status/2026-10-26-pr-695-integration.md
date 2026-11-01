---
title: PR 695 current-main integration and verification
date: 2026-10-26
---

Integrated main 55722e8226b62c2a0e2e3bfe67b38b104bb09590, retaining migration 0119 before this branch's 0121; 0120 remains separately owned by #690. Reconciled exact migration histories and the hosted upgrade count. The populated 0118 S3 proof explicitly expects 0119 and 0121 while preserving its original ledger and seed receipts.

Dean instructed that existing builds be completed before implementation is pushed to any other claim. This contribution is limited to the existing PR. No merge or deployment is authorised.

Local foundation, naming, status-source, migration-numbering, design-register and whitespace checks passed on the integrated working tree. TypeScript passed. Application checks and final-head CI are in progress; no completed CI run, independent review, visual acceptance or production readiness is inferred. Original validation and review limitations remain in the PR.

Main advanced to f8ea675ef0c8394dc04b101f837fdcf445356f7e as PRs #694 and #713 landed. Integrated that documentation-only update as well, including the adopted owner build limit and Figma audit. No application, test, database, script, dependency or workflow bytes changed in this second integration. The full local unit suite, TypeScript and ESLint passed on the retained application source. Final-head CI remains a separate pending check.

Database CI exposed missing 0119 expectations in the populated 0118 reserved-migration cases for the assistant and Service finding follow-up upgrades. An audit of the 71 affected database, upgrade-helper and demo test files found the same omission in intake. Added the explicit 0118 branch to all three exact migration-ledger assertions; the 0119 cases still expect only the reserved migration and 0121. Evaluated all 24 historical cases against the pinned migration registry. Seed ledgers, snapshots, grants, receipts and replay assertions are unchanged; 0119 has no seed entry. The local environment remains unavailable, so exact-head CI validates this final correction.

Integrated current main 0a69f685745a546ac2ce77a690ab893cdfc73a6c, retaining the FigJam workflow-board register from PR #709.

The shared P11 journey could lose its keyboard position when a CS-04 Site refresh remounted the Owned follow-up list, or skip the target page during its loading state. Imported the exact test-only correction and regression from PR #710 (8f2b9a363a4071c3bcbe272435c8581277e3fe29), preserving this branch's existing journey setup. Page selection uses the UI's scoped response; pagination still uses native Tab and Enter, with a bounded retry only after an observed same-cursor refresh. The original keyboard-step limit and test deadlines remain unchanged. No application focus-restoration feature is implemented.

The source fix's exact-head CI completed with 71 successful checks and the expected manual-workflow skip. On the integrated PR #696 source, the three test files passed ESLint and TypeScript locally; this workspace blocked Chrome socket creation, so no local browser pass is claimed. Fresh exact-head CI on each receiving branch remains the integration proof. PR #710 remains unmerged; the separate focus-restoration feature stays queued.
