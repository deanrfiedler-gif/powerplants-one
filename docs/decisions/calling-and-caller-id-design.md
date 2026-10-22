---
document_id: PPO-CALLS-CALLER-ID-PROP
title: Calling, caller ID and call logging, design paper
date: 2026-10-23
owner: Dean Fiedler
status: Direction accepted by the owner 23 October 2026; Q1–Q12 await his decision; nothing is built, and no route, migration, capability, dependency, provider connection or app-store listing is authorised by this record
versioning: git
---

# Calling, caller ID and call logging, design paper

**Owner:** Dean Fiedler. **State:** Direction accepted by the owner, 23 October 2026: "Proceed: write the calling spec and the native app ADR on the recommended basis, and start with stage 1." That acceptance covers the shape in section 3 and the stage order in section 7. The detailed rules in sections 4–6 are proposed, and Q1–Q12 in section 8 carry recommended answers that wait for his decision. Each stage still needs its own authorisation and its own pull requests.

**Raised by:** Dean, 23 October 2026: "The Pipedrive CRM platform has a feature that allows it to connect to the users phone, contacts, etc., for making calls. For example, if someone calls the users mobile file, it will show that it is a Pipedrive contact, along with the details of the contact. After the call is finished, the user can then record the activity, notes relating to the call, and schedule the next activity. I want to make sure we include a feature like this in the Powerplants One app."

He then gave these facts and goals:

- Staff take customer calls on company iPhones, company Android phones and personal mobiles, and the business uses Microsoft Teams Phone for office numbers. Most customer calls go straight to staff mobiles.
- "Once the Powerplants App is completed, I may make another version of it that can then be used by other consumers based on a subscription model, similar to what Pipedrive does."
- He asked whether PPO itself could be the phone app rather than a separate companion: "could we simply make the Powerplants One app the core app, similar to what Pipedrive does?"

**Related:**
- Requirements: CRM-03 (link calls, meetings, emails, notes, documents and tasks to records), CRM-02 (next actions), CRM-08 and PAR-05 (preserve the Pipedrive capabilities in use, including calls). NFR-01 (server authorisation), NFR-02 (audit), NFR-03 (information on devices), NFR-05 (visible outages), NFR-08 (accessible workflows), NFR-09 (no duplicate commands). No parent requirement ID is added or renamed.
- Decisions: D-020 (identity, permissions and privacy), D-012 (retention), [ADR-0032](ADR-0032-mobile-installation.md) (installable web app), [ADR-0063](ADR-0063-native-phone-app.md) (the native phone app, proposed with this paper), [ADR-0059](ADR-0059-email-sending-from-ppo.md) (Microsoft tenant still unverified, point 7).
- Reference: [CRM feature report r02, section 10](../reference/crm-feature-report-r02.md) ("Do not mark a call completed merely because a telephone link was opened").
- Scopes: My Work (`/work`), People (`scope:CS-02`), Organisations, Leads, Deals (`scope:CR-01`), Sites and the Conversations context panel. Stage 1 adds no route, so it needs no new scope ID.

Everything below is a PPO design proposal. Pipedrive is a reference for the feature only; PPO does not copy its screens or wording.

## 1. What PPO has today

- **Call is already an activity type.** `activity_type` includes `Call`. Completing an activity records an outcome, and the **Record outcome** dialog in My Work can plan the next activity, including a deal's or lead's next action through its own command (`src/activities/components/client/my-work-dialogs.tsx`).
- **One free-text phone number per person.** `ppo.people.phone` is unvalidated text (migration 0002). Organisations have no phone number, and leads keep their own contact phone. The synthetic seed holds no phone numbers.
- **Six separate `tel:` links.** The people register, the CRM directory, the customer workspace, the site workspace, the Conversations context panel and My Work each build their own `tel:` link by stripping characters. Nothing is recorded when one is tapped.
- **PPO is a web app.** On phones it installs as a home-screen web app (ADR-0032). No web app can see incoming phone calls, on any phone.
- **No phone system is connected.** The Microsoft tenant, licences and consent are unverified (ADR-0059 point 7).

## 2. How Pipedrive does it, and what phones allow

Pipedrive's caller ID and call logging come from its native phone apps, not from its website ([Pipedrive help](https://support.pipedrive.com/en/article/calling-and-logging-calls-in-the-mobile-app)).

| | Android | iPhone |
|---|---|---|
| Shown on an incoming call | Contact, organisation and deal | Contact name only |
| How | The app is set as the phone's "caller ID and spam" app | A Call Directory label; numbers must include a country code |
| Calls that prompt for logging | Incoming calls from contacts, outgoing calls placed in the app, and outgoing calls placed outside it, each with its own setting | Only outgoing calls placed from the app |
| What is logged | The activity details | The activity, notes and a follow-up activity |

