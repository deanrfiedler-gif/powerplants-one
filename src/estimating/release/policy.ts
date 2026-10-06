import { canonical } from "../../platform/operations";
import { digest } from "../../documents/store";

// Explicit non-operative local fixture; never an operational delegation or terms catalogue.
export const releasePolicy = Object.freeze({
  id: "SYN-ES05-01",
  terms_version: "PPO-SYN-NONOPERATIVE-TERMS-r01",
  template_version: "PPO-SYN-RELEASE-r01",
  terms:
    "Synthetic demonstration only. This document has no commercial validity, is not an operative offer, and authorises no work, payment or external communication.",
  operative_terms: "Not configured",
  financial_exceptions: "Not configured",
  validity_period: "Not configured",
  self_approval: false,
  independent_issuer: true,
  delivery_provider: "None — recorded simulation only",
});
export const releasePolicyHash = digest(canonical(releasePolicy));
export const releaseCapabilities = {
  Prepare: "estimating.quote.prepare",
  Approval: "estimating.quote.approve",
  Issue: "estimating.quote.issue",
  Distribution: "estimating.quote.distribute",
} as const;
export type ReleaseAction = keyof typeof releaseCapabilities;
