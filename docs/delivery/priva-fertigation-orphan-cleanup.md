# Native fertigation abandoned local uploads

Committed preparation manifests and historical report/evidence bytes remain
immutable, including preparations the user has not yet linked into a successor.
A failed database commit can leave private bytes without a committed manifest.
They have no authorized download route and are retained for original-operation
recovery before any cleanup.

The local synthetic maintenance tool audits at most 25 permanently closed
`AttachFertigationEvidence` or `PrepareFertigationOutput` operations. Use the
native original-operation recovery flow to resolve an abandoned operation without
acceptance first. An accepted original cannot be closed or reclaimed this way.

Run with the existing private local environment; do not put connection details
on the command line:

```powershell
node --env-file=.env.local --import tsx scripts/fertigation-orphans.ts audit <workspace-uuid> [offset]
```

The audit reports only synthetic UUIDs, exact hashes, byte counts and retention
status. Use the returned `next_offset` to inspect the next bounded page. A retained
or already absent entry does not prevent auditing later closed operations.
It retains files younger than 24 hours and any shared document-key, record-ID
or operation-ID reference found in the live schema. It does not scan or
delete arbitrary files, `.tmp` files, historical manifests or hosted objects.

For one audited eligible orphan, stop the application, workers and browser as
required by the existing recovery policy. Then explicitly supply the exact audit
identity and hash:

```powershell
$env:PPO_RECOVERY_STOPPED = 'application-worker-browser-stopped'
node --env-file=.env.local --import tsx scripts/fertigation-orphans.ts cleanup <workspace-uuid> <original-actor-uuid> <closed-operation-uuid> <audited-sha256>
```

Cleanup locks the original workspace/operation, repeats reference and age checks,
verifies the canonical private path and original bytes, and unlinks only that
exact file. It never recursively deletes directories or rewrites database
history. The local-synthetic configuration guard refuses hosted/production
environments; no cloud cleanup capability or live SharePoint connection is added.
Keep the audit/result in the private operational record. Schema inventories above
512 relevant columns are held for a separate bounded review rather than guessed.
