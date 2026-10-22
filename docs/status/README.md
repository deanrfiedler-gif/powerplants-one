# Status fragments

Each contribution adds a dated source file here. The tracked [status page](../STATUS.md) and [decision index](../decisions/README.md) are stable navigation and historical records. They are not regenerated in feature PRs. The [source-isolation decision](../decisions/documentation-source-isolation.md) replaces the earlier requirement to commit rendered views.

## Add a fragment

```sh
python3 scripts/build_status.py --new "Short title" --decision
# Edit the printed file. Omit --decision when no decision summary is needed.
python3 scripts/build_status.py --check
```

A fragment is `YYYY-MM-DD-slug.md`; its date must match its front matter. Use a task-specific slug, check the early draft PR claims for overlap, and keep one fragment per contribution. The creation command refuses to overwrite an existing path. Use the user's local date when it differs from the host date.

```markdown
---
title: Short title
date: 2026-10-22
---

What is now true, what was checked, and what remains open. Link the authoritative chapter and evidence.

<!-- decision-index -->
[Source-isolation decision](../decisions/documentation-source-isolation.md) (PPO-DOCUMENTATION-SOURCE-ISOLATION-DEC) records the adopted repository workflow.
```

- The title renders as a dated heading; do not add H1/H2 headings to the status body.
- Links are relative to the fragment; the generator relocates them for the output.
- The `decision-index` section is optional. The decision itself lives in exactly one record under `docs/decisions/`.
- Keep implementation, verification, owner review, acceptance and deployment distinct. Report failed or unexecuted checks and outstanding decisions.
- Update the authoritative feature chapter when behaviour changes. Create a new chapter only when one does not exist; reuse `docs/guides/`, `docs/contracts/`, `docs/delivery/` and `docs/testing/` as appropriate. Include purpose/scope, usage, dependencies/configuration (or none), refusal/recovery and validation relevant to the change. Do not copy architectural rules into competing records.
- Later updates use a new fragment; correct an earlier fragment only when its text is wrong.

## Read the combined views

```sh
python3 scripts/build_status.py
```

Open `tmp/documentation/STATUS.md` and `tmp/documentation/decisions.md`. They contain all fragments newest first, followed by the retained historical entries. Local links point back into this checkout. Output is ignored by Git and is not committed. `--check` validates sources and legacy entry identities without writing any files.

[Documentation assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/workflows/documentation.yml) builds downloadable `documentation-views-<commit>` artifacts on successful PR, main and manual runs. Select a main run for published main state; a PR artifact is a preview of its checked merge commit. Each artifact identifies its exact source and links to that commit on GitHub. Artifacts expire after 30 days; rerun the workflow or regenerate from that commit. No automation commits to main.

For source-bound links locally, pass a full commit SHA to `--web-ref` from a clean checkout of that commit. CI uses its checked-out commit. The default local view explicitly describes the working tree rather than claiming a publication.

## Existing branches and historical corrections

An older branch may still contain regenerated index edits. After integrating current main, retain all source fragments and restore current main's landing pages for routine generated changes:

```sh
git restore --source=origin/main -- docs/STATUS.md docs/decisions/README.md
python3 scripts/build_status.py --check
```

Inspect the diff first: an intentional correction to the historical record must be retained, not discarded. Declare such maintenance under [docs/maintenance/](../maintenance/README.md). The legacy suffix after `fragments:end` and `docs/STATUS-log.md` remain historical records. `legacy-index.txt` protects their entry identities; `--accept-legacy` updates that ledger only for an intentional reviewed legacy correction, and never writes generated content into the landing pages.
