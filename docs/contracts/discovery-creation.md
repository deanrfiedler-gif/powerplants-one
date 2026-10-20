# Reviewed discovery creation

<!-- versioning: git -->

Owner: Dean Fiedler. Scope: ES-02, PPO-010, EST-01–EST-09. Direction: [creation journey decision](../decisions/discovery-creation-journey.md). Implementation and verification are in progress; owner visual review is pending.

## Read and review

`GET /api/v1/estimating/workspaces/create-options` accepts `opportunity_id`, optional `scope_mode` (`Site`, `Unknown`, `NoSiteRequired`) and optional `site_id`. It reuses existing scoped permissions, shows active estimator candidates and the permitted Sales brief with acceptance revision, receiver, time and source-change state. Choices are bounded to the first 100 active users, with `more_estimators` explicit. The final preview checks the chosen estimator against the complete proposed scope and references. Neither this read nor assignment creates grants.

The existing `estimatingOptions` and `discoveryFormOptions` reads remain unchanged. The create proposal and command accept an optional `creation` object:

- `owner_id`: initial estimator, an active user with the existing opportunity and discovery-scope read/edit duties.
- `sales_brief`: explicit `null` when there is no current accepted brief, or `{ handover_id, acceptance_event_id, expected_version, source_hash }` identifying the exact reviewed acceptance.

The server compares that selection to the opportunity's current permitted accepted brief. An accepted brief cannot be silently omitted. A changed acceptance or source requires renewed review. The incoming estimator must be able to read the linked source and edit the actual proposed scope. Preview returns the reviewed owner and attributed brief alongside the existing validation and confirmation requirements.

## Commit and original recovery

The existing `CreateEstimatingWorkspace` command, workspace transaction lock and operation journal create the workspace, Option A, first discovery revision and optional binding atomically. `created_by` and answer attribution identify the creator; `owner_id` identifies the selected estimator. A linked Sales acceptance retains its original receiver. It neither changes that acceptance nor confirms discovery answers.

Migration 0113 replaces only the deferred binding guard. The new branch requires matching creation audit details, first option/revision, reviewed owner and Sales selection, original creation receipt and workspace-created publication. The separate `SalesHandover:BindEstimating` branch retains its receiver/owner restrictions. Binding rows remain immutable.

Exact retry checks the creator's current access to the retained workspace, revision and Sales evidence before returning the original receipt. It does not require the creator to be the assigned estimator. Editing the resulting workspace still requires its owner. Other mutation receipts retain their owner checks. Payloads without `creation` retain the original normalised shape, creator ownership and separate Sales-link workflow, including their existing hashes and receipts.

## Limits and review

This is an online creation contract; it adds no offline persistence or queued creation. Creating a workspace does not cost, price, approve or deploy anything. Existing owner reassignment is outside this change. The accepted page still requires responsive implementation and frame comparison. The bounded estimator list may need a separately designed search if more than 100 active users are introduced; the current prototype must report the limit rather than imply a complete list.

Evidence: [prerequisite execution record](../testing/evidence/discovery-creation/README.md). Test results, owner acceptance and deployment are separate.