These are operating-system limits, so PPO will meet the same ones. In particular, **no app can prompt after an incoming call on an iPhone.** Pipedrive also logs only numbers held in a contact's phone field, and a Pipedrive community thread reports that Android caller ID did not appear while the phone was locked.

## 3. The accepted shape

1. **Desktop stays a web app.** Office users keep working in the browser.
2. **One native "Powerplants One" phone app** shows the existing PPO screens inside, and adds native code only where the phone requires it: caller ID and call-end prompts now, and push notifications and better offline later. There is no separate companion app. [ADR-0063](ADR-0063-native-phone-app.md) records this.
3. **A call core in PPO that works with any phone system.** It owns phone numbers, number lookup, call events, the Log call sheet and the Calls to log list. Every source of calls plugs into it through one interface.
4. **Phone-system connectors**, starting with Teams Phone. Other systems can follow without changing the core.

The core is written for any company that might use PPO. It assumes nothing about Powerplants' own Microsoft setup, country or phone system, which keeps a later subscription version open without building it now. Multi-company accounts, billing and onboarding are a separate product-direction decision (section 7, stage 4).

**Not included:** call recording, transcription and AI call summaries. Each carries consent and privacy obligations, and each would need its own decision.

## 4. Rules every stage must keep

- **R1. Opening a phone link never completes anything.** A call becomes a completed Call activity only when a person saves it in the Log call sheet. The CRM feature report requires this.
- **R2. A person decides.** Every call event ends in one of two ways: someone logs it, or someone skips it. Calls are never logged automatically, and never disappear without trace.
- **R3. Unknown numbers stay private.** A call from or to a number that matches no PPO record the user may see is never stored by PPO, on the phone or on the server. Personal calls on a company or personal phone therefore never reach PPO. A person can still choose to log a call with an unknown number by entering it themselves.
- **R4. Access is checked on the server.** Number lookup returns only records the user is permitted to read, and it uses the same company and scope rules as the rest of PPO (NFR-01). A match the user may not see behaves as no match.
- **R5. Ambiguity is shown, not guessed.** A number held by more than one person or organisation, such as a shared office line, returns every permitted match. The person chooses which one to log against, and PPO never picks for them.
- **R6. Numbers are kept as entered and in a standard form.** PPO keeps the text a person typed and an international form (E.164, such as +61 4xx xxx xxx) beside it. A number that cannot be read is kept as typed and flagged **Number needs checking**. It is never discarded or silently corrected.
- **R7. Device data is the minimum, and removable.** A phone holds only what caller ID needs (section 6.2). It is cleared on sign-out and when access is withdrawn, at the next sync.
- **R8. One call, one event.** A call reported twice, such as by the phone app and by Teams, or by a retried request, is recorded once. Events carry a source and an external reference that make retries harmless (NFR-09).
- **R9. Outages are visible.** A connector that is failing or disconnected says so where calls are logged. Calls to log never claims to be complete when a source is down (NFR-05).

## 5. Stage 1: the call core on the web

Stage 1 is useful on its own, on any device, and every later stage builds on it.

### 5.1 Phone numbers

- **Several numbers for each person** (Q1), each with a label (**Mobile**, **Work**, **Home** or **Other**) and one marked primary. The existing `people.phone` value moves across as the primary number, labelled **Other**, with its text unchanged.
- **Main numbers for organisations** (Q2), such as reception, with the same labels.
- Each number keeps the entered text, the E.164 form or a **Number needs checking** flag (R6), and the country used to read it.
- **Country:** a number written without a country code is read using the company's country, which is Australia for Powerplants companies (Q9). Nothing hard-codes +61.
- **Reading numbers** uses a maintained phone-number library rather than PPO's own rules (Q7). Adding it is a new dependency, which stage 1 records in its own ADR before use.
- Leads keep their contact phone, which is read the same way so that lead contacts can be matched too.

### 5.2 Number lookup

A server read takes an E.164 number and returns, for the signed-in user:

- each permitted person and organisation that holds it (R4, R5);
- for each, the open deals, leads and projects linked to them that the user may read;
- the last completed activity and the next planned activity.

It reads only. It writes no event and creates no activity. The phone app (stage 2) and connectors (stage 3) use the same read.

### 5.3 Call events and Calls to log

A **call event** is the fact that a call happened, reported by a source. It is not an activity.

