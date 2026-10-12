---
document_id: PPO-ES08-WORKBENCH-NATIVE-R01
revision: r01
date: 2026-10-12
owner: Dean Fiedler
status: Retained application captures of the built workbench; not visual acceptance or a UI baseline
---

# ES-08 Screen Configurator Workbench · native captures r01

These eight images capture the Screen Configurator Workbench as built on 12 October 2026 from the [owner-accepted design board](../design-board-r01/README.md) ([build record](../../../../decisions/es08-workbench-build.md)). They are implementation captures for paired comparison with the board; they are not owner visual acceptance and not an entry in the accepted [UI baseline register](../../../../standards/ui-baselines.json). Retain these bytes unchanged; a revised build receives a new revision folder.

Every figure, name, rate and run in them is the public synthetic ES-08 fixture (`SYN Northbank Screen Systems`, estimate v1, run R01).

## Images

| Capture | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Configure, secondary menu collapsed | [PPO-ES-08-Native-01-Configure-1440-r01.png](PPO-ES-08-Native-01-Configure-1440-r01.png) | 1440 × 2255 | 376,217 | `cb06fffbe7ec0cb5966783b6ad271b3103f3cc44d6c07693284bbd067418ba77` |
| 01 · Configure, secondary menu docked | [PPO-ES-08-Native-01-Configure-docked-1440-r01.png](PPO-ES-08-Native-01-Configure-docked-1440-r01.png) | 1440 × 2440 | 387,042 | `aec68589245a19bd1e879c899b160c104438a2d814d544cc0b8eedc9daac01d9` |
| 02 · Drawings, five sheets, cut schedule and cross-check | [PPO-ES-08-Native-02-Drawings-1440-r01.png](PPO-ES-08-Native-02-Drawings-1440-r01.png) | 1440 × 4284 | 602,886 | `64cdb6b101b240c836ae69c75aeefef6cb13eba8fe83ae048fc2f1c74b1ae053` |
| 03 · Parts & working with the working panel open | [PPO-ES-08-Native-03-Parts-working-1440-r01.png](PPO-ES-08-Native-03-Parts-working-1440-r01.png) | 1440 × 1881 | 367,512 | `330600081163b0d7694e9fa5285e973bbdd77ac51aad9d9e46f80232df99dbce` |
| 04 · Pricing | [PPO-ES-08-Native-04-Pricing-1440-r01.png](PPO-ES-08-Native-04-Pricing-1440-r01.png) | 1440 × 1768 | 295,056 | `8d76df744a081663e18650a73ef653a2f31ec17bc38c587dfd10c0c27b2dafc0` |
| 05 · Compare & save | [PPO-ES-08-Native-05-Compare-1440-r01.png](PPO-ES-08-Native-05-Compare-1440-r01.png) | 1440 × 1777 | 279,922 | `66e617f90d587f5cafb432e62dc760bd79ec8e64168101333288594f8c525f25` |
| D · Phone · Configure | [PPO-ES-08-Native-D-Phone-Configure-390-r01.png](PPO-ES-08-Native-D-Phone-Configure-390-r01.png) | 390 × 4886 | 326,291 | `6336ac12215cc1e241dc428f900eeb675575e6f3a07c2ac260bd19bef93c8feb` |
| E · Phone · Drawings | [PPO-ES-08-Native-E-Phone-Drawings-390-r01.png](PPO-ES-08-Native-E-Phone-Drawings-390-r01.png) | 390 × 6573 | 469,121 | `4d6be4d3d31d3920e809c76dae62c7d5d2906c3c5ea9b6756ecf7b410d675dac` |

Desktop captures are full-page at a 1,440 px viewport with the shared shell, at device scale 1; "docked" shows the secondary menu open, the others show it collapsed. Phone captures are full-page at 390 px with mobile emulation. The page height is the module's scroll height at that width.

## Capture method and limits

Captured in headless Chrome through Playwright from the task dev server on the worktree `feat/es08-screen-configurator-workbench`, signed in as the synthetic coordinator identity against a disposable `ppo_synthetic_test` database holding the ES-08 fixture. The script is not retained; the captures are reproducible from the browser spec's fixture reset and the same views.

Not captured: the working panel's manual review dialog, the Method & limitations dialog, the withheld states, Definition review and Run history. Those are exercised by `tests/browser/specialist-workbench.spec.ts`, which writes its own screenshots to the Playwright output folder.
