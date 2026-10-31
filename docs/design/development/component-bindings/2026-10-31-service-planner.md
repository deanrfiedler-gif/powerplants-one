# PL-01 component consumer bindings

<!-- versioning: git; committed history is authoritative -->

Consumers: `route:/schedule` and `scope:PL-01`. The [page contract](../pages/route-schedule.md) describes the accepted composition; [build evidence](../../../testing/evidence/service-planner-build/README.md) separates functional proof, capture inspection, owner acceptance and deployment. These bindings add no command authority or review fingerprint.

## planner

`PlannerAttention`, the tray, Day/Week boards and phone sheet consume the native schedule and demand reads. Fixtures cover a bare hold without a reason, authorized gate narratives, complete/partial demand, the 44 px strip, selected visits and drop comparison. Single Week tiles show time and title; multiple tiles keep time with title in hover/details. Phone visits put the title before time/site in a bordered person card.

Shared surface, line, ink and radius tokens remain in use. The existing planner-specific status palette is bridged through scoped semantic variables in `service-planner.css`; it does not extend a shared CSS page list. Missing typed work-order hold causes, release dates and the native proposal's missing crew/board preview remain explicit alignment gaps, not invented fixtures or booking rules.

## application-shell

`SecondaryMenuFrame` receives `data-ppo-workspace="shared"` through `attributes` and starts its Scheduling menu collapsed. `SchedulingNavigation` opts into side presentation only here; other consumers keep their default. The 1024 reference uses the primary rail's existing Collapse primary navigation control. The page does not replace the user's primary navigation preference.

## buttons

Visit cards retain `data-appointment`, `data-status`, keyboard focus and Enter/Space selection. Move or reassign provides the button alternative to drag. A drop only opens Move this visit?; the native save command and authoritative refusals remain. Tray expand/collapse has a named control, counts and captions. Busy state, enabled-before-focus guards and uncertain-save recovery remain with existing command controls.

## read-state

Initial or failed reads make holds unknown. A failed refresh retains the last good board with actions unavailable; a denied read clears protected records. Demand retains its own complete/partial/error state and continuation. The phone tray's Back control returns to the board without inventing a successful refresh. These are separate from an empty permitted result.

## fields

Date, Site, People and display timezone reuse native controls; extra status and Work orders controls remain behind Filters. Move retains current/proposed civil times, complete crew/travel, required reasons, policy preparation and reviewed versions. Plan visit retains authorized work context and its native proposal fields. These forms are longer than the design composition because their existing authority and recovery requirements remain visible.
