# Connected customer journey owner walkthrough

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Prepared 8 October 2026. Review: pending actual owner observations.

[Scope decision](../decisions/integrated-journey-acceptance.md), [execution ledger](../testing/evidence/integrated-journey/README.md), [continuity contract](../contracts/lead-to-delivery-continuity.md).

## What this review establishes

Review one connected fictional customer need from Lead through Deal, independent estimating discovery/costs, exact quotation issue/response, explicit Won, native Project receiving and a new owned Lead for a later need. Verify that the next action and the reason for each handover are understandable. This is a source-specific prototype review, not operational approval or full PT-30 acceptance.

The automated proof prepares initial records and commercial reviews with native HTTP commands, then operates conversion, explicit links, Won recovery, Project creation and return-to-Sales through the real compiled browser interface. It does not claim an unaided human completed every authoring form. The independent Service receiving alternative is covered by its retained browser scenario; this joined chain deliberately follows Projects.

## Retained local session

Use the isolated `codex/integrated-journey-acceptance` checkout and private session root `C:/Users/Dean.Fiedler/.codex/tmp/integrated-journey-20261008`. The database is `ppo_synthetic_test` on loopback port 55838. Configuration, document storage, browser traces and raw preservation snapshots remain outside Git. Do not reset this session or substitute a regression database.

The [desktop entries](../testing/evidence/integrated-journey/desktop-entry-records.json) and [phone entries](../testing/evidence/integrated-journey/mobile-entry-records.json) supply every saved ID. Both chains survived a real application/PostgreSQL restart. Choose the **coordinator** synthetic identity for the saved-record walkthrough. Estimating source review, quotation approval and quotation issue used their distinct named synthetic duties during preparation. One human switching roles does not count as independent human review.

Desktop starting points (local retained session only):

- [Original Lead](http://127.0.0.1:3000/sales/leads/ca556a31-23f6-44b1-962b-2b1ca0b899a8) → [Won Deal](http://127.0.0.1:3000/sales/opportunities/1d8fa0f6-db4d-4b52-b4a6-ba1f86f42ad2).
- [Accepted estimating brief](http://127.0.0.1:3000/sales/handoffs/estimating/b8279e92-70d4-475b-80b1-801a6a9ea286) → [independent Discovery](http://127.0.0.1:3000/estimating/discovery/a3ae5d97-f10d-44e7-ba86-e69b56f9d497) → [exact quotation](http://127.0.0.1:3000/estimating/quotes/3ef94a4f-dceb-4f0e-8b65-99a6eccff60e).
- [Project receiving](http://127.0.0.1:3000/projects/339ecc22-77c9-4a88-b7c9-57f0375c1213) → [owned follow-up](http://127.0.0.1:3000/work/72c53cec-b826-44bc-b053-0a0af79c9614) → [returned Lead](http://127.0.0.1:3000/sales/leads/b1c53cd1-30d2-4c41-a5cf-e1e36e9c3162).

The application is the compiled source at main `4f883d1`; this contribution changes verification/documentation only unless the execution ledger records an application fix. Check for an existing task-owned listener at `http://127.0.0.1:3000/api/v1/health` before starting another. From the isolated checkout, use `npm run serve:compiled` with its private `.env.local`. Never kill an unexpected listener or copy the environment file into Git.

## Review tasks

Record reviewer, date/time/timezone, source/build, device/browser, viewport, actual zoom, input method, assistive technology and whether help was needed. For each task record Pass, Fail or Blocked and the actual comment; silence is not acceptance.

| Task | Open and act | Expected observation | Owner result |
|---|---|---|---|
| IJ-H01 | Original Lead → Open deal → Activities | Same customer/site, original Lead reference, owner and planned action; conversion did not discard the enquiry | Pending |
| IJ-H02 | Accepted estimating handover → linked Discovery | Sales wording is attributed; the independently confirmed discovery revision remains its own record | Pending |
| IJ-H03 | Exact estimate and quotation → Deal commercial evidence | The saved scope/cost version and released quotation match; independent approval, issue and staff-recorded response are distinct | Pending |
| IJ-H04 | Deal History and saved outcome | Won cites the exact reviewed response; it was an explicit action, not an automatic consequence of issue or reported acceptance | Pending |
| IJ-H05 | Won handover → native Project → Sales handovers | Exact accepted source is retained; receiving does not approve Project scope or complete delivery | Pending |
| IJ-H06 | Project → Sales handovers → Record a customer need for Sales review | The route to a dated owned review is findable. The saved follow-up retains Project provenance and has an explicitly linked new Lead | Pending |
| IJ-H07 | Returned Lead and its next Activity | Same Activity owner/date/status and Project relationship; the original Won Deal remains Won | Pending |
| IJ-H08 | Keyboard through handovers; Escape from Project Sales dialog; browser Back/reload | Visible focus, sensible focus return and durable saved context; interrupted commands use original recovery | Pending |
| IJ-H09 | Desktop and physical phone, plus actual 200% zoom | Text/actions remain usable. Automated 390 px coverage is not a physical-phone observation | Pending |
| IJ-H10 | Representative screen reader and independent visual comparison | Labels, announcements, errors and navigation are understandable; missing accepted cross-module mockups remain explicit | Pending |

Dean's final review records **Accepted within stated scope**, **Changes required**, or **Not yet reviewed**, with the relevant IJ-H IDs. Keep defects separate from suggestions. Existing Field/Finance/PT-30 obligations remain in the [Field owner walkthrough](field-integrated-owner-walkthrough.md) and [acceptance ledger](../testing/field-integrated-acceptance-ledger.md).

## Hosted demo

Azure run 37677805712 was started externally and deployed main `4f883d1` on 8 October Brisbane time. Its database gate, web readiness/health, anonymous refusal and worker-image configuration passed. Dean completed invited Microsoft sign-in. The implementation agent then reopened the existing saved Deal, estimate version 2 and Draft quotation revision 1, viewed its saved HTML and verified the downloaded PDF against its stored hash. These read-only hosted checks do not exercise the full locally prepared chain or actual hosted worker execution. See the execution ledger for exact references.

The hosted tester has existing invited permissions, not the local role chooser. Newly seeded local review/issue profiles do not expand hosted permissions. A denied action is a boundary to record; do not widen access to manufacture the complete local journey online. No customer distribution, live MYOB/SharePoint/CAD operation or invitation change belongs to this walkthrough.
