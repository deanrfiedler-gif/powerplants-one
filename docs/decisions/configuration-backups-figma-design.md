---
document_id: PPO-EQ08-CONFIGURATION-BACKUPS-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; restyling the built page, new data and any operating rule separate
source_commit: 7eb4432baefcf8b098a37726b250a311f21e67dc
versioning: git
---

# Configuration backups design — owner decision

On 23 October 2026 Dean asked Claude to "design and build the 'Configuration backups and recovery evidence (EQ-08)' UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." `/equipment/backups` is already built and verified with synthetic data; this design restyles it onto the Equipment page pattern. Claude asked "Do you accept the EQ-08 proposal?" and offered the design with departures D1–D10 and the recommended answers to Q1–Q4. On 31 October 2026 Dean answered: "Accept as drawn".

Claude drew the page from these sources:
- [ADR-0045](ADR-0045-equipment-native-workflows.md), the [Equipment workspace design](equipment-workspace-design.md) and the retained [Equipment r02 HTML](../reference/ui/equipment/PPO-Equipment-and-Installed-Base-Workspace-r02.html);
- the built page and model: `src/components/equipment-evidence.tsx` and `src/equipment/model.ts`, with the [native implementation evidence](../testing/evidence/equipment-native/README.md);
- the Figma proposals for Equipment EQ-01, Commissioning & as-built EN-08, Kitting and controller preparation, Bench testing and returned units, and Change review EN-07.

**Those five were still proposals when EQ-08 was accepted.** EQ-08 reuses their identities and rules, and accepting EQ-08 accepts none of them. If one changes before acceptance, EQ-08's story and handover wording follow it.

Scope:
- `scope:EQ-08` "Configuration backups and recovery evidence", route `/equipment/backups`.
- Parent requirements DAT-03, ENG-07, SVC-06, DOC-01 and DOC-02, and journey J-03; none is added or renamed, and none is marked complete.

This is a design decision. It authorises no application code, route change, migration, capability, grant, adapter, controller connection, business transaction or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design EQ-08 in Figma | User decision, 23 October 2026 | Dean's request quoted above |
| Rules D1–D10 | Accepted as recommended, 31 October 2026 | "Accept as drawn". Section 4 |
| Q1 Where backup files are kept | Direction accepted as recommended; today's practice not verified | One protected SharePoint "Backups" library per customer site is the place of record, and PPO holds its path and checksum. A vendor cloud or a laptop may be where a file is captured, never where it is kept. Nobody has checked where files are kept today |
| Q2 Backup deadline after a change | Design rule accepted as recommended; not an operating rule yet | Within 5 working days of a change being applied, and before handover at commissioning. A late one shows as an overdue gap with an owner; nothing else is blocked |
| Q3 Default custodian | Design rule accepted as recommended | The site's service coordinator for installed equipment; the workshop lead for a unit prepared in Kitting until it is installed. The technician who captured it is recorded as "captured by" |
| Q4 Test-restore at commissioning | Design rule accepted as recommended; not an operating rule yet | Required for controllers PPO configures, onto a workshop bench unit or the installed unit before handover, verified by a second person. Where a restore isn't possible, record "not tested" with the reason; it stays a gap |
| Accept the design | User decision, 31 October 2026 | Quoted above |
| Named Figma version | Saved 31 October 2026 at Dean's instruction | "You save it". Section 7 |
| Restyling the built page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Configuration backups · EQ-08" `2278:452`, under "— Shared records —" after Test instruments EQ-09. The page header `2278:453` holds the conformance declaration; the notes card `2309:4870` is in Flows and notes. File index row `2836:30378` |
| Desktop 1440 | Backup register `2283:254`; Gaps worklist `2285:1060`; CP-4 backup history `2290:5080`; IC-2 out of date `2291:1990`; Record backup `2294:2763`; Record restore evidence `2294:3080` |
| Tablet 1024 | Backup register `2285:1758` |
| Phone 390 | IC-2 backup history `2301:4295`; Record backup `2301:4481` |
| Phone 320 | IC-2 backup history `2304:3551`; Record backup `2304:3625` |
| States | Read-only `2291:2566`; Loading `2309:3807`; Nothing matches `2309:4192`; Could not load `2309:4530`; Configuration changed while recording `2304:4113`; No recovery procedure `2304:3736`; Custodian left `2304:3865`; Never test-restored `2304:3976` |
| Page parts | Moved at acceptance to Components, section "Components · Service, Supply chain and Shared records parts": Backups / Backup grid header `2283:86` and row `2283:87`; Backups / Gap grid header `2283:181` and row `2283:182` |
| Prototype | Flows "EQ-08 — desktop" (from the register) and "EQ-08 — phone" (from the phone history); 16 links, none off the page |
| Story | Synthetic, section 3 |
| Retained captures | [Configuration backups design r01](../reference/ui/equipment/configuration-backups-design-r01/README.md): 19 icon-free PNGs with hashes, from copies `2836:380661`–`2836:394264` on Captures at y = 630,000 |

## 3. Story and conformance

