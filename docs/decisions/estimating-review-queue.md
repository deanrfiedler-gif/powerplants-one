# Estimating Reviews & approvals queue backend

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 12 October 2026. Status: bounded synthetic backend implementation authorised by the backend-completion instruction; page implementation is now recorded below; independent review and owner acceptance remain separate.

Traceability: BC-01 in the backend completion plan; ES-04/05; EST-03/07/08; PPO-010; AT-01/26; existing ES-04 and ES-05 acceptance. This adds no parent requirement, business authority or operative commercial policy.

## Decision and alternatives

Implement a read-only `GET /api/v1/estimating/reviews` projection over the existing native estimate-review and quotation-release services. Reuse TypeScript/Next/PostgreSQL, current access checks and the domain state derivation. Extract transaction-aware read helpers so the queue observes candidates, permissions, detailed state and counts under one workspace lock. Existing detail-route envelopes and commands remain compatible.

A separate stored queue would duplicate mutable state and require synchronisation. Calling each detail route from a client would split authority/counts across unrelated reads and duplicate transport. Reimplementing approval rules in a new module would drift from the native command contracts. The selected projection avoids these problems without a schema, seed, capability, dependency or service addition.

## Authority and scope

The queue requires `estimating.read`. Each estimate row also passes the complete current and retained source checks already used by its review detail. Quotation rows additionally require the existing `estimating.quote.read` and exact retained recipient/source authority. No permission is inferred from team membership or a review label.

People with read access may inspect non-actionable reviews, including their own estimates. Eligibility is the existing source service's `can_review`/`can.approve`, including independent duty, author/owner/submitter exclusions and changed-basis holds. Read access never confers review authority. Do not reveal inaccessible record names, IDs, amounts, findings or counts. A denied source is explicit; an omitted unavailable record makes the visible window partial without a hidden-record count.

The endpoint has no mutation method, receipt creation, review decision, quotation issue, customer delivery, notification or ERP effect. Each row links to the owning review/release route, whose later read and command independently recheck access and source versions.

## Row contract

Estimate rows identify the latest immutable submission of each estimate, with one row per Completeness, Technical and SourcePrice review. Carry the exact submission ID, saved estimate version ID/number, native review sequence, reference, title, permitted customer/owner context, saved sell value and source-owned link. Preserve Pending, Reviewed, Returned and Changed basis distinctions. An applicable earlier Reviewed decision is labelled carried forward, never represented as a new decision. After responses and resubmission, a returned kind becomes Pending with its prior finding count and decision identity retained; it needs a fresh decision. Own-work status is a separate flag, not a new review outcome.

Quotation rows identify the latest prepared release revision for each quotation, including an older prepared revision held by a newer Draft. Carry exact quote/revision/estimate identities, release sequence, recorded approval and issue status, source-current state and native approval eligibility. Rendering is separate from approval: an unready output is not Awaiting my approval. Returned/Approved/Issued history remains distinguishable from a currently actionable request. Commercial policy remains the existing non-operative synthetic policy.

Return summaries only: internal cost lines, raw source evidence, recipient addresses, output manifests/paths and full finding text are not queue fields. The owning detail services supply those only under their existing access rules.

## Search, views, counts and pagination

Validate an allowlist of query fields: `q`, `source`, `view`, `offset`, `limit`. Sources are all/estimates/quotations. Views are all/awaiting_me/my_submissions/returned/completed/changed. Query text is bounded and literal, and unknown fields, choices and noncanonical integer windows are refused.

Read a bounded candidate window ordered by submitted/prepared time descending with stable source/UUID tie-breakers. An estimate is one candidate producing up to three rows; a quotation is one candidate producing one row. Window pagination operates on candidates, not the number of visible review kinds. Filtering a view must not prevent continuation to older candidates.

Counts are computed only from fully authorised rows in the current candidate window, after the search/source selection and before the selected view. Name this basis explicitly in the response; these counts are not global menu totals. Return the window limit/offset, continuation and observation time, plus complete/partial source status. Never return a raw hidden-candidate total. Clients must preserve the difference between an empty complete window, a filtered empty window with continuation, denied sources and a partial window. Separate requests are live reads, not a frozen export; new submissions can change offsets.

