# Shared documentation maintenance

Routine feature PRs add a [status fragment](../status/README.md) and maintain the relevant guide, contract, decision or evidence chapter. They leave `README.md`, `docs/README.md`, `docs/STATUS.md`, `docs/decisions/README.md` and `docs/status/legacy-index.txt` unchanged. The combined status and decision views are disposable output under `tmp/documentation/`; never commit them.

An onboarding correction, repository restructuring or correction to the legacy record can legitimately change a protected file. Declare that bounded maintenance in a **new** `YYYY-MM-DD-slug.json` file in this folder, list its exact changed protected paths, and link the decision explaining it. For example:

```json
{
  "kind": "documentation-maintenance",
  "reason": "Correct the local setup entry point after the reviewed tooling change.",
  "decision": "docs/decisions/documentation-source-isolation.md",
  "paths": ["README.md"]
}
```

Use the decision for the actual task; the example above identifies the governing policy. Paths must be unique and must be protected files actually changed by this PR. Wildcards and reused declarations are refused. A declaration explains scope for review; it does not grant approval or authorise unrelated changes. Generated output cannot be exempted. Required contracts, shared controls and design registers are outside this landing-page restriction and still change narrowly with their implementation.

After committing, check the PR diff locally:

```sh
python3 scripts/check_documentation_scope.py --base origin/main --head HEAD
```

The check compares the head with its merge base. Unrelated changes already on newer main do not become this PR's changes; staged and uncommitted edits are not included. CI runs it on the PR base/head in Documentation assurance and the merged-tree job. Missing Git history or invalid declarations fail the check. Existing declarations remain historical records and cannot exempt later PRs.

When bringing an older feature branch forward, preserve its fragment and take current main's landing pages. The generator now writes only ignored output. If an old branch changed the legacy record intentionally, retain that correction with its own maintenance declaration instead of discarding it.
