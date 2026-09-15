# Interactive Naming and Filing r01

Open [index.html](index.html) directly in a current browser. It is a standalone synthetic design review with embedded r18 fonts, tokens and brand mark. No network, local file content, storage API or application/SharePoint/Outlook operation is used. The page resets on reload. Review visual acceptance separately from scripted checks.

Maintained sources: `model.js`, `app.js`, `styles.css`, `theme-assets.json`. Rebuild the standalone HTML with `python3 docs/blueprints/naming-filing-prototype/build.py`. The initial theme asset extraction required the exact verified r18 hash; later rebuilds need no external file. Do not edit generated `index.html` by hand.

[Functional specification](../naming-and-communication-assistance.md) · [Configuration](../../architecture/sharepoint-information-architecture.md) · [Acceptance](../../delivery/naming-sharepoint-pilot.md) · [Verification and handover](../../delivery/naming-sharepoint-handover.md).

Model assurance: `node scripts/check-naming-assistance-design.mjs`. Optional DOM event assurance: install jsdom 26.1.0 in an isolated temporary directory, then run `node scripts/check-naming-assistance-dom.mjs /absolute/path/to/node_modules/jsdom/lib/api.js`. This optional tool is not an application dependency and uses stubs for native dialog/popover APIs; it cannot establish layout or accessibility acceptance.
