# Document library native read support

Owner: Dean Fiedler. Implementation decision by Codex under the standing order, 31 October 2026. Independent review and application visual acceptance remain pending.

## Context

The [accepted Document library design](document-library-figma-design.md) resolves Q2 to Number/Updated sorting and Q5 to controlled UI types. DK-01/DK-02 also needs authorised labels, exact revision history and source/target choices. Existing commands, permissions and source authority remain the owners of business rules.

## Decision

Use the existing application/PostgreSQL read infrastructure. Add signed register continuation bound to actor, workspace, working company, filters, order and page size. Add GET revisions and options alongside the existing library reads. A revision is presented only after revision/source authority succeeds. A choice uses the same existing context/owner/source checks as its command; selecting a choice never grants authority. The RecordedOwner filter is distinct from the currently eligible Owner assignment picker. The My documents view binds to the current actor.

Load 25 more rereads the displayed window, clearing rows on denied or failed reads. Rows do not claim a total. History, revisions and links disclose partial coverage without hidden identities or counts. User labels are read only within an authorised document context.

## Alternatives and boundaries

Assembling revision history from events would duplicate revisions and lose independent exact-source visibility. Showing raw IDs or arbitrary client-entered source IDs would leave the accepted choice workflows unusable. Reusing the native context functions in read-only choice endpoints preserves one authority model and avoids new permissions. This introduces no technology choice, migration, capability, grant or dependency.

The [API contract](../contracts/document-library.md) and [workspace ledger](../testing/evidence/document-library/workspace/README.md) describe payloads and validation. No review request, automatic link retargeting, live SharePoint integration, distribution or operating authority is added.
