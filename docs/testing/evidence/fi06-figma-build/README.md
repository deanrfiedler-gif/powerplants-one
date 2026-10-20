# FI-06 accepted design implementation evidence

Owner visual review: pending. Build and verification in progress.

Authority: [accepted design](../../../decisions/incidents-figma-design.md), private Figma file “PPO - Design”, named version “Incidents and corrective actions — accepted”. Page `1348:2972`; notes `1355:2930`.

## Build plan and claim

- Refine the existing register, incident record, triage and report form in `src/incidents/` and `src/app/incidents.css`.
- Reuse the shell, RegisterTable, RegisterChip, Button, Field, LocalDateTimeField, RecordTabs/RecordPanel, WorklistPanel/WorklistMenu and recoverable commands. Add only FI-06 presentation helpers.
- Extend the existing permission-checked incident reads for register columns and view counts; retain all command authority and exact-scope holds. Use synthetic fixtures. No migration, capability, dependency or deployment is planned.
- Add the accepted reporting handover to the existing visit menus with narrow changes. Keep Source reference explicitly decided in the build record.
- Update the four FI-06 page contracts, register and guides, component consumer bindings, generated build sequence and status fragment in this PR.
- Verify filters, state handling, site-time conversion, permissions, submission recovery, handovers, and desktop/tablet/390/320 layouts. Run repository assurance and report environmental limits separately.

Risks: bounded register reads must not imply global counts; existing command recovery must survive presentation changes; the design's synthetic display references may differ from existing stored identities. Undrawn flows retain existing authority and remain documented gaps. Conversations is outside this build.

## Results

Not yet run. This initial commit claims the work; it is not implementation or visual acceptance.
