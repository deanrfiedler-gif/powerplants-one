# Document library r01 verification

## Verified outcome

**23 model groups and 23 native-browser groups passed** on source `cd4a942dfd1c511f4550c273b0161f8ce3338ef0` in [run 35177401963](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35177401963), [job 105062019841](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35177401963/job/105062019841). No page or console errors were recorded.

[HTML](../../../reference/ui/document-library/PPO-Document-Register-and-Linked-Library-r01.html) · [detailed report](../../../reference/ui/document-library/PPO-Document-Register-and-Linked-Library-Report-r01.md) · [handover](../../../decisions/document-register-linked-library-design.md) · [PR #226](https://github.com/deanrfiedler-gif/powerplants-one/pull/226).

| Evidence | Exact identity |
|---|---|
| Authoring main | `aa94dcdcb1dd08798be240325857c3d32d04af02` |
| Verified source | `cd4a942dfd1c511f4550c273b0161f8ce3338ef0` |
| Delivered HTML | 165,771 bytes |
| HTML SHA-256 | `4e67700df87892ec9fc1af4dd06952c6016c9ad3f224bec4065a842b1d081d53` |
| Native runtime | Node 24.21.0; Playwright 1.63.0; Chrome 153.0.8010.47 |
| Native manifest | [results.json](results.json): 23 groups, 38 screenshot identities, zero page/console errors |
| Model manifest | [model-results.json](model-results.json): 23 groups |
| Executable/source hashes | [source-manifest.json](source-manifest.json) |
| Original archive | [Artifact 10479287342](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35177401963/artifacts/10479287342), 6,122,363 bytes |
| Archive SHA-256 | `b6a8bdb4904b9c8afaaf232f28d7294ea33cb57aaedc447e96b47d21a2abaa21` |

The original archive, all 38 capture hashes and the delivered HTML hash were verified after transfer. The archive expires on 1 October 2026 according to GitHub. Original manifests and three inspected captures are retained in this directory; the source and browser script reproduce the remaining views. The final evidence/report/status update changes no tested executable source or HTML bytes.

## Executed checks

The dedicated workflow passed deterministic assembly, focused ESLint, the 23 model groups, all three repository documentation checks and the complete native-browser suite. Local syntax, focused lint, model, foundation, prototype, naming and whitespace checks also passed. The documentation checks preserved 78 parent requirements and verified 250 document-register records at the tested source.

Native tests exercised exact search and location filters; excluded selection; docked/full document navigation; exact extract download; text size/source identity; revision comparison; failed-save retry; unresolved review blockers; independent response acceptance; retained decision/reload; source successor; exact receiving references and task deduplication; source recovery; restricted/missing sources; partial relationship failure; scoped read/export; loading/empty/error recovery; cross-tab conflict; malformed state; responsive layouts; phone focus/Escape; and keyboard tab navigation.

All six views fit 1440×960, 1024×768, 820×800, 390×844 and 320×844 with no horizontal page overflow. Native testing used GitHub’s pinned workflow runtime. Chrome was not installed in the local authoring environment, so no local native-browser pass is claimed.

## Visual inspection

Final original captures inspected include:

- [Desktop revision review](1440-revision-review.png): readable paired source sections, changed-content highlighting, separate findings and exact technical decision context.
- [Phone document detail](390-document-detail.png): identity and revision before the extract, readable stacked context and clear synthetic/source boundaries.
- [Phone snapshot](phone-snapshot.png): full-width drawer, scrollable source context, fixed Open full document action and visible keyboard focus.

The preceding run also supplied visual inspection of desktop register, snapshot and document detail; the 820 px document view; 320 px register; phone revision comparison; phone usage/impact; and phone source exceptions. Its layout sources are identical to the final run; the final change added only the snapshot keyboard focus handler. Earlier toast-overlaid workflow captures are preserved as evidence rather than used as the primary review images.

## Verification findings and repair history

| Run | Outcome and action |
|---|---|
| [35176924965](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35176924965), source `ce069eed` | 22 model groups and 12 completed native groups. The next group stopped on a case-sensitive assertion: CSS displays DESTINATION PREVIEW in uppercase. The assertion was corrected to match the actual presentation without removing its receiving-context check. [Original partial manifest](first-run-results.json). |
| Authoring refinement | Phone comparison changed to labelled earlier/selected sections. A new unresolved finding now places current review on hold while preserving the original decision. Stored-state validation rejects malformed event times and receiving targets. A focused model case verifies the new-finding hold. |
| [35177146402](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35177146402), source `1613517f` | 23 model groups and 21 completed native groups, including all widths. The phone drawer’s native Tab wrap briefly left focus outside the dialog. Added an explicit first/last keyboard focus loop. [Original partial manifest](second-run-results.json). |
| [35177401963](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35177401963), source `cd4a942d` | All 23 model and 23 browser groups passed. Phone focus, Escape return, keyboard navigation and zero page/console errors verified. |

## Publication and remaining limits

PR #226 carries the authorised standalone design and detailed report. Documentation assurance and UI baseline assurance passed on the tested source. Broader application workflows were still running at this handover; they are separate from the component result above, and no all-repository runtime pass is claimed. Final documentation-only publication triggers its normal checks without changing the tested artifact.

Owner design acceptance, physical-device/screen-reader review, server permissions and atomic concurrency, real provider/retention behaviour, receiving-system acceptance and application integration remain separate. No merge, deployment, access change, live document issue or business communication was performed.
