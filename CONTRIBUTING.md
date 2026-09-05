# Contributing to the private prototype

Dean is the prototype owner. Departmental owner roles in the master blueprint are proposed reviewers, not people automatically invited to this repository.

## Work lifecycle

1. Select an issue with a bounded outcome and source/requirement links.
2. Record assumptions and dependencies; identify what can proceed with synthetic examples and what requires source evidence.
3. Create a descriptive branch, for example `docs/service-workflow` or `feature/appointment-planner`.
4. Make the change, update affected documentation and run applicable checks.
5. Open a pull request describing the problem, result, validation and remaining limitations.
6. Merge only within the current user-authorised scope and any repository rules, then update the associated work item.

Use an independent reviewer when available and appropriate. A sole-developer documentation workflow should not falsely claim independent review or require an unavailable second reviewer. Automated checks are advisory unless settings make them required.

## Definition of ready

An implementation item identifies the actor, intended outcome, scope boundary, requirement IDs, data/authority rules, dependency decisions, failure/recovery behaviour and observable acceptance. A discovery item can be ready while those details are the output being investigated.

## Definition of done

The agreed outcome exists, evidence is linked, applicable checks pass, source assumptions remain explicit and documentation is current. Closing a document issue does not mean its application feature has been implemented or a business gate has been approved.

## Records and naming

Preserve the issued `GEN_SPC_PPABusinessPlatform_MasterBlueprint_v02.md` and historical references. Add a new controlled version for material source changes. Use STD-001 naming for issued business documents where applicable. `GEN` remains provisional; `SOL008` belongs to the separate Smartsheet PPA Delivery System and must not be reused here.

GitHub filenames such as `README.md`, `AGENTS.md`, workflows and issue forms follow their standard conventions. Architecture decision IDs (`ADR-0001`) and backlog IDs (`PPO-001`) are local repository identifiers, not invented ERP/programme references.

## Data handling

Keep operational MYOB exports, customer files, personal information and credentials in authorised systems. Prefer synthetic fixtures. A private repository still needs controlled membership, token handling and an appropriate future support/ownership plan.

## Validation

```sh
python3 scripts/check_foundation.py
```

GitHub checks use a pinned checkout action with read-only contents access. No deployment, ERP access or credentials are required. Add runtime/application checks after the technology and implementation scope are selected.
