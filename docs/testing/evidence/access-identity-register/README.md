# AD-01 identity register implementation evidence

Scope: AD-01; route `/admin/access`; 24 October 2026. Owner: Dean Fiedler. Review status: Draft; owner visual acceptance pending.

The [accepted design captures](../../../reference/ui/access-review/users-and-access-design-r01/README.md) are immutable, icon-free source compositions. The [native continuation](../../../decisions/access-review-native.md#identity-register-continuation--24-october-2026) records the read contract and exposed adaptations. The [page contract](../../../design/development/pages/route-admin-access.md) and [fixture inventory](../../../design/development/access-identity-register-fixtures.json) bind this implementation.

## Separate evidence lanes

`tests/database/access-identity-register.test.ts` exercises real current/scheduled/expired grants, inactive precedence, masked identities, scope, literal search, stable 50-row paging, saved teams, independent request approval/application, unchanged users/grants and authority/context refusal against an isolated `ppo_synthetic_test` database. The browser real-read case uses the actual API and follows the exact returned person identity.

`tests/helpers/access-identity-register.ts` contains synthetic visual examples reflecting the accepted composition. The browser visual case intercepts only the register read; its illustrative counts are not installed as grants and do not prove database behavior. It covers desktop 1440 × 900, tablet 1024 × 900, phone 390 × 844 and narrow phone 320 × 844, filters, sort, selection, columns and cleared failed/denied/working-company reads. Application images, when retained here, omit icon artwork and retain layout/text for comparison.

## Results

Validation is in progress; final results and capture inventory are recorded before handover. No pass or owner review is implied by source presence. Existing runtime icon mapping is reused; exact licensed-icon, physical-device, screen-reader and zoom review remain open. No hosted deployment or business acceptance is included.
