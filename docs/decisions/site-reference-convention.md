# Short synthetic Site references

<!-- versioning: git; committed history is authoritative -->

Document ID: PPO-SITE-REFERENCE-DEC
Owner: Dean Fiedler
Status: Owner decision recorded; implementation and owner visual review separate
Date: 20 October 2026

Dean asked whether `SYN-SITE-…` was the more professional approach. The recommendation was to adopt the shorter convention deliberately, preserving compatibility and traceability. Dean approved: "I am happy for you to adopt the shorter convention deliberately, as per your recommendation."

This resolves the implementation question raised by [Sites Q3](sites-figma-design.md): the accepted design uses `SYN-SITE-…`, while existing synthetic identity storage allocates permanent `SYN-PPO-SITE-…` references. It supersedes the recommendation to retain the longer spelling in the [preflight build record](../delivery/sites-cs04-build.md), not the accepted design.

## Reference contract

- Public Site references use `SYN-SITE-` followed by the complete existing numeric suffix, including leading zeroes. The mapping is exact and reversible within the Site namespace. It never renumbers a record.
- Existing immutable storage references remain intact as legacy references. Site read APIs provide the shorter `display_number` and the original `legacy_display_number`; commands continue to use opaque IDs. No external ERP key, historical record, issued document or stored identity is renamed.
- Site register and shared Site search accept both spellings with the same permission checks. Existing UUID links remain valid. References do not confer access and are unique only within their existing workspace namespace.
- The rule is applied at the Site read/search boundary so consumers agree. Other record types are separate increments; no product-wide replacement is implied by this page change.
- No migration, dependency, capability or production data change is required for this reversible mapping. A future change to storage allocation would be a separate schema change with upgrade and historical-identity proofs.

Owner approval of the convention is not evidence of an implemented or visually reviewed page. The CS-04 pull request records executed compatibility and page checks.
