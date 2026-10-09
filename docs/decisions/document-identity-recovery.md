# Document identity and recovery proof

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Direction: 10 October 2026 (Australia/Brisbane). Scope: PT-18 / AT-20 / AT-36 and the existing document identity, exact-issue and access contracts. Review: source self-review and local synthetic verification; independent review and owner acceptance remain separate.

Dean authorised document identity and recovery testing alongside his UI work in Claude. The independent branch starts from main `184b933836b9790b4ffb6565552475a1af1eec24`; the job-pack and Service/Finance storage-time permission fixes in PRs #378/#379 remain separate. This contribution changes tests and evidence only. No runtime, UI, schema, seed, permission, dependency or integration change is needed for the observed behaviour. No merge or deployment is included.

The existing model separates immutable `pack_sources` identities and version hashes from mutable `pack_source_locations` display/availability projections. Source bytes and issued bundles use the private synthetic document store. Earlier tests changed a display name or availability flag; they did not join actual file movement, an explicit replacement identity, reviewed successor preparation and retained pack/report/Finance retrieval.

Exercise the existing boundary with real synthetic files: rename the display projection without changing identity; move the file to a different opaque item key; remove the retained version; and place different bytes at the original key. A newly observed item with the same title/hash must not retarget an immutable source. Fixture registration represents a synthetic discovery observation only. The existing preparation, check and issue commands must explicitly select and review a successor source; registration alone grants no release authority.

The new tests pass on unchanged application source. A missing or mismatched source refuses new preparation, while retained issued copies remain exact. Missing retained output returns an owned retryable error; restoring the original file recovers the same issue without generating another. Existing audit/receipt/issue rows remain intact. The evidence records both the separate unstarted-visit reconciliation procedure and the joined already-issued three-output procedure rather than pretending a completed attendance can be re-prepared.

[Execution evidence](../testing/evidence/document-identity-recovery/README.md) supplies exact keys, issue IDs, hashes, commands and limitations. These are synthetic local-storage semantics, not assertions about SharePoint rename/move behaviour. There is no new source-ingestion or reconciliation endpoint. An authenticated customer delivery channel, live provider behaviour/retention, independent review and owner/device acceptance remain unproven. PT-18 therefore retains a component disposition; no parent acceptance is promoted.
