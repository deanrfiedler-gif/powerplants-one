# Shared layout and CRM — accepted r08 implementation

**Revision:** r01 · **Date:** 7 September 2026 · **Owner:** Dean Fiedler · **Status:** Implemented in draft PR #59; verification in progress.

## Authority and source

Dean accepted the r08 clickable review and requested implementing its shared layout and CRM, followed directly by the next step. The [decision](../decisions/shared-ui-r08-implementation.md) records the accepted presentation and mapping to current persisted contracts. Existing tracking: PPO-009 / #9; earlier standalone design PR #58. This implementation starts from actual main `4a9c27d5580edc236ff22b15a65ae441c0bc69a4`; P11 draft #57 remains separate.

The accepted personal HTML remains separate from repository source. No embedded screenshot, operational image, customer dataset or new branding bytes are uploaded. The application reuses the existing repository logo/font and native CSS/SVG components.

## Delivered behaviour

The compact shared shell groups Service navigation, shows the actual module, retains bright white navigation icons and uses the accepted navy selected surface/green accent. Synthetic identity controls expand on demand while preserving their original server interaction and owner reset behaviour. Existing module workflows remain reachable.

CRM uses the same permission-filtered I2 query for Board and List. Actual Enquiry/Qualified stages occupy the available desktop width, share a single vertical scrollbar and remain below an opaque fixed header row. Equal-height cards retain customer/site, opportunity owner, reference/outcome and the designated Activity, with coloured state footers and owner descriptions. Full titles remain available through opportunity detail; full Activity text through its existing canonical record. Responsive phone stage selection, independent view scroll position, current page/completeness and error/denial recovery are retained.

New opportunity, qualification and next-Activity planning use the existing I1 forms and server guards. Commercial money/closing fields and automatic rotting/scheduling rules remain outside the current domain; the reference's fictional examples are not copied into persistence.

## Verification

- Local checks use the unchanged exact Node 24.20.0/npm 11.19.0 and lockfile. `npm run check` passed: lint, typecheck, all 20 unit cases and application build. No local PostgreSQL or rendered browser pass is claimed; runtime proof uses the existing disposable CI workflow.
- Retained browser cases now open the collapsed identity controls before switching; their permission, save, isolation and record assertions remain. The table-view label changes from Grid to List.
- The prior unbounded inline long-Activity assertion is replaced because r08 explicitly accepts equal-height clamped cards. Its replacement verifies the exact full text/link and opens the canonical Activity to verify all original 2,000 characters. The shared customer long-Activity case remains.
- Added real-data browser coverage checks desktop widths 1920/1440/1280/1024, phone 390/320, contained stage width, consistent card heights, simultaneous column scroll, stationary headers, retained Board position and selected navigation/keyboard owner access.
- The existing I2 focused browser step is moved earlier in Application assurance for faster UI feedback. Every retained application/database/HTTP/restart/browser gate and dependency pin remains; none is skipped or relaxed.
- The accepted HTML's earlier standalone browser results do not verify this application implementation. Current-source CI and original captures must be inspected before a rendered-verification claim.

## Publication and remaining limits

Draft [PR #59](https://github.com/deanrfiedler-gif/powerplants-one/pull/59) first published source `ef4bb7b479becb29f61ea47d418b0a97aa2903de`. Documentation assurance and the retained standalone design assurance passed. Application run `34128578222` passed static/build and the focused I2 suite, then failed at the Finance test identity helper; Estimating run `34128578095` passed its database, HTTP and restart proofs, then failed at the same helper assumption. Those failures are retained: the old assertion looked for the now-collapsed “Use this identity” button. The correction waits for the confirmed identity's “Change identity” control and the settled identity region. It changes no business assertion or timeout. The 320px canonical long-Activity capture also now explicitly sets that viewport on its separate page. Neither initial failed run is treated as a complete assurance pass.

Original Application run `34128578222` artifact `10021329211` was retrieved and its ZIP SHA-256 verified as `c0d767def0e35ac0ade586cab1aadd56344bb82bec136692c9b36d5404c73e1c`. Desktop Board/List, 320px Board, keyboard owner tooltip and the shared Customers shell were visually inspected. The phone capture exposed an inherited 88px brand minimum height; this is corrected to fit the 50px mobile navigation row, with a regression assertion. The owner tooltip now supports Escape dismissal while retaining keyboard focus and has no mouse gap between trigger and tooltip. Fresh source evidence is required for these corrections.

A fresh private-repository read confirms `deanrfiedler-gif/powerplants-one` and its existing permissions. Direct Git clone has no local credential, so source was fetched through the connected GitHub tools and every fetched blob checked against its Git SHA. Local Git is an inspection snapshot; publication commits must use the actual remote main as parent and preserve its full tree.

Automatic approval review rejected creating a separate tracking issue as an additional disclosure outside the current authorisation. No alternate issue creation was attempted; work continues under existing #9. Repository publication remains subject to its own result and normal checks.

No merge, actual-main verification, independent review, business acceptance, production readiness or deployment is claimed at this checkpoint. The next step is current-source verification and reviewable repository publication, followed by the normal checked merge and verification of actual main when permitted.
