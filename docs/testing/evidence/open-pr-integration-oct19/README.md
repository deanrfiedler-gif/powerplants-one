# Open PR integration — 19 October 2026

Owner: Dean Fiedler. Integration and source review: Codex, at Dean's request to repair and merge the open pull requests. Branch: `codex/integrate-open-prs-oct19`; [PR #622](https://github.com/deanrfiedler-gif/powerplants-one/pull/622). This is synthetic repository verification, separate from owner/device acceptance and deployment.

## Integrated contributions

| PR | Source head | Contribution |
|---|---|---|
| #606 | `6d50abc1` | Accepted compact phone-header design |
| #609 | `f0d31c32` | Compact phone-header implementation and browser test adaptations |
| #610 | `3cc78b27` | Accepted Calendar design |
| #615 | `614a3200` | Accepted Stakeholder updates design |
| #616 | `5e25908f` | Workshop register pages, placement rule and accepted Workshop builds design |
| #617 | `b7b6c86a` | Accepted Project financial performance design |
| #619 | `8ed80e9f` | Separate document/design entries and locally derived UI build sequence |
| #621 | `307d549a` | Accepted Baseline, forecast and dependency review design |

Each source head is retained as an ancestor of the integration branch. The shared document register and design index retain their existing entries. Ten new document rows and five design entries move into the per-change files introduced by #619. Generated status and decisions indexes are regenerated from all fragments. The UI sequence keeps #616's SD-06 Workshop placement and #619's ignored `tmp/` output. No issued reference is rewritten.

## Repairs and review

- Resolved additive index/register conflicts and the deleted generated UI sequence conflict. No parent requirement or scope identity is renamed.
- Reconciled #606's completed Figma lock-in with #609's newer application implementation, keeping running-app owner review pending.
- Fixed stale phone callbacks: replacing a registration's configuration without notifying its consumers left already-rendered controls holding the previous callbacks. Stable wrappers now dispatch to the latest page state, including an action retained by an open record menu. The regression exercises the chooser, action, separate/combined filter, previous/next and More actions.
- Codex reviewed the Claude-authored source changes and design decision records for authority boundaries, preservation of source evidence, synthetic calculations, permission proposals and implementation scope. This is a different-model source review; no new Figma, device, operational or Finance acceptance is claimed.
- The first combined phone-browser run passed 439 tests and failed the directory-navigation test because it still requested the removed Organisations menu button. The test now opens the accepted header view chooser by its accessible name, verifies the Organisations dialog and retains the exact People/Sites destination checks.
- Bounded the Project financial performance decision's MYOB observations to the one inspected project; zero projection columns there do not establish company-wide forecasting usage.
- The first performance run's retained phone sample shows successful core API responses followed by a 120-second wait for the hidden Change identity button. Seven diagnostic scripts now reuse the existing phone-aware identity locator. The identity region must still settle and the mounted trigger must still be enabled; no menu is opened inside the timed sample, and no original failed sample is discarded or replaced. The directory browser proof covers the shared locator on desktop and phone.

## Validation

- Targeted unit tests: **31 passed**, including the stale-callback regression, phone markup/accessibility contracts, working-register identities, Font Awesome mapping, breadcrumbs and source-text integrity.
- Development register: **0 errors**, 366 entries, 338 unreviewed and 28 stale; all 48 component reviews remain pending.
- Foundation, prototype, naming, migration numbering, status generation, lint, typecheck and the full application build passed locally on the integration before the final test/documentation repair.
- The repaired directory navigation and shared identity readiness checks passed against the compiled application on desktop and phone (**2 passed**) using a separate loopback `ppo_synthetic_test` instance. Targeted ESLint and typecheck also passed after the seven diagnostic scripts adopted the existing locator. The phone proof explicitly verifies that the retained trigger is hidden and enabled.
- The first full CI run passed the general desktop browser suite, CRM, Email Calendar, Estimating E1, Supply, HTTP, reports and focused quality checks. The phone-browser failure above requires verification on the repaired head. [PR #622 checks](https://github.com/deanrfiedler-gif/powerplants-one/pull/622/checks) retain the authoritative final-head outcomes; merging requires the protected checks to pass.

## Limits

Conversations T2b [#620](https://github.com/deanrfiedler-gif/powerplants-one/pull/620) was initially excluded from this integration because its remote head contained only a migration reservation and design/plan. It was merged separately into main on 19 October at 14:10 UTC as `f5ca408e`; this integration incorporates that main update without claiming assistant implementation. The author's separate worktree is not edited. Original PR descriptions may predate the later saved-version evidence in their committed decision records. Application delivery does not approve the proposed Finance definitions or external-system integrations. No deployment, external message, operational migration or business transaction is performed.
