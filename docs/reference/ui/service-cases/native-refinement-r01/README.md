# Service requests native refinement · board images r01

<!-- versioning: issued set; files are retained unchanged, and a changed board is issued as a successor set -->

**Status:** Proposed design images. They are not an accepted baseline and have no recorded owner visual review. The governing record is [Service requests native refinement](../../../../decisions/service-requests-native-refinement.md).
**Scope:** `scope:SV-01` and `scope:SV-02`.
**Issued:** 23 September 2026.

## Provenance

These images are renders of the thirteen frames of the private claude.ai design canvas "Page Refinement Audit", page "SV-01/02 Service requests", version 7.

- **Renderer:** Chromium from the container's Playwright browsers, driven by Playwright 1.63.0 on Node 24.21.0.
- **Scale:** 1 CSS px to 1 image px.
- **Font:** Roboto loaded from Google Fonts.
- **Canvas runtime:** absent. The frames are static inline-styled markup, so the canvas runtime changes nothing visible.
- **Frame 4:** its embedded board (`dc-import`) was substituted with the rendered frame 1.

The frames show the **module interior only**; the application shell is a separate module and is not drawn:

- desktop frames are 1364 × 896 (a 1440 × 960 window less the 76 px rail and 64 px header);
- phone frames are 390 × 716 (a 390 × 844 phone less the 64 px header and 64 px bottom navigation);
- frame 13 is a full-screen dialog at 390 × 844.

All records are synthetic: r02's fixture at 10:00 am Tuesday 15 September 2026 (Australia/Melbourne), plus the fictional follow-up call from Priya Shah in frame 5.

## Files

| File | Frame | Size (px) | Bytes | SHA-256 |
|---|---|---|---|---|
| `01-register-board.png` | 1 · Register · board, manager view | 1364 × 896 | 183,170 | `afffb3f4ce46c623f1412d62407e9ccc5cf22c961f7da4ffc96bcad589944fdf` |
| `02-register-list-scrolled.png` | 2 · Register · list, scrolled right with the Request column pinned | 1364 × 896 | 133,230 | `37fe8b948cd9dec725c34d62ae2fefaba0dc225eaf181914c784b72436b966c9` |
| `03-register-list-preview.png` | 3 · Register · list with request preview | 1364 × 896 | 185,253 | `3ffb2f7bcd1d1b8f266274699388ed9dfbfaf0fbfc181cbdb520645136da34a3` |
| `04-register-triage.png` | 4 · Board move New → Triaged opens the triage form | 1364 × 896 | 231,482 | `0c98a7f64723a0e0a05a1503d146aa442aaf4c97ba82bbfc3502542436a2f9a2` |
| `05-log-request.png` | 5 · Log a request · duplicate check | 1364 × 896 | 159,510 | `383c8d03d9e0e5ddc6da720ac1a738da0370920a432a723712cc6f4b61582790` |
| `06-register-states.png` | 6 · Register states | 1364 × 896 | 123,339 | `d43ec4fdfe24e1efeff485a00219a8e6ee29fedd08ecb81e7abbd34265208363` |
| `07-request-overview.png` | 7 · Request overview · TKT-000201 | 1364 × 896 | 211,586 | `17cf7e7c2dfc0f5a915c5a576853b4330c6114575950e8cf268427c7188d3a00` |
| `08-request-work-visits.png` | 8 · Work & visits · TKT-000203 | 1364 × 896 | 183,746 | `2304da900e63c5d01933a910eb2dd06c04a4d531e9e5bd495e4cdfc05380ad30` |
| `09-request-evidence.png` | 9 · Evidence & updates · TKT-000206 | 1364 × 896 | 198,228 | `be9de69c530e3c0d8a7d698e82a40a5a239430eff9d7fd834f6ab25859c6b723` |
| `10-request-resolution.png` | 10 · Resolution review · TKT-000206 | 1364 × 896 | 174,667 | `c53a5b9f00a6ef582eb0a45ab2780c9d5ec2394749bcf8b990fb326280217a34` |
| `11-phone-register.png` | 11 · Phone register | 390 × 716 | 70,687 | `92c43abe065cf660212d2a154292f23402339a6cc39555773947e732d47612a3` |
| `12-phone-request.png` | 12 · Phone request overview | 390 × 716 | 68,845 | `71d0b38f5915fe22addd6fe658be31fc51660a731134b40ae3bdaf6a21d86376` |
| `13-phone-triage.png` | 13 · Phone triage form · full-screen dialog, validation state | 390 × 844 | 58,948 | `da2a3e64d384ee24f53db371bf09a5ce6c6eb005977d3960899096368d94686c` |

## Limits

These are design images, not application captures. No native implementation exists to compare against, and no device, zoom or screen-reader review is claimed.
