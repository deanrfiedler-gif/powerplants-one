---
title: Settings module Figma file renamed to its accepted name
date: 2026-11-14
---

Dean renamed the private Figma file to "PPO - Settings module (accepted)". This follows decision A50 and the naming of the other accepted files, such as "PPO - Shell (accepted)" and "PPO - Sales module (accepted)". The rename closes the last open item of the named-version step. Section 12 of the [Settings refined UI record](../decisions/settings-module-refined-ui-proposal.md) (PPO-SETTINGS-REFINED-FIGMA-PROP) now records it.

The rename leaves the file's link, node IDs and version history unchanged. The build basis is still the named version "PPO - Settings module (accepted)". The file's link is not recorded here (ADR-0050, ADR-0053).

Checked: the link Dean shared carries the new name. Repository checks were run for this change: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`. Nothing here changes code, routes, migrations, permissions or integrations.
