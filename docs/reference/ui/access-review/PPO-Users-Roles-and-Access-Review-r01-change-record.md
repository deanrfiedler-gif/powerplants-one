---
document_id: PPO-AD01-CHANGE
title: Users, Roles, Teams & Access Review r01 — change record
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: Record of the first issue; no prior revision
source_commit: efd4d4e33f5fc4ef2a4605455ed8d4c66e0ddc39
---

# Users, Roles, Teams & Access Review r01 — change record

This record is required by the shared UI style specification (§7.1, element 6). It covers the design HTML `PPO-Users-Roles-and-Access-Review-r01.html` (SHA-256 `a15ecb01ff596e5eaa9cc784977ab103fe664de6258ac41c66aaed58397d6363`).

## r01 — 17 September 2026 (first issue)

- **Scope and identity:**
  - new standalone module for coverage register entry AD-01;
  - scope container `#ppo-access-review`;
  - meta `ppo-scope-id` = AD-01, `ppo-design-revision` = r01.
- **Theme:**
  - r20 token core, with the same seventeen names and values as `docs/design/my-work/workspace.css`, checked by the model;
  - Roboto embedded byte-identically from `docs/design/my-work/fonts.css` (`57b4aafb71296b18d80408cb10aa972c87f5185deafd748c7fdcfb33e2bd4bef`), with a Verdana fallback;
  - no divergent token values introduced;
  - one local token pair, `--support` 292 px and `--panel` 448 px, records the reused layout widths.
- **Components reused:** page title, context strip, tabs, state badges, metric tiles, register/cards, supporting column, native dialog, 448 px inspection panel.
- **New local treatments:**
  - effective-access matrix cells (allowed, none, via workspace);
  - a dashed *Proposed* badge distinguishing design proposals from contract facts;
  - an explanation step trace;
  - before/after rows marked by icon and text as well as colour.
- **Declared viewports:** 1440×960, 1024×768, 820×800, 390×844, 320×740.
- **Fixtures:** seeded synthetic identifiers (workspace, SYN-A/SYN-B, three sites, nine users), plus design-only preview identities and two masked hosted testers. Fixture manifest SHA-256 `13d0e64db11afa36104a55be883c5c605947b84bc3a9471acbeaa36a57ede37d`.

### Defects found by the builder's visual and native review, and fixed before issue

1. Screen-reader-only captions were visible, because the class was missing from the scoped stylesheet.
2. Header icons were not rendered, because the header was not hydrated at start-up.
3. Three review decisions in the fixture were stored as bare strings rather than decision objects, so they rendered blank.
4. The `InProgress` state label is now shown as "In progress".
5. List buttons centred their content; they are now left-aligned.
6. End dates rendered as bare dates, although they are contract timestamps and some are not at midnight. They now show time (AEST).
7. `crm.opportunity.transfer.own` was flagged "Own assignments"; the flag now reads "Own records only".
8. Keyboard tab navigation did not persist the current view; preview settings are now saved on every render, except when a damaged stored session is being preserved.
9. At 820 px, an absolutely positioned screen-reader caption escaped its table's scroll container and widened the page. The wrapper is now its positioning context.
10. Grant row labels at phone width still read "From"/"To" after the headers changed to "Valid from"/"Valid to".
11. Bundle matches were ordered by fewest missing capabilities, which put a one-capability bundle first. They now order by the number matched.
12. Queue tiles centred their text when a row held a single tile (visible at 390 px). They now align to the start like the other tiles.
13. The before/after table printed "to No end date" mid-sentence; it now reads "to no end date".
14. A request created from an access review showed two *Draft* history lines, the first wrongly attributed to the administrator. Only the recorded creation entry is now shown.

15. **Found by pull request CI (#232):** four `catch` blocks in `workspace.js` declared an error binding they never used. The repository's ESLint rule rejects this, so `npm run check` failed in every application job. The blocks now use bare `catch`. There is no behaviour change; the HTML hash changed only because of this.

### Owner decisions applied before issue (17 September 2026)

- **Decision 5, independence of review recommendations:**
  - requests created from Change or Revoke now record the attesting approver;
  - that approver is excluded from the reviewer choice and refused at save, submit and decide;
  - restore refuses such a record.
- **New fixture person:** *SYN Deputy platform data owner* (design-only) holds the proposed approval capability without being a preview role.
- **Reference code note:** the page now states that `ACR` registration is deferred to a PPO-STD-001 r05 amendment (decision 3).
- **Unchanged:** decisions 1, 2 and 4 required no page change. The approver preview role was already titled *Access approver (platform / data owner)*.

### Corrections to the build plan

These are listed in the [report §12](PPO-Users-Roles-and-Access-Review-Report-r01.md#12-departures-from-the-build-plan-and-corrections):
- the pack check/issue separation-of-duties pair was removed;
- seeded scope fixtures replaced Willowbank;
- the fixed clock moved to 17 September;
- no stored "refused" request;
- the plan was relocated to `docs/delivery/`.
