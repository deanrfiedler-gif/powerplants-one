---
document_id: PPO-QUOTE-VIEW-TRACKING-PROP
title: Quotation view tracking, decision paper
date: 2026-10-19
owner: Dean Fiedler
status: Accepted by the owner 19 October 2026 (Q1–Q10 as recommended); nothing tracks a quotation yet; no code, route, migration, capability, service, dependency, DNS change or customer message authorised by this record
versioning: git
---

# Quotation view tracking, decision paper

**Owner:** Dean Fiedler. **State:** Accepted by the owner, 19 October 2026: "Proceed with your recommendations for Q1 to Q10 of the quotation view tracking paper." Proposed the same day. Acceptance chooses option B and the rules in sections 4 and 7 only. Each build stage in section 6 still needs its own authorisation, and the gates in section 6 still apply. The document ID keeps its original `-PROP` suffix, because IDs are stable.

**Raised by:** Dean, 19 October 2026: "One feature in Pandadoc that I did really like was the ability to see when a customer had opened a quotation, when they viewed it, how many times that had viewed it, what pages that had viewed, and how long they had viewed them for. I would like to include a similar feature to this within the Powerplants One app if possible." After Claude's recommendation he asked: "Yes, draft a decision paper for quote view tracking based on your recommendation, on a branch with a draft PR."