- **Fields:** source (**Click to call**, **Phone app** or **Teams**), the source's own reference (R8), direction (**Outgoing** or **Incoming**), the user it belongs to, the matched number, start time, whether it was answered (yes, no or unknown) and duration when known.
- **States:** **To log**, **Logged** (with the activity it became) or **Skipped** (with an optional reason: **Personal**, **Not business** or **Already logged**).
- **Calls to log** is a section of My Work listing the user's own events in **To log** (Q4), newest first, with person, organisation, number, time, direction and duration. Each has **Log** and **Skip**. The My Work summary strip counts them.
- **Retention:** skipped events are deleted after 30 days. A logged event keeps only its link to the activity, which follows activity retention under D-012 (Q5).

### 5.4 Click to call

One shared **Call** control replaces the six separate `tel:` links. When it is tapped:

1. PPO records a **Click to call** event (Outgoing, answered unknown) for the matched person or organisation.
2. It opens the `tel:` link. On a phone, the dialler opens. On a desktop, the computer's own calling app opens, such as Teams or Phone Link, if one is set up.
3. When the person comes back to PPO within two hours, the **Log call** sheet opens with the event filled in (Q8). If they close it, the event stays in Calls to log.

Opening the link never logs or completes the call (R1).

### 5.5 Log call sheet

The Log call sheet is reached from a call event, from the Call control, and from a **Log a call** action on person, organisation, lead, deal and project pages and in My Work. It builds on the existing Record outcome pattern rather than replacing it.

- **Who:** the person, filled in from context or the event, or found by name or number. Where a number has several matches, all are shown (R5).
- **Linked to:** suggested open deals, leads and projects from the lookup. The person can change them.
- **Call:** direction, result (**Connected**, **No answer**, **Left voicemail**, **Busy** or **Wrong number**, Q6), time and duration, filled in from the event where known.
- **Outcome and notes:** outcome presets plus free text, as in Record outcome.
- **Next activity:** "Plan the next activity", on by default for deals and leads. It uses the parent's own next-action command, as Record outcome already does.
- **Saving** creates one completed Call activity with these details and links, and marks the event **Logged**, in one command. When the next activity fails after the call has saved, the sheet says so and keeps the entries for a retry, as Record outcome already does.
- **Wrong number** offers to flag the number as **Number needs checking** on the person or organisation. It never deletes the number.

### 5.6 Permissions

- Logging a call uses the existing activity create and edit permissions for the linked records. Stage 1 adds no capability, so the access-review contract is unchanged.
- A user sees and acts on only their own call events. A manager view is not part of stage 1 (Q4).
- Every Log, Skip and number change is audited with actor, time and reason (NFR-02).

### 5.7 Design and evidence

- **Figma first.** These are drawn in the PPO - Design file and accepted before they are built:
  - the Log call sheet, as a desktop dialog and a phone full-screen sheet;
  - the Calls to log section in My Work;
  - the Call control and its states;
  - the phone numbers editor on person and organisation pages.
- **Register at build time.** The Call control and Log call sheet become shared components in `docs/design/development/components.json`, with their consumer bindings.
- **What must be proven:**
  - number reading for Australian mobile, landline and 13/1300/1800 numbers, international numbers and unreadable text;
  - lookup that refuses records the user may not read, including other companies' records;
  - several matches for one number;
  - one event from a retried request;
  - Log and Skip, and a next-activity failure after the call saves;
  - the return-to-PPO prompt;
  - keyboard and screen-reader use of the sheet;
  - the upgrade path for existing `people.phone` values, with every migration-test duty in `AGENTS.md`.

## 6. Later stages, in outline

### 6.1 Stage 2: the native phone app

[ADR-0063](ADR-0063-native-phone-app.md) records the app itself. For calling it adds:

- **Android:**
  - With the user's consent, PPO becomes the phone's caller ID and spam app. An incoming call from a matched number shows the person, organisation and one open deal or project in a notification.
  - When an answered or missed call from a matched number ends, and when an outgoing call to one ends, a call event is created and the Log call sheet is offered.
  - Each kind of call has its own setting, as in Pipedrive.
- **iPhone:**
  - A Call Directory extension labels incoming calls as "Name · Organisation".
  - Calls placed from the app create a call event and offer the Log call sheet when the call ends.
  - Incoming calls cannot prompt (section 2). They can be logged by hand from **Log a call**.
- **Matching happens on the phone.** An incoming call must be identified in a few seconds, often without a reliable connection. So the phone keeps a small directory of the numbers the user may see and matches against it locally (R3), rather than calling the server for each call.

### 6.2 What the phone holds

