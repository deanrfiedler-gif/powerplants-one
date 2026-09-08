# Email & Calendar first persisted journey

## Scope and acceptance

Dean accepted the r02 HTML demo on desktop and mobile and authorised this implementation on 8 September 2026. This records user visual acceptance; the earlier cloud review browser remained blocked. The working application has its own desktop/mobile CI journey and screenshots. D-025 remains open for real integration and communication policy.

The synthetic mailbox is private to the coordinator. Linking requires an explicit opportunity selection and current access to the same company opportunity. A follow-up creates one internal Activity in the same transaction as its email association; the existing opportunity history, Work screen and Brisbane calendar read that persisted Activity. The opportunity's designated next action remains unchanged. Email text is not copied into the Activity. Colleague access to an Activity does not grant access to its source email.

## Local walkthrough

Stop the local app before applying the additive migration. Retain existing local configuration and database. Run `npm run db:migrate`, then `npm run db:seed`. Optionally run `node --env-file=.env.local --import tsx scripts/email-demo-fixtures.ts` to create two fictional opportunities through ordinary authorised CRM commands. Repeating that fixture command replays original receipts. No reset is required.

Start with `npm run dev`, choose Coordinator, and open Email & Calendar. Open a message, choose an opportunity and save the link. Enter the follow-up action and Brisbane due time, then create it. Open the linked opportunity to see the Activity, or choose View on calendar. Reload both pages to confirm the same saved action. Calendar supports date selection, week navigation, Day/Agenda, source filters and accessible event dialogs that become bottom sheets on phones. Dense/short overlapping events use the readable agenda fallback.

## Verification

TypeScript and focused lint were checked locally. PostgreSQL, restart, actual route and desktop/mobile journey checks are defined in `.github/workflows/email-calendar-journey.yml`; execution results are pending. The workflow retains screenshots and restart evidence, uses a disposable PostgreSQL service, and exercises duplicate retries, changed payloads, rollback and permission revocation. No local browser pass is claimed.

## Limits

Fictional adapter only: no Graph credentials, consent, Outlook invitations, email sending or sync. Emails remain owner-only; sharing settings and real mailbox retention/disconnect behaviour are deferred. Calendar uses Australia/Brisbane for this bounded slice. One follow-up per email, up to 100 visible items per source; no attachments, recurring-event editor or automatic matching. Fixtures are deliberately dated 8–9 September 2026. The prepared read-only Microsoft test-mailbox pilot follows this journey's acceptance.
