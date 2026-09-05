# P06 original output evidence

Synthetic prototype — not for operational use. This is implementation self-review, not independent review, owner acceptance, full PT/AT passage or production readiness.

The [handover](../../../delivery/p06-handover.md#original-output-and-visual-review) explains the executed component and visual checks. [manifest.json](manifest.json) records each original path, byte count, SHA-256, source/executed commit and tree, workflow/artifact, image dimensions and PDF page boxes. Retrieve the privately retained [P06-output-evidence.zip](https://chatgpt.com/api/library/files/libfile_af9560df02fc819181bda733cf1634ce/download), or the original private workflow artifacts below while retained. The compact ZIP is 9,141,721 bytes, SHA-256 `b86b38532f32d05c9a82b79769ef53e050212803f91494fa5e3355e7d3cf5605`. It contains 57 source/output files plus its README and manifest; PDF/HTML/source bytes are outside Git.

| Original artifact | Selected content |
|---|---|
| [33970856208 / 9971046047](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33970856208/artifacts/9971046047) | Primary 28 PNG / 5 PDF / 5 HTML / 5 JSON originals; two premature SC-14 captures explicitly rejected. |
| [33967998661 / 9970247382](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33967998661/artifacts/9970247382) | Earlier two long PDF/HTML/source-manifest originals; unrelated browser selector failures documented in handover. |
| [33972180297 / 9971411233](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33972180297/artifacts/9971411233) | Corrected four original SC-14 current/withdrawn screenshots with two source/output manifests. |

All 43 pages of the seven PDFs below were manually inspected from Poppler renders of these exact originals. All are A4 portrait, contain readable repeated identity and page counts, and have no blocking clipping/overlap. Tag/outline presence is recorded separately; PDF/UA and screen-reader behaviour remain unverified. Standard and long HTML screenshots were inspected at desktop and phone sizes, including all full-height reading strips. Two exact fictional source files were extracted from retained snapshots and their original byte counts/hashes verified.

| Run / project | Original filename | Pages | PDF SHA-256 |
|---|---|---:|---|
| 33970856208 / desktop | `SYN-PPO-PACK-000002-job-pack-r01.pdf` | 4 | `35cd0e8738af7d94e1fbc15e46c1185fc86428b72c84fe773aeb1322920aeb72` |
| 33970856208 / phone | `SYN-PPO-PACK-000004-job-pack-r01.pdf` | 4 | `c7c7320542a33dfdb62753f66d3ce3634e503e53b287aabd9396763a01f3f410` |
| 33970856208 / standalone fixture; never issued | `SYN-PPO-PACK-900001-job-pack-r99.pdf` | 7 | `b338c566eb87b0c26342aa7e2fde0eafae750fc37b7e8eff8b3c944da0f9873a` |
| 33970856208 / desktop | `SYN-PPO-PACK-000003-job-pack-r01.pdf` | 7 | `2b99b2c15262daa9db49aaa16b9c04ca2bd22591572b2c797ee254dc67130cec` |
| 33970856208 / phone | `SYN-PPO-PACK-000005-job-pack-r01.pdf` | 7 | `c6f932d1fd63c26ad3f0364367f683e32907e05bf0871ff01bfddd2707110d38` |
| 33967998661 / desktop | `SYN-PPO-PACK-000002-job-pack-r01.pdf` | 7 | `f3a1e1a177989e50597a3e45244bb0ba815336729832a3753321c534807bde05` |
| 33967998661 / phone | `SYN-PPO-PACK-000003-job-pack-r01.pdf` | 7 | `dc37075af3d29b933bee4a26282a23a902fc34345a2a23c48e93245f5509573f` |

Original source manifests link issue UUID, job operation, source/template/snapshot hash, reserved preparation timestamp, actual issue record, renderer and browser version. Same filenames in different disposable runs are distinguished by those identities and original paths; they are never substituted by a newer output. Subsequent assurance reruns create distinct synthetic outputs and do not replace this selection.

The primary `P06-document-manifest.png` files are preserved despite being rejected as document-screen evidence: they captured the previous workbench before navigation settled. The supplement waits for the exact URL/heading/loaded status and shows current applicability and withdrawal on both devices. Inspection-only PNG/crop failures were corrected from unchanged originals. No output was visually edited.

Final PR/main SHAs and actual publication checks are in the [external publication record](https://github.com/deanrfiedler-gif/powerplants-one/issues/30#issuecomment-5552360820), avoiding circular self-SHA claims. P07 actual start/capture remains absent.
