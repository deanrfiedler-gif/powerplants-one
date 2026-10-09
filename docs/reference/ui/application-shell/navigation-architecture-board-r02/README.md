# Navigation architecture board · retained captures r02

<!-- versioning: issued set; files are retained unchanged, and a changed board is issued as a successor set -->

**Status:** Proposed design reference. Not owner-accepted, not an application capture and not a UI baseline entry. The governing record is [Navigation architecture board](../../../../decisions/navigation-architecture-board.md).
**Scope:** `system:shell`, with proposed compositions for `scope:RP-01`, `scope:RP-05` and `scope:PJ-02`.
**Issued:** 9 October 2026. **Supersedes:** [r01](../navigation-architecture-board-r01/README.md) as the current reference; r01 stays unchanged.

## What changed from r01

- **Reports workspace.** NAD-08, adopted by Dean on 9 October 2026, is applied to the sitemap, the reconciliation, the rules (NR-20), D5, both Mermaid graphs and the RP-01 and RP-05 wireframes.
- **New boards** from the audit:
  - record page pattern (AU-04);
  - record relationship map (AU-05);
  - landing, attention routing and access scope (AU-11, AU-12, AU-16);
  - 320 px wireframes (AU-06).
- **Rules and handovers.** Rules NR-17 to NR-20 and NR-A1 to NR-A7; handovers HO-19 to HO-23; a disposition for every reserved slot.
- **Consistency fixes.** One status legend, one synthetic project fixture, capability names labelled with their owning rails, accessible Mermaid sources, and the portfolio breadcrumb and URL.
- **Audit board.** Added as capture 33, with a resolution record for each finding.

## Source identity

The private claude.ai Design artifact "PPO Navigation Architecture", <https://claude.ai/artifact/UKeykdt6pNm9stkUH8JSLH>, version 26 (`1791516976-d300`), 27 artboards. It uses the Powerplants One design system copied at version `1790281695-2888`. Only the owner can open it. Its artboard sources run in the Design runtime and are not copied here; the two Mermaid sources it publishes are copied unchanged.

## Provenance

- **Renderer:** Chromium headless shell build 1194 from the container's Playwright browsers, driven by playwright-core 1.48.2 on Node 22.22.0.
- **Scale:** 1 CSS px to 1 image px, full page at each artboard's frame width.
- **Graphs (files 13 to 19):** rendered at 2× by Mermaid 11.4.1 from `navigation-overview.mmd` and from each domain `subgraph` of `navigation.mmd`. Labels are in DejaVu Sans because Verdana is not installed in the render environment. The sources' init line pins colours only, because Mermaid directives reject font lists.
- **Font:** Roboto loaded from Google Fonts; the renderer confirmed it was available for every artboard.
- **Canvas runtime:** absent. The artboards are static inline-styled markup, so the runtime changes nothing visible.
- **Not captured:** the board's "Mermaid graphs and source" artboard. Files 13 to 19 and the two `.mmd` files carry its content.

All records, names, amounts and dates are synthetic: SYN- references and fictional organisations as at 9 October 2026, 08:30 AEST (UTC+10).

## Files

