# Service requests native refinement · board images r02

<!-- versioning: issued set; files are retained unchanged, and a changed board is issued as a successor set -->

**Status:** Proposed design images. They are not an accepted baseline. Dean accepted the refinement's recommendations (D1–D8) on 23 September 2026, but his visual review of the frames has not yet been recorded. The governing record is [Service requests native refinement](../../../../decisions/service-requests-native-refinement.md).
**Scope:** `scope:SV-01` and `scope:SV-02`.
**Issued:** 23 September 2026.
**Supersedes:** frame 8 of [board images r01](../native-refinement-r01/README.md). Every other r01 image stays current and unchanged, so this set holds only the new and corrected frames. The index below shows where each frame's current image is held.

## Provenance

These images are renders of the private claude.ai design canvas "Page Refinement Audit", page "SV-01/02 Service requests", version 8. The renderer, scale, font and treatment of the canvas runtime are the same as for r01.

The frames show the **module interior only**. The application shell is a separate module and is not drawn.

| Frames | Interior (px) | Window |
|---|---|---|
| 1–15 | 1364 × 896 | 1440 × 960, less the 76 px rail and 64 px header |
| 16, 17 | 948 × 704 | 1024 × 768, less the rail and header |
| 11, 12, 18, 20–22 | 390 × 716 | 390 × 844 phone, less the 64 px header and 64 px bottom navigation |
| 13, 19 | 390 × 844 | Full-screen dialogs |
| 23, 24 | 320 × 440 | 320 × 568 phone, less the header and bottom navigation |

**Fixture.** All records are synthetic: r02's fixture at 10:00 am Tuesday 15 September 2026 (Australia/Melbourne), plus the fictional follow-up call from Priya Shah in frames 5 and 18.

**Frame 14** shows the same records as they would stand in the application today:
- the native states are New, NeedsInformation and Triaged;
- the existing triage gate needs a known site, so TKT-000204 (no site) is still New;
- TKT-000206 is left out, because its remote-investigation history needs the lifecycle extension.

## Frame index

| Frame | Current image |
|---|---|
| 1 · Register · board, manager view | r01 `01-register-board.png` |
| 2 · Register · list, scrolled right | r01 `02-register-list-scrolled.png` |
| 3 · Register · list with request preview | r01 `03-register-list-preview.png` |
| 4 · Board move New → Triaged opens the triage form | r01 `04-register-triage.png` |
| 5 · Log a request · duplicate check | r01 `05-log-request.png` |
| 6 · Register states | r01 `06-register-states.png` |
| 7 · Request overview · TKT-000201 | r01 `07-request-overview.png` |
| 8 · Work & visits · TKT-000203 | **r02** `08-request-work-visits.png` (corrected) |
| 9 · Evidence & updates · TKT-000206 | r01 `09-request-evidence.png` |
| 10 · Resolution review · TKT-000206 | r01 `10-request-resolution.png` |
| 11 · Phone register | r01 `11-phone-register.png` |
| 12 · Phone request overview | r01 `12-phone-request.png` |
| 13 · Phone triage form | r01 `13-phone-triage.png` |
| 14–24 | **r02**, listed below |

**Frame 8 correction.** r02's model refuses a clarification while a request is waiting. The r01 frame nonetheless offered *Request information* as a header action. It now offers *Update waiting reason* beside *Review and resume*, and the *More* menu lists *Cancel request*.

## Files

| File | Frame | Size (px) | Bytes | SHA-256 |
|---|---|---|---|---|
| `08-request-work-visits.png` | 8 · Work & visits · TKT-000203 | 1364 × 896 | 184,537 | `97557c715b5b462552127c1d2dde2ce2b40fea89e86e719cee41042884529e00` |
| `14-native-register-board.png` | 14 · Native increment · board for the three existing states | 1364 × 896 | 148,870 | `b0c2003dc410ce61f17abae59c6a79066a2e02b0a949169f53bdb05e36752c39` |
| `15-request-triage-actions.png` | 15 · Triage & actions · TKT-000203 | 1364 × 896 | 183,689 | `4f4c93febacd8aca73f4f49869c01dfb02ac0eb95dce078f83f6877bd68301ab` |
| `16-register-list-1024.png` | 16 · Register list at 1024 × 768 · preview overlays the table | 948 × 704 | 129,576 | `092e02dbdf015f48fa02d4a4b67bd82eb769f6273ac13cf7957da2a985a3bbc0` |
| `17-request-overview-1024.png` | 17 · Request overview at 1024 × 768 | 948 × 704 | 116,291 | `41b23a8e513e235032e80a80370c5f8b672c013f4dd1c8f480601b69f4e03b44` |
| `18-phone-log-request.png` | 18 · Phone · log a request, match found | 390 × 716 | 56,441 | `f7462c83e73f433fc2fa0008a1012fd858176e4d5c6490468613d9e4b242afee` |
| `19-phone-filters.png` | 19 · Phone · filters, full-screen sheet | 390 × 844 | 40,989 | `de1e16da8e0fecaf69a08065e878a8baac5f542bfa1d3972ff0f4592fdd978dd` |
| `20-phone-no-matches.png` | 20 · Phone · no matches | 390 × 716 | 25,080 | `abb7824d817ade94bbe094d136239488a70534d557c00a59d8543577f5bf487d` |
| `21-phone-work-visits.png` | 21 · Phone · Work & visits · TKT-000203 | 390 × 716 | 66,067 | `19a2d597c1d64eb753721eb2e3c577737a82362bb04efea675121c5b857991be` |
| `22-phone-evidence.png` | 22 · Phone · Evidence & updates · TKT-000206 | 390 × 716 | 63,674 | `6071fe91a9a8078c7a553ebbb21583d51b2f4d38f4c8a77f59b3834679c8bd84` |
| `23-narrow-register-320.png` | 23 · 320 px · register | 320 × 440 | 33,327 | `f888764223ecd5d21a2e4565ab502a755ba55ac1ebf7c1a465b67949288d7765` |
| `24-narrow-request-320.png` | 24 · 320 px · request overview | 320 × 440 | 39,664 | `7c9c900193741bfe365a9d4af82743e232008fa4ce66570a2bd8657d7e7fa1cb` |

## Limits

- **Not captures:** these are design images, not application captures. No native implementation exists to compare against.
- **No device or accessibility review:** no device, zoom or screen-reader review is claimed.
- **Scrolled content:** where content scrolls behind a sticky bar (frames 18, 21, 22 and 24), the clipped content is what that scroll position shows. It is not a layout defect.
