# Job Pack I7 application evidence

Owner: Dean Fiedler. Captured and inspected by Codex on 24 September 2026. Compiled I7 working source based on `fe0a7e0`; the committing change contains the corresponding implementation. Chrome 154.0.8037.58, Playwright 1.63.0, real local synthetic coordinator session and the retained `tests/fixtures/job-pack-read.json` API fixture. Captures do not imply a persisted transaction.

`heading-{1440,1024,820,770,390,320}.png`, `readiness-{1440,1024,820,770,390,320}.png` and `satisfied-{1440,1024,820,770,390,320}.png` capture the header and closed/open satisfied groups at viewport heights 960, 768, 800, 900, 844 and 800 CSS px respectively. The readiness views are scrolled viewport captures, not whole-card crops.

Inspected heading at 1440 and 320 px, readiness at 320 px and open satisfied rows at 390 px. The scope title, references, controls and readiness wrap and remain within the module. Attention remains visible outside satisfied disclosures. The phone captures also expose utility icons overlapping the shared Service navigation; this is recorded for correction and re-capture in I5, not labelled visual acceptance. Paired reference comparison, 200% zoom, final print evidence, physical devices and owner acceptance remain separate.

Thirty compiled browser cases passed with six deliberate mobile-project skips; 18 unit and three focused database cases passed. See the [I7 handover](../../../delivery/job-pack-i7-handover.md) for coverage and local timeout limits. No review fingerprint is adopted from these checks.