| File | Artboard | Size (px) | Bytes | SHA-256 |
|---|---|---|---|---|
| `01-sitemap.png` | Sitemap: six capability domains on seven department rails and the Reports workspace | 2400 × 3006 | 1,133,067 | `d4e66d39328eb90414a7be2daea82b456fdeee9d72512d644798dfed7c1d24ab` |
| `02-navigation-reconciliation.png` | Reconciliation with the built navigation, with reserved slot dispositions | 1840 × 3980 | 1,029,213 | `0ee7e984be31bd32308b7dafec457cf31e847ba57083d79df7acf767eb84b74d` |
| `03-handover-path.png` | Cross-domain handover path, HO-19 to HO-23 added | 2192 × 1110 | 165,557 | `8dc4d3191bb7d86a8b63a18b9332c4ee7abdcaa786fd74042c30202782c60f97` |
| `04-navigation-rules.png` | Navigation rules NR-01 to NR-20 and accessibility rules NR-A1 to NR-A7 | 1440 × 2788 | 758,217 | `7cca18bd3ff553fcba725ac4f77503b80172fa38234dea2f716c9bf8e526b122` |
| `05-interaction-register.png` | Inter-module interaction register HO-01 to HO-23 | 1440 × 1968 | 503,474 | `e3aca3ce74e0c365765ba8eecda2a21771890211252f10773ae63628f4951b6c` |
| `06-brief-reconciliation.png` | Brief reconciliation R1 to R15 | 1280 × 1365 | 318,836 | `952964db4d1ef92004ba442d56d9d0f373e8f82fef7a2d6075cd70baa63247db` |
| `07-domain-1-commercial.png` | Capability table D1 | 1280 × 1840 | 369,465 | `76429b58a3df190ac731d251752afb636b032579e96a50c94c61a8f8e00d04a6` |
| `08-domain-2-delivery.png` | Capability table D2 | 1280 × 1710 | 359,835 | `70cc604195fe071e64307a69542efcb7b3c3242e6b2219575a04db0142233b03` |
| `09-domain-3-resources.png` | Capability table D3 | 1280 × 1552 | 331,204 | `cc074ca45cd717d58090ab187815e210f9be1ae352595983218991803e7d2c71` |
| `10-domain-4-field.png` | Capability table D4 | 1280 × 1859 | 379,207 | `05eb6405c2bb35ce73b03a51ecd718a5fba4e3421e6c6088dd7a6b1247c32d13` |
| `11-domain-5-executive.png` | Capability table D5, Reports workspace | 1280 × 1308 | 305,846 | `13fc1eb3a0b1ba869a16acbe76f9b8648cce2f9e6b6e7ba79af2fb25d69e45e9` |
| `12-domain-6-governance.png` | Capability table D6, persona matrix and seeded-identity mapping | 1280 × 2428 | 484,905 | `ce2895ced4fa4cb305e88d0a160c90a87111646a5d85f7741d33fcde39fbaef1` |
| `13-graph-overview.png` | Mermaid overview graph | 7094 × 3164 | 995,084 | `876ee440273f3bf28433dd1e672b07df51508beddf42c38ccbdbcfc9f66e991e` |
| `14-graph-domain-1.png` | Mermaid domain 1 graph | 5896 × 2176 | 383,539 | `f91602b484670fb21366d111720432ada737dae0b122d0f887f692e54d5a885d` |
| `15-graph-domain-2.png` | Mermaid domain 2 graph | 4558 × 1594 | 278,410 | `2c438cc1aa5b34164a308828755dda5dea56899904b58a8a7722c3bc8607afb6` |
| `16-graph-domain-3.png` | Mermaid domain 3 graph | 5450 × 1432 | 259,189 | `80ee7db74219bc8ec28679164fa78983c25d8824707e6e049a6e7890ab184647` |
| `17-graph-domain-4.png` | Mermaid domain 4 graph | 6626 × 1660 | 361,522 | `f3e3bb11b925fccfed252f556c3d2664273d9fd318b9570e38822f39ef276707` |
| `18-graph-domain-5.png` | Mermaid domain 5 graph | 4926 × 1138 | 217,977 | `095afb2342d419a18fdebb629e58a1899f0bb415a0c7e0ccb7a9c545914e0e80` |
| `19-graph-domain-6.png` | Mermaid domain 6 graph | 3242 × 1078 | 151,175 | `e91c7b52ccf384a8f63e7ff0a2c9c451923cca61612455820395c5b4e26e8a10` |
| `20-navigation-policies.png` | Landing by persona, attention routing and access scope | 1440 × 1698 | 317,352 | `d7837990960122ecf8fa6ca68900239584b3ddddfd9d2c99c941fea0054a9513` |
| `21-record-page-pattern.png` | Record page pattern and section map | 1440 × 1717 | 360,501 | `1927811351ef18e7be3aa6359373c7094565cb65f6f42c17e6e7ed75852b1acb` |
| `22-record-relationships.png` | Record relationship map and rules RL-01 to RL-06 | 1440 × 1294 | 221,307 | `54657061681619d1d4fd72c63a763ee55bc9b546b3e8618760dc5b71a3b1c87b` |
| `23-rp01-overview-desktop.png` | RP-01 management overview, desktop, compact rail with focus tooltip | 1440 × 900 | 181,815 | `10e9ca251671fff3f1d2fdee70421034d7e400986389a9cdf919603e45702425` |
| `24-rp01-overview-phone.png` | RP-01 management overview, phone | 390 × 1330 | 110,669 | `65ed53b925d488c5748e2fe45e0cd239b94709bf737319a84216bc204cfb06c2` |
| `25-rp01-overview-320.png` | RP-01 management overview, 320 px | 320 × 1381 | 109,668 | `35b0c1a32a5314dfe2ca06f7a252948706a70f59a56295a9a4a752098946b800` |
| `26-rp05-exceptions-desktop.png` | RP-05 exception desk, desktop, expanded rail | 1440 × 1084 | 221,793 | `b483679285a21c714d37dcbae732b667cb55677fb0e4157d6811d1d87259f8d4` |
| `27-rp05-exceptions-phone.png` | RP-05 exception desk, phone | 390 × 1007 | 89,917 | `68c9e8b9eab970ee1baa8ea59c283e7bd25d7a7d2e4cf6335cc0419bdc1aeb0f` |
| `28-rp05-exceptions-320.png` | RP-05 exception desk, 320 px | 320 × 1061 | 89,830 | `3c62cda98d0899e99dc50431841e39cbef9b530fb925d0200ebbc2deb36d449e` |
| `29-pj02-portfolio-desktop.png` | PJ-02 portfolio health view, desktop | 1440 × 900 | 175,808 | `150df5e395b2881d2fc469ce9c68098001f36e664ea7dc1c56f2e9e40d7cda47` |
| `30-pj02-portfolio-phone.png` | PJ-02 portfolio health view, phone | 390 × 969 | 80,563 | `62ee6213e7a146537981ba66216904afbc4f360c2b54241055691cb157279c5b` |
| `31-pj02-portfolio-320.png` | PJ-02 portfolio health view, 320 px | 320 × 1013 | 79,921 | `173b67e7b771e48c4f3ddee06342ebe0aba26348dbeda2b3e4178d0c67c50f08` |
| `32-wireframe-conformance.png` | Wireframe conformance declaration | 1440 × 900 | 217,510 | `dbf6b96cd412d7e7284ef5df0c34d390bdbe662deba447b886ddb770ac27478f` |
| `33-navigation-audit.png` | Navigation audit AU-01 to AU-23 with resolution record | 1440 × 4120 | 1,044,858 | `d826e097f5824d624366d142775b0d596a62f91ed34d8735b837715435c09519` |
| `navigation-overview.mmd` | Mermaid source, overview | — | 4,288 | `ff63bfa45206c371b0c2a111236998f1a38ecf7875c223f8e7c95dec04c5e02a` |
| `navigation.mmd` | Mermaid source, page level | — | 12,785 | `9f8693701c0e5769ba28014bddc2cec7a1a7241f69fae47dc1714edab20dc314` |

## Limits

These are design images, not application captures.

- **Not drawn or reviewed:** 1024 px, 200 % zoom, keyboard and screen-reader behaviour.
- **Rail tooltip:** on capture 23 it covers part of the first tile, as it would on screen.
- **No review:** no owner visual review is recorded.
- **Drift:** statements about the built navigation were read from main `dcec2cf` and `5005e7e` on 9 October 2026, and will drift as the shell changes. The source files, not these images, remain the authority.
