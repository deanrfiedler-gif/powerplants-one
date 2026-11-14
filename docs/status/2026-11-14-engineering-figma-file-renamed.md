---
title: Engineering Figma file renamed as a proposal
date: 2026-11-14
---

On 14 November 2026 Dean renamed the Engineering module's Figma file "PPO - Engineering module (proposal)". This follows the convention used by the other module files: "(proposal)" until Dean accepts a file, then "(accepted)" with a named version of the same title.

The rename closes finding AF-028 of the [Engineering module Figma alignment audit](../decisions/engineering-figma-alignment-audit.md) (section 8.7), which had found the shared link naming the file without the suffix. Assumption A1 of the [Engineering record](../decisions/engineering-module-refined-ui-proposal.md) now records the name as settled.

Checked: the Read me title and the A1 notes line in the file already read "(proposal)"; they were read, not edited. The Plugin API does not expose a file's title, so the new name rests on Dean's statement and his link. Repository checks: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

Not done: a named version of the file, which is Dean's to save. The file remains a proposal and nothing is accepted. No Figma file, design register entry, code, route, migration, permission or integration changed.
