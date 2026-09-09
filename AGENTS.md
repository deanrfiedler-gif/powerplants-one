# Repository guidance

## Context

Powerplants One is Dean Fiedler's personal prototype in a public source repository. Hosted demo access remains separate and restricted to approved testers. Read `README.md`, `docs/STATUS.md` and the relevant parts of the current blueprint before making changes. Follow current user instructions; historical document approval gates are business context, not evidence that the user must re-authorise already requested repository work.

## Evidence and scope

Preserve the distinction between a user decision, documented CREMS behaviour, bounded prior account observation, proposed design and unresolved question. Never turn a prototype, mocked response, disabled Smartsheet rule or example calculation into a production claim.

Retain issued source snapshots in `docs/reference/` unchanged. The working master uses a stable versionless filename; edit working specifications through reviewed changes and preserve baseline/traceability. Record newer decisions in `docs/decisions/` and update `docs/STATUS.md`. Preserve all existing parent requirement IDs. Derived registers must identify their source and remain consistent with the parent scope.

MYOB remains the intended ERP authority; SharePoint owns business documents; native CAD tools retain authoring responsibilities. This repository task does not authorise business transactions, production integration, customer communications or migration. Apply the actual scope of subsequent user instructions.

## Adopted naming and project instructions

Follow [PPO-STD-001](docs/standards/naming-conventions.md) and [ADR-0005](docs/decisions/ADR-0005-project-naming-adoption.md). Powerplants One / PPO is independent of the other project's STD-001 and SOL008. Current master: `docs/blueprints/BP-01-master-blueprint.md`. Preserve the exact issued references and all 78 parent IDs. Apply documented local-to-source mappings; do not rename external records. Keep the maintained [ChatGPT instructions](docs/standards/chatgpt-project-instructions.md) aligned with substantive decisions without treating a copied instruction block as fresher than the repository.

## Implementation

Keep changes small enough to review. Inspect existing work before editing. Use branches and pull requests; report validation and any limits accurately. Avoid unrequested frameworks, dependencies, services, deployment infrastructure or bulk issue creation.

Use synthetic or specifically approved redacted fixtures. Keep credentials, connection strings, raw production exports and operational documents outside the repository. `.gitignore` is a convenience, not a security boundary. Do not place secrets in examples, issues, logs or test evidence.

Before choosing a technology, capture the reason, constraints and alternatives in an architecture decision record. Use stable internal IDs and explicit external company/entity keys; do not invent undocumented ERP endpoints or CREMS formulas.

## Validation and handover

Run `python3 scripts/check_foundation.py` for foundation changes and `python3 scripts/check_prototype.py` for PP-01 package changes. Run `python3 scripts/check_naming.py` for naming/guidance changes. Add meaningful application tests only when application behaviour exists. The current check is documentation assurance, not business acceptance.

Link work to requirement, decision, interface and acceptance IDs where relevant. Explain what changed, what was checked and what remains open. Keep code delivery status separate from business approval and production readiness.
