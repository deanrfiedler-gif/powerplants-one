---
document_id: PPO-FERT-BOARD-EVD
revision: r01
date: 2026-10-12
owner: Dean Fiedler
status: Working evidence from the local dev server against the board reference scope; not a visual review, not an owner acceptance, not a UI baseline
source_commit: 322ffe6a12cc99398ed07fc58557e587dbeed8c1
---

# Priva fertigation board parity — application captures r01

These captures show the native record workspace after it was built to the [retained design board captures r01](../../../reference/ui/estimating/fertigation-design-board-r01/README.md) ([workbench refinement record](../../../decisions/fertigation-workbench-refinement.md), "Built to the board", 12 October 2026). The [board parity register](../../priva-fertigation-board-parity.csv) pairs each board region with its application element and records its status.

## Method and limits

- **Scope.** [`boardReferenceScope`](../../../../tests/helpers/fertigation-board-scope.ts) (FN-T117): r02's synthetic sample imported with the proposed placements and completed with the declarations the board shows as made, saved as revision 2 of a scope created from a synthetic Discovery alternative. Every figure on the captures is that scope's entered value or a `PPO-FERT-NATIVE-CALC-r01` result: the engine raises 2 conflicts and 6 review findings for it, as the capture README records, not the board's 21 r02 checks.
- **Runtime.** The local dev server (`npm run dev`) on a disposable PostgreSQL cluster, headless Chromium through the repository's Playwright at device scale 1, viewport 1440 × 1000 and 390 × 844 (mobile emulation), locale en-AU. Font Awesome's Kit does not load on 127.0.0.1, so every icon is the local outline drawing. The dev server is not the compiled application.
- **Full-page captures.** The module scrolls inside its own container, so for the page captures the frame, workspace and scroll owner were given `overflow: visible` and `height: auto` by an injected style before the screenshot; nothing else was changed. The dialog captures are plain viewport screenshots.
- **Source.** The captures were taken from the compiled build of the code at the source commit above plus the phone header compaction in the same pull request; the later phone fix that keeps Compare draft visible while a draft is dirty changes a state these captures do not show.
- **Not evidence of.** Pixel parity with the board (the shared shell, real scopes and font availability make pixels differ), owner acceptance, the compiled browser suite, CI, devices, screen readers or 200% zoom.

## Captures

