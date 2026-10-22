# ADR-0063: One native Powerplants One phone app

<!-- versioning: git; committed history is authoritative -->

Status: proposed. The direction (one native app, no separate companion) was accepted by Dean on 23 October 2026. The wrapper technology (Q10 in the calling paper) and the stage 2 build await his decision and a spike.
Date: 23 October 2026. Owner: Dean Fiedler. Builder: Claude.

Related: [Calling, caller ID and call logging, design paper](calling-and-caller-id-design.md) (PPO-CALLS-CALLER-ID-PROP); [ADR-0032](ADR-0032-mobile-installation.md), which this amends for phones; NFR-01, NFR-03, NFR-07 and NFR-08; D-020; BP-01's open item to "validate mobile/offline needs on actual devices".

## Context

Dean wants Pipedrive-style caller ID and call logging on staff phones. He asked, on 23 October 2026: "Do we need a companion app, or could we simply make the Powerplants One app the core app, similar to what Pipedrive does?" After the recommendation he said: "Proceed: write the calling spec and the native app ADR on the recommended basis, and start with stage 1."

The calling paper sets out the constraints:

- **Only native apps can identify calls.** On Android, caller ID needs the phone's caller ID and spam role. On iPhone, it needs a Call Directory extension. Detecting the end of a call placed from the app also needs native code. No installed web app can do any of this.
- **Staff use mixed phones.** They use company iPhones, company Android phones and personal phones.
- **PPO's screens are server-rendered web pages**, served by the hosted gateway after Microsoft sign-in (ADR-0032). There are hundreds of them, and they change every week.
- **A later subscription version is possible.** Customers might sign in with Microsoft or Google, and Google refuses sign-in inside an embedded web view.

ADR-0032 chose a web app manifest over "a native wrapper, a separate mobile codebase or app-store packaging", because all those were "larger than the problem". That problem was only a home-screen icon. Caller ID is a new problem that the manifest cannot solve.

## Decision

**Build one native Powerplants One app for iPhone and Android that shows the hosted PPO screens in a web view and adds native code only where the phone requires it.**

- **One app.** Staff install one app, not a companion beside the web app. It is the phone version of PPO.
- **The screens stay the web screens.** Every page is built once and appears on desktop and in the app. The app adds no screen of its own except native system surfaces: the caller ID notification on Android, permission prompts and its settings.
- **Native code for calling first.** The Android caller ID and spam role, call-end detection, the iPhone Call Directory extension, and the small on-device directory are described in the calling paper (sections 6.1 and 6.2). Push notifications and stronger offline come later, each with its own decision.
- **The native bridge is limited.** Native features are available only to pages from PPO's own origin. Navigation away from that origin opens the system browser.
- **Sign-in uses the system browser.** This is the pattern Google requires and Microsoft recommends. It also lets the app refresh the caller-ID directory in the background with its own short-lived, revocable credential, without reusing the web-view cookie.
- **Desktop is unchanged.** On phones, the store app replaces the installed web app. ADR-0032's manifest stays for desktops and for anyone who has not installed the app.

**Recommended wrapper technology: Capacitor** (Q10). It is built for exactly this split: web content in the platform web view, with plugins in Kotlin and Swift and native projects that can be edited directly. The iPhone Call Directory extension is an ordinary Xcode extension target.

The stage 2 spike must confirm one point before this choice is final. Capacitor documents its remote-URL setting for development live reload, while PPO's pages are server-rendered and must load from the hosted origin. The spike must show a supported production pattern for loading a remote origin, or it must choose the alternative below.

## Options considered

| Option | For | Against | Verdict |
|---|---|---|---|
| **A. Capacitor shell around hosted PPO** | One set of screens. Native projects are editable for the call-screening service and the Call Directory extension. Small native surface. | Remote-origin loading must be proven for production. Web-view look and feel. App review risk (below). | **Recommended**, subject to the spike |
| B. React Native (Expo) shell with a web view | Remote web views are a common production pattern. Expo modules cover native code. | A second JavaScript runtime and toolchain beside Next.js. The iPhone extension needs config plugins. More moving parts for the same result. | Fallback if A fails the spike |
| C. Android Trusted Web Activity plus a separate iPhone app | Smallest Android wrapper | Two different wrappers. A Trusted Web Activity alone still needs native code for call screening. | Rejected |
| D. Fully native apps (Swift and Kotlin) | Best phone feel. This is where Pipedrive is today. | Rebuilds hundreds of pages twice and keeps three versions of every change. | Rejected now. Revisit only for a mature subscription product. |
| E. Stay a web app only | No new codebase | Cannot do caller ID or call-end prompts on any phone | Rejected for calling. Stage 1 still works on the web. |
| F. Separate companion calling app | Smaller app | Two apps to install and sign into. Dean preferred one. | Rejected |

## Consequences

- **A second codebase.**
  - A native project folder, its build tooling and the Capacitor packages. These are new dependencies, added only in the stage 2 pull request with this ADR accepted.
  - Its location and CI jobs are decided in the spike.
  - The web application's dependencies do not change.
- **Accounts and distribution.**
  - Powerplants needs an Apple Developer Program organisation account (which needs a D-U-N-S number) and a Google Play Console account.
  - The first release goes to staff privately: TestFlight or an Apple Business Manager custom app, and a private app in managed Google Play.
  - Public store listings, a privacy policy and data-safety declarations belong to a later subscription decision.
- **App review risk.**
  - Apple may reject an app it judges to be "just a website" (App Store guideline 4.2). Caller ID, call logging and later notifications are real native features, which is the usual answer, but approval is not certain.
  - Google reviews apps that ask for the call-screening role and declares sensitive permissions. The spike must list every Android permission the app requests and why.
- **Security.**
  - The app's background credential, the on-device directory and the native bridge are new attack surfaces under NFR-03. They need a security review and a second-model review before any staff release.
  - Device data follows the calling paper's R7: the minimum needed, cleared on sign-out, and withdrawn at the next refresh.
- **Personal phones.** The app works without device management. It holds only the caller-ID minimum, so a lost personal phone exposes names, organisations and one deal title per number, and nothing more.
- **ADR-0032 is amended for phones.** Its manifest, icons and installation help remain for desktops. Its "larger than the problem" conclusion no longer holds on phones once caller ID is required. A dated note in ADR-0032 points here.
- **Reversal.** The app adds no data authority of its own. Withdrawing it leaves PPO working in the browser and the installed web app exactly as today. Only caller ID and call-end prompts are lost.

## Validation and open questions

- **The stage 2 spike must show, on a physical Android phone and a physical iPhone:**
  - loading the hosted PPO origin in a supported production configuration;
  - system-browser sign-in;
  - the bridge restricted to PPO's origin;
  - Android caller ID through the call-screening role, with the phone unlocked and locked;
  - a Call Directory label on iPhone;
  - a call-end prompt for a call placed from the app on both;
  - removal of the directory on sign-out.

  Emulators and desktop browser emulation are not device evidence.
- **Open questions:**
  - which company account owns the Apple and Google listings;
  - who manages app releases;
  - whether company phones are under device management that could install the app;
  - where the native project lives in the repository.
- Nothing in this ADR is built. No dependency, account, listing, credential or store submission is authorised until stage 2 is authorised.
