---
title: DK standalone design source pins reviewed and corrected
date: 2026-10-27
---

Codex for Dean reviewed and corrected the standalone design source pins in separate [PR #725](https://github.com/deanrfiedler-gif/powerplants-one/pull/725), following the dependency finding in [PR #719](https://github.com/deanrfiedler-gif/powerplants-one/pull/719). [PR #717](https://github.com/deanrfiedler-gif/powerplants-one/pull/717) merged on 27 October 2026 at 17:05 Brisbane time; reviewed main is `09ada5633893db8cd6a93742ce6e6b6c7cf2c5c2`. This is source-pin maintenance, not a new application build.

The contract at integration head `9c0559a090d795b07e5313fd47c847b76989884c` is identical to current main. Against pre-integration main `923f1284765d5a88c0fb003725951a573a9b374c`, its sole change is the six-line [native Outputs receiving amendment](../contracts/document-issue-distribution.md#native-outputs-receiving-workspace--24-october-2026). Git blob `39a415248465847dfcfcc41cd47e5800ab321a6b` becomes `12d53c0a4984e65289e5f15d1d70b96b201639e5`; SHA-256 `3c4cde29159f9b8e7086c04fe1e59db5a5c6cd82b0f1d76c584eaa2d03c86143` becomes `642efeca5a7d4cc9b0b3340dd23ede1cc76e2d76c895784ad4b5fd765c1c1aeb`. Counting newline-terminated lines gives 170 before and 176 after (171/177 split entries when the final empty entry is counted).

All three builders first failed on that contract. Auditing every pinned source also found the older naming-standard pin in Output distribution; after correcting the contract alone, that builder failed on naming. Its exact pinned source was recovered from commit `f1a79dadc4d9076b8d235c22ea75ba23e4de69e6` and compared with main. Only the adopted new-allocation namespace amendment differs. The [DK-03 review](../design/output-distribution/README.md#source-pin-review--27-october-2026) explains why the historical scenario and its longer demo references remain intact, without claiming current allocator conformance. That pin changes from `f095ef3440d1d8cde22b23638d8c6ce672675728e127a720d426bbdc366a5a6e` to `1967b71c19eed24f64f35a192d4503db3a0e9ead8bbf26883c01bedb50a57468`. All other pins match and remain unchanged.

| Retained design | Assessment under the added contract section | Fresh local result |
|---|---|---|
| [DK-03 Output distribution](../design/output-distribution/README.md#source-pin-review--27-october-2026) | Valid historical scenario: domain issue authority, original bytes and separate distribution/response facts retained. Broader fictional families do not claim native Outputs support. | Builder passed; 38 model groups passed. |
| [DK-01/DK-02 Document library](../design/document-library/README.md#source-pin-review--27-october-2026) | Valid historical scenario: exact source review and prepared follow-up remain separate from issue and acknowledgement; Library ownership unchanged. | Builder passed; 23 model groups passed. |
| [DK-06 Template management](../design/template-management/README.md#source-pin-review--27-october-2026) | Valid historical scenario: publication/eligibility do not issue outputs, rewrite historical bytes or substitute a template into a reserved operation. | Builder passed; 35 model groups passed. |

Each package's existing decision records the superseding accepted Figma layout and native-contract precedence. These source-pin reviews preserve original intent; they do not reaccept the historical layouts or claim native feature parity.

All three generated HTML files equal their pre-build and committed-main bytes:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| Output distribution r01 | 247871 | `91252dd5b550d465478ac9eb41aa8d93a1efa9c3e573cfc393d8480d0ad1af7b` |
| Document library r01 | 165771 | `4e67700df87892ec9fc1af4dd06952c6016c9ad3f224bec4065a842b1d081d53` |
| Template management r01 | 324285 | `a8e76cf50dfd844f0bc84b2e16e9f5eb6d78efe2021642b43808e4beb46e6c3d` |

Verification commands from the repository root:

```sh
python3 scripts/build-output-distribution.py
python3 scripts/build-document-library.py
python3 scripts/build-template-management.py
git diff --exit-code origin/main -- docs/reference/ui/output-distribution docs/reference/ui/document-library docs/reference/ui/template-management
node scripts/check-output-distribution-model.mjs
node scripts/check-document-library-model.mjs
node scripts/check-template-management-model.mjs
python3 scripts/check_foundation.py
python3 scripts/check_naming.py
python3 scripts/check_prototype.py
python3 scripts/build_status.py --check
python3 -m unittest discover -s scripts -p 'test_documentation*.py'
git diff --check
```

Those checks passed locally with Python 3.12.14 and Node 24.22.1 (repository Node pin: 24.21.0); documentation regression coverage is 22 tests. Browser suites, focused ESLint and full application/database suites were not run locally: fixture, JavaScript/CSS, builder and application bytes are unchanged. The three existing design workflows run the pinned runtime, lint and browser checks when these manifest folders change; exact-head CI is separate evidence and is reported on the PR, not inferred from the local passes. The shared contract and naming-standard paths still do not trigger those workflows by themselves; workflow coverage expansion is outside this correction.

Open PRs/issues were checked before claiming: #704 and #706 contained only their native-page claim fragments and #719 recorded the finding without editing these sources. Changes are limited to the three manifests (four pins total), their existing source guides and this fragment. No other contributor branch, contract, guard, fixture, issued reference, visual-review fingerprint, workflow, dependency or application behaviour was changed. No independent review, new owner acceptance, merge or deployment is claimed.
