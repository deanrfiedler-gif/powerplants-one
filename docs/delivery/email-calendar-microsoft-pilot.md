# First Microsoft Email & Calendar pilot

**Revision:** r01 · **Date:** 8 September 2026 · **Owner:** Dean Fiedler · **State:** Prepared only; live implementation, registration and connection not performed.

[Integration design](../blueprints/email-calendar-integration.md) · [Prototype review](../blueprints/email-calendar-prototype/README.md) · [Handover](email-calendar-handover.md).

## 1. Intended result

Demonstrate that one authorised PPO user can read an approved Exchange Online test mailbox and primary calendar, explicitly link a conversation to a synthetic opportunity, and create one internal follow-up without changing Outlook messages/events. This pilot does not import Dean's operational inbox.

Proposed defaults below make the pilot reviewable. They are recommendations for the named test environment, not approved company retention or support policy.

| Item | Proposed bounded configuration |
|---|---|
| Test users | One mailbox owner for live reads. A second synthetic PPO actor for negative authorisation tests, with no mailbox grant. |
| Mailbox | Company-approved dedicated Exchange Online test mailbox; fictional content only; not a shared/delegated mailbox. Actual tenant/license unverified. |
| Mail selection | Inbox and Sent Items; initial fixed lookback of 30 days. Avoid archive mailbox and operational history. Folder selection does not reduce the granted Mail.Read scope. |
| Calendar | Primary calendar, fixed start at pilot date minus 30 days and end at plus 90 days. |
| Permissions | Delegated Mail.Read and Calendars.Read. Authentication scopes as needed: openid, profile, offline_access; User.Read only for the selected identity lookup. No application permissions, Mail.Send, Mail.ReadWrite or Calendars.ReadWrite. |
| Sync | Initial read, explicit Refresh and proposed five-minute worker polling. No webhook in the first proof. |
| Email display | Plain text first; attachment metadata only initially. Download of a known harmless text attachment can be enabled as a specific test after protected retrieval exists. |
| Local actions | One explicit opportunity link and one persisted internal Activity; operations use current PPO permissions/receipts. |
| Sharing | Owner-only live pilot. Colleague-sharing and free/busy demonstrations use fixtures and remain outside real Graph scope. |
| Duration | Proposed five business days of observed testing, followed by review and teardown. |
| Storage | Isolated database and protected token/content store; no operational exports, no browser offline mail cache, no content in Git/logs. |
| Retention | Proposed purge of test message/event cache at disconnect or pilot end; cleanup target within 24 hours. Retain content-free test results/operation references for the review. Backup expiry and purge verification must be chosen before launch. |

Microsoft's delegated permissions and OAuth consent are distinct from PPO login and record access. A successful Microsoft sign-in must not enable broad PPO data access. [Permissions overview](https://learn.microsoft.com/en-us/graph/permissions-overview), [authorisation-code flow](https://learn.microsoft.com/en-us/graph/auth-v2-user).

## 2. Responsibilities and prerequisites

| Responsibility | Proposed owner | Evidence needed before connection |
|---|---|---|
| Pilot scope and acceptable test content | Dean | Named test mailbox, user, dates and review outcome criteria |
| Company Microsoft tenant/consent | Company Microsoft 365 administrator, person unassigned | Exchange Online eligibility, tenant ID, test account, permitted app registrar and consent policy |
| PPO implementation and recovery | Developer/technical maintainer, person unassigned | Reviewed code, passed synthetic tests, isolated environment and teardown procedure |
| Real data retention/security policy | Company-designated data/security owner, person unassigned | Confirm content is fictional, cache/backup limits and access/logging policy |

No colleague has been assigned or contacted. The admin's involvement is required to confirm the actual company account setup, not because every Graph delegated permission always requires admin consent.

The current local PPO uses synthetic identities. Real mailbox content must not be enabled behind the demo actor selector. Complete the real authentication, secret management, restore and isolation prerequisites appropriate to the authorised environment before connecting. P12 and the separately prepared Private Prototype Demo package govern their own delivery; this design does not declare them complete or buy Azure services.

## 3. Provisioning instructions for the authorised pilot

1. Confirm which Microsoft tenant contains the test mailbox, whether it is Exchange Online, and who can register/consent to an app. Record the actual tenant/client IDs privately, never in public evidence. If the mailbox is only a local PST/IMAP account configured in Outlook, stop this Graph route and assess its actual provider.
2. Prepare a separate pilot environment with real PPO authentication, correct company/actor binding, HTTPS redirect URI, protected server token storage, backed-up configuration and outbound restrictions. Verify synthetic identity switching is disabled. Choose/approve hosting separately; app registration does not itself deploy PPO.
3. Register the single-tenant PPO pilot app in the correct Microsoft Entra directory, configure its exact redirect URI and the minimal delegated scope set above. The administrator follows tenant consent policy. Prefer a maintained Microsoft authentication library; do not hand-roll token validation or ask users to paste passwords/tokens into PPO. [Microsoft app registration](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app).
4. Use the approved test user to sign in through Microsoft. Validate token issuer, audience, tenant and user binding, and store refresh material only on the server. Confirm the account displayed by PPO matches the approved test mailbox before starting a sync.
5. Start the bounded initial read. Record start/end scope and source checkpoint times without logging message bodies, subjects, addresses or opaque token URLs. Follow every page before marking complete.
6. Run the case matrix below. Record source/app versions, actor, operation/correlation ID and actual result. Verify Outlook remains unchanged. Use screenshots containing fictional content only.
7. Review the evidence, keep sending disabled and disconnect/clean up. Decide separately whether to improve the read pilot, implement selected-message sharing or specify sending/calendar writes.

## 4. Fictional test dataset