No waiting-time SLA, due date or red/overdue state is invented. Return the recorded submission time and `waiting_policy: NotConfigured`. The register exports only selected rows in the current window after a fresh authorised read; selection never crosses candidate windows and never relabels window counts as complete totals.

## Verification

[Executed local evidence](../testing/evidence/estimating-review-queue/README.md) records results and baseline failure comparison separately from the contract below.

- Validate query boundaries and derived views without mirroring SQL strings.
- Create actual native submissions/returns/successors; prove independent review eligibility, own-work exclusion, applicable retained decisions and changed-basis treatment.
- Create and render actual native quotation releases; prove pending render, approval, return/issue and changed-source states through the same service used by detail reads.
- Prove company/site/source restrictions, independent read versus decision duties and revoked access; inaccessible records must not enter visible counts.
- Prove deterministic windows and view-independent continuation, exact source identity and absence of new receipts/audit/business events on reads.
- Exercise the HTTP route's authenticated no-store response, validation, denial and unsupported writes against the compiled application.
- Rerun existing ES-04/ES-05 database and unit contracts after helper extraction. Record actual limits and failure dispositions, not assumed business acceptance.

## Relationship to the accepted design

The accepted Figma Reviews & approvals design remains the page reference. This backend resolves queue visibility by reusing source read authority, keeps quotation approvals as a source/view of the same queue and leaves waiting-time policy unconfigured. The implementation activates the existing estimate-reviews navigation ID at `/estimating/reviews`, retaining ES-04/ES-05. This matches the path already planned in scope:ES-04; no runtime destination existed at the implementation baseline. It makes no global-count or visual-acceptance claim.


## Register and exact snapshot implementation — 24 October 2026

Use the accepted register, selection panel and phone list on Figma page 56:2 (desktop 77:635, selection 81:1002, phone 104:1803), with the retained captures and accepted phone-header amendments. Additional estimate/pricing-exception and quotation issue/distribution workflow frames remain review pending; their appearance is not adopted by this increment. The existing native workflows remain the decision destinations.

The shared shell and controls render All reviews, Awaiting my review, Quotation approvals, Returned for changes, Reviewed and Submitted by me. Type/site filters and their menu counts apply to the readable rows in this window; text search is applied by the candidate reader. The footer says candidate limit separately from visible review rows, retains Next window through empty filters and partial reads, and explains live-offset movement. Reviewed includes native Reviewed/Approved/Issued outcomes; this is a view, not a new state. Elapsed time is calculated from recorded submission/preparation and response observation timestamps; completion has no active waiting timer. Missing values remain Not recorded.

`GET /api/v1/estimating/reviews/snapshot` accepts only source, record `id`, exact `submission_id` and review `kind`. It reuses the native readers in one workspace transaction, checks current and historical source access, and returns exact saved/revision identities, submitter/site, review applicability, returned findings and submitted responses, recorded native history, source-change information and native links. It has no command method. Cross-record combinations are unavailable. Full findings are confined to this permitted detail read; queue rows carry only counts. Quotation files hand over to the exact release workflow rather than inventing a second file authority.

Estimate handovers include exact submission and kind. A successor landing shows the selected submission as superseded and requires an explicit Open current review action; it does not silently attach a decision to a later submission. Native commands continue to enforce independence and expected versions. Selection offers oldest-first snapshots and revalidated selected-only CSV, never bulk approval. Phone checkboxes and a dismissible selection panel provide the same controls without requiring a long press. Read failures remove protected content and provide retry; fresh reads and native commands remain mandatory for source/authority changes.

No database, seed, capability, dependency or technology addition is needed. Reuse of the adopted stack follows the alternatives above. See the [page contract](../design/development/pages/route-estimating-reviews.md), [guide register](../design/development/guides.json) and [execution evidence](../testing/evidence/estimating-review-queue/README.md). Source presence, local functional proof, visual comparison, independent review, owner acceptance and deployment remain separate.
