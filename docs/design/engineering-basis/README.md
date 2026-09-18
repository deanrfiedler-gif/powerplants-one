---
document_id: PPO-EN02-SRC
title: EN-02 standalone source and rebuild guide
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: Synthetic design source; native browser review pending
source_commit: 108b1600152ee12443c75ffaf7feb7cc857316f5
---

# EN-02 source package

The [standalone HTML](../../reference/ui/engineering-basis/PPO-Design-Basis-and-Interface-Register-r01.html) is generated from these maintained sources. [Delivered-feature report](../../reference/ui/engineering-basis/PPO-Design-Basis-and-Interface-Register-Report-r01.md), [decision and handover](../../decisions/engineering-basis-interface-register-design.md), [actual verification](../../testing/evidence/engineering-basis-r01/README.md).

| File | Responsibility |
|---|---|
| `template.html` | Semantic module host, six-tab panel, record dock, editor dialog and print surface |
| `workspace.css` | r22-informed visual tokens, responsive rules, local tabs, registers and focus styling |
| `fonts.css` | Three embedded Roboto font-face blocks extracted unchanged from the supplied r22 board |
| `location-context.json` | Unchanged CS-08 canonical location fixture; EN-02 technical narratives are separate |
| `model.js` | Synthetic state, readiness, exact review, source history, dependency propagation and original-operation recovery |
| `workspace.js` | Six views, typed editors, role preview, persistence, safe text rendering, export and print |
| `manifest.json` | Exact source and artifact SHA-256 identities; regenerated with the HTML |

Build from repository root with `python3 scripts/build-engineering-basis-design.py`. The generator has no third-party dependency. The output embeds its fonts, CSS, fixture and scripts and makes no network request.

Run model checks with `node scripts/verify-engineering-basis-design.mjs docs/testing/evidence/engineering-basis-r01/model-results.json`.

DOM checks use **jsdom 26.1.0**, installed only in a separate QA directory; it is not an application dependency. Set `EN02_JSDOM_PATH` to that package's absolute directory, then run `node scripts/verify-engineering-basis-dom.mjs docs/testing/evidence/engineering-basis-r01/dom-results.json`. Dialog methods, object URLs, printing and viewport width are modeled. This is a DOM test, not a browser.

The local store key is `ppo-engineering-basis-r01`; its schema is `ppo-engineering-basis/1`. Reset only removes that key. JSON exports are review copies with no import route. Original raw-state export is an explicit recovery function for the file holder, not a role-restricted operational export. All embedded data is synthetic and inspectable.

Do not use the browser role selector, local SHA-256 hashes or event history as production authentication, signing or immutable audit infrastructure. Integration needs server scope checks, transactionally enforced versions, authoritative source retention and receiving receipts. The standalone stylesheet also needs containment in the shared application shell.

Keep issued revisions unchanged. Corrections after this package is issued need a successor artifact, a new verification record and a reviewed index update. The accepted Engineering r02 and all existing parent requirement identities remain intact.
