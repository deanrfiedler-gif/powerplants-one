# Email & Calendar synthetic prototype

**Revision:** r02 · **Date:** 8 September 2026 · **Owner:** Dean Fiedler · **State:** Clickable design artifact. No Microsoft connection, external messages, backend or durable business data.

Open [index.html](index.html) from a local copy of the repository. It loads the adjacent JavaScript/CSS and existing PPO brand assets. To make one offline downloadable HTML file:

```sh
python3 docs/blueprints/email-calendar-prototype/export.py /tmp/ppo-email-calendar-prototype.html
```

The export embeds the existing logo and Roboto font bytes, performs no downloads and requires no web server or Azure account. Download the exported HTML and open it in a current desktop browser. A mobile attachment preview may not execute JavaScript; a later authorised hosted demo is the appropriate route for an independent smartphone link.

## Calendar refinement review — r02

The demo now opens on **Calendar**. Start with Tuesday 8 September 2026.

1. Compare **Day** and **Agenda**. Day positions the meetings against hour lines; Agenda shows wrapping titles and context.
2. Select Wednesday **9** in the week strip. The internal follow-up appears under **Due this day**, without a fabricated meeting duration.
3. Tap the month/year to choose a date, or use the arrows to move a week. The filter control selects Outlook or PPO Activities; **Clear filter** restores both.
4. Tap a meeting for its full title, date, time, source and related record. On a narrow screen this uses a bottom sheet.
5. Switch the preview account to Jordan. The calendar shows only shared Busy periods. Revoking availability in Settings hides these periods and their week indicators.
6. Open **Email** to continue the original record-linking and sharing journey below. Settings → Reset sample data restores Alex’s inbox; reloading opens the revised Calendar.

The red line is explicitly labelled **Sample · 9:45** on 8 September. It is a fixed fictional time, not the current clock. The provided screenshot informs layout only; no real appointments were copied.

## Email review journey

1. Open **Email** and stay in **Preview as Alex · Owner**. Open **Irrigation upgrade — scope confirmation**.
2. Choose **Choose a record**. The same contact belongs to two opportunities. Select **Irrigation upgrade**, then **Save links**. The conversation stays private.
3. Choose **Plan follow-up**, enter **Confirm site visit details**, select a Brisbane due time, then **Create follow-up**. It is a PPO Activity simulation with no invitation.
4. On Casey's latest message, choose **Share this message**, keep the irrigation record and Jordan selected, leave the attachment unchecked, then **Share selected message**.
5. Choose **Preview as Jordan**. Only Casey's selected message is visible. The earlier message and unselected attachment stay private. Open **Records** to see the same permitted conversation in its Email tab.
6. Open **Settings**, revoke Jordan's demo record access, then return to **Email** and **Records**. Access disappears. Restore access to continue reviewing.
7. Change **Preview as** back to Alex. Open **Calendar** and inspect an Outlook event, private event and recurring occurrence. Select Wednesday to see the internal PPO Activity separately.
8. In **Settings**, try Paused, Reconnect required, Sync unavailable and Disconnected. Then restore Ready. Open the **First Microsoft pilot** plan.
9. Use **Reset sample data** to restore the original sample, or reload the file. All changes are in memory only.

## Files and evidence

- `index.html`: entry point, labels and metadata.
- `styles.css`: responsive PPO styling; existing Roboto/Verdana, navy/green/white.
- `fixtures.js`: six fictional conversations/seven messages, eight records and four initial events.
- `app.js`: in-memory interactions and deliberately separate link/share rules.
- `export.py`: deterministic standalone export.
- `check.mjs`: dependency-free scenario checks of rendered model projections and command simulations; not browser or server security acceptance.

The source logo is reused intact from `docs/standards/ui-assets/powerplants-logo-green-white.png`; font and OFL remain in the existing `public/brand/` assets. Small UI icons are local functional SVG geometry. No customer screenshot, mailbox export, real attachment, analytics or remote font/image dependency is included.

[Design and contract](../email-calendar-integration.md) · [Microsoft pilot](../../delivery/email-calendar-microsoft-pilot.md) · [Actual verification](../../delivery/email-calendar-handover.md).