Prepare 12 messages in six conversations, with both Inbox and Sent copies: same contact on two opportunities; unrelated personal message; one harmless text attachment; one deliberately unsafe HTML body/remote image; long subject and unbroken reference; duplicate delivery/change notification simulation. Do not send test invitations to operational people. Have the test-mailbox owner or an approved test harness populate messages/events under the pilot's later explicit authority.

Prepare eight calendar occurrences: ordinary meeting; private event; recurring series with one changed occurrence and one cancelled occurrence; all-day event; Sydney DST edge; Auckland DST edge. Store exact expected UTC instants and local dates. Add one internal PPO Activity and one controlled service appointment to prove that provider changes do not alter those authorities.

The downloadable prototype is smaller: six conversations/seven messages, eight illustrative PPO records and four initial calendar entries. The live dataset above is a future test fixture requirement, not a claim about data already created.

## 5. Acceptance matrix

All Microsoft runtime cases are **Not run** in this design increment. UI-model checks, if executed, prove only the separate preview and are recorded in the handover.

| Case | Exercise | Expected result | Parent |
|---|---|---|---|
| EC-A01 | Connect approved test owner; wrong-tenant/wrong-user attempt | Bind exact approved account; deny other identity without leaking cached data | NFR-01/03 |
| EC-A02 | Initial sync with multiple and empty intermediate pages | All selected pages applied once; complete only at final checkpoint | CRM-03, NFR-05/09 |
| EC-A03 | Same contact linked to two opportunities | Suggestions list permitted candidates; no automatic opportunity selection | CRM-01/03 |
| EC-A04 | Link/unlink/retry the same message context | One link/receipt; original message unchanged; dependent shares withdrawn on unlink | CRM-03, NFR-02/09 |
| EC-A05 | Colleague with record access but no share | No body, subject, preview, filename, hidden row/count or direct-object disclosure | CRM-06, NFR-01/03 |
| EC-A06 | Selected-message share; new reply and unselected attachment | Only exact selection visible; future replies and unselected attachment metadata stay private; fixture test only in first pilot | CRM-03, NFR-01 |
| EC-A07 | Revoke share/target access or disable user while viewing | Subsequent server reads denied; rendered state cleared; no attachment URL bypass | NFR-01/03 |
| EC-A08 | Create one follow-up; retry/complete/reload | One durable Activity with owner/time/source reference; no copied private body, invite or implicit completion | CRM-02/03, NFR-09 |
| EC-A09 | Unsafe HTML, remote image, URL and attachment | No script/form execution or automatic remote request; protected explicit attachment open | NFR-03/08 |
| EC-A10 | Move message between selected folders, then out of scope | Preserve immutable identity; one conversation; distinguish move/removal/deletion; no duplicate link | CRM-03, NFR-09 |
| EC-A11 | Cancel/change one recurrence occurrence | Correct occurrence changed, series and other occurrences preserved | CRM-03, NFR-09 |
| EC-A12 | Brisbane/Sydney/Auckland, all-day and DST edges | Correct UTC instants/local dates; ambiguous input handled explicitly | CRM-03, NFR-08 |
| EC-A13 | Timeout, 429, expired delta token and concurrent workers | Bounded backoff, retained checkpoint, safe rebuild and no false Ready state | NFR-05/09/11 |
| EC-A14 | Revoke Microsoft consent/expire refresh; reconnect | Hide content when authority invalid, clear session projections, rebind same account safely | NFR-01/03/05 |
| EC-A15 | Change Outlook event linked to controlled PPO work | No bypass of service readiness, crew conflict, approval or acknowledgement | NFR-01/09 |
| EC-A16 | Keyboard, 320/390/768/1440px, enlargement and real phone | Usable labels/focus, no unintended horizontal overflow, complete actions, year/timezone visible | NFR-08 |
| EC-A17 | Compare before/after Outlook state | No sends, invites, read/unread mutations, moves or deletes by PPO | CRM-03/08 |
| EC-A18 | Disconnect, interrupted cleanup and retry | Immediate access stop; worker/token/cache cleanup with evidence; no resurrection after restart | NFR-03/06/10/11 |

Pass all cases applicable to the stage with no unresolved access leak, duplicate effect or hidden sync failure. EC-A06/07 sharing cases remain synthetic until a separately authorised sharing implementation. Record UI review, server tests, tenant tests and real-device outcomes separately; passing this matrix does not close full AT-25 or authorise production use.

## 6. Reset, disconnect and costs

The current standalone preview resets from Settings → Reset sample data, or by reloading the file. It holds changes only in memory, uses no cookies/localStorage/IndexedDB and makes no external requests. Its actor and privacy switches change only fictional displayed state.

Future live teardown: first deny the connection in PPO and stop its workers; remove any subscriptions if that later mechanism was used; delete local refresh/access material; revoke the relevant consent through the supported company procedure where required; purge cached test message/event content and attachment staging; invalidate issued access URLs; verify cleanup across retries/restart and document when backups expire. Do not delete the user's original mailbox messages or events. Retain only the approved content-free audit/test receipt set. A failed cleanup remains owned and visible, never a successful disconnect claim.

No paid service was provisioned. Costs to confirm for a live pilot are test mailbox licensing, isolated app/worker/database hosting, token/key storage, logging/backup retention and engineering/support time. Existing Microsoft 365/Azure entitlements are unverified; no monthly estimate or free-service promise is made. A personal Azure subscription for the prototype is separate from company Microsoft tenant consent.

**Next implementation boundary:** implement the persisted synthetic email-to-opportunity-to-follow-up journey with server permissions and a provider adapter, then verify the read-only Microsoft prerequisites. No extra meeting, broad redesign or operational mailbox export is needed to review this package.
