# Azure private demo runtime

**Document ID:** PPO-DEMO-RUNTIME-DEC · **Revision:** r01 · **Date:** 9 September 2026 · **Owner:** Dean Fiedler · **Status:** Implementation in progress.

Dean authorised the next hosted-demo preparation after the successful [connection check](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34310429878). This increment prepares deployment code and a reviewable PR. It does not execute paid Azure provisioning or invite colleagues.

Use the existing Next.js/PostgreSQL application with a separate explicit `azure-demo` runtime. Preserve `localConfig`, loopback startup, local identity selection, existing migration bytes and business permissions. The hosted launcher uses compiled Next.js, accepts only its configured HTTPS origin, authenticates every application request and refuses the synthetic identity-selection endpoint. Do not route the development launcher through a tunnel.

Use pinned `openid-client` for single-tenant Microsoft Entra authorization-code sign-in with PKCE, state and nonce. Store short-lived, one-use login attempts and opaque sessions in PostgreSQL. Each invited Entra object maps to a distinct synthetic PPO actor, with Company A customer/CRM/estimating grants and an expiry. Recheck that mapping on every request. Email domains, forwarded identity headers and a shared Coordinator account confer no authority. This avoids reliance on an unverified proxy identity boundary. Application sign-in needs its own Entra registration; GitHub's Reader identity remains separate.

Use Azure Container Apps Consumption, Azure Database for PostgreSQL Flexible Server and a private Azure Blob container. The storage adapter preserves Synthetic document keys, exact content hashes and conditional first-write semantics. Blob storage avoids depending on local filesystem ownership, hard links and fsync behaviour on a network share. It is separate from future SharePoint ownership of business documents. Use a private network path to PostgreSQL; do not expose its firewall to all internet addresses.

Keep deployment manual on the protected `ppo-demo` environment, building the selected main commit. Infrastructure bootstrap is separate from routine image updates. Bootstrap/migration jobs use an operator database credential; web/worker use a database role without schema or access-administration rights. Never reset or seed on ordinary web startup or image deployment. A reset uses a new database/storage epoch with a retained previous epoch, not destructive schema deletion from a browser.

The narrow demo covers customer context, CRM follow-up and E1 manual draft quoting. Offline, Service/Finance operational work, real data, AI providers, email sending and full P12 acceptance remain outside this increment. Live Microsoft sign-in, cloud persistence/restart and desktop/phone acceptance must be exercised after operator setup; local tests cannot establish those outcomes.

Sources reviewed 9 September 2026: [OIDC client](https://github.com/panva/openid-client), [Microsoft authorization-code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow), [Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/overview).
