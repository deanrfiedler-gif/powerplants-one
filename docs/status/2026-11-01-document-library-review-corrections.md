---
title: Document library review corrections
date: 2026-11-01
---


Owner: Dean Fiedler. Scope DK-01/DK-02, DOC-01/DOC-02/DOC-04/DOC-06. Implementation and acceptance remain separate.

PR #706 integrates current main and the released #814 native-test discovery correction. The library successor opens its new exact revision while retaining the originating list context. Revisions and Links use the accepted table/panel composition, links filter on the server before pagination, and History uses immutable event summaries after source/target authority checks. Site-only registration explains its required site. Applied filters stay visible on tablet, Reset preserves view/sort, attention banners differ from all-clear, and command confirmations use completed-action wording.

No migration, capability, permission grant, dependency or external integration is added by these corrections. SharePoint remains business-document authority. `/documents/[id]` remains the issued job-pack viewer. Validation and source-bound captures are recorded in `docs/testing/evidence/document-library/workspace/README.md`; fresh exact-head review, visual/workflow acceptance and deployment remain separate.

The final state pass also clears unsubmitted search text on Reset, labels unreadable saved choices as unavailable, and places the exact-content-unavailable warning first in Overview, with authorised recovery as the primary record action.
