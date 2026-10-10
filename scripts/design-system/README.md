# Design system resync and kit

<!-- versioning: git; committed history is authoritative -->

These scripts keep the [Powerplants One design system](https://claude.ai/artifact/WwJiq36rg1KDdv1yS486SP) in step with the application, as [ADR-0051](../../docs/decisions/ADR-0051-claude-design-page-design.md) requires. The design system describes only what the app has. Its kit previews are captured from the running app, never drawn.

## When to run

Resync after a change to the tokens, the shell, the icons, a kit part or `docs/design/development/components.json`. The design system records the commit it was last synced from in `project/tokens.json` (`meta.ref`).

## Steps

1. **Serve the commit you are syncing.** Run the app locally with that commit checked out. The scripts sign in as the synthetic Coordinator through `/api/v1/local-session`. They read pages and the component catalogue; they change no records.
2. **Capture the kit.** From the repository root:

   ```bash
   PPO_KIT_REF=main@<sha> node scripts/design-system/capture-kit.mjs
   ```

   The previews, `bundle.css`, app captures and `report.json` are written to `tmp/design-kit/`. `PPO_KIT_ORIGIN` overrides the default `http://127.0.0.1:3000`. Font Awesome is blocked during the capture, and the script stops if any Pro artwork reaches the markup. `report.json` lists the rules taken from each stylesheet; a rule from a route stylesheet means a part depends on module CSS, so it is not yet a shared part.
3. **Merge the component guides.** Read the design system's `project/components/*/README.md` back into a folder, then:

   ```bash
   python3 scripts/design-system/merge-component-guides.py <components.json at meta.ref> docs/design/development/components.json <guides folder> <output folder>
   ```

   Run it with `--check` first. A guide it reports as `DIFFERS` holds a hand edit in a generated section; the merge keeps that edit.
4. **Check side by side.** Render each preview with the design system's tokens and `bundle.css` at the card's width, and compare it with the app capture in `tmp/design-kit/app/`. Record each difference, then fix it or explain it in the part's guide.
5. **Publish.** Re-read every design-system file you will replace, and confirm that nobody has changed it since you read it. Then publish the changed files to the design system in one update, with `project/design-system.json` (its `lastChange`) last. Update `meta.ref` in `tokens.json`. Never upload Font Awesome Pro artwork: the design system is shared by link ([ADR-0050](../../docs/decisions/ADR-0050-font-awesome-light-icons.md)).

## Adding a part to the kit

A part joins the kit only after it exists in the app as a shared component and is in the component catalogue. Add it to `PARTS` in `capture-kit.mjs`, together with the page or catalogue example it is captured from. If it has a catalogue entry, add its name to `CAPTURED_PARTS` in `merge-component-guides.py`.
