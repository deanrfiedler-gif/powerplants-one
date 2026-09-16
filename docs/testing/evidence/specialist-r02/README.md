# Screen Systems r02 verification

This record separates inspection of historical source evidence, execution of the recovered quantity port, synthetic workflow verification and business acceptance.

## Source audit

The two supplied attachment hashes are recorded in the [companion report](../../../reference/ui/specialist/PPO-Specialist-Configuration-Workbench-Report-r02.md). Originals were read without modification or external refresh. Raw operational files, quote details and private verification vectors remain outside the public repository.

- The attached saved reconciliation contains 142 Match values and one #VALUE! result, not a newly observed 143-line pass.
- All 3,106 Rules formula-display cells have saved #NAME? values; executable and original expression text remains recoverable.
- New private execution matches 141 of 143 historical quantity caches. This includes inactive zeros and manually entered quantities. Quote-specific one-off row 320 and catalogue-addition row 328 are outside the configured example.
- Independent arithmetic from cached historical quantities and rates matches the source price bridge. This is not a complete workbook recalculation in native Excel.
- Ten changed-input scenarios reproduce 13 numeric outputs supplied in earlier response evidence; invalid 100% shrinkage is separately blocked. The source's full 15-check claim is not inherited as new execution evidence.
- Current catalogue mappings, numeric engineering ranges, full branch acceptance and native desktop Excel checks remain open.

## Initial native execution and review

Source `e7260286122433aa608918c6f61c011c18148760` passed 25 model groups and 24 native Chrome groups in [run 35060902892](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35060902892). HTML SHA-256 `a07c279cf9eccf206cceac1a49bb75c6c57d1638df005d1fa6b6edc5af89d740`; Chrome `153.0.8010.47`; zero console/page errors. Original results are retained in [initial-results.json](initial-results.json).

All six views were checked for document/navigation overflow at 1440, 1024, 820, 390 and 320 px. Sixteen native captures were reviewed: desktop configuration, working dialog, parts, pricing, comparison, runs, run snapshot, evidence and recovery; all six phone views; 320 px configuration. Long phone captures were inspected through original-scale top/middle/bottom crops.

The review led to a concrete correction: discount is governed only by commercial inputs; its parts row cannot be independently excluded or manually quantity-edited. The final refinement also prioritizes the phone pricing bridge, adds numeric cut-length working and persists normalized input values and units in each run.

## Final verification

The corrected model passes 26 groups. Final native execution and exact source/hash are to be recorded after the corrected-source run completes. The original passing run above is not substituted for that final execution.

## Reproduction

```sh
python3 scripts/build-specialist-r02.py
node scripts/check-specialist-r02-model.mjs
node scripts/check-specialist-r02-browser.mjs
```

The browser script uses the repository's pinned Playwright and native Chrome installation. It runs from the repository root and writes original evidence to `verification-evidence/specialist-r02`. GitHub artifacts retain captures for 14 days; manifests preserve their hashes after that retention period. Local browser execution was unavailable in the managed environment; native execution used the established GitHub workflow.

Documentation foundation, PP-01 consistency and naming checks remain documentation assurance. These results do not close EA-16/17, AT-04/28, G06 or production approval.
