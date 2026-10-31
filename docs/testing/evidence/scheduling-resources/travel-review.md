# Travel review PL-05 implementation and evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Implementation: Codex, 31 October 2026. Branch: `codex/travel-review`; [PR #806](https://github.com/deanrfiedler-gif/powerplants-one/pull/806). Accepted source: [Travel review decision](../../../decisions/travel-review-figma-design.md), D1–D5/Q1/Q2 and [six retained r01 captures](../../../reference/ui/service/travel-review-design-r01/README.md). Parent SVC-04/SVC-05/SVC-08 and scheduling interfaces remain unchanged.

## Functional proof

16 focused and existing Scheduling model tests passed. New browser scenarios cover conflict/default person, correct leg, immutable comparison/reset/reversal, exact handover, limited resources, empty, failed/denied refresh, stale reads, keyboard use and four widths. Full and incremental typecheck (8 GB Node heap), lint and studio validation passed. Browser execution is in progress; existing Scheduling failures await an unmodified-main comparison. Final documentation checks are pending. Existing scheduling specs remain unchanged.

Real npm ci completed without engine override or junction. No migration, capability, grant, dependency, booking command or production connection. The task owns its loopback dev server on a free non-3000 port. Synthetic response fixtures are presentation proof, not database authority or operational rules.

## Design comparison and differences

All six retained accepted captures inspected; final application capture inspection pending. One live Figma design-context read timed out; no design edit or asset download was performed. Visual acceptance is not claimed.

- Current Scheduling tabs/navigation remain under the authorised initial-preflight fallback. No Service planner branch/PR existed at that check; [Service planner #808](https://github.com/deanrfiedler-gif/powerplants-one/pull/808) opened at 09:44:50 UTC, after the Travel claim at 09:42:20 UTC. Its optional side-navigation prop preserves the current default; [shared-file overlap was notified](https://github.com/deanrfiedler-gif/powerplants-one/pull/808#issuecomment-6542684131). No shared CSS root-ID lists were extended and no SecondaryMenuFrame opt-in is needed for this retained navigation.
- The source supplies no depot identity. Endpoints say location not supplied, and boundary times are identified as allowance boundaries, not confirmed departure/arrival. Inter-site labels describe the compared order, not a route-provider result.
- Blocks supply a kind and interval, not the design’s toolbox-talk name; closures additionally expose any supplied reason. No synthetic business name is inserted into live read data.
- With neither a conflict nor a linked signed-in technician, choose the first permitted person. This resolves the coordinator/no-conflict case; an unavailable explicit selection stays unavailable.
- The live toolbar retains accessible native day and IANA timezone controls; site filtering is disclosed in place, with timezone also in Filters on phone. Read metadata uses the returned observation time; at narrow widths the clock is hidden. The fixture day is 22 September 2031, not the design’s 13 October 2026.
- Cards keep explicit customer, crew, site timezone and full source dates when outside the selected local day. Summary lists closures separately, distinguishes overlap counts and missing travel bases, and calls paired buffers allowances rather than implying measured trips. These truthful source details can make the route taller than the design.
- Shared status controls and local fallback icons remain their current runtime variants. No Font Awesome Pro artwork is copied. Undrawn loading/denied/limited-resource states use existing controls. The empty state is a single card without a zero-visit route or summary.

## Separate statuses

Functional proof: partial, checks above only. Visual comparison: pending application captures. Owner acceptance: accepted design only, implementation not accepted. Physical-device/assistive-technology/native-zoom review: not performed. Deployment: not performed. Claude exact-head review and every merge gate remain required.
