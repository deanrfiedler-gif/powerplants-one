# ADR-0056 — Dependency update and audit gates

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. **Status:** implemented in the pull request that adds this record, as follow-up to the 15 October 2026 repository audit; owner review pending.

Related: audit finding QA-3 (no Dependabot, CodeQL or audit gate in CI); [ADR-0006](ADR-0006-p01-local-foundation.md) (exact pins and lockfile); [ADR-0022](ADR-0022-maintained-browser-runtime.md) (maintained runtime); the DK-06 [template publication backend](template-publication-backend.md).

## Context

On 15 October 2026 `npm audit` on main reported `next@16.3.4` with one critical advisory (remote code execution in `next/og` ImageResponse, which the application does not import) and one high (Server-Side Request Forgery in Image Optimization; `next/image` is used in two files), plus four moderate advisories and one low. It also reported high advisories in `sharp`, `source-map-js`, `brace-expansion` and `braces`. No workflow audits dependencies and nothing proposes updates, so none of this was surfaced.

## Decisions

1. **Next.js 16.3.8, not 16.4.1.** `next` and `@next/eslint-plugin-next` move together to 16.3.8, the patch release that clears every listed Next.js advisory. 16.4.1 is the current `latest` but a minor release; it arrives through the grouped Dependabot pull request (decision 4) and is reviewed there. Exact pins stay exact (`save-exact`).
2. **In-range transitive fixes, no overrides.** The lockfile refresh takes `sharp` 0.35.5 (with its platform binaries), `source-map-js` 1.2.2 and `brace-expansion` 5.0.12. Each is allowed by its parent's existing range. No package is added or removed.
3. **One named exception: `braces`.** [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) (high, published 18 September 2026) affects every release up to 3.0.3, which is the latest, and has no fixed version. It reaches the tree only through `@next/eslint-plugin-next` → `fast-glob` → `micromatch`, a lint-time path that expands the repository's own glob patterns. `npm audit fix --force` would downgrade the plugin to 14.2.35, a breaking change, so it is not used. The exception is recorded in `scripts/check-npm-audit.mjs` with its reason and date.
4. **Weekly Dependabot version updates** (`.github/dependabot.yml`) for npm and GitHub Actions, Monday 07:00 Brisbane. Minor and patch updates are grouped into one pull request per ecosystem; each major arrives alone. `@types/node` majors are ignored while Node is pinned to the 24 LTS line. Open pull requests are limited to three for npm and two for Actions, because each one runs the full always-on CI.
5. **A two-step audit gate** in a new `Dependency audit` workflow that runs on every pull request, on pushes to main, weekly and on demand. Step one, `npm audit --omit=dev --audit-level=high`, allows no exception in the runtime tree. Step two, `scripts/check-npm-audit.mjs`, fails on any high or critical advisory in the full locked tree that has no recorded exception. It also warns when an exception no longer matches anything, so the exception can be deleted. The gate reads only `package-lock.json`: it installs nothing and runs no package script.

## Alternatives considered

- **A literal `npm audit --audit-level=high`.** Rejected because it fails on every run until `braces` publishes a fix. A gate that is always red gets ignored, and then a new advisory goes unnoticed.
- **Only `--omit=dev`.** Rejected because development tooling would go unaudited, including the `brace-expansion` advisory that this change fixes.
- **An `overrides` entry.** Not possible, because no fixed `braces` exists to override to.
- **Renovate instead of Dependabot.** Not chosen: it is a third-party app with more configuration, and Dependabot is built into GitHub.
- **Advisory checks only on a schedule.** Not chosen: a pull request that adds a vulnerable package should fail on that pull request.

## Not decided here

CodeQL (also named in QA-3) needs its own decision. Some repository settings are the owner's to change: on 15 October 2026 Dependabot alerts, Dependabot security updates and secret scanning were all disabled on this public repository. `dependabot.yml` configures version updates only. Making `Dependency audit` a required check is also a branch-protection setting.

## Consequences

- **DK-06 managed templates (gap G5).** `src/documents/publication/definition.ts` fingerprints `package-lock.json` into every managed OUT-09 definition (runtime version 3 and later). Any lockfile change alters the recomputed definition, including this one and every merged Dependabot npm update. Publications made before the change then read `DefinitionChanged`, and `src/documents/context.ts` refuses new Job pack preparation with `TemplateUnavailable` at the sites they are assigned to. The affected publications must be republished, or G5 must be fixed. Legacy version 1–2 definitions and OUT-10/OUT-14 do not fingerprint the lockfile. No test, migration or seed depends on the current lockfile hash: tests publish and verify within the same tree, and no seed creates a version 3 definition. G5 is recorded in the DK-06 Template management design (pull request #502) and its fix is a separate piece of work. Until it lands, merging a dependency update into an environment with managed publications needs the same republish step.
- **CI load.** Each Dependabot pull request runs every always-on workflow. Grouping and the open-PR limits bound this.
- **Reversal.** Delete `.github/dependabot.yml`, the workflow and the script. Restoring the 16.3.4 pins would reopen the advisories.

## Validation

`npm audit` after the change reports only the four `braces`-chain entries, all under the one advisory. `npm audit --omit=dev --audit-level=high` reports 0 vulnerabilities. Against main's lockfile, `scripts/check-npm-audit.mjs` blocks six advisories, including the Next.js critical, and the runtime step fails. The pull request records the lint, typecheck, unit-test and CI results.

## Note, 24 October 2026: `braces` exception removed

GitHub withdrew [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) on 23 October 2026, so `npm audit` no longer reports it, and `scripts/check-npm-audit.mjs` warned that the `braces` exception no longer matched anything. As decision 5 intends, the exception has been deleted. The `exceptions` list remains, empty, so a future exception still has a reason, a date and a place in review. `braces` 3.0.3 stays locked through the same lint-time path; `package-lock.json` is unchanged. Decision 3 and the alternatives above record the position on 15 October 2026 and are otherwise unchanged.
