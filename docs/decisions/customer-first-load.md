# Customers first-load boundary

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Direction: 9 October 2026 (Australia/Brisbane). Requirements: PT-27, SH-03 and the existing Customers directory. CREMS remains historical background under the independent PPO product direction.

After #370–#373 merged, Dean authorised verification of merged main and the already-running private-demo update, followed by one bounded first-load correction and its measurements. This chat holds the repository write on `codex/customer-first-load`, based on main `dcec2cf05e82e1eaf2c7f90f136701d080cb6248`. The paired chat reviews read-only. No new deployment, merge or feature programme is part of this step.

The baseline places asset loading before the identity read and directory request. Its generated Customers client manifest includes the My Work views/list/overview graph because ShellControls imports NotificationBell from the full notification workspace, which imports MyWorkLayoutPreferences. The bell needs neither those workspace views nor their dialogs/settings. Extract its existing implementation into its own client module and import it directly from the shell. Keep its current-authority resource lifecycle, rendering, error/partial states, links and shell focus handling unchanged. BusinessSession remains the gate for customer content.

Leaving the dependency unchanged retains unnecessary startup code. Deferring all guides, restructuring root CSS, bypassing ContextList or combining session requests would introduce separate questions; they are not needed to establish this isolated boundary. This extraction adds no dependency, data cache, permission, migration or integration.

[Execution evidence](../testing/evidence/customer-first-load/README.md) distinguishes baseline/candidate application builds, diagnostic driver source, actual transfer counts, timing observations and compiled notification/navigation checks. Three contexts per viewport with precise coverage are a diagnostic sample, not ten-user PT-27 acceptance. Keep the three-second candidate target, previous timeout, hosted timing and actual owner/device acceptance open. Complete this bounded contribution and stop at handover.
