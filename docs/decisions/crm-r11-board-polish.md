# CRM r11 header and board correction

**9 September 2026 · PPO-009 / CRM-01–04/08 · First correction batch**

Dean confirmed hosted sign-in and saved CRM records work, supplied
`ppo-ui-design-review_r11.html` and a populated desktop screenshot, and authorised
CRM refinement with local iteration and one reviewable GitHub checkpoint.
Reference SHA-256: `a5b3ed664ffa728f74e75b635ef7fb72d78d84c25d75e08c986312585cb23411`.
Original reference HTML and embedded source images remain outside this repository.

This batch moves search/account controls into real header slots, aligns navigation
and the toolbar with r11, restores compact two-zone cards, adds exact minor-unit
value summaries, fixes overflowing account text and removes duplicate empty-board
notices. Local identity selection, hosted sign-out, separate Activity links,
snapshots, canonical deals, filters, paging and permissions remain. Customer
contact, deal owner and activity owner remain distinct. Card warnings indicate
missing activity/due information, not an invented rotting rule.

Amounts/counts describe the returned permitted page. The footer states when more
pages exist; unknown amounts differ from known zero. No all-pipeline total is
inferred from a paginated response. The database still supplies Enquiry and
Qualified. Lead / Qualification / Estimating / Quote / Negotiation / Closing
remain a follow-on pipeline contract and migration task. No reset, seed change,
migration, hosted configuration or deployment is included.

Source base: integration commit `93828dd898b55af8b8d2361983a8f554160d369d`;
existing PR #73 is a separate dependency. The deployed image remains
`5ce4d20f6d897ed2e9e9da9496130c2bb706a0cd` until an image update is performed.

## Review and verification

- `node scripts/build-crm-ui-review.mjs` creates an ignored review fixture from
  actual React components/CSS. API responses and framework navigation are
  substituted: this is presentation evidence, never database/Microsoft proof.
- `npx playwright test --config=playwright.crm-ui.config.ts` checks hosted/local
  account layout, 1440/390/320px views, card sizes/hit areas, filtering, empty
  results and denied-access clearing, retaining screenshots for human review.
- A separate short job in CRM assurance runs these checks. Existing database,
  full browser and restart checks remain. Two retained browser selectors follow
  moved content: the contact card area and page-completeness footer.
- Local lint, type checking, 39 unit tests and the application build pass.
- This workspace browser blocks local URLs/HTML previews. Rendered comparison
  awaits GitHub screenshots; no visual pass or Azure update is claimed.
- Exact GitHub execution results belong in the correction PR. Keep it a draft
  until the available evidence is reviewed.
