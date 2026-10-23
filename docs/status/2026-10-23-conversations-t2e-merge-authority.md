---
title: Conversations T2e merge authority and required-check observation
date: 2026-10-23
---

Dean instructed: "Follow PR #679 through CI, fix any failures, and merge once all required checks pass. Keep calibration and live evaluation unauthorised; do not inspect credentials or make live API calls."

This supersedes the draft/unmerged restriction in the earlier T2e checkpoints. [PR #679](https://github.com/deanrfiedler-gif/powerplants-one/pull/679) is ready for review; the final head, current-main integration, CI failures/disposition and eventual merge outcome are recorded in its ledger. No merge is inferred from a pending check. The owned worktree remains separate from the shared checkout, which is not edited, switched or stashed.

The GitHub connector could not read branch protection (403); the existing GitHub CLI connection returned the actual required-status-check configuration on 23 October 2026. All seven contexts belong to GitHub Actions app 15368:

- Check documentation foundation
- CRM desktop and mobile persistence and interaction proof
- CRM header and board visual checks
- Desktop and mobile browser suite against the compiled application
- E1 manual estimate, draft output and restart proof
- Email Calendar persisted journey and server permissions
- P01–P11 and CRM I1–I2 local application and PostgreSQL proof

The required-check strict setting is false. Repository policy still requires current-main integration and current merged-tree proof; no branch-protection setting is changed or bypassed. The intentional PT-27 comparison skip is separate from the seven required successes.

Claude independently reviewed 99721da67f28d9726ade8f3d186b044c8b9880e0; the [author disposition](../testing/evidence/conversations-t2e/README.md#independent-review-and-author-disposition--23-october-2026) verifies the findings, and 36abfcf2 corrects the sole reported blocker in documentation. No later independent review or formal GitHub review submission is claimed. The current different-model review plus author-disposition rule does not automatically require a second pass after each correction; no waiver is invented.

The [evaluation plan](../decisions/conversations-t2e-evaluation.md) retains its corpus-preparation, exact-run/cost, billing/credit/backstop, strict-metadata-risk, region/retention and private credential-provisioning gates. Merge delivers offline prerequisites only. It grants no live calibration, evaluation spending, model suitability, business acceptance or production readiness. No credentials are inspected and no live API calls are made in this merge task.
