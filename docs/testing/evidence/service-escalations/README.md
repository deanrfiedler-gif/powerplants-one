# SV-08 implementation evidence

Codex review, 1 November 2026. Synthetic application only. Functional proof, visual review, owner acceptance and deployment are separate. No owner visual acceptance or deployment is recorded.

## Visual comparison

References: the nine [accepted, icon-free captures](../../../reference/ui/service/escalations-design-r01/README.md). Browser: local reviewed Chrome 156.0.8078.80. The [browser fixture](../../../../tests/browser/service-escalations.spec.ts) captures register, reply and next-action form at 1440, 1024, 390 and 320 CSS px, plus diagnosing and Record as sent at 1440. Desktop/tablet height is 900; phone height is 844. The tablet primary rail is explicitly collapsed. The fixture deliberately uses one permitted synthetic case; it does not invent a manufacturer directory or production records.

Codex inspected the original references and application captures. Corrections made during comparison: move the next-action editor immediately after the reply, remove empty correspondence content above Record as sent, retain the full phone fault title, keep action footers reachable, align phone cards left, and use two-column sending fields on desktop. The browser checks verify no horizontal page overflow on case views. Files stay in ignored `tmp/sv08-captures/`; application shell artwork is not committed. Hashes below identify the inspected local captures, not a golden baseline or owner approval.

| Local application capture | SHA-256 |
| --- | --- |
| `diagnosing-1440.png` | `6a7d7639cf4d6a7fa1499dd5dc9f84cb6b6c6cd6bbc3d5ab80a56b572ecee806` |
| `next-action-1024.png` | `d5aa18efddc25a30a1fc58b5d576d41985baf109334ac02320c6b261b1fb0d2b` |
| `next-action-1440.png` | `9d01319b076f9b20e09769ba12b4118b8184160fbc1e34b5915cf3d58c093c68` |
| `next-action-320.png` | `30512f55d56589d652dccb8b40e07e8239336271f0d58a0abfc76bd9e4d3a6b1` |
| `next-action-390.png` | `02d4a2abea1df3618669007c0a040e94e52c526d7717c748cde50b98283e55be` |
| `record-sent-1440.png` | `bda12ba2a2afe2518207c8c316a770eaab3493b5940c649d8499d4c3840dda7a` |
| `register-1024.png` | `b071de89a494d729c3b14106ac98f9039fa19ebb0828b35094c8de78929cd41e` |
| `register-1440.png` | `77750117bcdf765c718ff06e387071cfcdfd971925788fbdac4f098ef06cb784` |
| `register-320.png` | `56910dcb9970a61813df034a8e50bce34c805a150c1263a0f98af8d86727925b` |
| `register-390.png` | `c0c98d2b8cb44a086264ea9763cd2c6af0d00d54f77ec2e9fd919708bd916009` |
| `reply-1024.png` | `286211aef21fbe76a4c931828e4394bcc961acf93fbe55b4fae8bbaa6d2c9335` |
| `reply-1440.png` | `01a0316da48fa963fd20bdfc55d6802026cb23d215ffb904b776e9a423d9d223` |
| `reply-320.png` | `5bd26a38dfed1b782017f32e719e3a1a9d2b0e9cd702efd4f16f3d7e72a50ce4` |
| `reply-390.png` | `127b2aa2df62576a040af561813763ddf97e7a4e290183f9420f8a760aebe825` |

## Differences from accepted frames

- D3 requires a native finding at opening. The frame-04 unlinked state is omitted and Create finding and next action becomes Record next action. New references use SYN-ESC; existing source references remain unchanged. This is the recorded [agent decision](../../../decisions/service-escalations-native.md), not Dean's acceptance.
- The register uses the shared table, current row density, read-time/candidate-window wording and explicit paging. It has no unsupported bulk-selection or settings column. Manufacturer filtering and Open case remain visible on phones, making the toolbar taller. Fixture counts, names and dates differ from the three-case design story.
- The shared shell supplies current breadcrumbs, navigation, icons, tab underline and phone bottom bar. Record position and the proposed Conversations control are omitted where no case-navigation/conversation contract exists. Desktop summary width is 340 px (260 at tablet); cards and native controls retain shared spacing and sizes.
- The phone shows the complete fault title in the body and its reference in the shared header. Reply/Diagnosis/Pack/History remain available; configuration is within Diagnosis. Equipment/owner/source details follow the task instead of being removed. This is taller than the design's ellipsised header and static next-action card.
- Next action is an editable native form with owner, due instant, required evidence, approval requirement and audit reason. It updates the required linked finding. Sending uses maintained equipment support details, separate named sender/time and reference/reply date controls, exact file hashes and an audit reason. Shared local-time controls show timezone help. The persistent footer carries the no-send notice and action. These fields require scrolling at smaller sizes.
- Configuration is an immutable snapshot of the existing Equipment narrative/revision, not a newly invented structured controller export. Manufacturer routes are maintained against existing equipment/manufacturer pairs. Missing manufacturer or configuration blocks readiness; warranty shows the recorded end date, not a coverage verdict.
- Evidence files and reply attachments are retained downloads with hashes; no arbitrary attachment preview or external sending is added. Diagnostic source references are recorded text; native source handovers remain available. Free-text technical evidence and photos require an explicit exclusion review.
- Loading, denied, empty, stale and uncertain outcomes use shared controls. Undrawn configuration/history/closed/withdrawn/pack-preview/phone-diagnosis states follow these patterns. No 200% zoom or owner-device visual acceptance is claimed.

## Functional proof

The focused unit suite covers lifecycle and input boundaries, projection exclusions, escaping, hashing and attachment validation. Native database proof covers scope/denial, replay, optimistic versions, withdrawal, immutable packs/files, My Work chase ownership, reply cancellation, native next action, grower-approval gating and closure without source closure. The separate inspection proof uses submitted native readings and instrument/calibration attribution under the senior technician's capability. HTTP and historical upgrade execution are recorded in the dated status fragment; a pending or failed run is not a pass.

Browser proof covers denied reads, retained draft entries across tabs, exact retry of an uncertain command, responsive layout and the diagnosing/sending/reply task states. These fixture tests do not replace native database/HTTP execution or independent review.
