# Field team implementation verification

Scope: PL-02, `/service/technicians` and `/service/technicians/[id]`.
Owner visual review: pending. This is an implementation work record, not acceptance or deployment evidence.

## Build plan

Refine the existing register and person record against the [accepted Field team design](../../../decisions/field-team-figma-design.md), Figma file "PPO - Design", page `1289:54`, named version "Field team — accepted". Preserve the existing Visits and Needs preparation behaviour and its controlled handovers. Conversations is outside this build.

- Files: the FieldTechniciansScreen and ResourceWorkspaceScreen, page-local styles and view helpers, scoped test fixtures/specs, the three PL-02 page contracts, narrow register/guide/component consumer entries, generated build sequence and a status fragment.
- Reuse: the application shell and compact phone header, SecondaryMenuFrame/useSecondaryMenu, RegisterTable, Button/ButtonLink, ProductIcon through the existing Font Awesome mapping, Field/SelectField, ReadState/Stamp, planner laneDay and competenceState.
- Data: existing permission-scoped synthetic scheduling reads. Use the accepted resource-type fallback for Q3; reuse the planner's standard-hours calculation for Q4. Verify competence completeness before rendering summaries. No source editing or new authority.
- Tests: meaningful unit checks for summaries and URL handovers; browser checks for register, snapshot, record, evidence panel, read states, access boundaries and 320/390/1024/1440 layouts; repository assurance, lint, typecheck, unit suite and build.
- Risks: old r05 browser assertions will need updating for the accepted default/view layout; read completeness must prevent stale evidence; source role labels are not published; phone sheets, picker/menu interiors and tablet person layout have no accepted drawings. Record any necessary adaptation explicitly.

## Results

Implementation and checks are in progress. No pass, visual match, owner review or deployment is claimed.