- **What is stored** (Q11): for each matched number, the person's name, organisation and at most one open deal or project title. Nothing else: no notes, values, emails or activity history.
- **Where:** on iPhone, only the "Name · Organisation" label, which Apple's directory holds. On Android, an encrypted store inside the app.
- **Which records:** only records the user may read (R4).
- **Kept current and removed:** it refreshes in the background and on opening the app. It is cleared on sign-out, and withdrawn access takes effect at the next refresh (R7).

### 6.3 Stage 3: Teams Phone connector

- **What it does:** Teams calls are reported after they end. The connector matches each call's other party, keeps matched calls for users who have turned the connector on, discards the rest (R3), and creates call events through the same interface.
- **Before it starts:**
  - The IT contractor must confirm the tenant, the Teams Phone licences and who can grant admin consent.
  - The exact Microsoft Graph call-record resources and permissions are confirmed against that tenant. The likely permission is tenant-wide, so its scope and the discard rule need a security review.
  - It starts with a mocked adapter and synthetic calls, like the other Microsoft connectors (Q12).
- **Where it is managed:** connection health and on/off sit in the Settings hub (AD-02). Each user's own on/off sits in My account.

### 6.4 Stage 4: subscription readiness

This is a product-direction decision about a version of PPO sold to other businesses: multi-company accounts, billing, onboarding, store listing, terms and a privacy policy. It is recorded on its own when Dean is ready. Stages 1–3 are designed not to block it, and none of them builds it.

## 7. Stages and order

| Stage | Delivers | Depends on | Each needs |
|---|---|---|---|
| 1a | Figma proposal: Log call sheet, Calls to log, Call control, numbers editor | This paper | Dean's acceptance, named version, lock-in |
| 1b | Server: numbers, lookup, call events, Log and Skip commands, audit, tests | Q1–Q9; migration reservation; phone-number library ADR | Draft PR, second-model review (migration) |
| 1c | Web UI built to the accepted design; the six `tel:` links replaced | 1a accepted, 1b merged | Design register update, desktop and phone evidence |
| 2 | Native app (ADR-0063) with Android and iPhone caller ID and logging | Stage 1; ADR-0063 accepted; developer accounts | Spike first; physical-device acceptance |
| 3 | Teams Phone connector | Stage 1; tenant confirmed by the IT contractor | Security review; mocked first |
| 4 | Subscription-readiness decision | Dean's timing | Its own decision record |

Stages 1a and 1b can run at the same time because they touch different files. Stage 1c waits for both.

## 8. Questions for Dean, with recommended answers

| # | Question | Recommended answer |
|---|---|---|
| Q1 | Can a person have several numbers? | **Yes.** Labels Mobile, Work, Home and Other, with one primary. The existing number moves across as primary, labelled Other, unchanged. |
| Q2 | Do organisations get main numbers? | **Yes**, so calls from reception lines are recognised. |
| Q3 | What happens to calls with unknown numbers? | **Never stored** (R3). A person can still log one by hand. |
| Q4 | Who sees Calls to log? | **Only the user it belongs to.** No manager view in stage 1. |
| Q5 | How long are skipped and logged events kept? | **Skipped: deleted after 30 days.** Logged: only the link to the activity is kept, and the activity follows D-012. |
| Q6 | Which call results? | **Connected, No answer, Left voicemail, Busy, Wrong number.** |
| Q7 | How are numbers read? | **A maintained phone-number library** (such as libphonenumber-js), with its own ADR in stage 1b. Writing PPO's own rules would not cope with every country a later subscription version would need. |
| Q8 | When does the Log call sheet open after click to call? | **When the person returns to PPO within two hours.** After that, the call waits in Calls to log. |
| Q9 | Which country is assumed for numbers without a code? | **The company's country**, Australia for Powerplants companies. |
| Q10 | Which wrapper technology for the phone app? | **Capacitor**, confirmed by the stage 2 spike (ADR-0063). |
| Q11 | What does the phone hold for caller ID? | **Name, organisation and at most one open deal or project title**, for readable records only. On iPhone only "Name · Organisation". Cleared on sign-out. |
| Q12 | When does the Teams connector start? | **After the IT contractor confirms the tenant**, with a mocked adapter first and a security review of the Graph permission. |

## 9. Limits of this record

This paper sets direction and proposed rules only. It does not:
- show that Teams call records expose the numbers PPO needs;
- show that Apple or Google will accept the app (ADR-0063 covers that risk);
- show that Android caller ID works with the phone locked on every model;
- show that the IT contractor can grant the consent the connectors need.

Those are proven in their stages. Nothing here is a production integration, a business transaction or customer communication, and code delivery stays separate from business approval.
