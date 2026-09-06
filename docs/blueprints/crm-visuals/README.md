# CRM synthetic wireframe captures

**Design evidence only · 6 September 2026.** These 18 unchanged originals come from [CRM design assurance run 34014261906, attempt 1](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34014261906). They show a standalone HTML design document; no CRM runtime, operational record, persistence, permission enforcement, integration or acceptance is demonstrated.

[Screen specification](../crm-screen-specification.md) · [Interactive HTML source](../crm-wireframes.html) · [Exact capture manifest](manifest.json) · [Handover](../../delivery/crm-discovery-handover.md).

| Screen/state | 1440×1000 viewport, full page | 390×844 viewport, full page |
|---|---|---|
| C01 Sales worklist | [Desktop](desktop-work-ready.png) | [Phone](phone-work-ready.png) |
| C02 Pipeline | [Desktop](desktop-pipeline-ready.png) | [Phone](phone-pipeline-ready.png) |
| C03 Opportunity detail | [Desktop](desktop-detail-ready.png) | [Phone](phone-detail-ready.png) |
| C04 Relationships | [Desktop](desktop-relationships-ready.png) | [Phone](phone-relationships-ready.png) |
| C05 Activity | [Desktop](desktop-activity-ready.png) | [Phone](phone-activity-ready.png) |
| C06 History and references | [Desktop](desktop-history-ready.png) | [Phone](phone-history-ready.png) |
| C07 New opportunity | [Desktop](desktop-create-ready.png) | [Phone](phone-create-ready.png) |
| C03 Permission denied | [Desktop](desktop-detail-denied.png) | [Phone](phone-detail-denied.png) |
| C03 Stale/conflict | [Desktop](desktop-detail-conflict.png) | [Phone](phone-detail-conflict.png) |

## Provenance and review

The manifest records source head `0b596345afe9a53497dd296d02d71ea37631943d`, actual PR merge checkout `082104586093d448f282c5d2a4d1197c1b276def`, tree `a0989c958a50f2aba8a5865c4609578c8f789db4`, scenario, viewport, file size and SHA-256. The HTML input SHA-256 is `8ed6959814bcdc4633463da465b2a7d8c83966f6d59a518f8e21b663c76f4a6d`. These identify the generating source, not the later commit preserving its evidence. No capture or manifest was rewritten to pretend it came from a later head.

The downloaded artifact `9983414827` was verified against its recorded ZIP SHA-256 `25f21077499227a40f56746dec8e1bcd09ae6f45d5cd0d1de653c3a0575ed1cc`; all 18 extracted PNG sizes/hashes matched the original manifest before preservation.

Automated checks passed 147 views (7 screens × 7 states × 3 widths: 1440, 390 and 320), page reflow, board/list equivalence, validation and retained input, explicit unsaved previews, filtering, keyboard focus, denied illustration content suppression, and no JavaScript errors/network/storage. The 320px views were checked without preserved captures. This is design-document QA, not CA-13 or AT-25 runtime acceptance.

Visual self-review inspected nine originals: desktop worklist, relationships, activity and conflict; phone pipeline, detail, creation, history and denied. All seven screens and both captured exception types were inspected across the two viewport classes. Text, primary actions, wrapping, focus indication and unavailable references were readable; no blocking layout defect was found. Native long select labels may be clipped when closed; implementation should show the full selected reason in adjacent text. In the conflict illustration the banner describes the newer saved version and the form below retains the older proposal; real implementation must fetch a permitted comparison before retry. No independent reviewer, assistive-technology audit or physical handset acceptance is claimed.

Final PR and merged-main validation identities belong in the [external publication record](https://github.com/deanrfiedler-gif/powerplants-one/issues/9#issuecomment-5557062585). Later CI artifacts validate the then-current source independently; these original captures retain their original provenance.
