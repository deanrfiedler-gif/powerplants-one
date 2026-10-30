---
document_id: PPO-AI05-VOICE-CAPTURE-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 6e939bf0b937fc05f9e477d1cd14f8838c92fd9a
versioning: git
---

# Voice capture AI-05 design — owner decision

On 24 October 2026 Dean asked for the design of the assistant's voice page: "Your task is to design and build the "Voice capture and transcript review (AI-05)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew the page in Figma, covering:
- push-to-talk inside the accepted AI-01 assistant, phone first at 390 and 320, and in the desktop panel at 1440;
- a first-use explanation before the browser's microphone prompt, then recording, the editable transcript, the read-back of names, numbers and dates, fixing a misheard date, and the hand-off to the AI-02 review;
- eleven state cards;
- a proposed later use in My jobs, labelled as not the pilot.

Claude drew the page from these sources:
- the design register page [scope-ai-05](../design/development/pages/scope-ai-05.md);
- the [assistant specification](../blueprints/ppo-assistant-specification.md) §4, §5, §7, §8, §9 (AI2) and §10 (AIA-09, AIA-19);
- the [assistant direction](ppo-assistant-direction.md) (PPO-AI-DEC r03; A2 point 6: no raw audio is stored);
- the [AI and internal communications threads decision](ai-communications-threads-proposal.md) §4 (a microphone in every composer; driving mode rules V1–V8, which wait for a driving policy, Q11);
- the accepted [Assistant AI-01 design](assistant-figma-design.md), whose panel and parts this page reuses;
- the Proposal review AI-02 design (PPO-AI02-PROPOSAL-REVIEW-FIGMA-DEC, accepted 31 October 2026 and in review on deanrfiedler-gif/powerplants-one#782), whose review form this page hands to;
- the [My jobs design](my-jobs-figma-design.md), read only, for the later-use frames.

On 31 October 2026 Dean accepted the design by choosing the offered answer "Accept, as recommended". The question on screen was "Do you accept the AI-05 voice capture design?" The answer was offered as "Proceed with your recommendations: I accept the Voice capture · AI-05 design with D1–D17 and the recommended answers to Q1–Q7. Start the lock-in." That adopts D1–D17 and the recommended answers to Q1–Q7.

Scope:
- `scope:AI-05` "Voice capture and transcript review", destination `/assistant/voice`, shown inside `/assistant` on phones and the assistant panel on desktop. No new scope is added.
- No parent requirement ID is added or renamed; all 78 remain. The design elaborates CRM-02, NFR-03, NFR-08, NFR-09, NFR-10, NFR-11 and NFR-12, as the specification's acceptance table does. Acceptance procedures AIA-09 and AIA-16 to AIA-19 remain Not run.

This is a design decision. It authorises no application code, route, microphone use, speech provider, audio transfer, migration, permission, capability, grant, paid use or deployment. Every record, reference and time shown is synthetic. The speech-to-text service stays "To be decided"; the audio model and its cost need a later dated selection (specification §9).

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the voice capture page AI-05 | User decision, 24 October 2026 | Dean's request quoted above |
| Decisions D1–D17 | Accepted as drawn, 31 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Voice while driving | Resolved as recommended | No hands-free driving mode in AI-05. The explainer and settings say to use voice only when safe, not while driving. The accepted Conversations driving mode (V1–V8) stays a separate, later increment that waits for Powerplants' driving policy (threads Q11) |
| Q2 Duration limit | Resolved as recommended | 2:00 a recording, set by PPO, with a 10-second warning. It stops by itself and keeps the transcript. Revisit after the real-phone trial |
| Q3 Voice notes for technicians after the pilot | Resolved as recommended | Yes, as a later increment once the account-manager pilot is measured, starting with My jobs notes and readings. Not offline. This agrees with Q3 of the Assistant settings AI-06 design (in review on deanrfiedler-gif/powerplants-one#760): field technician after AI2 voice is tested on real phones |
| Q4 Keeping the transcript with the record | Resolved as recommended | No. It is discarded after the review unless the person ticks Keep as a note, which is off by default. The need summary carries the words that matter |
| Q5 Tap to start or hold to talk | Resolved as recommended | Tap to start and tap Stop, which works with gloves, one-handed and with switch access. No hold-to-talk |
| Q6 Real-phone testing | Resolved as recommended | AI2 acceptance on a current iPhone and a current Android phone, with Australian speakers, in a glasshouse with fans running, a ute with the engine on and a plant room. Results recorded per device and condition, apart from browser emulation (AIA-19) |
| Q7 Always showing the read-back | Resolved as recommended | Yes, for every name, number and date in the pilot. Consider skipping fully confident items only after measuring corrections |
| Accept the design | User decision, 31 October 2026 | Quoted above |
| Named Figma version | Saved, 31 October 2026 | "Voice capture — accepted", at Dean's "Yes, save it". Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Voice capture · AI-05" `2394:866287`, under "— My Work —", after Proposal review · AI-02. The page header `2394:866288` holds the conformance declaration; the notes card `2400:8304` in Flows and notes holds D1–D17, Q1–Q7, the flows, what is not drawn and the checks. File index: the row "Row / Voice capture · AI-05" `2915:446552` in the My Work group |
| Phone 390 | Composer with microphone `2395:877680`; first-use explanation `2395:877735`; recording `2395:877802`; transcript with low-confidence words `2395:877895`; read-back `2395:878096`; fixing the date `2396:754`; all checked `2396:815`; AI-02 review `2396:925`; too noisy `2396:1063`; microphone not allowed `2396:1129` |
| Phone 320 | The same ten: `2398:876102`, `2398:876155`, `2398:876248`, `2398:876303`, `2398:876347`, `2398:876391`, `2398:876464`, `2398:876508`, `2398:876564`, `2398:876618` |
| Desktop 1440 | Panel with the microphone `2398:879932`; first-use explanation `2398:880396`; recording `2398:880898`; transcript and read-back `2398:881392`; AI-02 review, full length (1440 × 2749) `2398:882044`, a copy of AI-02 `2393:747` carrying the voice values |
| States | Eleven panel-width cards in section "States": microphone not allowed `2398:891242`; 8 seconds left `2398:891308`; processing `2398:891394`; transcript ready, with Keep as a note `2398:891460`; low confidence `2398:891524`; over the limit `2398:891597`; network lost `2398:891675`; budget reached `2398:891747`; cancelled `2398:891821`; Voice settings rows `2398:891880`; keyboard and screen reader `2398:891954` |
| Proposed later use | Section "Proposed later use · not the pilot": dictating a reading note `2398:893370`; note dictated, number read back `2398:893608`. They use the My jobs Add a reading sheet. They are recorded as the Q3 direction, not as pilot scope |
| Components | Moved at acceptance to the Components page, section "Components · Assistant" `2388:6065`, keeping their node IDs and instances: AI-05 / Microphone button `2394:866397`; Recording indicator `2394:866590`; Readback item `2394:872249`; Readback card `2394:872250`; Transcript `2394:872412`; Voice permission `2394:872497`; Voice notice `2394:872574`; Composer · voice `2394:872653`. Seven Font Awesome Light icons moved to "Components · Icons": microphone `2394:866360`, microphone-slash `2394:866363`, stop `2394:866366`, waveform-lines `2394:866369`, wifi-slash `2394:866372`, hourglass-end `2394:866375`, steering-wheel `2394:866378` |
| Prototype | Flows "AI-05 — phone" (from the composer) and "AI-05 — desktop" (from the panel), with no links off the page. Microphone → first use → Allow microphone → recording → Stop and check → transcript → read-back → Fix → Use Wed 21 Oct 2026 → all checked → Continue to review → AI-02 review. Not now and Cancel return to the composer; Too noisy offers Try again and Type instead. On desktop the read-back card stands in for "after the checks" and goes to the AI-02 review |
| Story | Synthetic, Tue 13 Oct 2026, signed in as Jamie Park, account manager, leaving Hillview Growers SYN-PPO-ORG-000007. Spoken at 09:04 for 0:21: "Create an opportunity for Hillview Growers to extend climate screens to Glasshouse five. Assign it to me. I spoke to the head grower. Follow up on the twenty-first at nine." The transcript hears "Glasshouse 5" correctly but "the twenty-first" as "the 1st", which reads back as Sun 1 Nov 2026 and Not sure. Jamie fixes it to Wed 21 Oct 2026. "Nine" reads back as 9:00 am AEST and reaches the review as 09:00 AEST. AI-02's draft is prepared at 09:06. Priya Shah is Hillview's recorded grower; Glasshouse 5 is not a recorded site. No new reference is introduced; the later-use frames keep WO-000040 as My jobs draws it |
| Retained captures | [Voice capture design r01](../reference/ui/my-work/voice-capture-design-r01/README.md): nine icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:AI-05` Voice capture and transcript review. AI2 of PPO-AI-SPEC §9. No new scope; parent requirement IDs unchanged; capabilities unchanged |
| Page type (r20) | Form / guided workflow, inside the AI-01 assistant surface (Work queue + persistent detail variant on desktop, full screen on phones), with Review / comparison for the read-back |
| Reused components | AI-01: Panel header, Scope chip, Composer (unchanged, inside the voice composer), Conversations / Avatar, and its frames as bases. AI-02: Review field and Provenance tag. Shell / Phone header · compact, the top bar with the Conversations action, Rail · Sales, Button, Tag, Record / Banner. The My jobs Add a reading sheet in the later-use frames only. New: the eight components and seven icons in section 2 |
| Incoming handovers | From AI-01: the open assistant, its scope chip, provider state and budget. From the browser: microphone permission (not asked, allowed or blocked). From My account › Assistant (SH-03, proposed rows only): voice on or off. Read only; nothing here changes a record |
| Outgoing handovers | To AI-02: the checked transcript and confirmed values, as the request Carl prepares the draft from; AI-02 owns the review and Create opportunity. To a speech-to-text service, to be decided: the one recording, after Stop, deleted when the text returns. Never: stored audio, continuous or background listening, a spoken confirmation, or a save without the AI-02 review |
| Source authority | The decisions and specification listed above. Carl's drafts are proposals, never authority |
| Proposed departures | Seven, accepted: marked in section 4 |
| Status | Owner-accepted design, 31 October 2026 |
| Decision record | This file |
| Named version | "Voice capture — accepted", saved 31 October 2026 |

## 4. What the design shows

| ID | Decision | Basis |
|---|---|---|
| D1 | Push-to-talk only. Tap the microphone to start; Stop and check or Cancel ends it, and it stops by itself at 2:00. No wake word, no background or continuous listening, no hold-to-talk | Specification §9 AI2; threads §4 |
| D2 | The AI-01 composer is unchanged; a 48 px (phone) or 44 px (desktop) microphone sits to its left. Typing always works. **Departure:** AI-01 left voice out | AI2; specification §4; AIA-19 |
| D3 | First use explains what is sent, that audio is not kept, the 2:00 limit and budget, and not while driving, before the browser asks. Not now keeps typing | AI2; A2 point 6 |
| D4 | "Recording" in words with a dot, elapsed against 2:00, a progress bar, a level meter with words, Cancel and Stop and check at 56 px. Typing pauses while recording. **Departure:** the recorder replaces the composer | AI2 |
| D5 | One recording is sent after Stop to a speech-to-text service (to be decided) and deleted when the text returns. Nothing is queued offline | A2 point 6; specification §7, §9 |
| D6 | A 16 px editable transcript. Low-confidence words are underlined, in medium weight and named under the box, never colour alone. Record again is offered | AI2 |
| D7 | Names, numbers and dates, each with Confirm or Fix. Continue to review unlocks only when all are checked, with the reason in words. Numbers show digits and what was heard. **Departure:** a read-back step between the transcript and AI-02 | AI2; AIA-09 |
| D8 | Dates show weekday, day, month and year; times show am or pm with the zone. An unclear date is Not sure. **Departure:** Fix offers the other ways it could have been said, beside a date field | Specification §5; AIA-09 |
| D9 | Carl prepares the draft from the checked text, marked Your request. Source channel stays Needs input, because talking to Carl isn't the source. Create is never spoken, and the confirmation stays on screen. **Departure:** the AI-02 draft carries the time when the request gives one; AI-02's own frames show a date-only request | Specification §5, §7; AI2 |
| D10 | Problems say what happened and what still works: too noisy, over the limit (transcript kept), network lost (not sent, nothing saved), budget reached (paused until 1 November, as AI-01), microphone off (typing works), cancelled | AIA-16, AIA-17 |
| D11 | A recording reserves budget before it starts; if that fails it doesn't start. Audio is counted separately | Specification §8 |
| D12 | Settings show the speech-to-text service as To be decided. No named product anywhere | Specification §9 |
| D13 | The transcript is discarded after the review unless the person ticks Keep as a note. **Departure:** proposed Voice rows for My account › Assistant, drawn on this page only | Specification §7; Q4 |
| D14 | The explainer and settings say not while driving. AI-05 has no hands-free driving mode | Threads V8 and Q11; Q1 |
| D15 | Tab order, Enter or Space starts, Esc cancels, polite one-off announcements, labelled Confirm and Fix, 200% zoom. These are drawn as rules on a state card, not as focus frames | AIA-19; specification §4 |
| D16 | At 320 the recorder's buttons stack and the scope chip takes its own line, as on AI-01's 320 frames | AI-01 |
| D17 | A technician dictates a reading note in My jobs; numbers and units are read back; voice needs signal, so it is unavailable offline; Save reading stays My jobs' own. **Departure:** a proposed later use, not the pilot | Threads §4; Q3 |

## 5. Not decided and not drawn

Building the page is not decided. The speech-to-text service, its model, cost, data handling and processing location are not chosen; they need their own dated selection and an architecture decision. Powerplants' driving policy is still open (threads Q11), and the Conversations driving mode is not part of this design.

Not drawn: tablet 1024, which follows AI-01's full-width surface; live captions while recording, because text arrives after Stop; a frame for the level meter's "Too quiet" words; the My account page itself; the AI-02 phone review beyond the follow-up section, which AI-02 owns; focus-order frames and 200% zoom frames.

## 6. Alignment made at lock-in

The hand-off frames `2398:882044`, `2396:925` and `2398:876508` were drawn on 24 October from AI-02 as it then stood. AI-02's accepted polish changed that source, so these frames were aligned on 31 October before the captures were taken:
- on desktop, the source basis no longer gives a call date Jamie never stated; it reads "Jamie Park spoke to Priya Shah, head grower.";
- on desktop, two character counts were corrected (need summary 83, follow-up summary 68);
- on all three, the due time reads 09:00 AEST, the form AI-02's Ready frame uses, and the "What Create opportunity will do" list follows. The read-back keeps 9:00 am AEST (D8), because that is where a person checks what they said.

This is text only and changes no accepted decision. No other page was edited: AI-01 and AI-02 keep their own frames and captures.

## 7. Verification

- The audit when the page was drawn found all visible text in Roboto, no text clipped after one fix to the 320 recorder, no overlaps, nothing outside its section, phone buttons of 44 px or more, record and stop at 56 px, phone inputs at 16 px, status always in words, no named speech product, and 23 prototype links, none off the page. Fourteen copied off-page links were removed.
- Moving the eight parts and seven icons left the eight parts' instance counts unchanged (22, 4, 44, 9, 12, 3, 8 and 16). A screenshot after the move showed button labels intact.
- The nine captures are copies on the "Captures (icon-free)" page at y = 1,040,000 (`2915:449092`, `2915:449798`, `2915:450555`, `2915:451299`, `2915:452144`, `2915:453175`, `2915:454819`, `2915:456466`, `2915:457183`). 1,115 Font Awesome instances were swapped for `Icon/placeholder`, a scan found none left, and prototype links were cleared from each copy.
- The captures were exported at scale 1 with the Figma connector. The hashes are in the [captures README](../reference/ui/my-work/voice-capture-design-r01/README.md). Image 06 was re-laid in two rows after its first export hit Figma's 4,096 px limit.
- The named Figma version "Voice capture — accepted" was saved in the Figma desktop app on 31 October 2026 at Dean's "Yes, save it", in answer to "Shall I save the named version "Voice capture — accepted" in Figma?", and confirmed at the top of version history. The page header and File index row were updated first, so the version carries the accepted wording.
- Claude viewed the phone 390 composite and the File index row after the move, and each frame group when it was drawn. Claude did not play the flows in Present mode.
- Nothing is built, so there is no application, microphone, device, Australian-speech, noisy-condition or screen-reader evidence. Q6 sets that test plan; none of it has been run. The captures are design compositions, not application captures, and set no UI baseline.
