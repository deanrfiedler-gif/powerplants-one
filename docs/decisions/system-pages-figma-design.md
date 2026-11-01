---
document_id: PPO-SYSTEM-PAGES-FIGMA-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design; named Figma version saved; Request access and ideas I1-I6 outside the baseline; building the pages separate
source_commit: 1fc002978ee2a6871121d9252609a49c6dc31b9a
versioning: git
---

# System pages design — owner decision

On 31 October 2026 Dean asked Claude "to design and build PPO's system pages in Figma: sign-in, signed out, session expired, access denied, page not found, error, and the uncertain-outcome pattern, as a proposal for my review. Draw the frames; do not stop at a written brief." Claude drew the page and asked whether he accepted it. Dean then asked: "Give the pages an audit and polish", covering improvements, new and innovative features, professionalism and gaps. Claude applied the audit and asked: "Do you accept System pages with the recommended answers, including Q11–Q13?" On 1 November 2026 Dean answered: "Accept recommendations".

Claude drew the page from these sources:
- the [login r02 integration](login-r02-integration.md) and the maintained template in `src/login/` (`login.html`, `login.css`, `login.js`, `login-page.ts`);
- `src/app/not-found.tsx`, `src/app/error.tsx`, `src/app/loading.tsx` and `src/components/session-view-boundary.tsx`;
- the [desktop shell](desktop-shell-integration.md) and [application shell](application-shell-integration.md) records;
- the [Users and access design](users-and-access-figma-design.md) and [access-change requests](access-change-requests.md);
- [ADR-0013](ADR-0013-p08-offline-recovery.md) and the [offline recovery acceptance](offline-recovery-acceptance.md);
- the uncertain-outcome wording in the application and on the accepted Workshop builds, Receiving and Quotation release pages;
- [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

`Powerplants-One-Login-r02.html`, named in the brief, is not in the repository. The login decision records only its hash, so `src/login/` is the source that was redrawn. Portal home & access `2105:659722` was read and not changed.

Scope:
- `system:shell`, `route:/login` and `route:/`, as the scope ID mapping (PPO-UI-SCOPE-ID-MAPPING-DEC, draft PR #823) assigns. No new scope ID.
- `src/app/not-found.tsx` and `src/app/error.tsx` have no route or scope ID of their own, and none is created.
- Parent coverage is unchanged: BP-01 section 8.2 shared identity and navigation, and NFR-01–NFR-12. No parent ID is added, renamed or marked complete.

This is a design decision. It authorises no application code, route, read model, migration, capability, grant, seed or deployment, and it changes no hosted authority or tenant setting.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Accept the design | User decision, 1 November 2026 | "Accept recommendations", answering the question quoted above. Every recommended answer below is adopted on those words |
| Audit and polish before acceptance | User decision, 31 October 2026 | Quoted above. Section 6 |
| D1–D13 | Claude's proposals, accepted with the design | Section 4 |
| Q1 Should the error page offer "Report this problem"? | Resolved as recommended | Not yet. It has nowhere to send a report: no support address is invented, and Support requests CP-02 is the customer portal. The reference and "give this reference to your administrator" cover it |
| Q2 Is a maintenance page wanted for the hosted demo? | Resolved as recommended | No. No code or hosting decision supports one, and a hosted outage already shows "Sign-in is temporarily unavailable" (`src/platform/demo-gateway.ts`, HTTP 503) |
| Q3 Should Request access go to the manager or to administrators? | Resolved as recommended | Administrators. They hold `admin.access.propose`, and AD-01 has no manager role. "Ask your manager" stays as the fallback, as in the sign-in help |
| Q4 Keep the not-found wording? | Resolved as recommended | Yes, unchanged. It deliberately does not separate missing from no access |
| Q5 Adopt one uncertain-outcome wording? | Resolved as recommended | Yes: heading "Outcome unknown", actions "Check the outcome" and "Retry the same action" (D13). External sends keep their own wording |
| Q6 Adopt the signed-out notice and expired-attempt wording? | Resolved as recommended | Yes to both. Each needs one more presentation state on the login page, and neither establishes identity |
| Q7 Build Request access at all? | Resolved as recommended | Not with this page. Start with who to ask, then decide the self-request rule under AD-01, together with the Request access action Conversations T6 plans |
| Q8 Name the administrator, or say "your administrator"? | Resolved as recommended | Name them once a small read exists. Until then "your Powerplants One administrator", as sign-in says. The frames show the named version |
| Q9 Where does sign-in go after an expired session? | Resolved as recommended | The fixed destination stays. The [login register page](../design/development/pages/route-login.md) said "Return to the requested page"; this change corrects it |
| Q10 Should staff and portal expiry words match? | Resolved as recommended | No change now. The portal says "You've been signed out… Anything you hadn't sent was not saved." The portal page is untouched and the difference is recorded here |
| Q11 Replace two pieces of built jargon? | Resolved as recommended | Yes. "Refresh your identity context" becomes "Your session changed in another tab", and "This identity cannot read this record, or it does not exist." becomes "You can't open this record, or it doesn't exist." The frames show the new words; the application keeps the built words until built |
| Q12 Change the skip-link focus ring on navy? | Resolved as recommended | Yes, white on navy (D12). `#3b6b99` measures 2.57:1 against the navy panel, below the 3:1 needed for focus |
| Q13 Which ideas go forward? | Resolved as recommended | I1–I4 as proposals, I5 and I6 later. None is part of the accepted baseline (section 5) |
| Named version | Saved by Dean, 1 November 2026 | Section 7 |
| Building the pages | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "System pages" `3031:776966`, under the "— System —" divider after the amendment pages. The page header `3031:776967` holds the conformance declaration; the notes card `3040:2953` holds D1–D13, Q1–Q13, ideas I1–I6, the wording comparison and the behaviour table. File index row `3098:5075` |
| Desktop 1440 | Sign-in `3036:30461`; signing in `3036:30573`; expired attempt, built wording `3036:30675`; uninvited account `3036:30803`; session expired `3036:30931`; signed out `3036:31059`; page unavailable `3036:35757`; workspace access denied `3036:36003`; error `3036:36249` |
| Tablet 1024 | The same nine: `3036:30517`, `3036:30624`, `3036:30739`, `3036:30867`, `3036:30995`, `3036:31123`, `3036:35880`, `3036:36126`, `3036:36372` |
| Phone 390 | Sign-in `3036:37683`; session expired `3036:37728`; page unavailable `3036:37781`; error `3036:37853`; signing in `3043:3705`; uninvited account `3043:3745`; signed out `3043:3798`; workspace access denied `3043:3851`; help `3043:4027` |
| Phone 320 | Sign-in `3036:37925`; session expired `3036:37970`; page unavailable `3036:38023`; error `3036:38095`; workspace access denied `3043:3942` |
| Shared patterns | Uncertain banner at 1440 `3038:1888` and 1024 `3044:5329`; dialog `3038:2363`; every state `3038:3201`; phone banner at 390 `3038:2855` and 320 `3038:2965`; phone sheet `3038:3071`; offline phone `3038:3259`; offline and synthetic markers `3038:3346`; inline notices `3044:5928` |
| States | Cancelled `3039:73442`; sign-in unavailable `3039:73506`; too many attempts `3039:73570`; local `/login` `3039:73634`; expired attempt, new wording `3039:73693`; help dialog `3039:73757`; focus order `3039:73843`; 200% composition `3039:73917`; keyboard and zoom notes `3039:73907`; loading `3044:3547`; session changed in another tab `3044:3772`; application could not start `3044:3970` |
| Outside the baseline | Request access `3039:73964` and request sent `3039:74133` (D4); I1 session ends during work `3044:4210` and phone `3044:4727`; I2 session ending soon `3044:4861`; I3 your workspaces `3044:4005`; I4 is the "Idea I4" row in `3038:3201` |
| Parts | Moved at acceptance to Components `1:4`, section "Components · System pages" `3098:532053`: Sign-in / Notice `3036:161`, Microsoft button `3036:189`, Environment marker `3036:145`, Brand panel `3036:212`, Phone brand header `3036:219`, Microsoft symbol `3036:129`, four local drawings `3036:130`–`3036:142`; System / Message panel `3036:35756`, Outcome unknown banner `3036:38766`, Offline banner `3036:38779` |
| Prototype | Flows "System pages — desktop" and "System pages — phone", walking the states in turn. Home is not on this page, so its buttons go to the next state |
| Story | Synthetic. Sasha Cole (SC) signed in; Taylor Quinn, systems administrator; Hillview Growers from Organisations CS-01. Addresses use `example.invalid`; reference and operation numbers are invented. No tenant, credentials or real accounts |
| Retained captures | [System pages design r01](../reference/ui/application-shell/system-pages-design-r01/README.md): twenty-eight icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `system:shell`, `route:/login` and `route:/`. Workspace access denied applies at workspace roots only, never at a record. Parent coverage unchanged. Capabilities unchanged |
| Page type (r20) | Sign-in: Form / guided workflow, standalone variant with no shell. Page unavailable, access denied and error: shared application-frame variant with a message interior, as the application shell record; no r20 module type applies. Uncertain outcome and offline: shared patterns inside other pages |
| Reused components | Brand / Logo `31:215` unaltered at 140 and 92 px (its bytes match `public/brand/powerplants-logo-green-white.png`); the official Microsoft symbol; local drawings from `login.html`, no Font Awesome on sign-in. In-app: linked Shell / Top bar `35:138`, Rail · Service `198:3778`, Shell / Phone header · compact `1530:110`, v2 / Tab bar (phone) `107:149`, Button, Tag, Controls / Form field. Record / Header and record content are copied from Organisations CS-01 for context |
| Incoming handovers | A protected page without a session; a rejected session; the provider's return (cancelled, denied, expired, unavailable); sign-out; an address that cannot be shown; a page failure; any save whose reply was lost |
| Outgoing handovers | Successful sign-in goes to the fixed destination, never a caller-supplied address. Sign-out returns to `/login`. Unavailable and denied pages go to Home. Uncertain outcome replays the same original operation and never creates a second one. Access changes stay with AD-01; nothing here grants access |
| Exceptions and recovery | Drawn: cancelled, denied, expired, rate limited, unavailable, local, not found, denied workspace, could not load, could not start, identity changed, unknown outcome with its six states, offline and back online |
| Source authority | Listed above |
| Proposed departures | D2–D9 and D11–D13 in section 4, accepted |
| Status | Owner-accepted design, 1 November 2026 |
| Decision record | This file |
| Named version | "System pages — accepted", saved by Dean on 1 November 2026 (section 7) |

## 4. What the design shows

### Sign-in

The accepted r02 design is redrawn and not redesigned: the navy `#242a37` panel, intact logo, Roboto, green accent, split desktop, compact phone header and every word come from `src/login/`, measured from `login.css` at 1440, 1024, 390 and 320. Each hosted outcome in the login decision has a frame. The help dialog, focus order and a 200% composition are drawn.

### Page unavailable

The built wording stays: "This page is unavailable", "The address may be incorrect, the record may be unavailable, or your access may have changed. Use Home to open a permitted workspace, or check the original link." and "Return to Home". It never separates missing from no access.

### Workspace access denied

"You don't have access to Finance", "Your account doesn't include this workspace. Access to your other workspaces hasn't changed." and a Who to ask tile. It names only the workspace, which is a navigation label, and shows no counts or records. Any record address stays "This page is unavailable".

AD-01 does not support self-service requests today: `/admin/access/requests` needs `admin.access.read` and `admin.access.propose`, a proposal needs an independent reviewer, and hosted commands are refused. So the default page has no Request access button.

### Error and could not start

The built heading, body and Try again stay. A support reference from Next's error digest, Copy and Return to Home are added. The digest carries no stack trace or data, and a failure with no digest shows no reference line. There is no `global-error.tsx` today, so a failure in the root layout shows Next's default page; "Powerplants One could not start" is drawn with no shell.

### Uncertain outcome

One banner and one dialog replace the differing wording:

| Surface | Heading | Actions |
|---|---|---|
| Inventory `/supply/stock` | Uncertain result — original operation retained | Check original receipt · Retry original save |
| Organisations | No heading; a status line only | Confirm original save · Compare current saved version |
| Quotation release | Resolve the original action | Check original outcome · Retry exact original |
| Quotation conversion | Resolve the original action | Recover original conversion receipt |
| Products, Engineering control, Materials | Outcome unknown | Recover original result; Retry unchanged operation on Engineering control |
| Scheduling policy, outputs | Outcome not yet confirmed | Check original receipt · Retry unchanged original |
| Field, work orders | Outcome uncertain — … | Varies |
| Discovery, facility form | Creation outcome not confirmed; Result not confirmed | Confirm original save outcome |

Those are seven headings for one behaviour. The accepted wording is "Outcome unknown": "PPO didn't get a reply, so this save may or may not have gone through. A missing receipt doesn't prove it failed. New changes are held until the outcome is known." It states that closing the tab or switching identity removes the retained copy, shows the operation, and offers "Check the outcome" and "Retry the same action". The dialog stays open and its fields are locked, following `job-pack-ui.tsx`. Six states are drawn: unknown, checking, no receipt yet, can't check, saved and not saved.

External sends are kept apart, because their local save is known and PPO keeps checking by itself: Workshop builds and Kitting ("Saved here · MYOB send not confirmed"), Receiving ("MYOB outcome unknown") and Quotation release ("Send again stays unavailable…").

### Offline and synthetic markers

The exact My Work wording becomes the banner for online-only pages, with the page name swapped in, and "You're back online." ends it. The `/offline/` field workspace keeps its own queue and wording (ADR-0013). The hosted demo shows no synthetic banner, so none is drawn; its three existing markers are recorded instead.

### Departures, accepted

| ID | Departure | Built pattern |
|---|---|---|
| D1 | Not a departure: sign-in is redrawn, not redesigned | `src/login/` |
| D2 | Sign-out shows "You've been signed out" | `/login` with no message |
| D3 | An expired attempt says "Your sign-in attempt expired" | One expired state, saying "Your session has expired… Any work that was not saved…", though no session existed |
| D4 | Request access, outside the baseline (Q7) | Not supported |
| D5 | Error page gains a support reference, Copy and Return to Home | Heading, body and Try again only |
| D6 | Workspace access denied page | Nothing built |
| D7 | One uncertain-outcome wording | Seven headings |
| D8 | Offline banner on every online-only page | Phone My Work, with similar handling elsewhere |
| D9 | Top bar reads "Page unavailable"; no rail item is selected | No route label for not-found |
| D10 | Not a departure: no maintenance page and no synthetic banner are drawn, on purpose | None exists |
| D11 | "Powerplants One could not start" | No `global-error.tsx` |
| D12 | The skip-link focus ring is white on navy | `#3b6b99`, 2.57:1 |
| D13 | Outcome actions read "Check the outcome" and "Retry the same action" | Varying "original" wording |

## 5. Implementation scope and remaining work

- **Not built.** No page changes by this decision. The application keeps its built wording until a build is requested.
- **Request access (D4):** drawn and not accepted as baseline. It needs a new self-request rule under AD-01.
- **Ideas, not baseline:** I1 keep entries when a session ends (sessions end at 8 hours, and a save then returns only "Sign in to the private demo."); I2 warn before the session ends; I3 your workspaces on the unavailable page; I4 a read-only check on reconnect, which never retries, in line with ADR-0013. I5 an unknown-outcomes indicator and I6 reference lookup in Operational health come later and are not drawn.
- **Build needs:** one more login presentation state each for D2 and D3; `global-error.tsx`; a workspace-root denial and its status; focus moved to the heading on the unavailable and denied pages, which `not-found.tsx` does not do today; the error digest in the reference line; a small read for Q8.
- **Not drawn:** the no-JavaScript help section; "Copied" and Try-again busy states; a second failure after Try again.
- **Register:** `not-found.tsx` and `error.tsx` have no design register page, because they have no route. The shell contract records them.

## 6. Audit and polish

At Dean's request Claude read the frames at full size and checked them against the running code, not only the automated audit, which had passed them.

- **Corrected:** the sign-in focus state drew nothing, and is now a real 3 px ring; in-app frames showed the Estimating rail and tabs for a Service person, and now show Service; the Service rail ran past the 768 px screen and cut off More, so its shortcut list is drawn scrolled, as the [department navigation decision](department-navigation-icons.md) describes; copied addresses now use `example.invalid`.
- **Polished:** message pages gained a status icon, with the words still carrying the meaning; the reference sits in its own tile with Copy, which has a 44 px target on phones; the behaviour table gives each page's tab title, HTTP status, announcement and focus target.
- **Gaps drawn:** loading, session changed in another tab, inline notices, could not start, back online, more phone states and the uncertain banner at 1024.
- **Contrast measured:** muted text 5.55:1, environment marker 5.13:1, info notice 7.15:1, error title 6.05:1, green on navy 5.96:1, navy footer 8.47:1, small text on the warning banner 5.21:1. The only failure was the skip-link ring (D12).

## 7. Verification

- Claude checked the frames with screenshots inside Figma and a programmatic audit: no overlaps, nothing outside its section and no stray layers. Every in-app top bar is a linked instance of `35:138`.
- After Dean's acceptance, Q11 and Q12 were applied to the frames, the parts moved to Components, and instances checked as still linked.
- The twenty-eight captures are copies on the Captures page from y = 1,460,000. All 434 visible Font Awesome instances were swapped for `Icon/placeholder`. A separate re-scan found none left, no visible vector outside a placeholder, the logo or the login's local drawings, and no prototype action on any copy. The flow entry the cloning added to the Captures page was removed.
- The captures were exported at scale 1. The hashes are in the [captures README](../reference/ui/application-shell/system-pages-design-r01/README.md).
- **Named version:** Dean saved "System pages — accepted" in Figma on 1 November 2026: "I have saved the named version as System pages — accepted". Claude did not open version history to confirm it.
- **Not done:** the flows have not been played in Present mode. Real 200% browser zoom, screen readers, physical devices and live Microsoft sign-in remain open; the 200% frame is a composition, not a test, as the login decision requires. No owner device, accessibility or operational review is inferred. There is no new application evidence.
