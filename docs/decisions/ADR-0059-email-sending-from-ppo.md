# ADR-0059 — Sending email from Powerplants One: a person's own mailbox for correspondence, the shared mailbox for customer notices

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **State:** Accepted by the owner, 26 October 2026: "proceed with your recommendations", which adopts option C and the recommended answer to each of E1–E9 ([Dean's decision](#deans-decision-26-october-2026)). Proposed 19 October 2026. Acceptance chooses the sending paths and their rules only. It authorises no app registration, consent, mailbox, credential, DNS change, dependency, migration, capability, sending code, tracking endpoint or customer message; each waits for its own build stage. **Raised by:** Q1 of the [Emails EC-01 design record](emails-figma-design.md) (PPO-EC01-EMAILS-FIGMA-DEC), which reached `main` through [PR #608](https://github.com/deanrfiedler-gif/powerplants-one/pull/608). Dean adopted the record's recommended answer to Q1 on 19 October 2026: reading and linking are accepted, while Reply, Reply all, Forward, New email and the composer stay an EC-04 proposal "until an ADR settles sending". It also gates that record's Amendment A1 (sent email tracking), because only email sent through PPO can be tracked.

**Related:**
- Decisions: D-025 (Partially resolved); D-020 (identity, privacy and external access); D-022 (hosting and integration platform); D-024 (branding and templates).
- Requirements and outputs: CRM-03, PAR-06, OUT-17, IF-09, DOC-05, TR-03, NFR-11. No parent requirement ID is added or renamed.
- Acceptance: AT-25, AT-36.
- Scopes: `scope:EC-01` (`/email`, `/email/[id]`), `scope:EC-02` (mailbox connection), `scope:EC-04` (drafts and delivery review), `scope:CR-01` (deal record) and the lead record `route:/sales/leads/[id]`.
- Records: [ADR-0058](ADR-0058-outbound-customer-email.md) (customer email from one monitored shared mailbox through the communications service, no send-as); the [D-025 decision paper](customer-communications-d025.md) (message classes and rules R1–R9) and its [S2 build](customer-communications-core-s2.md); [ADR-0020](ADR-0020-email-calendar-synthetic-journey.md); [ADR-0021](ADR-0021-gmail-first-real-provider.md) (Gmail read-only on the hosted demo); the [Email & Calendar integration design](../blueprints/email-calendar-integration.md); the accepted [lead record](lead-record-page-design.md) and [deal record](deal-record-page-design.md) designs.

## Context

The accepted Emails design shows Reply, Reply all, Forward, New email and a composer, and Amendment A1 adds an eye on every sent email: Not opened, Opened n×, Opened · may be automatic, Viewed, or Not tracked. None of it can be built until PPO can send. PPO sends no email today: both mail paths are read-only, and the S2 communications core has only a synthetic channel.

Two earlier decisions already govern parts of this:

1. **Customer notices.** ADR-0058 and D-025 send the four customer notices (M1 dispatch, M2 delay, M3 visit confirmation, M4 project update) from **one monitored shared mailbox** through **one communications service**, with app-only Graph `Mail.Send` scoped by RBAC for Applications to that mailbox, "no delegated sending, and no send-as for any staff member". Dean chose "One shared mailbox" on 17 October. D-025 R4 adds: "PPO adds no tracking pixels and makes no read claim."
2. **Personal email in records.** The accepted lead record design (R6) gives the composer an Email tab that "writes and sends from the connected mailbox and links the email to the lead". The accepted deal record design (R9) adopts the same: "through the connected mailbox; build it with the mailbox pilot". The Emails design (Q3) scopes the mailbox view to one personal mailbox each, Inbox and Sent items, with no shared mailboxes.

These two pull in different directions only if one path has to carry both kinds of email. They are different kinds of email:

| | Customer notice (M1–M4) | Correspondence |
|---|---|---|
| Who writes it | PPO drafts it from recorded facts and a published template; a named person confirms it (S2) | A person writes it, or replies to or forwards a message |
| Who it is from | The company | The person |
| Recipients | One named role on the source record, never typed (R1) | Whoever the person addresses, including Cc and Bcc |
| Who can see it in PPO | Anyone who can read the source record (R3) | The sender; a colleague only through a share (integration design §5, EC-01 D5) |
| Replies | To the shared mailbox, handled by the owning team | To the person, in their own thread |
| Tracking | Never (R4; A1-Q1) | On by default, with a switch for each email (A1-Q1) |

Constraints:

1. **Accepted decisions stand.** ADR-0058, D-025 R1–R9, the S2 core, the EC-01 privacy model (D5) and A1-Q1 to A1-Q4 are not reopened here.
2. **Outlook owns the originals.** Exchange owns message originals; PPO owns record links, receipts, shares and audit (integration design §6). SharePoint owns business documents; MYOB stays the ERP authority.
3. **Least privilege.** A delegated permission is not narrowed by PPO's folder selection (integration design §6). App-only `Mail.Send` reaches every mailbox unless scoped (ADR-0058).
4. **Honest states.** Submitted, Sent, Delivered and Failed stay distinct (DOC-05), and failures stay visible (TR-03). Tracking is evidence, never proof (A1-D5).
5. **Privacy.** A1-Q2: the event type and time only, no IP address, location or device, kept for 12 months, and a privacy notice that says sales email may contain tracking. No personal data in URLs.
6. **No unrequested services.** A tracking endpoint is a new public surface. Dean asked for tracking, so the endpoint is in scope, but no third-party tracking vendor is.
7. **The tenant is unverified.** Dean said on 19 October 2026: "I believe our Microsoft Outlook is on Exchange Online, and is handled internally by our IT contractor." That is his belief, not a verified fact: the tenant, licences, mailboxes and who can grant consent are still to be confirmed with the IT contractor before any pilot (ADR-0058).
8. **The repository is public and synthetic.** No real mailbox address, tenant identifier or credential appears here.

## Options

### A. Everything from the person's own mailbox (Graph delegated `Mail.Send`)

Every email PPO sends, including M1–M4, goes from the signed-in person's own mailbox as that person.

- **Consent:** each person grants PPO permission to send as them, or an administrator grants it for the tenant. Notices stop when the person who would send them has not consented or has left.
- **Permission:** delegated `Mail.Send`, limited to the signed-in user. PPO cannot send for anyone who is not signed in, so a notice confirmed by one person cannot be retried by another.
- **Audit:** the person's Sent Items and the mailbox audit log, plus PPO's receipt. Notices are spread across many mailboxes.
- **Retention:** each copy follows that person's mailbox retention; a departing person's mailbox takes the notices with it.
- **Tracking (A1):** possible on everything, which would contradict R4 and A1-Q1 for notices.
- **Fit:** reverses ADR-0058 decision 3 and Dean's "One shared mailbox". Customer replies to a dispatch notice reach one person, not the owning team, which breaks ADR-0058 constraint 1.

### B. Everything through the shared mailbox and the communications service

Correspondence is added to the communications service as another message kind and goes out from the shared mailbox, as ADR-0058 does for notices.

- **Consent:** one administrator consent for the app-only registration. No per-person consent.
- **Permission:** app-only `Mail.Send`, RBAC-scoped to the shared mailbox. No staff mailbox is touched.
- **Audit:** strong: one communication record per message with the exact body, sender identity in PPO, and one Sent Items.
- **Retention:** the R3 communication record and the shared mailbox; D-020 and D-024 still open.
- **Tracking (A1):** technically possible, but every tracked email would then be a communications-service message, which R4 forbids from carrying tracking. A1 would need R4 to change.
- **Fit:** poor for correspondence:
  - a reply to a customer who wrote to Jamie comes from the shared mailbox, not Jamie, and the customer's next reply goes to the shared mailbox, so the thread splits across two mailboxes;
  - the sent copy is not in the person's Sent items, so the EC-01 Sent items view and threads do not show what the person sent;
  - R1 (named role only, never typed, no Cc) would have to be loosened for correspondence, weakening the notice rules;
  - it contradicts the accepted lead and deal designs ("from the connected mailbox").

### C. A split: correspondence as the person, notices on the shared mailbox (recommended)

Correspondence written in PPO goes from the person's own mailbox through delegated `Mail.Send`, as option A. M1–M4, and any later class D-025 defines, stay on the shared mailbox through the communications service, exactly as ADR-0058 decides.

- **Consent:** per person, for correspondence only, as a separate "Allow PPO to send as you" step after the mailbox is connected for reading (EC-02). The tenant's user-consent policy may require an administrator to grant it. Notices keep ADR-0058's single administrator consent.
- **Permission:** two registrations with two different shapes, never mixed. Correspondence: delegated `Mail.Send` only, the signed-in user's own mailbox only, never `Mail.Send.Shared` or any send-as or send-on-behalf right. Notices: ADR-0058 unchanged.
- **Audit:** correspondence has a PPO send receipt (who, when, which mailbox, which records, outcome) and the person's Sent Items; notices keep the R3 communication record.
- **Retention:** correspondence originals stay in the person's mailbox; PPO keeps the receipt and links. Notices as R3.
- **Tracking (A1):** correspondence only, which is exactly A1-Q1. Notices are never tracked, so R4 stands.
- **Fit:** keeps ADR-0058, D-025, the lead and deal designs and A1-Q1 as accepted. The cost is two Graph paths and two consent models to operate and review.

### D. No sending from PPO

People keep writing and replying in Outlook. PPO reads and links sent mail through the read pilot, and only notices go through the communications service.

- **Consent and permission:** none beyond reading.
- **Audit and retention:** Outlook only; PPO links what it reads.
- **Tracking (A1):** impossible, because PPO never sends the email. Every sent email would show "Not tracked", so A1 could not be built without an Outlook add-in, which is a separate product.
- **Fit:** the safest, and the honest fallback while sending is not built, but it drops Reply, New email, the lead and deal Email tabs and A1, all of which Dean accepted.

### Rejected outright

- **Gmail send.** ADR-0021 is deliberately read-only, on one personal account, on the hosted demo. It is not a company identity.
- **SMTP submission** (SMTP AUTH or a relay connector): a second credential type, with outcome reporting no better than Graph (ADR-0058 option C).
- **A transactional email service for correspondence:** sent copies would not be in the person's Sent Items, replies would still need the person's mailbox, and customer content would leave the tenant. ADR-0058 keeps it as the named alternative for notices only.
- **A third-party tracking vendor:** sends recipients' open data to a new processor for no gain over a PPO endpoint.

### Comparison

| | A | B | C | D |
|---|---|---|---|---|
| Consent | Per person, for everything | One administrator consent | Per person for correspondence; one administrator consent for notices | None new |
| Permission | Delegated `Mail.Send` | App-only, RBAC-scoped | Both, kept apart | Read only |
| Audit | Spread across mailboxes | One record per message | Receipt per sent email; record per notice | Outlook only |
| Retention | Each person's mailbox | Shared mailbox and R3 record | Mailbox originals; PPO receipts and R3 records | Outlook |
| Replies and threads | To the person, including notices | All to the shared mailbox | Correspondence to the person; notices to the team | Unchanged |
| A1 tracking | Possible, but breaks R4 | Needs R4 changed | Correspondence only, as A1-Q1 | Not possible |
| Accepted decisions | Reverses ADR-0058 | Contradicts lead and deal designs | Keeps all | Drops accepted features |

## Decision

Adopt **option C**. Proposed on 19 October 2026 and accepted by Dean on 26 October 2026 ([Dean's decision](#deans-decision-26-october-2026)).

### 1. Which path an email takes

- **Correspondence** is any email a person writes in PPO: New email, Reply, Reply all and Forward on Email (EC-01), and the Email tab of a lead, deal or other record's composer. It goes from that person's own mailbox, as that person.
- **Customer notices** are M1–M4 and any class D-025 adds later. They go only through the communications service from the shared mailbox (ADR-0058).
- **The rule at the boundary:** an email that PPO prepares from recorded facts or a published `CUS-EMAIL` template is a notice. An email a person writes is correspondence. The correspondence composer cannot send from the shared mailbox, and a notice can never be sent from a person's mailbox, even if that person confirmed it.
- **A person's reply to a customer's reply to a notice** is correspondence when the person answers from their own mailbox. Replies to notices arrive in the shared mailbox and are handled there in Outlook (R7); PPO does not show the shared mailbox in Email (EC-01 Q3).

### 2. The correspondence path

- **Provider:** Microsoft Graph v1.0, delegated, through a single-tenant registration for the person-facing mailbox features (the same delegated registration the read pilot uses). The app-only notice registration of ADR-0058 stays separate, so its RBAC scoping is never widened by delegated grants.
- **Grant:** `Mail.Send`, added in its own consent step after the read connection. Never `Mail.Send.Shared`, never send-as or send-on-behalf, never `/users/{id}` for anyone but the signed-in person. The exact minimal grant set, including whether replies and correlation need `Mail.ReadWrite`, is verified in the pilot, as the integration design requires for reading.
- **Who can send:** a person whose own mailbox is connected and who has granted sending, acting within a record they can open. A send duty is added to `src/platform/permissions.ts` in the build increment, with the access-review and grant-test ripple AGENTS.md lists. This record names no capability.
- **Tokens:** server-side, encrypted, rotated and redacted from logs (integration design §5). Disconnecting the mailbox or withdrawing the send grant stops sending at once in PPO.
- **No new runtime dependency:** Graph through `fetch`, as ADR-0021 and ADR-0058 chose.

### 3. Sent items, linking and record links

- **One copy, in the person's Sent Items.** PPO asks Graph to save the sent copy (the default), so the email appears in the person's Outlook and in EC-01 Sent items through the ordinary read sync. PPO does not keep a second copy of the body.
- **Correlation.** Each send carries a PPO operation identifier in a custom `x-` message header. PPO confirms Sent by finding the copy in Sent Items by that header and records the copy's immutable Outlook identifier and Internet message ID (integration design §6).
- **Links follow where it was written.**
  - Sent from a record's composer: linked to that record when Sent is confirmed.
  - A reply or forward in a linked thread: keeps the thread's links.
  - New email from Email: linked to the records the person ticks in the composer; nothing is pre-ticked (EC-01 D3).
  - A link never links a parent record silently (EC-01 D2).
- **Private by default.** A sent email is private to the sender, like any other email in their mailbox. A record's Email section shows it to the sender only, and to a colleague only through a share of that one message (EC-01 D5). Linking does not share it.
- **Notices are different.** A notice is a communication record on the record's timeline, readable by anyone who can read the source record (R3). Notices do not appear in a person's Email view.
- **Subjects.** The composer offers the naming assistance pattern `[confirmed reference] Purpose – Short description` (integration design §15) but does not enforce it on correspondence. Notices keep R7.
- **Drafts and attachments.** The first sending stage has no saved drafts (EC-01 Q3), no scheduled send and no new attachments. Forward carries the original's attachments through Graph. New attachments, and SharePoint document links in place of attachments, are a later stage.

### 4. Honest delivery states

Correspondence uses ADR-0058's outcome mapping, not a weaker one:

| State | Evidence | What the person sees |
|---|---|---|
| Submitted | Graph `202 Accepted`, which "doesn't indicate that the request processing has completed" | "Sending…" |
| Sent | The copy found in Sent Items by PPO's header | Nothing extra: it is in Sent items |
| Failed | A Graph error, or a non-delivery report in the person's Inbox matched to the message | "Not delivered", with the reason, on the email and in My Work |
| Delivered | Positive evidence only, such as a message trace | Not shown unless evidence exists. Never inferred from an open, a view or silence |
| OutcomeUnknown | A timeout or crash after hand-over | "Not confirmed — checking Sent items". PPO searches Sent Items before any retry and never retries blind |

- **Failures are owned.** Failed and OutcomeUnknown create one My Work follow-up for the sender (TR-03 pattern). There is no Held state for correspondence, because the person sends it directly; a send that PPO refuses (no grant, mailbox reconnect required) is refused before submission and nothing is sent.
- **Notices keep R4 and S2 unchanged**, including Prepared, Queued, Held and Withdrawn, and the "Sent — delivery not confirmed" wording.
- **Tracking never changes a delivery state.** An open is not Delivered (A1-D5).

### 5. Sent email tracking (A1)

Tracking applies to correspondence only, on by default with a switch for each email (A1-Q1, A1-D4), and never to notices (R4).

- **What is added to the email.** When tracking is on, PPO adds one small transparent tracking image to the HTML body, and rewrites each `http` and `https` link in the body to a PPO redirect. `mailto:` and `tel:` links, and links in quoted history, are not rewritten. A plain-text-only email cannot carry tracking and shows "Not tracked".
- **The tracking service.** Two routes on PPO's own application, not a separate vendor:
  - an image route that always returns the same transparent image, for any token, known or not, so it reveals nothing;
  - a redirect route that sends the browser only to the exact URL recorded for that token and link at send time, so it can never be used as an open redirect. An unknown or withdrawn token goes to a neutral page, not to a guessed URL.
- **Tokens.** One random, unguessable token per sent email (opens are counted for the email, not each recipient, A1-D3), and one per link. Tokens contain no address, name, record or message identifier.
- **Events stored.** Only the event type (`Opened`, `OpenedMayBeAutomatic`, `Viewed`, with the link's position in the email) and the time, against the send receipt. No IP address, location, device, user agent or recipient identity is stored (A1-Q2). Request facts used to classify an event are read in memory and discarded.
- **"May be automatic."** An open is recorded as `OpenedMayBeAutomatic` when request facts suggest a mail privacy service or security scanner rather than a person: for example a load within seconds of Sent, or a request from a known image-prefetch service. The classification rules are a pilot finding to be tested and documented, not a verified rule. Link scanners click links the same way; see question E4.
- **Known limits, said in the Details popover.**
  - Recipients whose mail client blocks remote images record no open, so "Not opened" means no open was recorded, not that the email was unread.
  - Image proxies can cache the image, so later opens may not be counted.
  - Opens by anyone the email is forwarded to, and the sender's own views of the Sent copy in Outlook, can count as opens.
- **Retention.** Tracking events are deleted 12 months after they occur (A1-Q2). Deletion is automatic and logged as a count, not as content.
- **Who sees it.** The sender, and a colleague the message is shared with; never a record's Email section for anyone else (A1-Q3). No alert unless the person asks for one on that email; the first open then adds one My Work notification (A1-Q4).
- **Privacy notice.** Tracking stays off for every real recipient until Dean records that Powerplants' privacy notice says sales email may contain tracking. On 19 October 2026 Dean decided to add it now (see "Dean's answers" below); the gate is met once he confirms the notice is updated. The update is a business action outside this repository, and this record gives no legal view on the Privacy Act 1988 or the Spam Act 2003.

**Tracking under the other options**, for comparison:
- A: the same mechanism, but on notices too, which R4 forbids.
- B: the same mechanism inside the communications service, which R4 forbids for every message it sends.
- D: not possible.

### 6. Audit

- **Correspondence send receipt** (one per send): the operation identifier, the sender, the mailbox identity, the time, the record links, the recipient count, the tracking setting, the outcome history and the provider identifiers once Sent is confirmed. Recipient addresses and the subject are read from the mailbox copy under the sender's access, not duplicated in the receipt; whether the receipt needs them for support is verified in the build (D-020).
- **Notice record** unchanged (R3).
- **Mailbox audit.** Exchange's own mailbox audit records the send in the tenant; PPO does not replace it.
- **Consent evidence.** Who granted sending, when, for which mailbox, and its withdrawal, are recorded on the mailbox connection (integration design `MailConnection`).

### 7. Retention

- Correspondence originals follow the mailbox's own retention. PPO's send receipts and links follow D-020, still open.
- Tracking events: 12 months, then deleted.
- Notices: R3, with D-020 and D-024 still open.

### 8. The hosted demo

The hosted demo stays read-only (ADR-0021). Sending there uses the synthetic channel only, with synthetic tracking events, and never a real recipient.

## Rationale

- **The two kinds of email need different identities.** A customer who wrote to a person expects that person to answer, from their address, in the same thread. A dispatch notice is the company speaking, and its replies belong to the owning team. Option C gives each its natural identity without bending either set of rules.
- **It keeps every accepted decision.** ADR-0058, D-025 R1–R9, the S2 core, the lead and deal composers, EC-01 D5 and A1-Q1 to A1-Q4 all stand as written. A and B each reverse at least one.
- **Least privilege holds on both paths.** Delegated `Mail.Send` without `.Shared` can only send as the signed-in person. The notice registration stays scoped to one mailbox. Keeping two registrations means neither can widen the other.
- **Tracking lands where it was asked for.** Dean asked for Pipedrive-style tracking of a person's sales email. Under C that is exactly where tracking runs, and nowhere the R4 promise ("no tracking pixels") applies.
- **The cost is honest.** Two consent models, two paths to secure and a public tracking endpoint to operate. Each is bounded, and each can be switched off on its own.

## Consequences

- **ADR-0058's scope is clarified, not changed.** Its decision 3 ("No delegated sending, and no send-as for any staff member") governs the communications service's notice channel. A person sending their own correspondence from their own mailbox is outside that channel. If Dean accepts this ADR, ADR-0058 and the D-025 paper gain a one-line pointer to it; neither decision changes.
- **EC-04 is split.** The composer on Email and on records is the correspondence path. The EC-04 "Communication draft, approval and delivery review" scope remains the notice path's review page. The register entry for `scope:EC-04` is updated when either is designed or built, not here.
- **Security review.** The delegated send grant and the tracking endpoint each need a D-020 security review. Administrator consent may be needed for the send grant under the tenant's policy.
- **A later migration.** The build adds the send receipt, its outcome ledger, the tracking tokens and events and an outbox kind for correspondence. That migration follows AGENTS.md's registry and upgrade rules. This record allocates no version.
- **A new capability** for sending, with the access-review and grant-test changes AGENTS.md lists. Not named here.
- **DNS may change.** If tracking links are served from a subdomain of the company's mail domain (question E6), that is a DNS change for Dean.
- **Reversal path.**
  - Correspondence sending has its own switch in PPO, off by default. Turning it off returns the composer to "Write in Outlook".
  - Each person can withdraw the send grant; an administrator can revoke it for the tenant.
  - Tracking has its own switch, separate from sending. Turning it off stops adding images and rewriting links; existing tracked links keep redirecting.
  - Moving correspondence to option B or D later changes the composer's path, not the notice path.

## Sequence

| Stage | Content | Depends on |
|---|---|---|
| E-S1 Read pilot | The delegated mailbox connection, Inbox and Sent items sync, linking (EC-01 as accepted) | The tenant, a test mailbox, consent and retention (integration design §9) |
| E-S2 Correspondence, synthetic | Composer, send receipt, outcome ledger, Sent Items correlation, follow-ups, on the synthetic channel | E-S1's types; this ADR accepted; the EC-04 composer design accepted |
| E-S3 Correspondence, live pilot | Delegated `Mail.Send` for test users, internal addresses only | E-S2; the D-020 review; consent |
| E-S4 Tracking, synthetic then internal | The image and redirect routes, tokens, events, 12-month deletion, the tracking line and Details popover (A1) | E-S2; the privacy notice confirmed before any external recipient; question E5 |
| Notices | Unchanged: D-025 S3–S6 | ADR-0058 |

Each stage is its own increment to authorise.

## Questions for Dean

If Dean answers "Proceed with your recommendations", these are adopted and recorded in his words.

| ID | Question | Recommendation |
|---|---|---|
| E1 | Which option? | **C**: correspondence from the person's own mailbox through delegated `Mail.Send`; notices on the shared mailbox through the communications service (ADR-0058 unchanged) |
| E2 | One app registration for everything, or two? | **Two.** The delegated registration for reading and correspondence; the app-only notice registration of ADR-0058, kept separate so its mailbox scoping is never widened |
| E3 | Should email to internal recipients only be tracked? | **No.** Tracking is added only when at least one recipient is outside the company's mail domains; colleagues are never tracked |
| E4 | Security scanners click links automatically. How should those views show? | **Add "Viewed · may be automatic"** to the tracking status, the counterpart of "Opened · may be automatic". This is a small change to A1-D2's five states and needs Dean's yes; until then, such a view is recorded as `Viewed` with the popover saying a scanner may have opened the link |
| E5 | The hosting platform's request logs may record the IP address of tracking requests. What if they cannot be excluded? | **Tracking does not go live** for external recipients until the tracking routes are kept out of request logs, or their logs are kept without IP addresses. Checked in E-S4 against the D-022 hosting choice |
| E6 | Where should tracking links point? | **A subdomain of the company's mail domain** pointing at PPO, so the links in an email match its sender's domain, which matters to spam filters and to recipients. It needs a DNS change by Dean. The application's own address is the fallback for the internal pilot |
| E7 | What happens to tracked links after the 12 months? | **They keep redirecting and stop recording**, for as long as the send receipt is kept. A customer who opens an old email still reaches the link |
| E8 | Signature on correspondence? | **A plain-text signature held in PPO for each person**, until D-024 decides branding. Graph does not apply the person's Outlook signature to mail sent through it; the pilot confirms this |
| E9 | Can a person send correspondence from a team mailbox they share in Outlook? | **Not in this stage.** EC-01 Q3 keeps shared mailboxes out of the Email view, and this ADR grants no `Mail.Send.Shared`. A later decision can add named team mailboxes |

### Dean's answers, 19 October 2026

The record asked three questions that only Dean or Powerplants can answer. Dean answered them on 19 October 2026, relayed through the Emails design session. In his words:

> "Yes, I believe our Microsoft Outlook is on Exchange Online, and is handled internally by our IT contractor.
> We can mention tracking in our Privacy Notice right now for the purpose of developing the Powerplants One app.
> No sales emails count as commercial under the Spam Act, so we will not need an unsubscribe button."

These answers decide none of E1–E9. The ADR stays Proposed.

| Question | Dean's answer | How it is recorded |
|---|---|---|
| Is the company's mail Exchange Online in a tenant PPO can be registered in, and who can grant consent? (also open for ADR-0058) | "I believe our Microsoft Outlook is on Exchange Online, and is handled internally by our IT contractor." | **Dean's statement, not verified.** Consent and administration sit with the company's IT contractor. Confirming the tenant, licences, mailboxes and the person who can grant consent stays a prerequisite of the E-S1 read pilot and the E-S3 sending pilot |
| When will the privacy notice say sales email may contain tracking? (A1-Q2) | "We can mention tracking in our Privacy Notice right now for the purpose of developing the Powerplants One app." | **Dean's business decision.** He will add tracking to the privacy notice now. The §5 gate is met once Dean confirms the notice is updated; until then tracking stays off for every real recipient. Updating the notice is a business action outside this repository |
| Does any correspondence count as a commercial electronic message under the Spam Act 2003, which would need an unsubscribe option? | "No sales emails count as commercial under the Spam Act, so we will not need an unsubscribe button." | **Dean's business position.** Correspondence gets no unsubscribe option on that basis. This record gives no legal view, and does not state this as a legal conclusion. Customer notices keep D-025 R2's plain instruction on how to stop them |

### Dean's decision, 26 October 2026

Claude summarised the open questions and recommended accepting option C with the recommended answer to each of E1–E9. Dean replied on 26 October 2026: "proceed with your recommendations".

| Item | Classification | What it means |
|---|---|---|
| ADR-0059 | Accepted by the owner, 26 October 2026 | The State line above. ADR-0058 and the D-025 paper now carry a one-line pointer here; neither decision changes (Consequences) |
| E1–E9 | Adopted as recommended, 26 October 2026 | Each recommendation in the Questions table above is now the answer, as written there |
| E4, "Viewed · may be automatic" | Adopted; design not yet redrawn | It adds a sixth tracking state to A1-D2 of the [Emails design](emails-figma-design.md#8-amendment-a1--sent-email-tracking-19-october-2026), which carries a pointer here. The Figma frames and the Email / Tracking status part still show five states; redrawing them is a design change for its own lock-in |
| E6, link subdomain | Adopted; DNS change not made | The DNS change is Dean's to make before tracking reaches an external recipient. The application's own address remains the fallback for the internal pilot |
| Tenant, consent and licences | Still unverified | Dean's 19 October statement stands as his belief. Confirming the tenant, licences, mailboxes and who can grant consent with the IT contractor remains a prerequisite of E-S1 and E-S3 |
| Building E-S1 to E-S4 | Not decided | Each stage in the Sequence needs its own authorisation. The EC-04 composer design must also be accepted before E-S2 |

Acceptance authorises no app registration, consent, mailbox, credential, DNS change, dependency, migration, capability, sending code, tracking endpoint, privacy notice change or customer message.

## Validation evidence and remaining questions

**Inspected** on main `562b9a575d2500e40ab101fc0f278cb7fd826409`, plus the Emails design record on the `docs/emails-design-lock` branch of PR #608:
- the Emails EC-01 design record, sections 1, 5 and 8 (Q1, A1-Q1 to A1-Q4, A1-D1 to A1-D6);
- ADR-0058, the D-025 decision paper (R1–R9, M1–M4, the sequence) and the S2 build record;
- the Email & Calendar integration design (sections 5, 6, 7, 9 and 15), ADR-0020 and ADR-0021;
- the lead and deal record design records (the composer's Email tab) and the `scope:EC-04` register entry.

**Not inspected:** the company tenant (Dean's belief that it is Exchange Online is recorded above, not verified), mailboxes, licences, DNS, hosting log settings, the privacy notice or any real mail. No Microsoft documentation was fetched for this record. The Graph behaviour it relies on (delegated `Mail.Send` limited to the signed-in user, `Mail.Send.Shared` for others' mailboxes, the `202 Accepted` response, custom `x-` headers, immutable identifiers, Outlook signatures not applied) is stated from the references ADR-0058 and the integration design already cite, and is to be verified in the E-S3 pilot.

**Planned validation, not executed:**
- On the synthetic channel: a send creates one receipt; a retried command returns its original receipt; OutcomeUnknown reconciles before retry; Failed creates one follow-up; a record composer links on Sent; a colleague cannot see an unshared sent email or its tracking.
- In the pilot, internal addresses only: `202` then a matched Sent Items copy; an invalid address producing a matched non-delivery report and Failed; a send for another user's mailbox refused; withdrawing the grant stops sending.
- Tracking: the image route returns the same response for any token; the redirect refuses any URL not recorded for the token; stored events hold type and time only; events older than 12 months are deleted.

This record was a decision proposal until Dean accepted it on 26 October 2026. Nothing here is built, and none of it is a production claim.