Synthetic, as at Fri 16 Oct 2026, 11:30 AEST. The brief asked for Tue 13 Oct, 09:00, but CP-4 was commissioned and backed up on Thu 15 Oct and Equipment, EN-08 and Bench testing read as at 16 Oct, so 13 Oct would come before the as-built backup (D9).

Reused exactly: Climate screen control panel CP-4 (SYN-AST-000214, serial SYN-SN-260040, Hillview Growers, SYN Glasshouse 4), its revisions 1–3 and backup SYN-BKP-000019; SYN-PPO-BLD-000040; Dosing controller DC-4 SYN-CTL-000014 and kit SYN-KIT-000031; return SYN-RTN-000017 of the 2-channel dosing unit SYN-SN-260037; the register's names and serials for IC-2, CC-4, PI-1 and the loan unit.

The four story cases:
- CP-4: backed up at as-built, Current, test-restored in the workshop at 10:15 on Fri 16 Oct, second-person verification waiting. Equipment's 09:00 frame shows those stages as unknown, which this later time is consistent with;
- DC-4: prepared in Kitting, backup Unverified, restore test due before dispatch;
- 2-channel dosing unit: returned from Block C and restored on the bench from its last backup;
- Irrigation controller IC-2: revision 4 applied on Thu 8 Oct, backup of revision 3 Out of date, one day overdue.

New synthetic records: SYN-BKP-000004, -000009, -000011, -000012, -000014, -000017 and -000018; SYN-KA-000041 to -000043. Their numbers, firmware versions, checksums and SharePoint paths are illustrative.

Conformance: r20 type Document & evidence workspace, supported by Register / worklist and Form / guided workflow. The page header declares the reused components, incoming and outgoing handovers and departures.

## 4. What the design shows

| ID | Rule | Basis |
|---|---|---|
| D1 | Equipment side menu › Equipment records › Configuration backups, on the Service rail with Equipment selected. Backups and Gaps are view tabs; an asset's history opens from its row | Equipment EQ-01; brief |
| D2 | Status in words. Current: matches the current configuration and a restore test passed. Unverified: matches, never test-restored. Out of date: the configuration changed since. No backup. Out of date and No backup outrank Unverified | Brief; ADR-0045 |
| D3 | Every backup names one revision: the current one, or an earlier one recorded as historical with a reason. A later revision makes it historical; it still restores its own revision | ADR-0045; built page |
| D4 | A new backup is a new record. Evidence stages and custodian changes are added, never edited; repeating a stage keeps the earlier one | ADR-0045; `backupProgress` |
| D5 | PPO keeps the protected location reference, source revision and a checksum or file reference. No upload, passwords, keys or connection strings. Restores are done with the manufacturer's tool | ADR-0045; built form; Kitting |
| D6 | Four stages: Backup reviewed, Procedure reviewed, Restore tested, Restore verified, each with where, who, unit, result and evidence. A test restore and a restore performed for return to service are both evidence, never an action PPO performs. The verifier differs from the tester | `backupSteps`; built review form |
| D7 | Gaps: No backup, Out of date, Never test-restored, No recovery procedure and Custodian left, each with an owner, due date and the source that raised it (EN-08, Kitting, Change review, Knowledge, People) | Brief |
| D8 | Phone for the technician: asset history and Record backup at 390 and 320, compact Record header, 16 px inputs, 48 px controls, one full-width main action | Brief; phone header amendment |
| D9 | The story runs as at Fri 16 Oct, 11:30 (section 3) | Consistency with the named pages |
| D10 | Existing references are kept; new ones use SYN-<TYPE>-000nnn with no PPO segment | Readable reference namespaces decision |

Wording: "Restore tested" and "Restore verified" stand for the model's RecoveryTested and RecoveryVerified.

## 5. What this does not decide or build

- Restyling `/equipment/backups` to this design is not decided. The built page stays as it is.
- The built model has no derived status, gaps worklist with owner and due date, custodian-change event, or where and unit-restored fields on restore evidence. Adding them needs its own design and go-ahead, and may need a migration.
- The 5-working-day rule and required test-restores are design rules, not operating procedure, until Dean adopts them for live use.
- Not drawn: the Recovery evidence and Sources tabs at full size; 430 px; the Restore verified form for the second person; tablet record views; the custodian assignment dialog.

## 6. Verification

Audit by script and screenshots: 20 frames including the notes card, Roboto only; no overlap and nothing outside a section; 80 px between sections; 16 links, none off the page. Claude traced the links in code. **The flows were not played in Present mode.**

Viewing the exports at full size after acceptance found three small defects, fixed on the page and the copies before the captures were retained: the breadcrumb cut off the record reference, the evidence-stage cells had uneven heights, and the Gaps tab showed its count twice. None changes content.

Open for those pages' next change, not changed here: Glasshouse 4 is Hillview Growers on Equipment and on this page but "SYN Riverbend Glasshouse 4" on EN-08.

Design acceptance is not functional, business or deployment acceptance.

## 7. Named version

Asked who would save the named Figma version, Dean told Claude: "You save it". Claude saved "Configuration backups — accepted" in the Figma desktop app on 31 October 2026 and saw it at the top of the file's version history.
