# Deliberate directory navigation experiment

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Direction: 8 October 2026. Final bounded quality continuation before the requested stop; source delivery, owner acceptance and deployment remain separate.

The [gateway/classification evidence](../testing/evidence/customer-server-diagnosis/README.md) confirms automatic record requests during Customers loading. This experiment disables automatic prefetch at the six Link sites owned by CrmDirectory: desktop names, affiliations, numeric Site/Facility counts, New, local context tabs and mobile cards. The user still activates the same href through pointer, keyboard or touch. Shared shell and Contacts hub view selection, permissions, cache policy and leave-intent handling are unchanged.

The alternative is to retain all current automatic prefetch, which may make later navigation faster but speculatively loads destinations the user might never choose. No global prefetch rule, dependency, session or database change is justified by this experiment. Reduced background requests alone do not establish faster initial or next-page loading.

[Execution and source-bound evidence](../testing/evidence/customer-directory-prefetch/README.md) record the fresh-context probe, actual receiving journeys and existing regression checks, including failed setup attempts and the test-only correction. The unchanged PT-27 timing target, ten-user performance, hosted operation and actual owner/device/accessibility acceptance remain open. Nothing in this decision authorises a merge or deployment.
