# Protected hosted Design & Development workspace

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Decision date:** 23 September 2026 · **Status:** Authorised implementation and deployment; verification recorded separately.

Dean approved a small protected workspace in the existing hosted PPO app, initially for his account only. This supersedes ADR-0040's local-only boundary for the private Azure demo. It does not establish a public developer portal or authorise operational integrations.

## Access

Reuse the validated Entra tenant, opaque session and current tester membership. A deployment policy enables the workspace only when `PPO_DEVELOPMENT_WORKSPACE=on` and one valid `PPO_DEVELOPMENT_OWNER_OBJECT_ID` is configured. Match that stable directory identity, not an email, display name, first tester, business role or browser flag. Missing configuration fails closed. The owner's identity was verified through the existing signed-in Azure account; its object ID stays in deployment configuration, outside this public repository.

Recheck enabled membership, tenant, session expiry, active actor and any selected hosted-role expiry on every request. The owner can use either of their existing hosted demonstration roles; switching roles cannot grant another tester access. Invitation expiry is not extended by this feature. No database migration, business capability or permission grant is introduced.

The hosted gateway blocks direct workspace pages, catalogue/guide APIs, previews and reference downloads before Next handles them. Each page and endpoint independently checks the trusted gateway and session membership. The root layout uses that same decision for the shell icon and draft-guide section. UI visibility is not the security boundary. Cached browser content already delivered cannot be recalled, but every subsequent request rechecks access. Responses remain private/no-store.

## One master and a release snapshot

Git remains the master. Docker builds require the exact full source commit and generate a validated snapshot containing the register, component library and guides. The image contains registered reference bytes outside public assets; the reader still enforces registry IDs, real-path containment and expected hashes. Hosted reads use the packaged snapshot, with no Git process or external GitHub dependency at request time. A missing/mismatched snapshot fails closed; it never falls back to mutable working files.

Show the deployed commit and link to its GitHub source. Where Docker excludes Git history, retain the commit-pinned history links and label file-level history unavailable instead of inventing dates or approval. Local mode retains working-file discovery, edit detection and refresh. Hosted changes appear only with deployment of the updated code and references.

## Examples and references

The existing catalogue renders real application components with synthetic fixtures and local callbacks. Only the independently authorised component-preview route allows same-origin embedding; business pages retain DENY. HTML references retain their restrictive CSP sandbox with no same-origin privilege, networking, forms or top navigation. Theme proposals and fixture edits remain temporary. Durable design/theme/code changes require Git changes, validation and deployment. No browser code editor, CMS, extra service, credential-bearing endpoint or business-write route is added.

## Alternatives and limits

A separate catalogue service would duplicate hosting and release authority. Giving every tester access would exceed the requested solo-developer scope. A new business capability and database migration would conflate design-tool access with operational permissions. The selected deployment policy is intentionally a single-owner boundary; any later multi-person editor workflow needs a separate access decision.

Source presence, deployment, visual alignment and business acceptance stay distinct. Draft guides remain clearly labelled and only supplement existing help for authorised workspace users. The catalogue's unresolved reviews remain unresolved.

Verification and rollback: [delivery record](../delivery/hosted-design-workspace.md). Technical basis: [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication), including independent server authorisation for route handlers.
