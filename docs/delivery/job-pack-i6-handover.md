# Job Pack structured saved sections

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Scope: SV-05 / SC-06; SVC-03, SVC-06, OUT-09. Review: implementation for review; no owner acceptance or deployment claim. Based on I4 `899dd6e`; the inspected main refresh `6c5e7c4` contains unrelated estimating/Projects changes.

## Result and authority

Implements adopted D6-A from the Job Pack build report and integration plan. Pure v1 formatter functions replace the equivalent inline snapshot text construction without changing schema, template version, canonical data or output rendering. Arrangements and controls are read from frozen text with strict delimiter/outcome handling. Scope, equipment, history and completion use an optional permission-scoped section_view and must re-serialise exactly. Failure keeps the saved text verbatim.

The scope projection uses the exact approved scope/hash. History verifies the original five-column hash before converting occurrence time to JSON. Denied dependencies stay null; the enclosing pack visibility rules still deny the whole read where applicable. Staff asset links additionally require asset visibility. Recipients get no internal asset IDs and retain the exact readable issue revision while staff prepare a successor. This corrects the former current_revision_id pointing outside the recipient revision list.

The runtime uses the existing r03 grids, lists, notes and native disclosures in Job pack and Preparation. The exact saved wording remains accessible. Captured controls are distinguished from current readiness. No migrations, capabilities, commands, immutable snapshot schema, digest, template or OUT-09 change.

## Verification

- Six unit cases passed against the pre-I6 retained text, including multiline/null coercion, ambiguous delimiters, future templates, denied/mismatched scope and history identity/hash proof.
- Three focused database cases passed: original snapshot digest and scope structure; recipient old issue during staff successor; exact history hash and revoked permissions. The task's disposable ppo_synthetic_test uses a temporary 60-second statement timeout wrapper for slow local seeding. Production/application timeout remains 10 seconds; this is not standard-timeout performance proof.
- The unchanged I4 implementation `d0bfd24` created an actual immutable revision in the disposable database. I6 read it and completed Check with identical snapshot and digest. This cross-check supplements the retained text fixture; no historical order of commits is claimed for the extraction.
- Three focused database cases passed again after requiring stored approved assets and batching selected history into one read. Pack read is not one of the four PT-27 measured reads (Customers, Work order, Planner, My Jobs); no PT-27 performance claim is made for it.
- Typecheck, changed-source lint, production build, foundation, naming and studio register checks passed. The final server projection guard was verified by the database cases; CI will verify the final compiled server.
- Compiled I6 plus I4 and r03 conformance: **22 passed, six deliberate duplicate mobile-project skips**. Verified sections, exact text, unavailable/mismatched fallback and keyboard disclosures pass across six widths. [Retained application captures and inspection](../testing/evidence/job-pack-i6/README.md) keep visual evidence separate from owner acceptance.
- I7 presentation refinements and I5 final conformance/entry links/paired evidence remain. Physical device, owner acceptance and deployment remain open.
