# Contacts, Stakeholders & Relationships source (CS-02 / CS-03 r01)

This source produces the [standalone r01 HTML](../../reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-r01.html). The [companion report](../../reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-Report-r01.md) documents its six views, fields, rules, provenance and receiving boundaries. The [build plan](../../delivery/contacts-stakeholders-build-plan.md) records the intended scope, and the [decision record](../../decisions/contacts-stakeholders-design.md) records what is proposed and what is contract.

| File | Responsibility |
|---|---|
| `template.html` | Semantic page shell, scope metadata (`ppo-scope-id` CS-02, secondary CS-03, `ppo-design-revision` r01) and assembly markers. |
| `fonts.css` | Embedded Roboto, byte-identical to `docs/design/my-work/fonts.css` and `docs/design/access-review/fonts.css` (SHA-256 `57b4aafb71296b18d80408cb10aa972c87f5185deafd748c7fdcfb33e2bd4bef`), itself taken from the r20 board. |
| `icons.json` | Unchanged Customer 360 line-icon set (SHA-256 `cf868d77b2c07f14f07985afd218649ba4362067ff2d55ef625c56bc2df1fcae`). |
| `workspace.css` | r20 token core reused by name from the AD-01 r01 source, plus theme r22’s complete `--ss22-*` selection family with the board’s own values, scoped under `#ppo-contacts`, with the register, stakeholder, reliance, panel and phone treatments. |
| `model.js` | Contract rules (Person projection, `visibility("Person")`, `listShared` refusals, the directory contract, the affiliation exclusion constraint, the `createPerson` context rule), the four-value presence vocabulary, the proposed model, proposals and duplicates, guards and restore validation. |
| `fixtures.json` | Ten synthetic people, ten affiliations, five sites, four organisations, fourteen downstream bindings and the six required scenarios. |
| `workspace.js` | Six views, dialogs, the 448 px inspection panel, local storage with validated backup and restore, fixed clock, scripted assistant and the eight UI states. |
| `source-pins.json` | Reused-asset hashes, the base commit, the pinned r22 theme board and its SHA-256, and the content hash of every pinned contract source. |

From the repository root:

```bash
python scripts/build-contacts-design.py            # rebuild the HTML
python scripts/build-contacts-design.py --check    # fail if the committed HTML is stale
node scripts/check-contacts-model.mjs --write-evidence
node scripts/check-contacts-browser.mjs
```

Edit sources and rebuild; never edit the generated HTML by hand.

## Determinism and line endings

`.gitattributes` pins `.html` to LF but leaves `.css` and `.js` to `text=auto`, so a Windows checkout holds CRLF for the sources and LF for the output. The builder therefore reads every source as bytes and normalises to LF before assembly, and writes bytes rather than text. A rebuild produces the same SHA-256 on Windows, macOS and Linux, which is what makes the determinism check mean the same thing everywhere. The model check normalises the same way before hashing, so its recorded source hashes match the ones the repository's own documents quote.

## Pinned contract sources

`source-pins.json` records the content hash of every file the design describes: migrations 0002, 0003, 0010, 0017, 0018 and 0019, `src/shared/commands.ts`, `src/shared/reads.ts`, `src/crm/directory.ts`, `src/shared/context.ts`, `src/projects/service.ts`, `src/finance/context.ts`, `src/scheduling/planner.ts`, `src/reports/service.ts` and `db/seed.sql`. The builder refuses to run if any of them has changed. That refusal is a prompt to re-read the source and decide whether the design is still accurate — never a reason to edit the pin without reading.

## The theme edition

The module builds on the r20 shared token core and adopts theme **r22**'s selection family. `source-pins.json` pins the r22 board by content — SHA-256 `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0` — and the builder refuses to run if it changes.

r22 was measured against r20 rather than taken on trust, and the measurement is a model-check group rather than a sentence in a document: r22 removes no token, changes no token value, and adds exactly 24, every one an `--nca-*` or `--ss22-*` component-local alias. A second group asserts this module declares the whole `--ss22-*` family with the board's own values, and that each of them resolves either to a token already declared here or to a shadow built from the brand navy, so the family introduces no new colour.

The selected directory row uses r22's **ring** treatment, the view tabs its **tabs** treatment, the attention queues ring, and the filter group **recessed**. A green marker is retained on the selected row and tab so selection is never carried by colour alone.

The r22 board carries `--surface-hover: #f0f2f5`, `--line-soft: #e9ecf1` and `--success-tint: #f3f7f1` — the Field Technicians r05 side of the three known divergences, which is the side this package adopts. The divergences remain formally unresolved; resolving them means reissuing the losing baseline.

## What this design asserts, and what it does not

The module reads. It issues nothing, sends nothing and acknowledges nothing. Every apply is labelled **Simulated**, because `src/shared/commands.ts` exports `createPerson` and `addAffiliation` for this record type and nothing else: there is no command to update a person, deactivate one, end an affiliation or merge duplicates.

The signature requirement is that **restricted is never rendered as empty**. `customerContext` returns `contacts: []` both when the reader lacks company-level `shared.read` and when the organisation genuinely has no contacts. Every list, count and panel in this module returns one of four presence values — present, restricted, none, unknown — following the `owner_unavailable` precedent already used for project task owners in `src/projects/service.ts`.

Authority basis is **Recorded**, **Asserted by us** or **Unknown**. Nothing here says a person can commit the customer, because nothing in the contract records that.

## Boundaries

Every person, organisation, site, affiliation and downstream binding is fictional. Preview role selection is explanatory; it is not authentication or authorisation. Browser storage is per-browser and is not shared persistence. Real domain write policy, owner acceptance and application integration remain separate work. No application package, dependency pin, server contract, migration or seed is introduced.
