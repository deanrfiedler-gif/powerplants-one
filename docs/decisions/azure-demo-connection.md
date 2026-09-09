# Azure demo connection preparation

| Field | Value |
|---|---|
| Document ID | PPO-DEMO-AZURE-CONNECTION-DEC |
| Revision | r01 |
| Date | 9 September 2026 |
| Status | Implementation choice for the requested demo preparation; live setup pending |
| Owner | Dean Fiedler — prototype owner |

Dean chose an independently accessible private hosted demo, created the Azure subscription and budget, and supplied resource-group and tenant screenshots. Preparing its delivery connection is within that request. The screenshots establish the observed account setup; they do not give this session authenticated Azure access.

Use GitHub OIDC federation with a dedicated user-assigned managed identity and a **Reader** assignment scoped to **rg-ppo-demo-aue** for the first connection check. This avoids a stored deployment password and allows the Azure resource owner to establish trust without assuming an Entra application-administrator role. A managed identity for automation is separate from end-user sign-in.

The exact trust subject names **deanrfiedler-gif/powerplants-one** and environment **ppo-demo**. Restrict that environment to **main**; the workflow also checks repository and branch, runs only on manual dispatch and requests only OIDC-token permission. There is no checkout or deploy step.

Alternatives considered: a client secret creates a long-lived credential to rotate; subscription-wide Contributor is unnecessary for metadata verification; directly exposing the existing local server would violate its synthetic identity boundary. A later deployment identity and runtime access model remain concrete implementation work.

The [setup guide](../delivery/azure-demo-connection.md) defines user actions, configuration, verification and removal. Keep actual tenant/subscription/client values outside source. Live connection success, hosted login, deployed services and tester access remain unverified until their own execution evidence exists. This record does not close P12, production readiness or the broader hosting decisions.