| Board | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Overview (A at 390) at 1440 px | [overview-1440.png](overview-1440.png) | 1440 × 3642 | 576,137 | `f37dcbff255b07444a5563679f3474036c76c446c128cbfb99996791aeceb295` |
| 01 · Overview (A at 390) at 390 px | [overview-390.png](overview-390.png) | 390 × 7806 | 485,930 | `6c02840edeb375de5130f87a00e4c9b97faa34433e32ca59cdd0bb95c0e54a70` |
| 02 · Growing areas & irrigation at 1440 px | [growing-1440.png](growing-1440.png) | 1440 × 1822 | 302,065 | `96eaa7bb3771165233dae3b8a638b14ab5fa08f0f72be0225855157b5393ec7b` |
| 02 · Growing areas & irrigation at 390 px | [growing-390.png](growing-390.png) | 390 × 3858 | 207,987 | `ba983de20cd93c314defef7a0bcbec0888c6a278c1dcc93baf9dd413e66f9b16` |
| 03 · Water & hydraulics at 1440 px | [water-1440.png](water-1440.png) | 1440 × 1608 | 264,932 | `29e88673eed529d5f7473f89bc77b05e91cb846d9e3c3f255d87b0e92080ef14` |
| 03 · Water & hydraulics at 390 px | [water-390.png](water-390.png) | 390 × 2823 | 184,696 | `7cb74a976d1d0928716ed11768d822e887e995cca77a8b7cd37a23b0dfab9790` |
| 04 · Recipes & dosing at 1440 px | [recipes-1440.png](recipes-1440.png) | 1440 × 1359 | 208,677 | `6eaa5ca0714924d8f36233b07abfb919ee3f039513021e3cceca4458fede643e` |
| 04 · Recipes & dosing at 390 px | [recipes-390.png](recipes-390.png) | 390 × 1958 | 126,826 | `3eb7288394bbf5ed48773cca4ecd3fa8c9213d9cdc10ca4dec304398e2eeb48e` |
| 05 · Controls & I/O at 1440 px | [controls-1440.png](controls-1440.png) | 1440 × 1621 | 239,762 | `fbf3a634a2f90fb1c920b32d02a14c21bf6bab2e19cb7a2051f7c994a4c9468f` |
| 05 · Controls & I/O at 390 px | [controls-390.png](controls-390.png) | 390 × 2880 | 173,761 | `91e1c9cc2a470fabb51769fb016ab5fa36d0b441e880542d10735c1004aa8c64` |
| 06 · Operating plan at 1440 px | [operating-1440.png](operating-1440.png) | 1440 × 2923 | 375,945 | `57070deb6b6ad323837f980ecd4f5ca743e04967332ffd1f0429ff62e86d6001` |
| 06 · Operating plan at 390 px | [operating-390.png](operating-390.png) | 390 × 4482 | 288,264 | `b5ec6f6b46f9dc10584969551e7013aedbb8ef97943f3ae21f9fe7a5a04ddcaf` |
| 07 · Unit configurator at 1440 px | [configurator-1440.png](configurator-1440.png) | 1440 × 2122 | 299,459 | `6435d9cc54b43023735a9eb1caa5a16fc0e23532b86afe13847d86a8bfc39792` |
| 07 · Unit configurator at 390 px | [configurator-390.png](configurator-390.png) | 390 × 3839 | 232,236 | `310d6766e6f5b152ed91eed4aae1b5cc448c028bdb465850e5e83428f5e71805` |
| 08 · Evidence & delivery at 1440 px | [evidence-1440.png](evidence-1440.png) | 1440 × 1685 | 251,169 | `e956d87c7473d7a80542aa7daef8462137b1d8bf568e9fe5ba818f237343c659` |
| 08 · Evidence & delivery at 390 px | [evidence-390.png](evidence-390.png) | 390 × 2618 | 164,645 | `3fc0d8f8eff3702faa5b03c502e796d082d5b10e99aa0c1d9b179f50043434f0` |
| 09 · Scope review at 1440 px | [review-1440.png](review-1440.png) | 1440 × 2241 | 453,840 | `d2b6a9d9adbc23097f8b912c9f605cdae4eaf490d1d53d9362602678141d379a` |
| 09 · Scope review at 390 px | [review-390.png](review-390.png) | 390 × 5538 | 354,276 | `dafa1b6f6008fd3ff838471d0322aaac56188b8f556189d68ec55cc4975f7d93` |
| H · States (scope register) at 1440 px | [register-1440.png](register-1440.png) | 1440 × 1000 | 53,881 | `7ca0399594f105114764612972b2756516b8b0f8101312d780280598c717828f` |
| H · States (scope register) at 390 px | [register-390.png](register-390.png) | 390 × 844 | 20,833 | `b9d10ae8a53a61670ac6657b187ee340e37b0edc8184ea07cb3c1593ad993977` |
| 10 · Import an r02 project (create route) at 1440 px | [create-1440.png](create-1440.png) | 1440 × 1101 | 109,833 | `feb5a59dfdb61c7260f949e249d8c29e728bf3ae9811d910206b255bf5b18231` |
| 10 · Import an r02 project (create route) at 390 px | [create-390.png](create-390.png) | 390 × 1464 | 74,482 | `5392d35e81accf4dcac9f32d274a00601f80fb72a720e7754fb04bd1036540d0` |
| Record editor (no artboard) at 1440 px | [dialog-editor-1440.png](dialog-editor-1440.png) | 1440 × 1000 | 201,104 | `3a811dd1973aef6b7ebaccb7f3b78fe44958a16114b9e3b4292f26544a584563` |
| Record editor (no artboard) at 390 px | [dialog-editor-390.png](dialog-editor-390.png) | 390 × 844 | 37,758 | `d9dd50b924d02307ccd4c22bdd8a9e6291f721c3db448cbe04d10a97abd754ea` |
| B · Resolve a conflict at 1440 px | [dialog-resolve-1440.png](dialog-resolve-1440.png) | 1440 × 1000 | 222,509 | `ebe78255625f95d38d987b545e338c8d71110028b2bffd35f21611064b4e9d87` |
| B · Resolve a conflict at 390 px | [dialog-resolve-390.png](dialog-resolve-390.png) | 390 × 844 | 70,506 | `e0b14f75361b945b187a9f35445ec0ba1cdcdee2b28961b8ea525de60f68d062` |
| C · Calculation trace at 1440 px | [dialog-trace-1440.png](dialog-trace-1440.png) | 1440 × 1000 | 196,845 | `042fc535ee10e650067a53db0e09ad3680f1f48b33ddeb713a8a6b9fe19a6d54` |
| C · Calculation trace at 390 px | [dialog-trace-390.png](dialog-trace-390.png) | 390 × 844 | 50,114 | `97962b29c7602e39ddae284ecbcb27dcf5cf20b62f48bb09b7c35a941237f4fb` |
| D · History at 1440 px | [dialog-history-1440.png](dialog-history-1440.png) | 1440 × 1000 | 215,386 | `39deffa9424da175de6e3efc283b69a307e7d1b46e9b0413b8dc76a23e060076` |
| D · History at 390 px | [dialog-history-390.png](dialog-history-390.png) | 390 × 844 | 57,911 | `5a4af74865ccc261bd14e771efebbaa4c1948c31692b9d3252052b1f88f2d167` |

## Checks recorded with this evidence

See the pull request and `docs/STATUS.md` for the type check, lint, unit suite, design register check and the fertigation browser suite outcomes on the same source.
