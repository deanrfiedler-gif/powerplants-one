---
title: Service module alignment batch 1, Part 1
date: 2026-11-13
---

Part 1 of alignment batch 1 has been applied to the Figma file "PPO - Service module", and the [Service module record](../decisions/service-module-refined-ui-proposal.md) is updated in place with a new section 11. Part 1 covers the Blocker SVA-001, the Majors SVA-002 to SVA-023, the file name SVA-035 and the record corrections SVA-040. The batch comes from section 10 of the [Service alignment audit](../decisions/service-module-figma-alignment-audit.md) (PPO-SERVICE-FIGMA-ALIGNMENT-AUDIT), with Dean's decisions Q1 to Q13 of 13 November 2026.

Settings now owns the scheduling-policy, preparation-policy and record-reference editors. Service shows them read only, with "Edit in Settings" for the duty holders, and keeps Policy impact. The file now agrees with the other records on several story facts:
- Casey Ward's 09:30 Woodhaven visit and Hillview pack acknowledgement;
- Supply's parts-ready signal;
- the SYN-RPT-000039 recovery;
- the 10:42 portal response, drawn on a new state sheet RV12c;
- the release to the portal;
- the commissioning handover scope and receiver;
- the Finance credit hold;
- the Westgate send state;
- the supplier-claim owner and return number;
- the Block C dates;
- Service receiving.

File-wide, the pass fixed pronouns, revisions (rNN), the text scale, the focus ring, state tones, phone target sizes and the My Work pill. Page-level notices became instances of the newly rebuilt local Shell / Banner and Shell / Toast. The settings pages lost the right strip, and the Read me now carries the confirmed file name.

Addendum A3 was supplied to this session and settled three readings the audit had reconstructed. No change was needed for the M-4 motor serial. The return renumbering is confirmed. The Block C customer stays SYN Northbank Nursery, and the site reads Northbank Farm · Block C. The record's section 11 lists every assumption and the conflicts left for Dean. Part 2 (the Minors and Polish) follows in its own session. Dean is asked to save the named version "PPO - Service module · alignment batch 1 (Blocker and Majors)".

Checked:
- each item's own proof, by readback of the Figma file;
- a file-wide scan of all 17 scope pages and the Read me: pronouns, revisions, text sizes, state tones, sheet and label bounds, phone targets and the replaced facts;
- renders of MJ01, MJ03, PL01, AP01 and AD04;
- an inventory read-back of every changed and added sheet;
- `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

Not checked: the other module files themselves (their facts were compared with their records), any prototype, keyboard or device review, and whether another session was editing the file, because the plugin API exposes neither version history nor active users. No other Figma file, record or code was changed; every record shown is synthetic.

<!-- decision-index -->
[Service module refined UI pages](../decisions/service-module-refined-ui-proposal.md) (PPO-SERVICE-REFINED-FIGMA-PROP) now records alignment batch 1, Part 1 (section 11): the Blocker and Majors of PPO-SERVICE-FIGMA-ALIGNMENT-AUDIT applied to "PPO - Service module" under Dean's decisions Q1 to Q13, the record corrections of SVA-040 and the confirmed file name. Design acceptance is not given; all data is synthetic.
