---
title: CS-04 component-note compatibility
date: 2026-10-28
---

Dean requested the compatibility correction between [PR #715](https://github.com/deanrfiedler-gif/powerplants-one/pull/715) and [PR #721](https://github.com/deanrfiedler-gif/powerplants-one/pull/721). Owner: this Codex session. [PR #726](https://github.com/deanrfiedler-gif/powerplants-one/pull/726) is a separate, one-level contribution into #715's branch; neither source branch is written directly and no pull request is merged by this contribution. It is documentation maintenance, not a new application build.

**Verified inputs.** #715: `188b8640a1570fccfffc8f5bee412a5722b9dd57`. #721: `8b84cf8d27905442f48995820e0b61fad7758466`. #720's `215cc241d4bec292a72c5c25bf226e7b783133ff` merged during this work; main advanced to `4d4e4d9ca51bd0eb81f9b840c55dee884c5c8d0a`, and #721 was retargeted to main. #719's architecture record remains at `38cd59d0a1d73212ca5895b9f55a544836157ea1`. The relevant placement rule is documented in the [component binding guide](../design/development/component-bindings/README.md); #721 extends it with adjacent consumer notes and a specification-size guard.

**Correction.** The added focus paragraph describes the Site host, not a change to the shared ReadState rules. It is moved verbatim to [the CS-04 consumer note](../design/development/component-bindings/2026-10-28-cs04-focus.md#readstate). Its paired [binding](../design/development/component-bindings/2026-10-28-cs04-focus.json) names `read-state` with an empty `used_on` addition: it registers the note without duplicating existing states, dependencies, consumer keys or alignment items. An inline link in the existing Sites paragraph keeps the note discoverable. ReadState returns from 120 to its frozen 119 blocks; all 52 baseline entries, totalling 1,860 blocks, and the validation rules are unchanged. No blank-line compression or baseline increase is used.

**Additional integration conflict.** #715 also conflicts with current main in ReadState: its revised cursor paragraph overlaps main's appended AD-01 and DK-03 sections. The separate contribution integrates current main, keeps #715's corrected cursor paragraph and preserves both appended sections byte for byte. #715's authoritative [focus decision](../decisions/sites-figma-design.md#8-keyboard-focus-during-follow-up-refresh--26-october-2026), page guide and original status fragment are unchanged byte for byte. The new compatibility work itself changes four files; the PR also carries already-merged main history needed by its older parent branch.

**Validation on the branch and a temporary combined tree with #721.**

- Before relocation, the combined `npm run studio:check` exits 1 with the single error `components/read-state.md has 120 paragraph blocks, more than the 119 it is frozen at`.
- After relocation, `npm run studio:check` passes on both trees: 372 register entries, 52 components, no integrity errors, 346 unreviewed and 26 stale page records, and 52 pending component reviews. No acceptance or review fingerprint is assigned.
- The combined tree passes all 17 tests in `component-binding-notes.test.ts`, `component-bindings.test.ts`, `component-catalogue.test.ts` and `development-workspace.test.ts`. These cover the freeze, note fingerprinting, orphan rejection, bindings, catalogue integrity and page guidance.
- Direct checks against the real files confirm all 52 frozen specifications pass, ReadState is 119/119, the note maps only to ReadState, and both the TypeScript and Python readers return exactly the unchanged 52-component manifest.
- Foundation/link/conflict-marker checks, naming, status-source validation, 22 documentation regression tests and whitespace checks pass on both trees. Prototype and migration-numbering checks also pass on the contribution branch. Documentation scope is checked against current main; the merge with #721 introduces no further textual conflict.

Reproduce the relevant checks after integrating the source branches and this correction in a disposable worktree:

```sh
npm run studio:check
node --import tsx --test tests/unit/component-binding-notes.test.ts tests/unit/component-bindings.test.ts tests/unit/component-catalogue.test.ts tests/unit/development-workspace.test.ts
python3 scripts/check_foundation.py
python3 scripts/check_naming.py
python3 scripts/check_prototype.py
python3 scripts/build_status.py --check
python3 scripts/check_migrations.py
python3 -m unittest discover -s scripts -p 'test_documentation*.py'
python3 scripts/check_documentation_scope.py --base origin/main --head HEAD
git diff --check
```

Runtime: Node 24.22.1 and npm 11.9.0. Node satisfies the declared range but differs from the `.nvmrc` pin 24.21.0; npm differs from the 11.19.0 pin. Installation used `npm ci --engine-strict=false --ignore-scripts --no-audit --no-fund`; no dependency or lockfile changes are committed. Pinned-runtime CI remains separate evidence. Application build/lint/typecheck, the full unit suite, database/HTTP/browser suites and manual accessibility acceptance were not run for this documentation-only correction.

**Remaining ownership and limits.** #715's owner must incorporate this contribution. #721 retains its own implementation and validation; it is combined only in a disposable local verification tree. The focus design remains unimplemented. The two Low findings in [Claude's corrected-head re-review](https://github.com/deanrfiedler-gif/powerplants-one/pull/715#issuecomment-6428657508), concerning delegated design authority and the Site-wide fallback scope, remain with #715's owner. This mechanical relocation does not resolve those findings or claim independent design approval. No application behaviour, permission, source contract, issued reference, Figma design, deployment or merge authority changes.
