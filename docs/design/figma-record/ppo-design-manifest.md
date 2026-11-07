---
document_id: PPO-FIGMA-RECORD-MANIFEST
title: "PPO - Design" frozen-file manifest
date: 2026-11-06
owner: Dean Fiedler
status: Record of the frozen file at the ADR-0067 stage 2 cut-off; read from the file through the Figma connector; no review is claimed
versioning: git
---

# "PPO - Design" frozen-file manifest

This is the manifest that [ADR-0067](../../decisions/ADR-0067-design-to-build-operating-model.md) stage 2 requires before the file is moved and duplicated. It lists every top-level page of the private "PPO - Design" Figma file at the cut-off, with its node ID. Under decision 5 the file is frozen as the permanent record, so these node IDs, and every citation that uses them, stay valid. The [design-to-build standard](../../standards/design-to-build-standard.md) section 3 forbids editing, renaming or deleting anything in the file; this manifest is how a later change would be detected.

## Cut-off

- **Named version.** "Before split" exists on the file, saved 6 November 2026. Dean confirmed it in chat in Claude's session; there is no [DEAN] comment. Claude's own attempt to save it through the connector timed out with an unknown result, so this record does not say which save created the version.
- **Read.** The page list was read through the Figma connector on 6 November 2026, before and after the named version was saved. Both reads returned the same 191 entries in the same order.
- **Counts.** 191 top-level entries: 176 pages and 15 section dividers. This matches the 191 pages ADR-0067 recorded on 1 November 2026. 152 pages carry at least one scope ID in their name.
- **Drawing.** Drawing in the file pauses from the cut-off until stage 3, under the standard's transition rule. Whether any page was mid-drawing at the cut-off was not recorded.
- **Not recorded here.** The file key and link, which stay outside the repository (standard section 3). Frame, layer and memory counts, which stage 2 measures separately.

## Pages by section

| Section | Pages |
| --- | ---: |
| (before the first divider) | 1 |
| System | 8 |
| My Work | 12 |
| Sales | 16 |
| Estimating & quotation | 30 |
| Engineering | 8 |
| Projects | 11 |
| Service operations | 22 |
| Supply chain | 12 |
| Finance | 7 |
| Reporting | 6 |
| Shared records | 19 |
| Administration | 13 |
| Customer portal | 6 |
| Evidence | 1 |
| Archive | 4 |

## Manifest

Order is the file's page order. Kind is Divider for a department divider page. Scope IDs are taken from the page name; a page whose name carries none shows a blank.

