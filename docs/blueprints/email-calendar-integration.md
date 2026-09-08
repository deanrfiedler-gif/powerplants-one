# Email & Calendar integration design

**Revision:** r01 · **Date:** 8 September 2026 · **Owner:** Dean Fiedler · **State:** Proposed design with a synthetic interaction prototype; no live integration.

**Workstream:** PPO-009 / [issue #9](https://github.com/deanrfiedler-gif/powerplants-one/issues/9), CRM-03 and PAR-06. Supporting parents: CRM-01/02/06/08, NFR-01/02/03/05/08/09/10/11/12. D-025, D-020 and D-012 remain operational evidence gaps. This increment does not change the 78 parent requirements, PP-01 P01–P12 order or AT-25 status.

[Clickable prototype](email-calendar-prototype/index.html) · [Run and review](email-calendar-prototype/README.md) · [Microsoft pilot](../delivery/email-calendar-microsoft-pilot.md) · [Design decision](../decisions/email-calendar-design.md) · [Verification and handover](../delivery/email-calendar-handover.md).

## 1. Objective and evidence

Provide a shared Email workspace, a combined agenda and contextual email views on permitted PPO records. The complete target journey is: find a conversation, identify its business context, create an accountable follow-up, deliberately share selected content if needed, and continue from the relevant record.

| Evidence | Finding and limit |
|---|---|
| Current user direction, 8 September | Design and synthetic prototype authorised, including desktop/mobile screens, linking, privacy and first Microsoft pilot preparation. It does not connect a live mailbox or authorise external communications. |
| Main `b3597f79413f87b9b2f1ce75a66a2addefbb0e34`, tree `8c72aae4da9117368f37fca9af94248bc276c7a3` | P11 merged through PR #57. Existing TypeScript/Next.js/PostgreSQL modular monolith, server permissions, Activity lifecycle and adapter/outbox boundaries retained. |
| Mobile PR #61 at `bfcf6e2d5c78e83fc848d18fdce4ef5fbf165e0d` | Reviewed mobile design mapping only. Still open at inspection; its implementation/testing is separate. The new preview adopts the compact phone header, bottom navigation, navy actions and readable record views. |
| Supplied Pipedrive email screenshot | Visible folder sidebar, compact conversation rows, sender/subject/preview/date, attachment indicators, filters and privacy controls. It does not establish the meaning of each lock, Microsoft tenant rights, sync completeness or licence. No screenshot message content is reused in fixtures or committed to Git. |
| Powerplants Brand Identity Guidelines 2026, pp17–19; supplied logo | Roboto/Verdana, navy `#242a37`, green `#62bb46`, white. Existing source logo and licensed font reused intact. No operational signature/contact block invented. |
| Microsoft primary documentation, checked 8 September | Graph supports mailbox and calendar reading, incremental tracking and later write capabilities. Account-specific support, consent and licence remain unverified. Links accompany the relevant technical choices below. |

The prototype is a separate design artifact under `docs/blueprints/`; it does not add a working `/email` route, migration, Microsoft credential, worker, role grant or production feature flag. Its in-memory actor simulation is not a security boundary. All correspondence uses fictional names and reserved `.example` addresses.

## 2. Scope and sequence

| Stage | Deliverable | Exclusions |
|---|---|---|
| EC design, this increment | Responsive inbox/thread/record/agenda/settings screens; explicit linking, selected-message sharing, follow-up and access-revocation simulations; pilot runbook | Real account access, sends, invitations, tenant registration, operational data and deployment |
| EC synthetic runtime, next proposed implementation | Server-enforced mailbox ownership and permitted record links, synthetic provider adapter, durable sync/operation records, one persisted internal follow-up journey | Real Graph connection and remote exposure |
| EC read-only Microsoft pilot | One approved test mailbox with fictional content; owner-only Inbox/Sent and primary-calendar display; incremental sync/recovery | Message sending, mailbox writes, shared mailboxes, multi-user content sharing and free/busy lookup |
| Later capabilities | Selected-message sharing with proven retention/access controls; compose/reply; explicitly scoped calendar writes; shared mailbox requirements | No implied approval from publishing this design |

Read-only describes Microsoft effects. Explicit record linking and follow-up are separate PPO mutations in the future runtime. Start with the current opportunity/Activity contract; enable other targets when their own runtime and permissions exist. Projects J1 remains pending. The quotation sample refers to a draft revision and is never labelled issued.

## 3. Screens and responsive behaviour

| Screen | Desktop | Phone | Essential state |
|---|---|---|---|
| EC-S01 Email | Existing narrow navy rail; folder sidebar; sender, subject/preview, privacy/context, date columns | Compact header; folder selector; stacked conversation rows; bottom navigation | Search, no results, private mailbox, selected shared messages, sync stale/unavailable |
| EC-S02 Conversation | Full thread with a right-hand context panel | Readable message cards; context continues below messages in one scroll | Sender/recipient/date, source label, selected attachment, record links, follow-up, sharing |
| EC-S03 Link record | Searchable modal, type/reference/customer shown for each candidate | Native contained modal with full-width controls | Ambiguous contact; no permitted candidate; explicit checked selection; unlink consequence |
| EC-S04 Message sharing | Review the exact message, one target record and named eligible colleague | Same review fields, no hover-dependent actions | Private default, attachment opt-in, no eligible colleague, withdraw share |
| EC-S05 Record Email tab | Existing record title/context, Emails and Details views | Same information in stacked sections | Only authorised conversations contribute subjects, rows and counts |
| EC-S06 Agenda | Date selector, source-labelled entries, source/meaning sidebar | Date selector and time/title/source cards | Private/busy, recurring occurrence, separate internal Activity, stale sync |
| EC-S07 Settings | Connection and privacy panels; explicit prototype controls | Single-column panels | Simulated ready/paused/expired/error/disconnected; revoke access; reset |
| EC-S08 Pilot plan | Compact read-only summary and acceptance sequence | Same content with natural wrapping | Prepared / Not connected; no fake sign-in or live action |

Use 44px primary/phone controls, visible keyboard focus, native labels and native modal focus containment. Body messages use 16px. Secondary row metadata uses 13–14px. At 620px and below, the navigation becomes a four-item bottom bar. Context is not hidden behind tooltips. Source dates include a year in full views; inbox rows use compact dates, with full dates in the conversation. The intended verification widths are 320, 390, 768 and 1440px, including 200% enlargement. These are targets, not a conformance claim.

Default UI actions are navy/white; green identifies selection or successful local outcomes. The Pipedrive screenshot's full compose/outbox/drafts surface is reserved for a later sending stage. Current actionable controls must work within this preview's limited model.

## 4. Record-linking contract

1. **Stable identity:** Provider context is `tenant_id + mailbox_id + provider_message_id`; PPO links use internal UUIDs plus typed target UUIDs. Readable SYN-PPO references, titles, email addresses and conversation subjects are labels, never primary keys.
2. **Suggest, then select:** Match a normalised sender/recipient address against current permitted contact relationships. Preserve the original address; do not strip plus tags or merge contacts. A contact match is evidence for a suggestion, not proof of the intended opportunity. Show all relevant permitted candidates and the match reason. The sample deliberately gives Casey two opportunities.
3. **Scope each target:** Resolve target existence, company/site scope and actor capability on the server. No cross-company link, hidden record label, autocomplete count or unrestricted ID lookup. Contact/organisation/site/opportunity are distinct targets; linking one does not silently link its hierarchy.
4. **Linking is not sharing:** Conversation-to-record links organise the owner's mailbox context. They never grant content access. Adding another target cannot expand an existing share's audience.
5. **Shares attach to an exact message and one target:** A recipient's access through one shared target must not reveal other private links. The email panel can show that permitted share without exposing an unrelated linked target. This is a proposed email projection; the existing all-target Activity rule remains unchanged.
6. **One source, multiple contexts:** Multiple PPO links can reference one provider message or mailbox-local conversation. Do not duplicate message bodies or treat identical subjects as a thread. Conversation identifiers are scoped to the mailbox; no cross-mailbox conversation merge is assumed.
7. **Link mutations:** Add/remove link uses current authorisation, expected revision and operation ID. Record actor/time/reason as appropriate. Retrying the same command returns its receipt. Removing a link withdraws shares dependent on it, without deleting the Outlook message, another link or an existing Activity.
8. **Follow-up:** Deliberately choose a permitted supported target, eligible owner, action and due time. Reuse PPO's current Activity creation command, transaction, permissions and receipt. The Activity text is entered by the user; do not copy a private email body into a broadly visible Activity automatically. Email-source visibility is checked separately. Completion of an Activity does not change email delivery or event attendance.

## 5. Privacy and sharing contract

| Actor / condition | Mailbox list and body | Linked record email view | Attachments / private events |
|---|---|---|---|
| Connected mailbox owner | Own permitted selected sync scope | Own linked conversations if the target remains permitted | Own allowed attachments; own event details |
| Colleague who can read the target, no share | No email content or message metadata | No private subject, preview, sender, attachment name, row or count | No content |
| Named recipient of a selected-message share | Only the exact currently shared selection | Only through the share's target while current access holds | Attachments require explicit inclusion; future replies remain private |
| Recipient loses target access, is disabled, or share is withdrawn | Remove access immediately at PPO authorisation boundary | Remove corresponding rows and counts | Block direct attachment/file access and clear rendered content |
| PPO administrator without mailbox grant | Connection health and redacted support identifiers only | No implicit email-content access | No mailbox access from administrative role alone |
| Customer portal user | None in this increment | None | Portal-safe publication remains a separate contract |

Proposed read predicate: current authenticated actor and tenant; enabled connection; allowed sync scope; then either mailbox ownership, or an active exact-message share plus current target access and active named recipient. Evaluate before search, pagination, counts, exports and file URLs. Mailbox access revocation/expiry hides cached content until valid access is re-established; a transient sync outage may retain the owner's previously authorised cache with a stale label. The demo's expired state illustrates reconnect UX but does not implement Microsoft access revocation.

The shared unit is a reviewed snapshot of selected content, not a grant to the entire thread. Before a real share, show sender, recipient fields, subject, body and individual attachments being disclosed; remove Bcc from colleague projections. Detect quoted history and forwarded content and require the sharer to include only the authorised selection. Do not rely on a provider's unique-body field as a privacy guarantee. New replies, changed attachments and later messages require a new share. An attachment toggle never implicitly shares every file in a thread.

Render untrusted email safely: sanitised allowlist HTML or plain text, no scripts/forms/iframes/event handlers, blocked remote pixels/images by default, safe links and explicit attachment opening. No email HTML in `dangerouslySetInnerHTML` without an established sanitiser. Future attachments need type/size checks, scanning, protected retrieval and per-request access checks. Ordinary attachments remain provider-owned; deliberate filing as a business document follows SharePoint's separate ownership/retention contract.

No real mailbox content in Git, logs, browser localStorage, service-worker caches, analytics or customer-visible output. Store provider tokens server-side with encryption and rotation; redact token, body, subject, attachment filename and delta-token URL from support logs. Reconnection must not reassign ownership from a changed email alias.

## 6. Microsoft and PPO boundary

Microsoft Graph v1.0 is the proposed direct provider interface. It works with the retained Next.js server and future durable worker, using adapters consistent with [ADR-0003](../decisions/ADR-0003-prototype-architecture.md) and [BP-02](../architecture/BP-02-platform-architecture.md). No new framework or paid integration broker is needed for this design. Outlook/Exchange owns message/event originals; PPO owns its record links, explicit Activities, grants, operation receipts and audit.

The first live design uses delegated access for the signed-in test user. `Mail.Read` is needed for bodies and attachments; `Mail.ReadBasic` omits those fields. `Calendars.Read` supports the selected event-reading flow. Add `Mail.Send`, `Mail.ReadWrite` or `Calendars.ReadWrite` only in separately scoped write stages. Requested folder/calendar filtering is an application selection and **does not narrow the underlying delegated permission to those folders**. Tenant user-consent policy may require an administrator even where a delegated scope is not intrinsically admin-only. [Microsoft permissions](https://learn.microsoft.com/en-us/graph/permissions-reference), [delegated access](https://learn.microsoft.com/en-us/graph/permissions-overview).

Future configuration is single-tenant initially, with authorisation-code flow, PKCE, state/nonce protections and a maintained Microsoft-compatible authentication library. Bind PPO actor, tenant object identity and mailbox identity; validate issuer/audience/tenant rather than accepting an arbitrary account. Use `openid`, appropriate profile scopes and `offline_access` for sign-in/background refresh; include `User.Read` only for the chosen `/me` identity lookup. Real implementation must verify the exact minimal grant set. [Microsoft delegated authorisation flow](https://learn.microsoft.com/en-us/graph/auth-v2-user).

Proposed internal types (no physical migration allocated):

| Type | Essential fields / purpose |
|---|---|
| MailConnection | UUID, PPO actor/company, tenant/mailbox provider keys, granted scopes, status, encrypted token reference, selected folders/calendar, consent evidence |
| ProviderMessage | UUID, connection/provider immutable ID, internet_message_id, conversation_id, folder membership, change_key, source timestamps, protected body/attachment references |
| CommunicationLink | UUID, conversation/message source key, typed target UUID, actor/time, revision, operation ID; no content-access effect |
| MessageShare | UUID, selected message/source revision or snapshot hash, one target, named recipient, included attachment IDs, actor/time, withdrawal state |
| ProviderEvent | UUID, connection/event/series/occurrence keys, source version, UTC instants, original timezone, privacy/cancellation and recurrence metadata |
| SyncCheckpoint | Connection + resource/folder + fixed date window, opaque next/delta link, successful checkpoint time, owned error and retry state |
| CalendarActivityLink | Provider occurrence and PPO Activity UUID, origin, explicit field/direction policy, last source/PPO versions; later implementation |

Unique constraints cover provider context/source ID and explicit link/share identities. Message IDs can change under ordinary folder moves; request immutable Outlook IDs consistently. Those IDs have mailbox-lifetime limitations and must not be treated as global IDs. Preserve Internet message IDs as supporting correlation evidence. [Immutable Outlook identifiers](https://learn.microsoft.com/en-us/graph/outlook-immutable-id).

## 7. Synchronisation and recovery

Proposed pilot: a bounded initial sync, manual Refresh and a server-side five-minute polling interval while connected. The interval is a pilot engineering choice, not a promised service level. Do not add webhook infrastructure to the first read-only proof. Later near-real-time sync can use Microsoft change notifications plus checkpoint reconciliation; subscriptions expire and need renewal/recovery. Shared/delegated mailbox notifications have different permission constraints and are excluded initially. [Microsoft change notifications](https://learn.microsoft.com/en-us/graph/outlook-change-notifications-overview).

Messages: run one delta stream per selected folder; follow every next link, even empty pages, then checkpoint the returned delta link. Use a fixed initial 30-day lower bound and separate local retention cleanup; do not silently reinterpret the opaque token as a sliding window. No `$search` on delta. Folder removal can mean a move; reconcile source identity/membership before classifying deletion. A move outside selected scope hides content in PPO without deleting the provider original or falsely claiming confirmed deletion. [Message delta](https://learn.microsoft.com/en-us/graph/api/message-delta?view=graph-rest-1.0).

Calendar: use the v1.0 primary `calendarView/delta` with a fixed date window. The API does not support `$select`, `$filter`, `$orderby` or `$search` for this flow; minimise retained fields after retrieval. Keep separate checkpoints when rebuilding a window; reconcile overlapping occurrence identities before swapping the active view. Store source recurrence and original timezone, distinguish series master from occurrence/exception, and handle out-of-window removal semantics. [Calendar delta](https://learn.microsoft.com/en-us/graph/api/event-delta?view=graph-rest-1.0).

Do not mark a round complete until every page is durably applied. Serialise per-connection/resource workers with a lease; idempotently upsert and reject stale application commands. On expired checkpoint, rebuild the declared scope while keeping the old authorised view marked stale. On 429 respect `Retry-After`; otherwise use bounded backoff and an owned error. No arbitrary promise of instant synchronisation. [Microsoft throttling guidance](https://learn.microsoft.com/en-us/graph/throttling).

Connection states: Disconnected → Connecting → InitialSync → Ready; Paused retains deliberately stale authorised cache; TransientFailure shows last success; ReconnectRequired hides content when authority is invalid; Disconnecting revokes PPO access immediately and cleans up in the background with an observable outcome. UI success never implies unseen provider work completed.

## 8. Calendar ownership and future direction

| Operation | Read-only pilot | Later proposed rule |
|---|---|---|
| Outlook creates/updates/cancels meeting | Read/display changes | Update provider projection; do not create/complete a PPO Activity without explicit mapping |
| PPO creates an internal follow-up | Separate PPO save | Optional deliberate calendar export with event identity and invitation preview |
| PPO service booking changes | Existing authorised PPO command only | Optional provider notification follows accepted PPO transaction; Outlook cannot bypass readiness/crew locks |
| Outlook edits a PPO-origin service mirror | No provider mirror yet | Raise an owned change request; do not silently reschedule the authoritative booking |
| Linked event and Activity edited concurrently | No two-way command | Expected source/PPO versions; show field conflict; no blanket last-write-wins |
| Recurring event occurrence cancelled | Reflect that occurrence | Do not cancel the whole series or complete a linked Activity |
| Private or colleague event | Owner-only initially | Separately approved free/busy projection; no private subject/location/attendee disclosure |

PPO keeps UTC instants plus source zone/offset and displays the user's selected zone. Brisbane/AEST is the prototype fixture zone; verify Sydney and Auckland DST boundaries, all-day local dates and ambiguous/nonexistent civil times in future tests. One Outlook attendee invitation, an Activity assignment and a controlled service reservation are different effects. Any later unknown send/update outcome enters reconciliation before retry; a Graph accepted request is not proof of delivery or customer acknowledgement.

## 9. Acceptance and remaining decisions

The [pilot plan](../delivery/email-calendar-microsoft-pilot.md) supplies EC-A01–EC-A18 and a runnable review sequence. These are child scenarios under existing parents, not new parent requirements or passed AT tests. The [handover](../delivery/email-calendar-handover.md) records actual executed checks separately from planned Microsoft/real-device checks.

Open before a live pilot: actual Exchange Online tenant/test mailbox, permitted registrar/admin, approved isolated environment, selected test-user identity, data/cache retention and cleanup ownership. Open before broader sharing/sending: company disclosure policy, operational mailbox list, shared-mailbox requirements, approved signature/document filing, invitation rules and ownership conflicts. None prevents this fictional design review.
