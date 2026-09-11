# Email & Calendar first persisted journey

## Scope and acceptance

Dean accepted the r02 HTML demo on desktop and mobile and authorised this implementation on 8 September 2026. This records user visual acceptance; the earlier cloud review browser remained blocked. The working application has its own desktop/mobile CI journey and screenshots. D-025 remains open for real integration and communication policy.

The synthetic mailbox is private to the coordinator. Linking requires an explicit opportunity selection and current access to the same company opportunity. A follow-up creates one internal Activity in the same transaction as its email association; the existing opportunity history, Work screen and Brisbane calendar read that persisted Activity. The opportunity's designated next action remains unchanged. Email text is not copied into the Activity. Colleague access to an Activity does not grant access to its source email.

## Local walkthrough

Stop the local app before applying the additive migration. Retain existing local configuration and database. Run `npm run db:migrate`, then `npm run db:seed`. Optionally run `node --env-file=.env.local --import tsx scripts/email-demo-fixtures.ts` to create two fictional opportunities through ordinary authorised CRM commands. Repeating that fixture command replays original receipts. No reset is required.

Start with `npm run dev`, choose Coordinator, and open Email & Calendar. Open a message, choose an opportunity and save the link. Enter the follow-up action and Brisbane due time, then create it. Open the linked opportunity to see the Activity, or choose View on calendar. Reload both pages to confirm the same saved action. Calendar supports date selection, week navigation, Day/Agenda, source filters and accessible event dialogs that become bottom sheets on phones. Dense/short overlapping events use the readable agenda fallback.

## Verification

The [dedicated assurance run at implementation commit `8898439`](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34188501282) passed pinned-runtime lint/type checks, 20 unit checks, four PostgreSQL cases, the database/process restart proof and four desktop/mobile browser cases. The browser cases exercised both the working journey and the unchanged exported r02 HTML demo: calendar navigation, event details, mobile sheets, narrow layouts, a lost accepted response, reload and denied identity. Browser test selectors were corrected to use the CRM envelope, distinguish command errors from the Next route announcer, and use the mobile week strip. The opportunity selector's accessible label was corrected in the application.

Screenshots and restart evidence are retained in the run's Email-Calendar-journey-evidence artifact. The current scratch environment could not download that archive (HTTP 403); automated geometry/interaction checks and Dean's separate visual acceptance are the evidence, not an additional manual screenshot inspection.

PR #62 was the earlier design package: it merged as `b489a8c` after its documentation/29 model checks, Dean's acceptance and the subsequent static-demo browser proof. Its broader retained application run had one timeout on an unchanged mobile service-report presentation button (111/112 browser cases passed); all other stages passed and that job was rerun. No full-application green result is claimed for that design-stage run.

The persisted synthetic implementation is published separately in [PR #64](https://github.com/deanrfiedler-gif/powerplants-one/pull/64), branch `feature/email-calendar-journey`. Five existing upgrade assertions now explicitly include migration 0015; a focused check reruns those upgrade paths without changing their original-row/checksum assertions. The broader application suite remains a separate pre-merge result for that implementation PR. The PR check list is the current execution record; this document's proof link identifies the tested implementation rather than asserting a future run passed.


## Limits

Fictional adapter only: no Graph credentials, consent, Outlook invitations, email sending or sync. Emails remain owner-only; sharing settings and real mailbox retention/disconnect behaviour are deferred. Calendar uses Australia/Brisbane for this bounded slice. One follow-up per email, up to 100 visible items per source; no attachments, recurring-event editor or automatic matching. Fixtures are deliberately dated 8–9 September 2026. The prepared read-only Microsoft test-mailbox pilot follows this journey's acceptance.

## Route and data contract

| Route | Purpose | Server authority |
| --- | --- | --- |
| `GET /api/v1/email` | Private bounded inbox/search | Owner, email read, internal and linked-record visibility |
| `GET /api/v1/email/:id` | Open private email | Same current authority; no sharing implied by link |
| `GET /api/v1/email/:id/options` | Explicit opportunity choices | Email edit and same-company visible opportunities |
| `POST /api/v1/email/:id/link` | Save selected opportunity | Current authority, expected version and original operation identity |
| `POST /api/v1/email/:id/follow-up` | Create one internal Activity | Current email, opportunity, Activity and owner scope; atomic save |
| `GET /api/v1/calendar?day=YYYY-MM-DD` | Personal Brisbane day | Own meetings and Activities with current per-record scopes |
| `GET /api/v1/operations/:id` | Recover original outcome | Original actor plus current record and command permissions |

All routes retain the application's local gateway, session, origin and no-store response controls. Email and calendar data are not added to the offline service-worker cache. No source body is copied to audit/outbox payloads; the operation stores a hash and record identity. Uncertain responses retain the same in-memory operation ID for an unchanged retry. Reload re-reads the committed source association; this slice does not persist unsent form drafts.
