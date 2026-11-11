---
title: Shell named version saved for the record header toolbar
date: 2026-11-10
---

Dean saved a new named version of the private Figma file "PPO - Shell (accepted)": "Shell refined concept — accepted · record header toolbar". It pins the record header toolbar Dean accepted on 9 November 2026, which the 8 November version "Shell refined concept — accepted" did not carry. The [shell decision record](../decisions/shell-refined-concept-design.md#11-named-version-for-the-record-header-toolbar--10-november-2026) gains section 11: what the version pins, by page and node ID, and which version each build cites. A build of the toolbar, or any build step that starts after 10 November 2026 and uses the shell, cites the new version. A build step already started from the 8 November version, such as the S1 build, keeps it until moving is its own step. The [shell rules export](../design/development/systems/shell-refined-concept-rules.md) now names the saved version. The file's link and key are not recorded (ADR-0050, ADR-0053).

Checked: the version is recorded on Dean's statement; this session cannot read the file's version history, so the two versions were not compared. Repository checks run for this change: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`. Not done: any application code, capture or baseline change; the module records that cite the 8 November version are not edited and cite the new one when next changed.