**Related:**
- Requirements and outputs: EST-08 (issue controlled quotations and record the customer response), EST-03, CRM-03, OUT-06 (customer quotation). No parent requirement ID is added or renamed.
- Acceptance: AT-05, AT-26, AT-36.
- Decisions: D-020 (identity, privacy and external access), D-022 (hosting), D-024 (templates, issue and signature policy), D-025 (Partially resolved), D-012 (retention), D-027 (portal and optional features).
- Records: the [native quotation release decision](quotation-release-native.md) and [release contract](../contracts/quotation-release.md); the [quotation response contract](../contracts/quotation-response.md); [ADR-0058](ADR-0058-outbound-customer-email.md) (Accepted); [ADR-0059](ADR-0059-email-sending-from-ppo.md) (Proposed); the [D-025 decision paper](customer-communications-d025.md); the [customer portal direction](customer-portal-direction.md). The Emails EC-01 design record `docs/decisions/emails-figma-design.md` (PPO-EC01-EMAILS-FIGMA-DEC), whose Amendment A1 (sent email tracking) Dean accepted on 19 October 2026, is in [PR #608](https://github.com/deanrfiedler-gif/powerplants-one/pull/608) and not yet on `main`. This record cites A1 by its IDs.
- Scopes: `scope:ES-05` (quotation release, `/estimating/quotes/[id]/release`), `/estimating/quotes/[id]/response`, and `scope:CR-01` (deal record). The customer-facing page proposed in section 4 is a new route that is not registered until a build stage adds it.

Everything below is a PPO design decision. It is not an observed operating rule, and PandaDoc is a reference for the feature only. PPO does not copy its screens or wording.

## 1. What PPO has today

- **Issue is exact, but sending is simulated.** Release prepares, approves and issues a quotation revision against an exact retained HTML and PDF manifest. Distribution records only `Unknown`, `SimulatedDelivered` or `SimulatedFailed`, and no provider is called.
- **PPO sends no email.** ADR-0058 (Accepted) sends customer notices from one shared mailbox and states that PPO "makes no read claim" for them (D-025 R4). ADR-0059 (Proposed) recommends that people send correspondence from their own mailbox, with A1 tracking on that correspondence only. D-025 leaves quotation issue out of its message classes.
- **Sent email tracking is designed, not built.** Dean accepted A1 on 19 October 2026: on by default for email a person sends from PPO, with a switch for each email (A1-Q1). Only the event type and time are stored, with no IP address, location or device, for 12 months, and the privacy notice says sales email may contain tracking (A1-Q2). Only the sender and colleagues it is shared with see it (A1-Q3). There is no alert by default (A1-Q4). Tracking is "evidence, never proof" (A1-D5). ADR-0059 section 5 sets out the tracking routes and tokens.
- **Customer responses are recorded by staff.** The response contract records a reported answer with a claimed respondent. Signature and authority verification are Not configured.
- **There is no external page.** The customer portal is a design only (CP1–CP5), with no external principal in the runtime.

## 2. What any option must keep

1. **The exact issued quotation.** A customer sees only the approved and issued manifest, never a re-render or a draft (quotation release decision). Internal cost and margin stay excluded (OUT-06).
2. **Views are evidence, never acceptance.** No view, download or time changes the quotation's status, its response or the deal stage. A response is still recorded through the response contract.
3. **Accepted privacy rules stand.** A1-Q2 (event type and time, no IP, location or device, 12 months), A1-Q3 (who sees it) and the privacy notice gate apply unless Dean changes them here, and every departure is listed in section 7.
4. **Notices stay untracked.** D-025 R4 is unchanged. Quotations go as correspondence from a named person, not as a notice.
5. **No new vendor.** No third-party tracking or document service receives customer pricing or view data.
6. **Authority stays where it is.** MYOB stays the ERP, SharePoint owns business documents, and Exchange owns mail originals.

## 3. Options

| | A. Email tracking only | B. A PPO quotation page (recommended) | C. PandaDoc or a similar service | D. Tracking inside the PDF |
|---|---|---|---|---|
| How | The quotation PDF is attached to a tracked email (A1) | The email carries a "View quotation" link to a PPO page that shows the exact issued quotation, with a PDF download | Quotations are rebuilt in, or pushed to, the service through its API, and its view data is read back | The PDF calls home when opened, through embedded scripts or remote content |
| Opened and how often | Email opens only, with Apple Mail and Outlook distortions ("may be automatic") | Quotation views, counted on PPO's own page | Yes | Rarely: most readers block it |
| Which sections, for how long | No | Yes, by section, as approximate active time | Yes, by page | No |
| Downloads | No | Yes | Yes | No |
| Keeps the exact issue chain | Yes | Yes: the page serves the retained HTML, and the download is the retained PDF | No: a second copy is built outside PPO's approval and hashes | Yes |
| New services or vendors | None beyond A1 | One public page on PPO, beside the A1 routes | A new processor of customer pricing and view data, plus a subscription | None, but the PDF looks like malware to security tools |
| Cost to build | Lowest; comes with A1 | Moderate | Integration plus ongoing licence | Low, but unreliable |

**Recommendation: B**, adopted by Dean on 19 October 2026 (Q1). It is the only option that gives what Dean described without sending quotations or customer behaviour outside PPO. It reuses the retained HTML that approval already binds, and the token and event rules of A1 and ADR-0059. A is a fallback that comes free with A1. C breaks the exact issue chain and adds a processor, and D does not work reliably.

## 4. Accepted design (option B)

### 4.1 How the customer receives it

- **Send quotation** on the release page sends a correspondence email from the issuer's own mailbox (ADR-0059 option C), drafted from the issued revision: recipient, a short covering note and a **View quotation** button.
- The quotation link is PPO's own, not an A1 rewritten link, so a view is counted once, against the quotation. The email itself keeps A1 open tracking when its switch is on, and the two are shown separately.
- **No PDF attachment by default** (Q2). The page offers **Download PDF**, which serves the exact retained PDF. The sender can attach the PDF for a customer who asks for it, and the composer then says that reading the attachment is not tracked.
- Sending fills the release Distribution step with a real outcome (Sent, Failed or OutcomeUnknown from ADR-0059) in place of the simulated one. Delivery and views stay separate states.

### 4.2 The quotation page

- One page outside the application shell, with no sign-in, served at an indicative path such as `/quote/[token]`.
- It shows the exact retained HTML of the issued revision inside a plain Powerplants frame: the quotation number and revision, the validity date, **Download PDF**, and the sender's name, email and phone for questions.
- There is no Accept or Sign button in this stage (Q9). Customers reply to the sender as they do now, and staff record the response through the existing response page.
- The page is readable on a phone and meets the same accessibility rules as PPO's other customer outputs.

### 4.3 What is recorded

Each event is stored against the quotation issue and the send receipt, with its type and time only:

| Event | When |
|---|---|
| `Viewed` | The page is opened. A view within a few seconds of Sent, or from a known link scanner, is recorded as `ViewedMayBeAutomatic`, the counterpart that ADR-0059 E4 proposes for email links |
| `SectionRead` | The reader leaves a section after reading it, with the section key and its active seconds, rounded to 5 seconds (Q4) |
| `Downloaded` | The PDF is downloaded |

- **Sections, not pages.** The HTML is not paged, so time is kept per quotation section: for example summary, scope, pricing, options, terms and exclusions. A new template version marks its sections. Quotations issued before that have no markers and show whole-quotation time only; their retained bytes are never regenerated (Q10).
- **Active time only.** Time counts while the page is visible and the reader has scrolled, moved or touched in the last 30 seconds. A tab left open overnight adds nothing after that.
- **Not stored.** No IP address, location, device, browser, user agent, cookie identity or recipient identity (A1-Q2; Q5). Request facts used to classify an automatic view are read in memory and discarded, as in ADR-0059.

### 4.4 What staff see

- **On the quotation and on the deal's Estimates & quotations tab:** a "Customer views" line, for example "Viewed 4 times · last today 9:12 · PDF downloaded", and Details with the dated events and the time per section.
- **Wording:** "Viewed", "Viewed · may be automatic", "Not viewed yet" and "Not tracked" (an issue that was not sent through PPO). Never "Read", "Opened by Jo" or anything that names a person, because a forwarded link cannot be told apart.
- **Details says the limits:** times are approximate, a forwarded link counts as a view, and "Not viewed yet" means no view was recorded.
- **Who sees it:** the sender, the quotation owner and the deal owner (Q6). Other readers of the deal see the delivery state only.
- **Follow-up:** no alert by default (A1-Q4). An optional "Tell me when it is first viewed" adds one My Work notification. Separately, one follow-up suggestion goes to the quotation owner when a quotation has been viewed and no response is recorded within 5 working days (Q7).

### 4.5 The link and who can open it

- The link holds one random, unguessable token per send, with no customer, quotation or message identifier in it, as in ADR-0059.
- **Anyone with the link can view the quotation.** That is how PandaDoc-style links work and why forwarding shows up as extra views. It is also a deliberate exception to PPO's internal rule that possessing an identifier grants nothing, so it needs Dean's decision (Q3) and the D-020 external-access review.
- The sender or quotation owner can **withdraw** a link at any time, and the page then shows "This link is no longer active" and the sender's contact details, with no prices.
- The page is never indexed by search engines, sets no third-party scripts or fonts, and is limited in request rate.

### 4.6 Revisions, validity and withdrawal

- **Superseded.** When a later revision is issued, the earlier revision's page shows "This quotation has been replaced" and the sender's contact details, with no prices. It does not link to the new revision, which may have different recipients (Q8).
- **Validity.** After the validity date the page shows a "Validity ended on …" banner and stays readable. Thirty days later the link closes like a withdrawn link (Q8).
- A closed link keeps its recorded events until they reach 12 months.

### 4.7 Privacy and retention

- The privacy notice gate of ADR-0059 section 5 applies: tracking stays off for every real recipient until Dean confirms that Powerplants' privacy notice mentions it. The notice wording should cover quotation pages as well as email.
- Events are deleted 12 months after they occur, and the deletion is logged as a count (A1-Q2).
- ADR-0059 E5 applies: the page does not go live for external recipients until the hosting request logs for it are kept without IP addresses.
- This record gives no legal view on the Privacy Act 1988 or the Spam Act 2003.

### 4.8 The hosted demo

The hosted demo stays synthetic. It may show the page for synthetic issued quotations with synthetic events, and it never sends to a real recipient.

## 5. Honest limits

- A view means the page was loaded, not that the customer read or understood it.
- Security scanners open links. Some are recognised and marked "may be automatic", and some will not be.
- A forwarded link counts as more views of the same quotation, and a customer who prints or saves the PDF reads it untracked from then on.
- A customer who never opens the link but reads an attached PDF shows "Not viewed yet".
- Section times are approximate and are meant for prompts like "they spent time on pricing", not for measurement.

## 6. Sequence and dependencies

| Stage | What it does | Depends on |
|---|---|---|
| QV-S0 | This decision | Done: Dean accepted Q1–Q10 on 19 October 2026 |
| QV-S1 | Synthetic build: the quotation page for synthetic issued quotations, section markers in a new template version, the three events, the Customer views line and Details, withdrawal, supersede and validity behaviour, with database, HTTP and browser proofs | QV-S0. Needs a migration (reserved first), a read duty in `src/platform/permissions.ts` with the AGENTS.md ripple, and the page's design register entry |
| QV-S2 | Send quotation from the release page through the correspondence path, filling Distribution with real outcomes | ADR-0059 accepted and its correspondence pilot built; PR #608 merged |
| QV-S3 | Real external recipients | Privacy notice confirmed, ADR-0059 E5 (logs) and E6 (link domain) met, and the D-020 external-access review of section 4.5 |
| Later | Accept online, a one-time email code for sensitive quotations, and a portal view of the same page | Separate decisions under D-024 (signature policy) and the portal stages |

## 7. Questions for Dean

Dean answered on 19 October 2026: "Proceed with your recommendations for Q1 to Q10 of the quotation view tracking paper." Every recommendation below is therefore adopted as written. That includes Q4's departure from A1-Q2: a section's active seconds may be stored beside the event type and time, for quotation pages only. A1-Q2 is otherwise unchanged, and A1 email tracking keeps "event type and time" only.

| ID | Question | Recommendation (adopted 19 October 2026) |
|---|---|---|
| Q1 | Which option? | **B**, a PPO quotation page, with A1 email tracking as the fallback for anything sent with an attachment |
| Q2 | Attach the PDF as well as the link? | **No by default**, with a switch for each email; the composer says attachment reading is not tracked |
| Q3 | May anyone with the link view the quotation? | **Yes**, with an unguessable token, withdrawal, and closure 30 days after validity. A one-time email code can be added later for sensitive quotations |
| Q4 | Record active time per section? | **Yes**, as section key and active seconds rounded to 5 seconds. This adds a duration to A1-Q2's "event type and time", which is a small departure needing Dean's yes |
| Q5 | Count different browsers, to suggest the link was forwarded? | **No.** It needs a browser identifier that A1-Q2 rules out. Views are counted, not devices |
| Q6 | Who sees the views? | **The sender, the quotation owner and the deal owner.** Other deal readers see the delivery state only |
| Q7 | Prompt a follow-up? | **No alert by default**, an optional "Tell me when it is first viewed", and one My Work suggestion when a viewed quotation has no recorded response after 5 working days |
| Q8 | What do replaced and expired links show? | **Replaced:** a notice and the sender's contact details, no prices and no link to the new revision. **Expired:** readable with a banner until 30 days after validity, then closed |
| Q9 | Accept online on the page? | **Not in this stage.** It raises signature and authority questions under D-024, and recording a response stays with staff |
| Q10 | Quotations issued before section markers exist? | **Whole-quotation time only.** Their retained bytes are never regenerated |

## 8. What this record does not do

Acceptance authorises no code, route, page, migration, seed, capability, grant, service, dependency, DNS change, privacy notice change or customer message. It does not change D-025 R4, ADR-0058, ADR-0059, A1 or the quotation release and response contracts. It does not make view data a sales rule, a pipeline probability or evidence of acceptance.
