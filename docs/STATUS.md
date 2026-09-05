# Current prototype status

## Recorded user direction

Dean chose to develop this as his own private prototype and created `deanrfiedler-gif/powerplants-one` with a README. He then authorised the repository foundation: the v02 blueprint, documentation structure, project guidance and initial development backlog.

This direction supersedes the master blueprint's proposed company-organisation setup for the **current prototype ownership only**. It does not approve a company deployment or close the enterprise ownership, finance, operational or security decisions.

## What the foundation contains

- Issued Master Blueprint v02 and preserved v01/audit references.
- An index of all 78 parent requirements, 29 open/partially resolved decisions and 38 planned acceptance scenarios.
- Prototype ownership ADR, architecture/service work briefs, contribution/agent guidance and issue/PR templates.
- Initial discovery/design backlog, with live issue links recorded in the delivery register.
- A local documentation validator and a GitHub documentation-check workflow; execution evidence is recorded in the foundation handover.

## What remains planned

No application framework, hosting service, database, ERP write interface or deployment environment has been selected or implemented. There is no runnable business app, active integration, migrated operational dataset or production service. BP-02–BP-09 remain planned specifications, with BP-02/BP-07 and minimum Finance/document detail the recommended next package.

The first operational release remains the proposed planned-service journey. The owner can authorise synthetic prototype design while missing tenant contracts and operational policy values remain explicitly unresolved.

## Decisions affected by the repository setup

| Master decision | Current treatment |
|---|---|
| D-003 | Repository slug `powerplants-one` is in use. Formal programme reference and broader naming remain open; GEN stays provisional |
| D-029 | Personal private repository ownership is confirmed for this prototype. Plan features, enforceable review controls, recovery and eventual company ownership remain open |
| D-001/D-002 | Dean owns prototype work. Company sponsorship, organisation structure and delegated business approvals remain unconfirmed |
| D-022/D-023 | Technology, hosting, commercial budget and ongoing production support remain open |

[ADR-0001](decisions/ADR-0001-personal-private-prototype.md) records the ownership decision. The issued blueprint is intentionally unchanged so it continues to represent its original evidence and approval state.

## Repository controls

The repository was confirmed private with `main` as default branch. Branch protection was not enabled in the inspected baseline. No branch-protection, visibility, membership or paid-plan setting is changed by this foundation. A GitHub Projects board has not been provisioned; the initial backlog uses repository Issues and a versioned index.

Read [foundation handover](delivery/foundation-handover.md) for the actual publication/check status and [the backlog](delivery/backlog.md) for next work.
