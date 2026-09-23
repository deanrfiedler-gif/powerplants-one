# Job Pack saved section presentation

Owner: Dean Fiedler. Scope: SV-05 / SC-06. Reference: [Job Pack r03](../../../reference/ui/job-pack/powerplants-one-job-pack-r03.html). D6-A is the adopted design decision; application visual acceptance remains open.

## Desktop

SectionBody is shared by Job pack and Preparation. SectionParts reuses Pair, information grids, task lists, history rows and notes. It presents only data whose formatter matches the exact saved section. Each successful structured view includes the native Exact text as it will be issued disclosure. Unknown, inaccessible, ambiguous or unsupported data retains the original section text. The existing note remains separate.

## Mobile

Control labels stack above values below the page breakpoint. Long values wrap. Native disclosures keep visible focus and work by keyboard. Inspect 390/320 px alongside 1024 and shell transition widths. A source link never substitutes for the retained wording.

## Fixtures, consumers and limits

`tests/fixtures/job-pack-read.json` adds only a section projection to the retained pre-I6 snapshot. Unit compatibility tests retain its original text. The application browser fixture exercises verified, unavailable and mismatched states, exact disclosure and six widths. Scope equipment IDs are null for recipients; staff links require current asset access. History needs selected ID/order/hash proof. No source read changes the snapshot or grants work authority.

The component is bound to scope:SV-05 and route:/service/packs/[id]. It is reference-only in the catalogue because there is no isolated renderer. Whole-page paired comparison belongs to I5; device and owner acceptance are not inferred from automated checks.
