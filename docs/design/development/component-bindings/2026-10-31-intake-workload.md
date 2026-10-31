# Intake & workload component consumers

Owner: Dean Fiedler. Review: pending owner visual and device acceptance. Scope: ES-01; route: /estimating. [Page contract](../pages/route-estimating.md), [decision](../../../decisions/intake-workload-design.md), [evidence](../../../testing/evidence/intake-workload-accepted/README.md).

## buttons

Reuse Button for filter, refresh, selection, sequence, export and snapshot controls. Native links retain exact record/revision identities. Refresh disables previously read actions; export revalidates the selected facts and current authority. No allocation or acceptance command is implied.

## register-table

Reuse RegisterTable, RegisterChip and RegisterSortHeader. Host cases include four readiness states, separate owners, null sell, literal search, bounded owner counts and exact saved versions. Workload end columns stay fixed; the wider table scrolls without changing the snapshot width. Phone rows are a scoped accepted host variant. Saved-estimate checkboxes are omitted because no bulk action is contracted.

## menu

Reuse SecondaryMenuFrame, WorklistChoice, WorklistMenu and WorklistPanel. The menu shows All/My and readiness counts from their documented windows. Phone view picker and Filter reuse shell registration. Filter form has labelled search, owner, readiness and supported sort controls. Unconfigured intake rules stay visible.

## dialog

The native modal snapshot implements the accepted overlap as page-scoped geometry; it never docks or shrinks the register. Focus enters the dialog and returns to the opener on close. Escape closes the top interaction; record tabs use arrow/Home/End keys. At 320 px navigation moves into the actions popover. Selection is a labelled non-modal complementary panel; Open in sequence enters the snapshot. Browser cases cover filters, keyboard, URL restoration, unchanged register width and tablet/phone screenshots.

## read-state

Reuse useResource and ErrorNotice with explicit host states. Initial loading has no current rows/counts; refresh marks retained rows unconfirmed and disables actions. Failure or denial removes old rows/counts/selection/snapshot. Tests distinguish native permission revocation from API-boundary failed/stale/no-edit presentation fixtures.

## application-shell

Reuse the existing module rail, secondary menu collapse, guide and compact phone header. The route joins existing styles through data-ppo-workspace=shared and adds one sorted module-workspace declaration to remove the obsolete section tabs. No shared shell CSS is changed. The adopted phone header replaces the original capture's duplicate toolbar. Physical-device, screen-reader and owner acceptance remain review items.
