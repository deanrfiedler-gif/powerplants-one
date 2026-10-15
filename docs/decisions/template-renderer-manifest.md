# DK-06 rendering-only template manifest

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Status:** User-authorised synthetic correction; independent review, owner acceptance and deployment separate.

## Decision

On 15 October 2026 Dean decided: "G5 is a defect. Proceed with option A: add a new DK06-OUT09-2 contract with a rendering-only manifest and explicit Playwright versions, keep DK06-OUT09-1 definitions retained unchanged, record the decision, implement it with the migration and ledger updates, and open a draft PR."

## Defect

The DK-06 Template management design recorded this as backend gap G5 (question Q5). [R3](template-publication-backend.md) fingerprints twelve files into every managed OUT-09 definition, and support recomputes that list on every read or use. Four of the files do not shape the output: `package-lock.json`, `src/platform/operations.ts`, `src/shared/validation.ts` and `src/platform/browser.ts`. A change to any one made every published DK06-OUT09-1 definition `DefinitionChanged`. It also refused new Job pack preparation, check and issue (`TemplateUnavailable`) at every site with a managed assignment, until a new revision was reviewed, published and assigned.

`operations.ts` changed eight times between August and October, and `browser.ts` changes with each reviewed Chrome major (ADR-0022). [R4](template-use-assignment-backend.md) had already avoided editing `operations.ts` for this reason. The legacy v2 P11 manifest covers renderer, branding and font files only. A focused database test reproduces the refusal for each of the four files.

## DK06-OUT09-2 contract

New managed publications use renderer contract DK06-OUT09-2. Its manifest fingerprints the sources that shape the output:

- `src/documents/publication/dk06-out09-2.ts`, the contract's renderer;
- `src/documents/render.ts`, the shared pack HTML and declared renderer version;
- `src/documents/validation.ts`, whose section keys and labels are printed;
- the Roboto font, its provenance record and the logo.

The definition also records the declared `renderer_version` and an explicit `dependencies` list: the `playwright` and `playwright-core` versions resolved in `package-lock.json`. A Playwright change therefore withdraws support; other lockfile entries do not.

Excluded sources and the reason:

- The definition builder, contract dispatcher, draft and shared validation, and canonical serialisation in `operations.ts`. Support recomputes the exact canonical definition text and re-parses the body against schema version 1, so any change that alters the text or what the body accepts is still refused.
- `browser.ts`. The reviewed Chrome runtime is governed by ADR-0022 and recorded on each output as `browser_version`. The file's bytes neither pin the browser binary nor describe the template.
- The rest of `package-lock.json`, replaced by the explicit Playwright versions.

A change to any manifest source or dependency version still refuses support and never substitutes another definition. Such a change is a new renderer contract, not an edit of this one.

## Retained DK06-OUT09-1

None of the twelve DK06-OUT09-1 manifest files changes, including `src/documents/publication/definition.ts` and `src/documents/publication/render.ts`. Retained definitions, publications, assignments and issued bytes are unchanged and stay supported until one of those files changes. They then fail closed as R3 designed. To replace one, copy its published definition into a draft, review and publish it (as DK06-OUT09-2), and assign it as a successor. No data is migrated or rewritten.

A new dispatcher routes legacy v1/v2, DK06-OUT09-1 and DK06-OUT09-2 definitions to their own support check and renderer. Pack context, the issue worker, the HTML preview, the catalogue, publication reads, publication and use assignment call the dispatcher.

## Database

Migration 0103 adds `ppo.template_publication_renderer()`, which names DK06-OUT09-2. It replaces the insert guard so that a new publication must name that contract and carry a non-empty dependency list. Existing publication rows are not touched; the guard runs only on insert. Publication asks the installed schema which contract it accepts, so a schema before 0103, which only populated-upgrade fixtures run, still receives DK06-OUT09-1. No table, seed, grant, user, identity type or capability changes.

## Alternatives

- Relax the DK06-OUT09-1 check in place. This needs no migration, but it changes the meaning of an issued contract and leaves recorded hashes that no longer guard anything. Rejected.
- Record the behaviour as intended. Every dependency update, unrelated platform edit or Chrome major would then require every managed template to be republished and reassigned. Rejected.

Traceability: BC-03 / DK-06 R3 correction G5; DOC-03/DOC-06, OUT-09, D-012/D-024 and AT-36. See the [API contract](../contracts/template-publication.md) and [evidence](../testing/evidence/template-renderer-manifest/README.md).
