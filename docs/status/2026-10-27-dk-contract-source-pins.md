---
title: Review DK design contract source pins
date: 2026-10-27
---

Codex for Dean claims the separate, authorised correction of the three standalone design manifests after [PR #717](https://github.com/deanrfiedler-gif/powerplants-one/pull/717), following the dependency finding in [PR #719](https://github.com/deanrfiedler-gif/powerplants-one/pull/719). Base: main `09ada5633893db8cd6a93742ce6e6b6c7cf2c5c2`.

Scope: review the document issue/distribution contract amendment against the existing DK-03, DK-01/DK-02 and DK-06 standalone designs; update only justified contract pins in their source manifests; add source-review notes to their existing READMEs; run the three builders and relevant checks. Preserve issued reference bytes, design intent, other pins and drift guards. No application, contract, workflow, acceptance or deployment change.

Expected files: `docs/design/output-distribution/{source-manifest.json,README.md}`, `docs/design/document-library/{source-manifest.json,README.md}`, `docs/design/template-management/{source-manifest.json,README.md}` and this fragment. Open PRs and issues were checked: #704 and #706 hold separate native-page implementation claims, currently changing only their own status fragments; #719 documents the finding but does not repair these pins. This is a documentation/source-pin maintenance contribution, not a new application build.

Initial claim only. Compatibility assessment and build validation are pending. Nothing is merged.
