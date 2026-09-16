# Screen Systems specialist design source

The [r01 workbench](../../reference/ui/specialist/PPO-Specialist-Configuration-Workbench-r01.html) is generated from these files. The [report](../../reference/ui/specialist/PPO-Specialist-Configuration-Workbench-Report-r01.md) inventories fields, features and receiving boundaries.

- model.js: reference cases, fields, exact-match boundary, decimal prices, overrides, stable-key rerun and recovery.
- workspace.js: five views, steps, dialogs, local drafts and export/restore.
- workspace.css: scoped r20 presentation and responsive layout.
- fonts.css: exact embedded Roboto CSS reused from the supplied r20 board.
- template.html: shell with explicit assembly markers.

Run **python3 scripts/build-specialist.py** and **node scripts/check-specialist-model.mjs** from the repository root. Native Chrome verification uses **node scripts/check-specialist-browser.mjs** with existing runtime/browser pins, or the focused specialist-design.yml workflow.

Do not add inferred Screen Systems formulae. Approved definitions, ranges, mappings and accepted examples remain G06 prerequisites. Fixture outputs are authored data; arbitrary engineering changes suppress results.