| # | Node ID | Page name | Kind | Section | Scope IDs |
| ---: | --- | --- | --- | --- | --- |
| 1 | `0:1` | Start here | Page |  |  |
| 2 | `626:2` | — System — | Divider |  |  |
| 3 | `1:4` | Components | Page | System |  |
| 4 | `626:20` | Template · App page | Page | System |  |
| 5 | `986:47` | UX benchmark exemplars | Page | System |  |
| 6 | `1035:48` | Shell top bar amendment | Page | System |  |
| 7 | `1530:70` | Phone header amendment | Page | System |  |
| 8 | `3036:32928` | Phone register patterns · amendment | Page | System |  |
| 9 | `3036:220` | Create forms · shared pattern | Page | System |  |
| 10 | `3031:776966` | System pages | Page | System |  |
| 11 | `626:4` | — My Work — | Divider |  |  |
| 12 | `404:2` | My Work · SH-01 · SH-02 | Page | My Work | SH-01 SH-02 |
| 13 | `2998:12031` | Reviews & handovers · SH-06 | Page | My Work | SH-06 |
| 14 | `1141:49` | Conversations | Page | My Work |  |
| 15 | `2367:85` | Assistant · AI-01 | Page | My Work | AI-01 |
| 16 | `2389:273553` | Answer evidence · AI-03 | Page | My Work | AI-03 |
| 17 | `2389:278889` | Proposal review · AI-02 | Page | My Work | AI-02 |
| 18 | `2394:866287` | Voice capture · AI-05 | Page | My Work | AI-05 |
| 19 | `2393:864503` | Drafting & domain help · AI-04 | Page | My Work | AI-04 |
| 20 | `2403:47777` | Recurring checks · AI-07 | Page | My Work | AI-07 |
| 21 | `2105:638399` | My account and preferences · SH-03 · SH-05 · EC-02 | Page | My Work | SH-03 SH-05 EC-02 |
| 22 | `2105:638924` | Search · SH-04 | Page | My Work | SH-04 |
| 23 | `2125:688373` | Calling and call logging · CS-01 · CS-02 · CR-01 | Page | My Work | CS-01 CS-02 CR-01 |
| 24 | `626:6` | — Sales — | Divider |  |  |
| 25 | `2966:12981` | Sales Pulse & Tasks · SH-02 | Page | Sales | SH-02 |
| 26 | `190:20237` | Leads (accepted) | Page | Sales |  |
| 27 | `224:2` | Lead record page (accepted) | Page | Sales |  |
| 28 | `549:2` | Deals · CR-04 | Page | Sales | CR-04 |
| 29 | `2336:155` | Pipeline insights · CR-04 | Page | Sales | CR-04 |
| 30 | `879:44` | Deal record page · CR-01 | Page | Sales | CR-01 |
| 31 | `1499:392390` | Emails · EC-01 | Page | Sales | EC-01 |
| 32 | `1511:396797` | Calendar · EC-03 | Page | Sales | EC-03 |
| 33 | `1509:394554` | Customer messages · EC-04 | Page | Sales | EC-04 |
| 34 | `2689:87` | Won-deal receiving · CR-03 | Page | Sales | CR-03 |
| 35 | `2294:85` | Sales aftercare · CR-05 | Page | Sales | CR-05 |
| 36 | `653:38` | Products · PD-01 | Page | Sales | PD-01 |
| 37 | `2393:864572` | Product publication · PD-02 | Page | Sales | PD-02 |
| 38 | `2393:859137` | Product pricing · PD-03 | Page | Sales | PD-03 |
| 39 | `2393:868573` | Product compatibility · PD-04 | Page | Sales | PD-04 |
| 40 | `2404:211` | Catalogue import · PD-05 | Page | Sales | PD-05 |
| 41 | `626:8` | — Estimating & quotation — | Divider |  |  |
| 42 | `128:8845` | Intake & workload · ES-01 | Page | Estimating & quotation | ES-01 |
| 43 | `2244:733125` | Estimate detail · ES-01 | Page | Estimating & quotation | ES-01 |
| 44 | `152:1122` | Sales briefs · CR-02 | Page | Estimating & quotation | CR-02 |
| 45 | `2245:736961` | Sales brief page · CR-02 | Page | Estimating & quotation | CR-02 |
| 46 | `1400:345306` | Discovery register · ES-02 | Page | Estimating & quotation | ES-02 |
| 47 | `1414:356570` | Create discovery workspace · ES-02 | Page | Estimating & quotation | ES-02 |
| 48 | `383:2` | Estimation Wizard · ES-02 | Page | Estimating & quotation | ES-02 |
| 49 | `1431:809` | Discovery costing · ES-02 | Page | Estimating & quotation | ES-02 |
| 50 | `408:4` | Priva Fertigation Workbench · ES-02 | Page | Estimating & quotation | ES-02 |
| 51 | `2043:80` | Automation Configurator · ES-02 | Page | Estimating & quotation | ES-02 |
| 52 | `711:38` | Excel estimate import | Page | Estimating & quotation |  |
| 53 | `464:2` | CPQ · 1 Read me, sources & decisions (accepted) | Page | Estimating & quotation |  |
| 54 | `464:3` | CPQ · 2 Foundations & components (accepted) | Page | Estimating & quotation |  |
| 55 | `464:4` | CPQ · 3 Rules studio (accepted) | Page | Estimating & quotation |  |
| 56 | `464:5` | CPQ · 4 Configure & price (accepted) | Page | Estimating & quotation |  |
| 57 | `464:6` | CPQ · 5 Compare, history & overrides (accepted) | Page | Estimating & quotation |  |
| 58 | `464:7` | CPQ · 6 Responsive & states (accepted) | Page | Estimating & quotation |  |
| 59 | `406:2` | Screen Configurator Workbench · ES-08 | Page | Estimating & quotation | ES-08 |
| 60 | `133:2366` | Cost sources · ES-03 | Page | Estimating & quotation | ES-03 |
| 61 | `123:40` | Quotations · ES-05 · ES-06 · ES-07 | Page | Estimating & quotation | ES-05 ES-06 ES-07 |
| 62 | `2142:82` | Quotation detail · ES-05 · ES-06 | Page | Estimating & quotation | ES-05 ES-06 |
| 63 | `2244:50245` | Quotation release · ES-05 | Page | Estimating & quotation | ES-05 |
| 64 | `2221:85` | Quotation page & customer views · ES-05 | Page | Estimating & quotation | ES-05 |
| 65 | `2244:50787` | Customer response · ES-06 | Page | Estimating & quotation | ES-06 |
| 66 | `2705:2415` | Quotation conversion · ES-07 | Page | Estimating & quotation | ES-07 |
| 67 | `56:2` | Reviews & approvals · ES-04 · ES-05 | Page | Estimating & quotation | ES-04 ES-05 |
| 68 | `2244:734679` | Estimate review · ES-04 | Page | Estimating & quotation | ES-04 |
| 69 | `2244:50439` | Estimate-to-actual review · ES-09 | Page | Estimating & quotation | ES-09 |
| 70 | `2244:48064` | Reference cases & calibration · ES-10 | Page | Estimating & quotation | ES-10 |
| 71 | `2315:792701` | Rules studio · rule sets, derived values & tables · ES-02 · ES-03 | Page | Estimating & quotation | ES-02 ES-03 |
| 72 | `626:10` | — Engineering — | Divider |  |  |
| 73 | `184:1047` | Engineering workload · EN-01 | Page | Engineering | EN-01 |
| 74 | `2091:552579` | Design basis & interfaces · EN-02 | Page | Engineering | EN-02 |
| 75 | `2091:592460` | Drawings & controlled documents · EN-03 | Page | Engineering | EN-03 |
| 76 | `2091:586789` | Technical queries · EN-04 | Page | Engineering | EN-04 |
| 77 | `2092:1424` | Materials & substitutions · EN-06 | Page | Engineering | EN-06 |
| 78 | `2091:595141` | Technical reviews · EN-05 | Page | Engineering | EN-05 |
| 79 | `2097:583371` | Change review · EN-07 | Page | Engineering | EN-07 |
| 80 | `2091:542313` | Commissioning & as-built · EN-08 | Page | Engineering | EN-08 |
| 81 | `626:12` | — Projects — | Divider |  |  |
| 82 | `209:46` | Projects · PJ-02 | Page | Projects | PJ-02 |
| 83 | `2883:6244` | Project initiation · PJ-01 | Page | Projects | PJ-01 |
| 84 | `345:2` | Project record page · PJ-02 | Page | Projects | PJ-02 |
| 85 | `1743:5636` | Baseline, forecast and dependency review · PJ-03 | Page | Projects | PJ-03 |
| 86 | `2097:630918` | Risks & issues · PJ-04 | Page | Projects | PJ-04 |
| 87 | `933:11285` | Contract obligations, notices and variations · PJ-05 | Page | Projects | PJ-05 |
| 88 | `2097:655149` | Subcontractor packages · PJ-06 | Page | Projects | PJ-06 |
| 89 | `2720:87` | Delivery readiness · PJ-07 | Page | Projects | PJ-07 |
| 90 | `1577:10373` | Stakeholder updates · PJ-08 | Page | Projects | PJ-08 |
| 91 | `2998:123` | Site assurance · PJ-09 | Page | Projects | PJ-09 |
| 92 | `2097:6900` | Acceptance & closeout · PJ-09 | Page | Projects | PJ-09 |
| 93 | `626:14` | — Service operations — | Divider |  |  |
| 94 | `1249:9313` | Service requests · SV-01 · SV-02 | Page | Service operations | SV-01 SV-02 |
| 95 | `193:18953` | Work orders · SV-03 | Page | Service operations | SV-03 |
| 96 | `312:2` | Work order record page · SV-03 | Page | Service operations | SV-03 |
| 97 | `1203:5805` | Service planner · PL-01 | Page | Service operations | PL-01 |
| 98 | `1326:4525` | Changes and follow-up · PL-04 | Page | Service operations | PL-04 |
| 99 | `1371:3488` | Travel review · PL-05 | Page | Service operations | PL-05 |
| 100 | `2244:50314` | Capacity review · PL-03 | Page | Service operations | PL-03 |
| 101 | `1187:50` | Appointment detail · SV-04 | Page | Service operations | SV-04 |
| 102 | `1289:54` | Field team · PL-02 | Page | Service operations | PL-02 |
| 103 | `272:2` | Job pack · SV-05 | Page | Service operations | SV-05 |
| 104 | `1265:53` | Service review and reports · SV-06 | Page | Service operations | SV-06 |
| 105 | `1490:70` | Customer response · FI-07 | Page | Service operations | FI-07 |
| 106 | `1358:3488` | Findings and follow-up · SV-07 | Page | Service operations | SV-07 |
| 107 | `1365:2901` | Remote diagnosis and escalation · SV-08 | Page | Service operations | SV-08 |
| 108 | `845:44` | My jobs · FI-01 | Page | Service operations | FI-01 |
| 109 | `2920:2650` | Time & labour review · FI-01 | Page | Service operations | FI-01 |
| 110 | `2336:85` | Site readiness · FI-05 | Page | Service operations | FI-05 |
| 111 | `1339:4184` | Inspections · FI-03 · FI-04 | Page | Service operations | FI-03 FI-04 |
| 112 | `1348:2972` | Incidents and corrective actions · FI-06 | Page | Service operations | FI-06 |
| 113 | `2089:548670` | Service agreements · MA-01 · MA-02 | Page | Service operations | MA-01 MA-02 |
| 114 | `2091:545925` | Maintenance · MA-03 · MA-04 | Page | Service operations | MA-03 MA-04 |
| 115 | `2089:15560` | Warranty cases · MA-06 · MA-07 | Page | Service operations | MA-06 MA-07 |
| 116 | `697:38` | — Supply chain — | Divider |  |  |
| 117 | `2089:529958` | Material demand · SC-01 | Page | Supply chain | SC-01 |
| 118 | `2089:544463` | Purchasing · SC-02 | Page | Supply chain | SC-02 |
| 119 | `2089:531469` | Inbound shipments · SC-03 | Page | Supply chain | SC-03 |
| 120 | `2089:535413` | Receiving · SC-04 | Page | Supply chain | SC-04 |
| 121 | `697:39` | Inventory · SC-05 | Page | Supply chain | SC-05 |
| 122 | `1690:76` | Workshop builds · CX-02 | Page | Supply chain | CX-02 |
| 123 | `2044:488208` | Kitting and controller preparation · CX-02 | Page | Supply chain | CX-02 |
| 124 | `2083:82` | Bench testing and returned units · CX-02 | Page | Supply chain | CX-02 |
| 125 | `2089:527625` | Returns & claims · SC-08 | Page | Supply chain | SC-08 |
| 126 | `2914:372` | Material change impact · SC-09 | Page | Supply chain | SC-09 |
| 127 | `2089:15629` | Dispatch & delivery · SC-06 · SC-07 | Page | Supply chain | SC-06 SC-07 |
| 128 | `2091:539160` | Service stock · SC-10 | Page | Supply chain | SC-10 |
| 129 | `1580:4164` | — Finance — | Divider |  |  |
| 130 | `2091:592837` | Finance handoffs · FN-01 | Page | Finance | FN-01 |
| 131 | `2097:606288` | Customer accounts · FN-02 | Page | Finance | FN-02 |
| 132 | `1580:4165` | Project financial performance · FN-03 | Page | Finance | FN-03 |
| 133 | `2097:611315` | Claims & obligations · FN-04 | Page | Finance | FN-04 |
| 134 | `2097:681762` | Cash outlook · FN-05 | Page | Finance | FN-05 |
| 135 | `2105:626649` | Measure definitions · FN-06 | Page | Finance | FN-06 |
| 136 | `2948:1497` | Finance exceptions · FN-01 · FN-02 | Page | Finance | FN-01 FN-02 |
| 137 | `2199:594` | — Reporting — | Divider |  |  |
| 138 | `2199:595` | Reports overview · RP-01 | Page | Reporting | RP-01 |
| 139 | `2404:876863` | Sales performance · RP-02 | Page | Reporting | RP-02 |
| 140 | `2411:33278` | Service performance · RP-04 | Page | Reporting | RP-04 |
| 141 | `2410:885569` | Supply & Finance trust · RP-05 | Page | Reporting | RP-05 |
| 142 | `2413:127` | Delivery performance · RP-03 | Page | Reporting | RP-03 |
| 143 | `2466:3344` | Report definitions · RP-06 | Page | Reporting | RP-06 |
| 144 | `744:2608` | — Shared records — | Divider |  |  |
| 145 | `1443:2615` | Organisations · CS-01 | Page | Shared records | CS-01 |
| 146 | `2302:786940` | Account development · CS-07 | Page | Shared records | CS-07 |
| 147 | `2288:761` | Stakeholders · CS-03 | Page | Shared records | CS-03 |
| 148 | `1375:2901` | Sites · CS-04 | Page | Shared records | CS-04 |
| 149 | `1415:357158` | Facilities and growing areas · CS-05 | Page | Shared records | CS-05 |
| 150 | `1395:150275` | People · CS-02 | Page | Shared records | CS-02 |
| 151 | `1400:346423` | Access & readiness · CS-06 | Page | Shared records | CS-06 |
| 152 | `1464:2918` | Site surveys · CS-08 | Page | Shared records | CS-08 |
| 153 | `2089:526174` | Equipment · EQ-01 | Page | Shared records | EQ-01 |
| 154 | `2662:87` | Movement, replacement & retirement · EQ-04 | Page | Shared records | EQ-04 |
| 155 | `2089:536153` | Test instruments & calibration · EQ-09 | Page | Shared records | EQ-09 |
| 156 | `2280:85` | Bulletins & lifecycle · EQ-06 · EQ-07 | Page | Shared records | EQ-06 EQ-07 |
| 157 | `2278:452` | Configuration backups · EQ-08 | Page | Shared records | EQ-08 |
| 158 | `744:2609` | Document library · DK-01 · DK-02 | Page | Shared records | DK-01 DK-02 |
| 159 | `770:42` | Output, issue and distribution · DK-03 | Page | Shared records | DK-03 |
| 160 | `793:6155` | Template management · DK-06 | Page | Shared records | DK-06 |
| 161 | `2200:833` | Knowledge · DK-04 | Page | Shared records | DK-04 |
| 162 | `2244:734610` | Knowledge authoring · DK-05 | Page | Shared records | DK-05 |
| 163 | `3015:123` | Help Centre & page guides · DK-07 | Page | Shared records | DK-07 |
| 164 | `1551:23773` | — Administration — | Divider |  |  |
| 165 | `1551:23774` | Users and access · AD-01 | Page | Administration | AD-01 |
| 166 | `2049:11645` | Settings · AD-02 | Page | Administration | AD-02 |
| 167 | `2997:1271` | Settings amendments · AD-02 | Page | Administration | AD-02 |
| 168 | `3016:6710` | Workshop settings · CX-02 | Page | Administration | CX-02 |
| 169 | `2097:685460` | Mappings & reconciliation · AD-05 | Page | Administration | AD-05 |
| 170 | `2097:678714` | Integrations · AD-04 | Page | Administration | AD-04 |
| 171 | `2097:614223` | Data quality · AD-03 | Page | Administration | AD-03 |
| 172 | `2097:668418` | Audit history · AD-07 | Page | Administration | AD-07 |
| 173 | `2333:797215` | Operational health · AD-09 | Page | Administration | AD-09 |
| 174 | `2393:852796` | Assistant settings · AI-06 | Page | Administration | AI-06 |
| 175 | `2438:893312` | Migration & cutover · AD-06 | Page | Administration | AD-06 |
| 176 | `3017:123` | Retention & lifecycle · AD-08 | Page | Administration | AD-08 |
| 177 | `3022:2348` | Onboarding & support · AD-10 | Page | Administration | AD-10 |
| 178 | `2105:659721` | — Customer portal — | Divider |  |  |
| 179 | `2105:659722` | Portal home & access · CP-01 | Page | Customer portal | CP-01 |
| 180 | `2179:85` | Support requests · CP-02 | Page | Customer portal | CP-02 |
| 181 | `2179:237` | Project updates · CP-03 | Page | Customer portal | CP-03 |
| 182 | `2199:85` | Equipment & reports · CP-04 | Page | Customer portal | CP-04 |
| 183 | `2244:41313` | Customer knowledge · CP-05 | Page | Customer portal | CP-05 |
| 184 | `2281:149` | Quotations & account · CP-06 | Page | Customer portal | CP-06 |
| 185 | `626:16` | — Evidence — | Divider |  |  |
| 186 | `115:2` | Captures (icon-free) | Page | Evidence |  |
| 187 | `626:18` | — Archive — | Divider |  |  |
| 188 | `1:5` | Screens | Page | Archive |  |
| 189 | `31:214` | Shell | Page | Archive |  |
| 190 | `73:4` | Shell v2 (proposal) | Page | Archive |  |
| 191 | `554:2` | Customer 360 (proposal) | Page | Archive |  |
