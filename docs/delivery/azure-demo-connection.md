# Azure demo connection setup

| Field | Value |
|---|---|
| Document ID | PPO-DEMO-AZURE-CONNECTION |
| Revision | r03 |
| Date | 9 September 2026 |
| Status | Connection verified; hosted app preparation separately in progress |
| Owner | Dean Fiedler — prototype owner |

The next step is to connect this GitHub repository to the demo resource group. This prepares a repeatable delivery path while application development continues. The connection check is deliberately limited to reading Azure account/resource-group metadata.

## Starting position

Dean supplied Azure portal screenshots showing an active **PPO Prototype Demo** subscription, Owner access, a monthly **PPO-Demo-Monthly** budget of **200**, an empty **rg-ppo-demo-aue** resource group and the Default Directory tenant. Budget currency/alert recipients and the resource group's actual location were not visible. The directory's Australian data location does not establish the location of future app/database resources.

The user has chosen a private hosted demo. The current application still rejects remote/shared use of synthetic identity in [platform configuration](../../src/platform/config.ts); its local server binds to loopback. A successful connection check does not change these restrictions or establish app readiness. The [demo package PR](https://github.com/deanrfiedler-gif/powerplants-one/pull/60) carries the broader proposed demo scope and costs.

## 1. Create the GitHub environment

Open the [repository environments](https://github.com/deanrfiedler-gif/powerplants-one/settings/environments), then:

1. Select **New environment** and name it **ppo-demo**.
2. Under **Deployment branches and tags**, choose **Selected branches and tags**.
3. Add a **Branch** rule for **main** only. This also protects OIDC use: the federated subject below names an environment, so the environment must constrain which branches can use it.
4. Under **Environment variables**, add **AZURE_RESOURCE_GROUP** with value **rg-ppo-demo-aue**.

If the branch protection option is unavailable under the account's GitHub plan, resolve that before adding Azure federation. Do not substitute an unrestricted environment. This connection does not invite testers or give them repository permissions.

## 2. Create the Azure identity

In the Azure portal:

1. Search for **Managed Identities** and select **Create**.
2. Select subscription **PPO Prototype Demo** and existing resource group **rg-ppo-demo-aue**.
3. Choose region **Australia East**.
4. Name the identity **id-ppo-demo-github-read**.
5. Select **Review + create**, check those values, then **Create**.
6. Open its **Overview** and locate **Client ID**, **Principal ID** and **Subscription ID**. Use **Client ID**, not Principal/Object ID, for GitHub login.

This is a user-assigned managed identity for the GitHub connection. It is separate from future app user sign-in. If this exact identity already exists, inspect it and its role/federation settings before reusing it.

## 3. Allow it to read the demo resource group

1. Open **Resource groups → rg-ppo-demo-aue → Access control (IAM)**.
2. Select **Add → Add role assignment**.
3. Select the **Reader** role.
4. On **Members**, choose **Managed identity → Select members**.
5. Select **PPO Prototype Demo → User-assigned managed identity → id-ppo-demo-github-read**.
6. Select **Review + assign**.

The role assignment must be at this resource group's scope. The identity needs no subscription-wide role, Contributor role or Owner role for the check. Reader permits resource metadata reads; it cannot create the hosting services.

## 4. Link the identity to this GitHub environment

Open **id-ppo-demo-github-read → Settings → Federated credentials → Add Credential**. Choose the GitHub Actions scenario and enter:

| Setting | Value |
|---|---|
| Organisation / owner | deanrfiedler-gif |
| Organisation ID / Owner ID | 231005545 |
| Repository | powerplants-one |
| Repository ID | 1357680346 |
| Entity type | Environment |
| Environment | ppo-demo |
| Credential name | github-ppo-demo-read |
| Issuer | https://token.actions.githubusercontent.com |
| Audience | api://AzureADTokenExchange |
| Subject identifier | repo:deanrfiedler-gif@231005545/powerplants-one@1357680346:environment:ppo-demo |

Check the automatically generated issuer, audience and subject against the table, then select **Add**. No client password or client secret is created.

**r02 correction:** The previous guide omitted the Organisation ID and Repository ID fields and used the older name-only subject. GitHub applies immutable subjects by default to repositories created after 15 July 2026. This repository was created on 4 September 2026; its numeric owner and repository IDs above were verified using GitHub repository metadata. Although Azure labels the field Organisation ID, this repository belongs to a personal GitHub account, so use its numeric owner ID. It is separate from the Azure tenant ID.

The subject above is the expected current default for the `ppo-demo` environment, derived from that repository metadata and GitHub's documented format. The connected GitHub tool cannot read the repository's OIDC customisation endpoint, so a custom subject override has not been ruled out and no live token has been observed. If Azure generates a different subject, compare the names, numeric IDs and Environment selection; if the connection later reports a mismatch, inspect the repository's OIDC settings before changing trust. Do not reuse the superseded name-only subject. The [GitHub OIDC reference](https://docs.github.com/en/actions/reference/security/oidc#immutable-subject-claims) and [Microsoft migration guidance](https://learn.microsoft.com/en-us/entra/workload-id/workload-identities-github-immutable-subjects) describe the new format.

## 5. Store the three IDs in GitHub

Return to **Settings → Environments → ppo-demo → Environment secrets**. Add:

| Secret name | Copy its value from |
|---|---|
| AZURE_CLIENT_ID | The managed identity's **Client ID** |
| AZURE_SUBSCRIPTION_ID | **PPO Prototype Demo → Overview → Subscription ID** |
| AZURE_TENANT_ID | **Microsoft Entra ID → Overview/Properties → Tenant ID** |

Use the subscription and tenant shown in Dean's portal. Keep their actual values in environment configuration rather than committing them to source. These identifiers are not passwords; using environment secrets also masks them in ordinary action logs. Do not create a publish profile, access key or long-lived GitHub/Azure password for this procedure.

## 6. Run the prepared connection check

The pull request containing [azure-demo-connection.yml](../../.github/workflows/azure-demo-connection.yml) must first be merged to **main** after its applicable checks pass. GitHub displays a manually triggered workflow once it exists on the default branch.

1. Open **Actions → Azure demo connection check**.
2. Select **Run workflow**, choose **main**, and run it.
3. Open the run. A passing summary says **Azure demo connection verified**.
4. Record the run URL as the connection evidence. A created identity or screenshot alone is not a passed connection test.

The workflow runs only when manually requested on main in this repository. It uses a pinned Azure Login action and short-lived OIDC tokens, performs account/resource-group reads, and checks the returned subscription, tenant, subscription state and exact resource group. It does not check out application code, create resources, publish the app, change IAM or list database/file contents.

## Troubleshooting

| Result | Check |
|---|---|
| Workflow absent from Actions | The workflow must be on main before its manual run button is available. |
| Job skipped or environment rejects it | Select main and confirm the environment permits only the main branch. |
| Missing or invalid configuration | Check environment name, three secret names/GUID values and the resource-group variable. |
| No matching federated identity | Compare owner/name and numeric ID, repo/name and numeric ID, environment, issuer, audience and subject exactly; check any GitHub OIDC customisation; allow a few minutes for newly created trust to propagate, then rerun. |
| Azure login finds no accessible subscription, or group read is denied | Check the Client ID and Reader assignment on the intended group, subscription and tenant; allow new IAM grants time to propagate. |
| Managed identity creation/role assignment denied | Confirm the selected subscription and directory. The setup needs identity-creation and role-assignment rights; the workflow identity itself remains Reader. |

Do not broaden the role or disable the application's local-only checks to make this test pass.

## Next increment and removal

Once the connection passes, prepare and verify the narrow hosted runtime: real sign-in restricted to the approved tester list, remote server configuration, PostgreSQL and durable demo files, synthetic seeding/reset, then a costed Azure deployment. Use a separate deployment identity with only the permissions needed by that reviewed deployment. GitHub federation authenticates automation; it does not authenticate colleagues using PPO.

This setup creates one identity, one federated trust and one Reader assignment. It provisions no application compute, database, registry or storage. It is not a hosting price quote. The existing budget sends alerts; it is not an automatic spending cap.

To retire this connection, remove **github-ppo-demo-read** from the identity's federated credentials, then remove this identity's **Reader** assignment from the group's IAM page. Delete **id-ppo-demo-github-read** only after confirming it is dedicated to this check and not used elsewhere; remove the associated GitHub environment secrets when no remaining workflow needs them. Do not delete the resource group as a connection reset.

## Sources and verification boundary

- [Microsoft: Azure Login with OIDC](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-openid-connect)
- [Microsoft: Managed identity federated credentials](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation-create-trust-user-assigned-managed-identity)
- [GitHub: Manage environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
- [Microsoft: Azure budgets](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets)

Source review: 9 September 2026. Local validation can check the workflow structure and shell guards; only an actual successful Azure workflow run proves this account connection. No Azure action has been executed by preparing these repository files.

## Verified connection — 9 September 2026

[Run 34310429878](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34310429878) passed on main `f8035b5c55251da4da52430adf2f83094feccd6b`. Login used the immutable subject recorded above; subscription, tenant, active state and exact resource group matched. This observed token supersedes earlier unverified-default notes. The CLI version warning was caused by output suppression before the successful login; this revision lets the pinned login step read JSON while retaining suppressed output elsewhere. [Hosted demo implementation](../delivery/azure-private-demo.md) remains separate from this read-only connection proof.
