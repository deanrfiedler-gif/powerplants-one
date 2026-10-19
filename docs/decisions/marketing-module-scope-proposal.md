---
document_id: PPO-MARKETING-SCOPE-DEC
date: 2026-10-19
owner: Dean Fiedler
status: Proposed for Dean's decision (19 October 2026), following his direction to build newsletter and social publishing into PPO; not accepted. Acceptance would change the CRM marketing deferral and add proposed page scopes only; designs, register entries, migrations, permissions, provider choices, platform applications, any sending and build each need their own authorisation
source_commit: 562b9a575d2500e40ab101fc0f278cb7fd826409
versioning: git
---

# Marketing module — scope proposal

**State:** Proposed, 19 October 2026, for Dean's decision. Nothing here is accepted. **Raised by:** Dean, 19 October 2026. In a Claude session he said Powerplants has a small marketing department that creates marketing content and uses Mailchimp to track newsletter subscribers. He suggested a Marketing module in PPO, possibly with features like Hootsuite or Sprout Social, which he has used and liked. Those words were relayed to this session and are paraphrased, not quoted. His later words in this session are quoted in section 1.

**Related:**
- Requirements: CRM-01 (people and organisations), CRM-03 (linked communication history), CRM-04 (segmentation and follow-up), CRM-07 (growth actions), CRM-08 and its parity entry PAR-17. Acceptance CA-14, CA-15, CA-16 and AT-25, as PAR-17 already lists. No parent requirement ID is added, renamed or removed; all 78 parent IDs are preserved. Section 2 says where social publishing falls outside them.
- Decisions: D-013 (Pipedrive parity), D-020 (identity, permissions and privacy), D-022 (hosting and integration platform), D-024 (branding and templates), D-025 (customer communication, Partially resolved).
- Records: the [approved CRM scope](crm-approved-scope.md) and [BP-03 section 0](../blueprints/BP-03-crm.md#0-approved-crm-scope--report-r02); [BP-01](../blueprints/BP-01-master-blueprint.md) §9.2 and §9.3; the [PAR-17 parity entry](../blueprints/crm-parity.md); the [D-025 paper](customer-communications-d025.md) and [ADR-0058](ADR-0058-outbound-customer-email.md); the [contacts and stakeholders design](contacts-stakeholders-design.md); the accepted [People CS-02](people-figma-design.md), [Organisations CS-01](organisations-figma-design.md) and [Leads](leads-design.md) designs; [ADR-0001](ADR-0001-personal-private-prototype.md) (personal private prototype); Proposed ADR-0059 in [PR #611](https://github.com/deanrfiedler-gif/powerplants-one/pull/611), not yet on `main`.

## 1. Direction and recommendation

**Claude's first recommendation** was to integrate rather than rebuild: PPO would own consent and audiences, Mailchimp would keep sending newsletters, and social publishing would stay in a dedicated tool. Section 4 keeps that comparison.

**Dean's direction, 19 October 2026.** Dean asked why the tools should stay separate instead of being built into PPO to save their fees. After Claude explained the costs and risks, he replied in this session:

> "I am happy with matching what those tools do, even if it would take several months of build plus permanent upkeep. It would reduce costs in the long term, and would also give us full control over how the modules are designed, how they operate, and how they integrate into the broader Powerplants One app. Also, as the Powerplants One app project progresses, we may convert it into another version and offer it to general consumers and business using a subscription based model for additional income."

**Recommendation, following that direction.** Build the Marketing module fully in PPO, in stages, and keep Mailchimp and the social tool running until PPO has proven each replacement:

1. **Consent and audiences first.** PPO becomes the record of marketing consent, with its evidence, separate from D-025's service notice preferences. Audiences are built from PPO data: organisations, sites, crops and segments, installed equipment, deals and aftercare. Mailchimp's subscriber history is imported, so no opt-in evidence is lost.
2. **Newsletters sent by PPO.** PPO composes, tests, approves and sends newsletters. It uses a bulk email delivery service only as the transport, from a separate sending subdomain, and handles unsubscribes, bounces, complaints and the Spam Act itself. Every send is approved by a named person. Mailchimp is cancelled only after PPO meets the switch-over criteria (MK-D9).
3. **Social publishing from PPO.** PPO composes, schedules and publishes posts to the company's own LinkedIn, Facebook and Instagram pages and reads back their results. The platform applications are started first, because their approval is the longest lead time and is outside PPO's control. The social tool is cancelled only after PPO publishing has run reliably.
4. **Engagement on records.** Newsletter engagement and social-sourced enquiries appear on People, Organisation and Lead records, as Pipedrive Campaigns shows them.
5. **A content and campaign calendar** that plans newsletters, posts, events and launches together.

The full build is several months of work plus permanent upkeep, as Dean accepted. Building it in stages means each stage delivers something useful on its own and can stop without waste.

## 2. What this changes in the current deferral

| Current record | Current text | Change proposed |
|---|---|---|
| [BP-03 section 0](../blueprints/BP-03-crm.md#0-approved-crm-scope--report-r02), Current-stage exclusions, row "Marketing" | Excluded now: "Campaigns, bulk marketing and marketing subscription management". Retained: "Individual correspondence, customer classification and relationship follow-up" | **All three move into scope**, in stages: marketing subscription management (consent and audiences), campaigns (planning, engagement and attribution) and bulk marketing (person-approved newsletter sends). The row is replaced by a pointer to this decision. Automated, trigger-based marketing stays excluded (section 8) |
| [Approved CRM scope](crm-approved-scope.md), deferral 3 | Same three items deferred | Gains a pointer to this decision. Report r02 is a retained reference and is not edited |
| [BP-01](../blueprints/BP-01-master-blueprint.md) §9 summary | "Lead capture/prospecting, CRM proposal generation/e-signatures, marketing and vendor subscription-limit comparisons are deferred at this stage" | "marketing" is removed from the deferred list, with a link here. Lead capture, proposals and vendor comparisons are unchanged |
| BP-01 §9.2 | "Capture consent and applicable communication preferences. Campaign tools must not turn access to customer records into permission to send marketing." | Kept word for word. Rules MK-R1 to MK-R10 (section 5) are how this proposal meets it |
| BP-01 §9.3 PAR-17 / CRM-08 and the [PAR-17 parity entry](../blueprints/crm-parity.md) | "r02 defers capture/prospecting, proposals/e-signatures and marketing"; the entry says to split any identified used add-on "into a named child entry under PAR-17, without new parent requirements" | Mailchimp and the social tool become named child entries under PAR-17, each recording what PPO replaces, the data and consent carried over, and the switch-over evidence. No child number is invented here |
| D-025 and the [D-025 paper](customer-communications-d025.md) | Marketing listed as open | Service notices are unchanged. Marketing consent is a separate record (MK-D3), and marketing email goes through its own sending path, never the notice or correspondence paths (section 9). The decision register's D-025 note gains one sentence on acceptance |
| [Contacts and stakeholders design](contacts-stakeholders-design.md), item 2, and the [data dictionary](../contracts/service-data-dictionary.md) | "No automatic marketing consent inferred" | Kept. `contact_preference` stays free text with no consent meaning |

**Social publishing has no parent requirement.** None of the 78 parent IDs covers publishing to social media; the nearest are CRM-04 (segmentation and follow-up) and CRM-07 (growth actions). This proposal adds no parent ID. If accepted, social publishing is recorded as accepted scope under BP-03 tracing to those two parents and PAR-17. A new parent requirement would be a separate blueprint decision.

Unchanged deferrals: lead capture and prospecting (web forms, chat, visitor identification, enrichment), CRM proposals and e-signatures, and vendor subscription comparisons. A newsletter subscriber is not a lead.

## 3. Where things stand today

- **Mailchimp holds the subscribers.** No Mailchimp data, key or account detail is in this repository, and none may be added. The public repository uses synthetic data only.
- **PPO has no marketing consent.** `contact_preference` is free text with no consent meaning.
- **PPO has notice preferences, which are not marketing.** D-025 R2 gives each contact *Allowed* or *Do not notify* for each service notice class (M1 to M4), for each company, with who recorded it, when and why (`src/communications/preferences.ts`). The accepted People design shows them on a Notices tab.
- **Leads already record a source** channel and details on each manual enquiry.
- **PPO sends no email.** The S2 communications core has a synthetic channel only. ADR-0058 (Accepted) sends customer notices from one shared mailbox; Proposed ADR-0059 sends personal correspondence from each person's own mailbox.
- **Sprout Social, checked in Dean's trial account on 19 October 2026.** At Dean's invitation, a read-only look at Settings › Integrations found ready-made connections for HubSpot, Salesforce, Microsoft Dynamics 365, Zendesk, Slack and others, and a Sprout Public API whose Connect button was unavailable on the trial. Sprout's API documentation says the API reads analytics, messages, listening and cases and creates posts only as drafts, within 60 requests a minute; third-party sources say it needs the Advanced plan. Under Dean's direction this matters less: PPO would publish to the platforms directly.
- **Mailchimp, 19 October 2026.** Dean offered his Mailchimp trial for review. The account Chrome opened showed a declined-payment notice dated 24 May 2025, so it appeared to be an older account rather than the new trial, and the review stopped before any page was read.
- **Unknown:** whether Powerplants uses Pipedrive Campaigns or another marketing add-on (MK-Q10), how many subscribers Mailchimp holds, which social channels the team uses, and the volume of posts and newsletters.

## 4. Options

Prices are in US dollars from third-party summaries checked on 19 October 2026, or from general knowledge where marked, not from vendors' own pages. They are for comparison and must be confirmed before any budget.

### 4.1 Newsletter email

| | A. Integrate Mailchimp | B. Build newsletter sending in PPO (Dean's direction) | C. Replace Mailchimp with another platform | D. No PPO marketing (status quo) |
|---|---|---|---|---|
| What it is | PPO owns consent and audiences and syncs them to Mailchimp; Mailchimp sends and reports back | PPO composes, approves, sends and tracks newsletters through a bulk email delivery service used only as transport | Move to another platform and integrate PPO with it | Mailchimp stays standalone |
| Running cost | Mailchimp's fee continues. Plans are priced by contact count, unsubscribed contacts included; entry paid plans start around US$13 to US$20 a month for 500 contacts | A delivery service is charged per email, at cents per thousand (general knowledge; for example Amazon SES lists about US$0.10 per 1,000). No platform subscription | Another platform's fee | Mailchimp's fee |
| Build cost | Consent, audiences, sync adapter, webhook receiver, engagement import | Everything in A except the sync, plus an email editor and templates, preview and test sends, send queue and throttling, unsubscribe pages and one-click unsubscribe, bounce and complaint processing, suppression, tracking and reports. Several months and permanent upkeep | Like A, plus a subscriber migration | None |
| Deliverability risk | Low; Mailchimp carries it | **Highest.** Mailbox providers require domain authentication, one-click unsubscribe and low complaint rates for bulk mail. Mitigated by MK-R7 to MK-R9: a separate sending subdomain so staff mail is protected, authentication before the first send, a warm-up, and running alongside Mailchimp until the switch-over criteria are met | Depends on the platform; warm history resets | Unchanged |
| Spam Act 2003 | Mailchimp supplies the mechanics; PPO honours its unsubscribes | PPO carries every obligation: consent, sender identification, a working unsubscribe for at least 30 days after each message, honoured within five working days | The new platform supplies the mechanics | Marketing staff carry it in Mailchimp |
| Control and product value | Limited to what Mailchimp exposes | **Full control** of design, operation and integration; reusable if PPO becomes a product | Limited | None |

### 4.2 Social publishing

| | S1. Keep a dedicated tool | S2. Build social publishing into PPO (Dean's direction) | S3. Connect PPO to Sprout Social's API |
|---|---|---|---|
| What PPO does | Records social media as a lead source only | Composes, schedules and publishes posts to the company's own pages; reads back post results; links social enquiries to Leads | Reads Sprout messages and results into PPO; creates draft posts only |
| Running cost | Sprout Social Standard about US$199 a seat a month (annual); Hootsuite Standard about US$99 a user a month (annual); Buffer about US$6 to US$12 a channel a month | No tool subscription. LinkedIn and Meta publishing access is free once approved; X API access is paid | Sprout Social Advanced for every seat, about US$399 a seat a month (annual, third-party figure) |
| Build cost | None | A composer with per-platform previews and media checks, a scheduler and publishing queue, an integration for each platform, token refresh, a results import, and permanent upkeep as the platforms change | An adapter |
| Risk | Low | **Platform approval and change.** LinkedIn requires an approved developer application to post for a company page; Meta requires app review for publishing to Facebook pages and Instagram business accounts. Both change their APIs and policies regularly (general knowledge, to be confirmed in MK-S1). Mitigated by applying first, starting with the channels the team actually uses, and keeping the social tool until PPO publishing is reliable | Plan lock-in; low request limits |
| Control and product value | None | **Full control**; reusable if PPO becomes a product, subject to the approvals in section 10 | Limited |

### 4.3 What the subscriptions cost against the build

For a small team, the fees are roughly US$15 to US$100 a month for Mailchimp and about US$400 a month for two Sprout Social Standard seats, or about US$50 a month for Buffer: about US$5,000 to US$6,000 a year with Sprout Social. Option B still pays a delivery service, but at a small fraction of that. The build and upkeep are the larger cost. Dean has weighed this and chosen control and long-term saving, with possible product income, over the near-term saving of buying the tools (section 1). The staged plan keeps the tools running while each replacement is proven, so the business never relies on an unproven part.

## 5. Proposed decisions

| ID | Proposed decision |
|---|---|
| MK-D1 | **Scope.** A Marketing module built in PPO with six parts: marketing consent; audiences; newsletters (compose, approve, send, results); engagement and attribution on records; social publishing (compose, schedule, publish, results); and a content and campaign calendar. Options B and S2. |
| MK-D2 | **Who owns what.** See the table below. |
| MK-D3 | **Marketing consent is its own record.** One record for each person, email address and sending company: *Not asked* (the default), *Subscribed*, *Unsubscribed*, *Bounced* or *Complained*. Each change records the basis (express, or inferred with a written reason if Powerplants uses inferred consent; MK-Q2), who recorded it, when, how (in person, phone, email, event, PPO unsubscribe page, Mailchimp import) and the wording agreed to, where known. Append-only and versioned, following the notice preference pattern, and separate from D-025 notice preferences: changing one never changes the other. |
| MK-D4 | **Audiences** are saved definitions over PPO data (organisation type and status, site region, crop or segment, installed equipment, deal stage or outcome, aftercare and service agreements). Every audience is intersected with consent and suppression, and shows how many people are eligible and how many are excluded and why. Each send keeps a snapshot of exactly who it went to. |
| MK-D5 | **Newsletters.** A newsletter is composed from approved brand templates (D-024) in a block editor, previewed on desktop and phone, test-sent to staff, then approved by a named person with the marketing approver role before it is queued. PPO sends it through the chosen delivery service from a separate sending subdomain, throttled, with sender identification, a working unsubscribe link and a one-click unsubscribe header in every message. Bounces, complaints and unsubscribes are processed as they arrive and update consent the same day. |
| MK-D6 | **Engagement and attribution.** For each send and person, PPO records delivered, opened, clicked, bounced, complained and unsubscribed, with the event type and time only. Opens are shown as "Opened · may be automatic" where privacy or security software may have caused them, matching the Emails design's tracking wording. People show their newsletters and consent history; Organisations show a summary on the Activity tab; a Lead can name the newsletter or social post it came from. |
| MK-D7 | **Social publishing.** PPO composes a post once, with per-platform text, media and previews, and schedules or publishes it to the connected company pages. Posts are approved by a person before scheduling. PPO reads back each post's results and shows them with the campaign. The first channels are those the team actually uses (MK-Q7); LinkedIn, Facebook and Instagram are assumed until confirmed. Replying to comments and messages (a social inbox), listening and competitor analysis are later stages, not this scope. |
| MK-D8 | **Content and campaign calendar.** One shared calendar of planned newsletters, social posts, campaigns, events, trade shows and launches, each with an owner, channel, date, status (Idea, Planned, In review, Scheduled, Published, Cancelled) and links to the SharePoint asset, the newsletter or the post. |
| MK-D9 | **Switch-over criteria.** Mailchimp is cancelled only when PPO has imported Mailchimp's consent history in full, sent at least three newsletters to real subscribers alongside Mailchimp with delivery, bounce and complaint rates no worse than Mailchimp's, and processed every unsubscribe within the same day. The social tool is cancelled only after PPO has published to each channel on schedule for a full month without a missed post. Dean confirms each cancellation. |

| Data or task | Owner |
|---|---|
| People, organisations, sites, equipment, deals and aftercare | PPO (MYOB stays the ERP authority) |
| Marketing consent and evidence; audiences; newsletters; social posts; engagement; lead attribution; the calendar | PPO |
| Moving email from PPO to recipients' mailboxes | The delivery service, as transport only; it holds no audience or consent of its own beyond its suppression list, which PPO mirrors |
| Publishing to each social network | The network's own API, under the company's own page accounts |
| Brochures, images, videos and other marketing assets | SharePoint, as for all business documents |
| Mailchimp and the social tool | Kept until MK-D9 is met, then cancelled |

### Rules

| ID | Rule |
|---|---|
| MK-R1 | Access to a customer record is never permission to market to anyone on it (BP-01 §9.2). Marketing capabilities are separate from CRM capabilities. |
| MK-R2 | No consent is ever inferred automatically: not from being a contact, a customer, a named recipient, an allowed notice preference, a deal or an exchange of emails. |
| MK-R3 | An unsubscribe, bounce or complaint always wins, and is applied the same day; the Spam Act's five working days is the outside limit, not the target. A person re-subscribes only by giving new express consent, recorded with its evidence. |
| MK-R4 | Withdrawing consent can be recorded by any staff member who can edit the person, and takes effect at once. |
| MK-R5 | Every newsletter send and every social post is approved by a named person before it goes out. Nothing is sent or posted on a trigger. |
| MK-R6 | Marketing email never goes through the ADR-0058 shared mailbox or ADR-0059 personal mailboxes, and never from the company's main mail domain. |
| MK-R7 | Before the first real send: the sending subdomain is authenticated (SPF, DKIM and DMARC) and the delivery service's bulk-sender requirements are met. |
| MK-R8 | New sending starts small and grows (a warm-up), beginning with staff and the most engaged subscribers. |
| MK-R9 | Sending stops automatically for review if bounce or complaint rates pass thresholds set in the sending ADR. |
| MK-R10 | Only the fields a send needs leave PPO. Every send, post, consent change, export and account connection is audited. Real contacts, keys, tokens and account details are never put in this repository; synthetic fixtures only. |

## 6. Pages (proposed scope IDs)

The [page register](app-page-register.md) has 21 module codes and none covers marketing. This proposal suggests a new module code **MK — Marketing** with six scope keys. They are **proposed keys only** and are not added to `docs/design/development/register.json` by this pull request. If Dean accepts, the pull request that draws the first page adds them through `npm run studio:sync`, following [PPO-STD-001](../standards/naming-conventions.md) and the [HTML module conformance](../standards/html-module-conformance.md) rules. No requirement ID is created.

| Proposed scope | Title | Proposed route | r20 page type | Main content |
|---|---|---|---|---|
| `scope:MK-01` | Marketing consent and subscriber register | `/marketing/subscribers` | Register / worklist, with Record detail | Every person with a consent record: state, basis, evidence, sending company, suppression; imported Mailchimp subscribers awaiting a match; record consent and withdrawal |
| `scope:MK-02` | Audiences | `/marketing/audiences` | Register / worklist, with Review / comparison | Audience definitions with eligible and excluded counts and reasons; the snapshot each send used |
| `scope:MK-03` | Newsletters | `/marketing/newsletters` | Form / guided workflow, with Register / worklist | Compose from templates, preview, test-send, approve, schedule and send; delivery, engagement, bounces, complaints and unsubscribes for each send |
| `scope:MK-04` | Social posts | `/marketing/social` | Form / guided workflow, with Planning workspace | Compose once for several channels with per-platform previews, approve, schedule or publish, see the queue and each post's results |
| `scope:MK-05` | Content and campaign calendar | `/marketing/calendar` | Planning workspace | Newsletters, posts, campaigns, events and launches by date, owner and status, with links to assets |
| `scope:MK-06` | Marketing results | `/marketing/results` | Overview / dashboard | Newsletter and social results over time, list growth and loss, and leads attributed to marketing |

Changes to existing pages, not new scopes:
- **People (CS-02):** a Marketing section beside the Notices tab, with consent for each company, its history and evidence, and recent newsletters. It must look clearly different from notice preferences. This amends the accepted design, so it needs Dean's review in Figma.
- **Organisations (CS-01):** a marketing summary on the Activity tab.
- **Leads:** "Newsletter" and "Social" as source channels, with the send or post chosen from MK-03 or MK-04.
- **Settings hub:** the sending domain and its authentication status, the delivery service connection, and the connected social pages, under integrations, in the Settings hub proposed in [PR #612](https://github.com/deanrfiedler-gif/powerplants-one/pull/612).

## 7. Roles and permissions (proposal level)

| Role | Can do |
|---|---|
| Marketing coordinator (the marketing team) | Read the people and organisation fields audiences need; record consent and withdrawals; build audiences; compose newsletters and posts; manage the calendar; see results |
| Marketing approver (marketing lead, or Dean) | Everything above, plus approve each newsletter send and social post, approve exports, and connect or disconnect social pages and the delivery service |
| Sales, service and project staff | See consent and recent marketing on records they can already read; record consent with evidence (MK-Q5); record a withdrawal at any time; choose a newsletter or post as a lead source. Cannot compose, send, post or export |
| Administrator | Set up the sending domain and connections in Settings; holds no marketing data access because of it |

Capability names such as `marketing.read`, `marketing.consent.record`, `marketing.audience.manage`, `marketing.compose`, `marketing.send.approve`, `marketing.social.publish` and `marketing.connection.manage` are illustrative only. No capability, role, grant or seed is added. When one is, AGENTS.md's capability and grant rules apply: the AD-01 access review regeneration and every exact-grant and unchanged-snapshot proof.

## 8. What stays out

- **No automated sending.** No trigger-based journeys, drip sequences or automatic posts; every send and post is approved by a person (MK-R5). This also keeps D-025's rule that a named person sends customer messages.
- No sending in any build stage until that stage is separately authorised, and none to real recipients before MK-R7 is met.
- No social inbox, listening, competitor analysis or paid advertising management in this scope; they are possible later stages.
- No web forms, landing pages, chat or visitor tracking; the lead capture deferral is unchanged. A public subscribe page is a question for later (MK-Q12).
- No purchased lists, enrichment or prospect databases. No SMS marketing. No lead scoring from engagement (r02 "Later").
- No consent inferred automatically (MK-R2).
- Nothing in this pull request builds anything, connects to Mailchimp, a delivery service or a social platform, adds a dependency, or holds a real contact, key or account detail.

## 9. Dependencies

- **ADR-0059, email sending ([PR #611](https://github.com/deanrfiedler-gif/powerplants-one/pull/611), Proposed).** ADR-0059 separates customer notices (shared mailbox) from correspondence (the person's own mailbox). Newsletters are a third path with their own delivery service and sending subdomain (MK-R6); marketing consent is never needed for correspondence or notices, and a marketing unsubscribe never blocks them. ADR-0059 proposes PPO tracking routes for correspondence with privacy rules (event type and time only, 12 months, no IP address). Newsletter tracking should reuse that mechanism and its rules rather than build a second one, so the two should be designed together.
- **People CS-02 and Organisations CS-01.** Both designs are accepted and their builds are in progress. The marketing additions amend them and should be drawn after their builds land.
- **D-025 notice preferences.** Unchanged; MK-D3 reuses their versioned, evidence-carrying pattern without sharing the record.
- **D-024 branding and templates.** Newsletter templates need the brand decisions D-024 holds open.
- **D-020 privacy and D-022 hosting.** Inbound bounce, complaint and unsubscribe events need a public receiver that does not log personal data; the unsubscribe page must work without signing in. Privacy notice wording, retention, and whether the Privacy Act's direct marketing rules apply to Powerplants are for Powerplants to confirm. This record gives no legal view.
- **D-013 Pipedrive parity.** If Pipedrive Campaigns or a similar add-on is in use, its history joins the PAR-17 inventory.

## 10. If PPO becomes a product

Dean mentioned that PPO might later be offered to consumers and businesses by subscription. That would be a separate decision: PPO is a personal private prototype ([ADR-0001](ADR-0001-personal-private-prototype.md)), and this proposal does not change that. Three things are worth knowing now, so the module does not have to be rebuilt later:
- **Design for more than one company.** PPO already keys records by company; consent, audiences, sending domains and social connections should be kept per company from the start.
- **Platform approval is harder for a product.** LinkedIn and Meta review apps that publish for other businesses more strictly than apps a company uses for itself, and may require business verification. An approval won for Powerplants' own use may not cover selling the feature (general knowledge, to be confirmed).
- **Sending for customers needs abuse controls.** A product would need each customer's own authenticated sending domain, limits, and monitoring so one customer cannot harm others' deliverability, and the Spam Act obligations would partly pass to each customer.

## 11. Sequence if accepted

Each step needs its own authorisation. The two tracks can run side by side.

**Newsletter track**
1. **Record edits.** Amend the BP-03 deferral row, BP-01 §9, the PAR-17 entry and the D-025 register note as section 2 sets out.
2. **Designs.** MK-01 and the People marketing section first, then MK-02, MK-03, MK-05 and MK-06.
3. **Consent and register,** synthetic, under AGENTS.md's migration rules.
4. **Mailchimp import,** read-only, of subscribers and opt-in evidence, from an export Dean provides outside the repository or through Mailchimp's API, on his authorisation.
5. **Audiences.**
6. **Sending ADR.** Choose the delivery service, sending subdomain, authentication, throttling, thresholds (MK-R9) and tracking approach, with the ADR-0059 tracking design.
7. **Composer and sender, synthetic,** with a fake transport and recorded responses.
8. **Internal pilot:** sends to staff only, from the authenticated subdomain.
9. **Parallel running** with Mailchimp until MK-D9 is met, then Dean confirms cancellation.

**Social track**
1. **MK-S1, apply first.** Dean, as the company's page administrator, applies for LinkedIn and Meta developer access for Powerplants' own pages. Claude can prepare the application text; it cannot apply. Confirm current requirements then.
2. **Social ADR:** the integration approach, token storage, refresh and failure handling for each platform.
3. **Designs:** MK-04.
4. **Composer and scheduler, synthetic.**
5. **Test-page pilot** on a non-public page or test account for each platform.
6. **Live publishing** alongside the social tool for a month, then Dean confirms cancellation (MK-D9).

## 12. Questions for Dean

| ID | Question | Recommendation |
|---|---|---|
| MK-Q1 | Confirm options B and S2, built in stages, with Mailchimp and the social tool kept until the switch-over criteria (MK-D9) are met? | **Yes.** |
| MK-Q2 | Express consent only, or inferred consent as well (for example from an existing business relationship, which the Spam Act allows)? | **Express only for newsletters.** Record an inferred basis only if Powerplants confirms it relies on it, with a written reason; never automatically. |
| MK-Q3 | One sending identity for each company, or one for everything? | **One for each sending company**, so each message identifies the right sender. |
| MK-Q4 | Import existing Mailchimp subscribers? | **Yes, read-only first.** Match to existing People by exact email; send ambiguous matches to review; hold unmatched subscribers as unlinked rows instead of creating people automatically; keep Mailchimp's opt-in date and source as evidence. |
| MK-Q5 | Who may record consent? | **Anyone who can edit the person, with evidence**; withdrawal by anyone at once; audiences, sends, posts and exports by the marketing roles only. |
| MK-Q6 | How much engagement should sales staff see? | **A summary per newsletter** (delivered, opened, clicked) for 12 months, matching the Emails tracking retention. |
| MK-Q7 | Which social channels does the team use? | **Start with LinkedIn, Facebook and Instagram** if those are the ones in use; add others later. Leave X out at first because its API is paid. |
| MK-Q8 | What sending subdomain should newsletters use? | **A subdomain of the company domain kept only for marketing** (for example `news.` before the domain), so staff mail is never affected. Needs a DNS change by Dean. |
| MK-Q9 | Which social tool for the interim, until PPO publishing is proven? | **Keep whichever the team already uses.** If none, Buffer is the cheapest stop-gap; let the Sprout Social trial lapse unless the team needs it in the meantime. |
| MK-Q10 | Does Powerplants use Pipedrive Campaigns or another marketing add-on today? | Needed for the PAR-17 inventory; no recommendation. |
| MK-Q11 | How long should consent evidence be kept? | **For as long as the consent is relied on, plus a period Powerplants sets** (D-020); engagement events for 12 months. |
| MK-Q12 | Should PPO host a public newsletter subscribe page to replace Mailchimp's signup forms? | **Yes, at switch-over**, as a narrow exception to the lead capture deferral: it records consent only and creates no lead. Decide when the newsletter track reaches step 9. |

## 13. Evidence boundary

- Dean's suggestion and his 19 October direction (quoted in section 1) are user direction. Everything else is Claude's proposed design for his decision.
- Prices and vendor facts come from third-party summaries read on 19 October 2026 and from general knowledge where marked; none was checked against a vendor's own pricing page or a Powerplants account. Platform approval requirements are general knowledge and must be confirmed in MK-S1. The Spam Act points summarise the ACMA's public guidance and are not legal advice.
- Nothing was built, configured or connected. Dean's Sprout Social trial was viewed read-only at his invitation (the Integrations settings page only); nothing was changed, connected or accepted. The Mailchimp account that opened was not reviewed (section 3). No other vendor or social platform account was accessed.
- This is an owner decision paper, so CONTRIBUTING.md requires a review by a different model before merge. That review has not happened.
