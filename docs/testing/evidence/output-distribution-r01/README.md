# Output, Issue & Distribution Centre r01 verification

Baseline `main`: `a5406a81c02d37c4a23e75c1b71c7653fcec0d80` for the build; shared index, register and STATUS edits re-applied onto `81b0d401edc1c2ea31e5440c3416befe335219e3` after #221 merged, with every pinned source re-checked against it and unchanged. Standalone DK-03 design. No runtime integration, provider connection, deployment or business acceptance is implied by anything recorded here.

Delivered HTML SHA-256: `91252dd5b550d465478ac9eb41aa8d93a1efa9c3e573cfc393d8480d0ad1af7b`, 247,871 bytes.

## What was executed

| Check | Command | Result |
|---|---|---|
| Deterministic assembly | `python3 scripts/build-output-distribution.py` | Reproduced the delivered bytes from the pinned sources; the builder refuses to assemble if any pinned source hash has changed. |
| Model verification | `node scripts/check-output-distribution-model.mjs` | **38 groups passed.** [Returned result](model-results.json). |
| Focused lint | `npx eslint docs/design/output-distribution/*.js scripts/check-output-distribution-*.mjs` | Clean. |
| Native browser verification | `node scripts/check-output-distribution-browser.mjs` | **36 groups passed**, no page or console errors, 41 captures. [Returned result and capture manifest](native-results.json). |
| Repository assurance | `check_foundation.py`, `check_prototype.py`, `check_naming.py` | All three passed with the new files present. |
| Conflict-marker scan | `git --no-pager grep -n -E "^(<<<<<<<\|=======$\|>>>>>>>)" -- docs` | No match. |

[Pinned source manifest](source-manifest.json) records the exact reused sources and their hashes at the time of the build.

## Runtime actually used, and its limit

The authoring run used **Chromium 141.0.7390.37** through the repository-pinned Playwright 1.63.0 on **Node 22.22.2**, launched with the documented `PPO_CHROME_PATH` override, because Node 24.21.0 could not be installed in that session — the distribution host is outside its network allowlist. The runtime actually used is recorded verbatim in `native-results.json` rather than inferred from the committed script default.

**The pinned runtime has since been executed.** The focused `Output issue and distribution design` workflow — which installs npm 11.19.0, Node 24.21.0 from `.nvmrc` and the Chrome channel through `npm run browser:install` — passed on head `940316bd148d478bd4927da8d15d33085f4c3d39` in [run 35192211499](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35192211499), covering the deterministic rebuild, focused lint, the model checks, foundation/prototype/naming assurance and the native browser journey. Its returned evidence is retained as that run's artifact. This record and the design report were amended afterwards to cite that run; the HTML, the module source and both check scripts are byte-identical to the head it tested. `Check documentation foundation`, `CRM header and board visual checks` and `Registered UI design baseline integrity` also passed on the same head.

## What the browser run proves

All six views were exercised at **1440, 1024, 820, 390 and 320 px**, plus a 1024×420 short viewport, asserting that the document scroll width never exceeds the client width. The principal ten-step walkthrough completed through ordinary controls, including the failed-save retry, the interrupted finalisation, the recovery of the original operation, the single release, two independent recipient outcomes, the reconciliation and the acknowledgement.

Two assertions are worth naming because they check the things most easily faked:

- A manifest item is downloaded, and its actual byte length and SHA-256 are compared against the byte count and content identity the workspace displayed. The model's digest is separately compared against Node's `crypto` for seven inputs including empty, block-boundary and multi-byte cases.
- The final check asserts the page issued **no request other than to the local test server** — no font, image, analytics or provider call.

## Captures

41 captures were produced. Each file name and its SHA-256 is in the capture manifest inside [native-results.json](native-results.json). The image files themselves are **not committed in this contribution**: the transfer path available to this session applies newline translation to binary content, which was detected by hashing the written files and would have committed silently corrupt PNGs. The focused workflow retains the images as a run artifact, and the committed manifest hashes allow any retained copy to be checked against the run that produced it.

Seven captures were opened and read during review — the 1440 px queue, readiness, distribution, exceptions and detail views, the released state and the 390 px queue. Four defects found that way were fixed before the final build:

1. An unclosed `article` element nested the recipient cards inside one another.
2. The recipient destination and channel were printed twice when they were the same value.
3. The follow-up control in the exceptions view targeted the selected output rather than the exception's own output.
4. A routine preparation position carried a warning tone.

Visual review is **not** claimed for all 41 captures.

## Post-build adversarial review

After both suites were first green, an independent adversarial review was run against the code with the contract and the design report as the specification. It found eight defects — each a real gap between a report claim and the code — and all eight were fixed before this delivered build. They are listed in the report's verification section. Eight model groups and two browser groups were added to hold the fixes, which is why the counts here are 38 and 36 rather than the 30 and 34 of the first assembly.

The most serious two are worth naming here, because both were the kind of thing this module exists to prevent: a retained response displayed a content binding that was recomputed at render time rather than recorded, and a reconciliation could establish **Delivered** on a channel declared incapable of evidencing delivery.

## What remains separate

Owner design acceptance; screen-reader, assistive-technology and physical-device testing; server permission, concurrency and retention behaviour; provider evidence; application integration; accepted UI baseline changes; and deployment. Client-side preview profiles demonstrate intended scope and are not authentication — every fixture in the file is readable by anyone holding it.
