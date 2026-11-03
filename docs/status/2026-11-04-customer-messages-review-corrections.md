---
title: Customer messages review findings and reviewed corrections integrated
date: 2026-11-04
---

Codex continued existing [PR #804](https://github.com/deanrfiedler-gif/powerplants-one/pull/804), taking over its released claim and the integration handover. The original heads of #811 (`2175dbac1c217a3ae9586bdbea3e51b8168e07a8`) and #813 (`e4e96307dfe38d9f68cdb2116a16c02a40b3403e`) are ancestors, preserving the separate action reasons and phone Refresh corrections. No child PR was edited or closed.

Main `a9d4a8534c2fbb78e70b42dd0254623826472109` was merged. Only the three authorised conflicts occurred: the document-library row followed by the three original Email rows, and the two entry-based design registers. Main's unrelated entries retain their exact bytes; only the specified additions/replacements differ. Both JSON files parse with unique keys: 361 guides and 385 entries. Studio passed.

The six remaining findings from Claude review 5722636703 are addressed: the action views and Inbox counts read the oldest-first action queue; a filled candidate window is explicitly incomplete; missing dialog content has plain fallbacks; desktop subjects wrap and headings align with cells; facts use plain labels and Brisbane ETA dates; and the decision record attributes build choices to Codex with their source comments. Existing browser scenario bodies and assertions are unchanged; added scenarios cover bounded reads, dialog/fact presentation and desktop/phone Inbox with captures.

Passed here: foundation, prototype, naming, status, design-token validation, seven focused UI units, both native EC-04 database cases, 22 existing S2/S3 database cases and the three HTTP cases run exclusively after their reset. The new native regression retains an older Held message behind 201 newer completed messages and checks a filled action window plus an empty source-filtered result. All fixtures are synthetic.

The [evidence report](../testing/evidence/customer-messages/README.md#review-corrections-and-integration--4-november-2026) records the final broad-check outcome and limitations. Setup succeeded with the database ready and browser unavailable. Browser suites and fresh captures: **not run here; left to GitHub CI**. Historical captures remain labelled as predating the fixes. No independent confirmation, application visual acceptance or deployment is claimed. Claude is asked only to confirm the six findings, unchanged correction integration and the specified conflict resolutions; Dean merges.
