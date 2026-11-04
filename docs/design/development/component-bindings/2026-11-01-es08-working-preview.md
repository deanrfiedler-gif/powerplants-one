# ES-08 Working during preview refresh

Owner: Dean Fiedler. Implementation: Codex for Dean. Review: functional evidence and visual acceptance remain separate.

## Screen Configurator Workbench

The existing `scope:ES-08` and configuration/view consumers retain their working panel and calculation. Working is temporarily unavailable while the displayed calculation is stale. The real preview must settle before activation, so removing the re-check notice cannot move an enabled opener during a pointer click. Dean approved the temporary disabled state on 24 October 2026.

The opener uses `aria-disabled` with an activation guard and the existing disabled colour tokens. It remains focusable: editing within the dialog can start another preview, and Escape must still return focus while that response is pending. Enter on that unavailable opener leaves the dialog closed. Calculation, proposal, save and issued-source behaviour remain unchanged.

The fixtures in `tests/browser/specialist-workbench.spec.ts` hold the real saved-preview and edited-preview responses. They check disabled/enabled states, focus return while unavailable, blocked keyboard activation, the exact 390 px phone dialog and the settled edited value. The original journey and its desktop/phone width assertions remain intact. See the [owning view record](../pages/route-estimating-configurations-id-view.md), [component rules](../components/screen-configurator-workbench.md) and [status evidence](../../../status/2026-10-24-ci-flake-es08-panel.md). No visual review, acceptance scenario or deployment is inferred from these tests.
