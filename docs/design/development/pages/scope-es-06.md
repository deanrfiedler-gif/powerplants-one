# Exact quotation response and negotiation

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Stable ES-06 / `route:/estimating/quotes/[id]/response`. Native `QuotationResponse`; r20 Document & evidence workspace with guided staff capture. [Retained ES-06 r01](../../../reference/ui/quoting/PPO-Quotation-Response-and-Negotiation-r01.html) and [companion](../../../reference/ui/quoting/PPO-Quotation-Response-and-Negotiation-Report-r01.md) remain unchanged. Accepted Figma design: the [Quotation response design decision](../../../decisions/quotation-response-figma-design.md) of 30 October 2026, with 22 icon-free captures in [design r01](../../../reference/ui/estimating/quotation-response-design-r01/README.md) (design compositions, not application captures). The running page is not yet built to it; this contract, the [native decision](../../../decisions/quotation-response-native.md) and the response contract govern it until a build is authorised. Unedited execution captures: [desktop](../../../testing/evidence/quotation-response/desktop.png), [320 px](../../../testing/evidence/quotation-response/mobile-320.png); source hashes and review limits remain in the evidence ledger.

## Desktop

At 1440/1024 px use the existing PPO shell and one page scroll owner. Put exact offer identity and non-operative conditions first; follow with current report/holds, attributable capture, information-only clarification, separate ES-07 readiness and immutable history. Long hashes/UUIDs wrap. Original PDF/HTML and ES-05 links retain the exact revision.

Accepted design: captures 01–11 in design r01 use the Release page shell with a four-step response lifecycle (Issue, Customer response, Open items, ES-07 preparation), a main column and a side column; forms replace the main column. Tablet capture 12 collapses the rail and gives the form the full width.

## Mobile

At 390/320 px stack panels and labelled fields. Shared fields retain readable text, minimum targets and keyboard focus; native disclosures reveal exact evidence without navigation. Keep original recovery above forms. Disable replacement controls while saving, unknown or stale, preserve entries during refresh, and require explicit use of the new basis. Permission denial removes protected content. No offline command exists.

Accepted design: captures 13–16 show the deal owner after a call at 390 and 320, with the compact record header, stacked outcome cards, 16 px inputs in 48 px boxes and a sticky bar of 48 px buttons.

## Reuse, states and handovers

Reuse Button/ButtonLink, Field, SelectField, Status, ValidationFields/ErrorNotice, permitted resource loading and actor-bound recoverable-command journal. Reuse the ES-05 token-based panel/evidence stylesheet; no global token or control behaviour changes. Host fixtures are `tests/browser/quotation-response.spec.ts`; they use actual issued synthetic records, never an unbound catalogue simulation.

States: unissued/unavailable, no report, Accepted, Declined, conditional acceptance, unresolved/answered/confirmed clarification, material negotiation, explicit correction, superseded offer, stale sequence, original outcome unknown, prepared review and held prior preparation. Attribution and conditions remain textual, never colour-only. The customer-reported outcome is not verified authority or a signature.

Incoming: exact immutable ES-05 issue and original manifest/source/recipient/terms/template. Outgoing: material change to the ES-05 successor path; exact response plus owned review note and unresolved receiving checks for ES-07. This page sends and converts nothing.

Declared departure: bounded authenticated staff capture replaces the proposed customer signing/iframe surface for this increment. Multiple options, operative commercial content, sample validity/withdrawal and local-storage authority are not adopted. See the [native decision](../../../decisions/quotation-response-native.md). Independent paired visual, physical-device, screen-reader and owner acceptance remain pending; no review fingerprint is promoted. [Executed evidence](../../../testing/evidence/quotation-response/README.md) remains separate. Accepted design states are captures 17–22. Q2 (deal owner and quotation owner record), Q1 and Q4 (written evidence before ES-07 preparation) and Q5 (lost reason on Declined) change built rules and need their own authorisation. The named Figma version "Customer response ES-06 — shared record layout, accepted" waits for Dean.

The exact response now links to the separate ES-07 receiving page. That page records receiving and bounded native Forecast demand conversion; this response component still only reports and prepares. See the [ES-07 contract](../../../contracts/quotation-conversion.md).
