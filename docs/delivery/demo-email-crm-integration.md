# Private demo integration handover

**Document ID:** PPO-DEMO-INTEGRATION · **Revision:** r02 · **Date:** 9 September 2026 · **Owner:** Dean Fiedler · **State:** Implementation prepared; combined CI and cloud acceptance pending.

This review branch combines PRs #64, #69 and #72 under the [integration decision](../decisions/demo-email-crm-integration.md). Their individual component checks do not establish a working combined deployment. Their source PRs remain available; this integration has not been merged or hosted.

## Demonstration scope

| Area | Included in the combined app |
|---|---|
| Shared layout | Desktop navigation and mobile menu include Email & Calendar. Existing Service/Finance screens remain, subject to permissions; invited demo testers retain the narrower commercial scope. |
| Email | Each invited actor owns two fictional enquiries: irrigation scope confirmation and climate monitoring questions. Search, open, explicitly link to a permitted opportunity, and create one internal follow-up. |
| Calendar | Each actor has two fictional meetings on their first setup day in Brisbane, including a private appointment. Their owned follow-up Activities appear on the selected date. Hosted Calendar opens on today in Brisbane. |
| CRM | Revised Board/List, desktop snapshot, mobile full-deal navigation, separate core/scope edits, guarded stage moves and personal customer/contact directory views. |
| Estimating | Existing E1 manual estimate and immutable draft quotation journey retained from the Azure preparation. |

All correspondence is synthetic. Linking an email does not share its body with another tester, send mail, create an Outlook appointment or replace the opportunity's designated next Activity. Meetings are read only. Real mail/calendar synchronisation and the separate Assistant branch are not included.

## Fifteen-minute rehearsal

1. Sign in as an invited tester after cloud setup. Create an opportunity using Company A, its existing fictional organisation/site/contact and yourself as owner. Keep a clear `SYN DEMO` title.
2. Open **Email & Calendar** in the desktop navigation or phone menu. Open **Irrigation upgrade — scope confirmation**, choose that opportunity and save the link.
3. Enter **SYN Confirm irrigation site visit**, choose a Brisbane due date/time and create the follow-up. Confirm the saved Activity link, then reload the message.
4. Open **View on calendar**, confirm the follow-up on its due date and open its details. Select the first setup date to inspect the fictional meetings; returning days later does not move those meetings automatically.
5. Open the linked deal. Edit its title/value in **Edit deal information**; edit inclusions separately under **Details → Edit requirements and scope**. Check **Timeline** still contains the follow-up and that the original designated next Activity has not changed.
6. Open the same demo URL in a second browser or phone and sign in as the same tester. Confirm the saved message link, follow-up and deal edits. A different invited tester gets their own mailbox; the original message URL must be unavailable to them. The internal Activity can still be visible through permitted shared CRM context.
7. Continue with the estimating recipe in the [Azure demo guide](azure-private-demo.md). Record navigation, wording and layout feedback with fictional records only.

## Setup, update and reset

First deployment uses the existing [Azure private demo guide](azure-private-demo.md). The combined migration runner applies 0001–0015 and 0017, then the separate demo identity migration. Operator setup creates expiring tester grants and individual mailboxes. Source migrations 0015 and 0017 are unchanged. If Azure has not been bootstrapped yet, perform its first setup from the reviewed combined main commit.

An ordinary image deployment does not migrate or seed. If a previous demo epoch has already been bootstrapped without Email/CRM refinements, stop and review that database upgrade before changing images; do not run the image-only workflow against the older schema. This package does not claim an executed cloud upgrade. A fresh demo epoch can instead be created using the existing operator reset procedure, retaining the previous epoch for review.

Re-running the tester list keeps existing actor IDs, message bodies/dates, meeting dates, links and follow-ups. It does not clear a rehearsal. Removing a tester denies access and removes their sessions while preserving their records. To start over, use the owner's new database/storage epoch reset described in the Azure guide. There is no browser reset or automatic destructive reset on startup.

## Verification and limitations

- Local lint, TypeScript, all 38 unit cases, the compiled Next.js build, four Python operator cases and foundation/prototype/naming checks passed in the combined worktree. The existing report-template dynamic filesystem tracing warning remains. PostgreSQL, browser journeys, infrastructure compilation and container build require the pinned CI environment here because local PostgreSQL/Docker are unavailable.
- `tests/demo/database.test.ts` exercises distinct invited identities, runtime access-table restrictions, mailbox ownership, cross-user denial, CRM information/scope changes, idempotent follow-up, calendar ownership, repeated reconciliation, revocation and reconnect persistence.
- `tests/demo/ui.spec.ts`, through `playwright.demo.config.ts`, exercises the combined journey at desktop and phone sizes, a second browser, 320px layout and another actor's denial. It uses disposable loopback sessions created through the real invited-session SQL. It does **not** simulate a successful Microsoft callback or claim live HTTPS/device acceptance.
- The inherited Azure source `370b3ed0bd8d4b5b7936c4016f35c780f5ce92ee` passed all five Application assurance jobs in [run 34313612184](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34313612184). Fresh combined-source results are still required. Existing Email, CRM, E1 and full application workflows remain enabled. Upgrade checks retain originals and migration hashes; the exact new migration list and additive email grants are explicitly asserted. The broader checks and cloud operator rehearsal remain required before release.
- Screenshots in the focused CI artifact contain fictional records only. No invitation, email, paid cloud resource or deployment URL is created by these tests.

## First combined CI correction

Initial published source `774f62a034f9c7b5d81bb9ac4353bf86a79b503b` failed static checking in [Azure demo run 34318403177](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34318403177): the hosted Calendar default called `Date.now()` directly during component render. That final page change had followed the earlier local build. The correction reads the Brisbane default date from PostgreSQL through the calendar service; no lint rule is disabled. Each demo database case also restores current invitations before testing deliberate revocation, preventing one case from leaving the next actor disabled. The corrected source passes local lint, TypeScript, all 38 unit cases and the compiled build; fresh remote database/browser checks remain required. Original migrations and issued reference files were compared byte-for-byte and retained.

## Retained CRM checks

Source `4b0380912949a45a29bc74e5590f78f052c98ba0` passed the focused [Email/Calendar](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34318717772) and [CRM refinements](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34318717916) workflows. Its new demo test submitted an offset timestamp to the UTC-only Activity command; the fixture was corrected with `toISOString()` without changing the validator. Source `a519fd69497876cb259d45d0846f770d63550d46` then passed the invited-identity database case and both desktop/mobile combined UI journeys in [Azure demo run 34318959628](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34318959628).

The full suite also reports retained I2/restart failures, so the focused CRM workflow now includes those exact existing procedures and their existing deadlines. Owner help is shown whenever the full Activity link receives focus, including programmatic focus after a pointer action, matching the old focus-triggered behaviour. The restart assertion now inspects the visible current-stage control and still requires Qualified; the earlier PR #69 run 34302205682 had selected a hidden Qualified edit control inside the new Details panel. Exact persistence, receipts, source versions and actual restart assertions remain. Fresh focused and broader results must be checked; these corrections do not establish complete application acceptance.

## Deployment preflight and streamed heading correction

Dean confirmed completing the sign-in registration, credential and user-access steps and requested Azure deployment on 9 September. At source `a05f05c890b281207f5c6b65dee22be54122cd35`, the focused Email/Calendar, CRM (including retained I2 and real restart), Azure preparation, estimating and documentation/design workflows passed. All four separate P11 application jobs passed. The main job's full browser suite passed 127/128 cases in [run 34319402650, job 102362492042](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34319402650/job/102362492042).

The remaining mobile CA-13 failure occurred at the shared heading assertion: `locator('h1')` briefly matched both `Loading your workspace…` and `A connected view` during the initial streamed page transition. The single-element assertion failed on ambiguity. The correction retries one atomic array assertion requiring exactly one heading containing the expected title, then explicitly checks its visibility. All four routes, title expectations, brand/menu assertions, viewport coverage and original deadlines remain; there is no fixed sleep, removed procedure or application change. Fresh corrected-source CI is required.

Direct Azure access was unavailable in this session: the portal returned HTTP 502 on the initial attempt and one reload, and no authenticated local Azure CLI was available. The owner can prepare persistent Bash Cloud Shell and confirm the selected subscription/resource group while corrected-source checks run. Provisioning, merge, live sign-in and phone acceptance have not been performed. The settings and secret Value remain with the owner.
