# Azure private demo deployment

**Document ID:** PPO-DEMO-RUNTIME · **Revision:** r03 · **Date:** 9 September 2026 · **Owner:** Dean Fiedler · **State:** Prepared implementation; cloud deployment and invited-user acceptance not executed.

The [GitHub-to-Azure connection check passed](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34310429878) on main `f8035b5c55251da4da52430adf2f83094feccd6b`. This package adds the hosted runtime, individual Entra sign-in, expiring tester mapping, private Blob adapter, infrastructure template, operator commands and a separate image-update workflow. [Decision](../decisions/azure-private-demo.md). No paid resources or invitations are created by merging these files.

## What this demo demonstrates

Use fictional Company A customer/site/equipment context, CRM opportunity creation/qualification/Activities, each tester’s private synthetic Email/Calendar journey and E1 manual estimates with exact draft quotation HTML/PDF. Each of up to five testers has a separate actor; size the first session for three simultaneous people. The tester's screen uses a synthetic alias while sign-in uses their actual invited Microsoft account. Company B, other workspaces and Service/Finance permissions are not granted. Local development and its identity chooser remain available only through the existing local launcher.

The [combined Email/CRM handover](demo-email-crm-integration.md) adds the shared UI refinements and two fictional emails plus two initial-day Brisbane meetings per invited tester. Reconciliation preserves existing messages, dates and follow-ups. This grants no Microsoft mailbox access.

The database setup preserves all original migration/seed bytes. It adds a separate checksummed hosted identity migration. Initial seeds contain customer context but **no opportunities or estimates**. For the first rehearsal, create these through the app (this table is a preparation recipe, not a claim that records already exist):

| Opportunity title | Prepare in CRM |
|---|---|
| SYN DEMO — Irrigation controls enquiry | Enquiry; next contact tomorrow. |
| SYN DEMO — Controls package for draft estimating | Qualify through the normal form; next review in two days. |
| SYN DEMO — Sensor follow-up overdue | Enquiry; an Activity due two days ago. |
| SYN DEMO — Qualified scope needs its next action | Qualify, complete the initial Activity with an outcome, leave the next action unplanned. |
| SYN DEMO — Site meeting date to be agreed | Enquiry; Date needed. |
| SYN DEMO — Propagation greenhouse controls and irrigation review | Qualify; Activity due today. |

Use the Company A organisation `SYN-PPO-ORG-000001`, site `SYN-PPO-SITE-000001`, contact `SYN Avery Contact` and the signed-in tester as owner. Prepare the records once; reload and compare Board/List. In the estimating scenario enter fictional Product 1 × cost 8,000.00 / sell 10,000.50; Labour 10 hours × cost 100.00 / sell 150.00; Freight 1 × cost 900.00 / sell 1,250.00. Expected sell total: **A$12,750.50 excluding tax**. Save a second version with 12 labour hours: **A$13,050.50**. Prepare a Draft, deselect Print for labour while keeping it included, and inspect its allowance and exact saved version. Do not send it to a customer.

## 1. Create the application sign-in registration

This is the owner's next Azure setup task. It is separate from `id-ppo-demo-github-read` and the three existing GitHub secrets.

1. In Azure, confirm **PPO Prototype Demo** and its existing directory are selected.
2. Search **Microsoft Entra ID**, then open **App registrations → New registration**.
3. Name it **Powerplants One Private Demo**. Select **Accounts in this organizational directory only**. Leave Redirect URI empty for now; the exact address is produced after the hosting environment exists. Select **Register**.
4. Copy its **Application (client) ID**. This is the demo web application's ID, not the GitHub automation ID.
5. Open **Certificates & secrets → Client secrets → New client secret**. Use description `ppo-private-demo`, choose a short available expiry covering the evaluation, then **Add**. Store the secret's **Value** in your password manager immediately, together with its expiry. Do not paste it into a chat, GitHub issue or source file.
6. Open **Enterprise applications → Powerplants One Private Demo → Properties**. Set **Assignment required? → Yes**, then save. Assign your own tenant user under **Users and groups → Add user/group**. This is application access, not an Azure subscription role. Assign individuals if group assignment is unavailable under the directory's licence.
7. Under **Microsoft Entra ID → Users**, open your own user and copy its **Object ID**. For a personal Microsoft/Gmail-backed sign-in, use the user object in this selected directory. Tenant ID, application client ID and user Object ID are different values.

This app requests `openid profile` for sign-in. It does not need mail, calendar, files or tenant-wide Graph application permissions. If the portal refuses registration or assignment, the directory administrator must perform those specific steps; subscription Owner alone does not establish every Entra permission.

## 2. Prepare Cloud Shell and review the infrastructure

After this PR's checks pass and the owner merges it, open the Azure portal's **Cloud Shell** button and select **Bash**. Use the exact demo subscription. Cloud Shell may require its own storage account; review that separate setup if prompted.

```bash
az account set --subscription 'PPO Prototype Demo'
git clone https://github.com/deanrfiedler-gif/powerplants-one.git
cd powerplants-one
git switch main
git pull --ff-only
az extension add --name containerapp --upgrade
az bicep install
```

If the repository is private at execution time, authenticate Git using your normal approved method; do not embed a GitHub token in its URL. Existing local working copies can use GitHub Desktop instead, but these operator commands expect Bash/Python/Azure CLI.

Register any unregistered providers in **Subscriptions → PPO Prototype Demo → Resource providers**: `Microsoft.App`, `Microsoft.Network`, `Microsoft.DBforPostgreSQL`, `Microsoft.Storage`, `Microsoft.ContainerRegistry`, `Microsoft.ManagedIdentity`, `Microsoft.OperationalInsights`. This does not itself provision their services.

Create private operator settings outside the checkout:

```bash
python3 infra/azure-demo/ppo_operator.py configure ../ppo-demo-settings.local.json
python3 infra/azure-demo/ppo_operator.py plan ../ppo-demo-settings.local.json
```

The configure command asks for the new application ID, secret Value (hidden while typing) and your user Object ID. It records the selected subscription/tenant, generates resource suffix, database/storage epoch and two database passwords, and initially allows your account for thirteen days. Keep a secure backup of the generated settings. The plan reads the target group and runs Azure What-If. It does not deploy.

The plan contains one Consumption environment, one warm web replica (1 vCPU/2 GiB), a short scheduled draft-recovery job, an on-demand operator job, PostgreSQL 16 B1ms/32 GiB/7-day backups, private database networking/DNS, Basic container registry, private LRS Blob storage with 7-day soft deletion/versioning, bounded Log Analytics and a registry-pull identity. Check regional availability and the displayed Azure plan before continuing.

### Cost review

Use the [Azure pricing calculator](https://azure.microsoft.com/en-au/pricing/calculator/) for **Australia East**, AUD and your subscription offer. The older [demo proposal](https://github.com/deanrfiedler-gif/powerplants-one/pull/60) estimated about A$160/month including contingency; it is not a quote for this implementation. Price compute/requests (including the warm replica and scheduled jobs), PostgreSQL compute/storage/backups, registry/build minutes, Blob storage/versions/transactions, monitoring, networking and egress. Include Cloud Shell storage if created. Resource availability, credits, tax and your agreement can change the result. Review against your **200 monthly budget** before running provision; a budget alert is not an automatic spending cap. No reliable current subscription-specific total has been obtained in this session.

### Older checkout: Python import error before configuration

The original `operator.py` filename shadows Python's standard-library `operator` module. Dean's Python 3.12 Cloud Shell reproduced `ImportError: cannot import name 'eq' from partially initialized module 'operator'` before any prompts, settings writes or Azure commands. The script is now named `ppo_operator.py`; its behaviour and private settings format are unchanged.

For the existing pinned checkout `f0898b7e7671b9339e9289b17eee59c865f4f810`, use Python's `-P` option to complete configuration and the read-only plan without editing tracked files:

```bash
python3 -P infra/azure-demo/operator.py configure ../ppo-demo-settings.local.json
python3 -P infra/azure-demo/operator.py plan ../ppo-demo-settings.local.json
```

Run configure only if settings have not already been saved; if the file exists, retain it and proceed to plan. Python 3.11+ supports [-P](https://docs.python.org/3.12/using/cmdline.html#cmdoption-P), which prevents prepending the script directory to the import path. Startup with this option was verified on Python 3.12.14. The permanent fix is covered by a fresh-interpreter CLI startup test: it failed with the original name and passes with the new name, alongside the four existing operator tests. Earlier tests imported the script after standard-library imports and therefore missed direct CLI startup. Actual authenticated configuration and Azure What-If remain separate owner-run checks. Use the renamed command after updating to the corrected source; retain the existing settings file.

## 3. Create the resources and exact redirect URI

The following command creates billable resources in the existing demo group and an AcrPull assignment. Run it as the resource owner after reviewing What-If and cost; the Reader identity cannot perform this step.

```bash
python3 infra/azure-demo/ppo_operator.py provision ../ppo-demo-settings.local.json
```

The command prints the exact Web redirect URI ending **`/auth/callback`**. Copy it into **App registrations → Powerplants One Private Demo → Authentication → Add a platform → Web → Redirect URIs**, then save. Do not enable implicit access-token or ID-token grants; this implementation uses authorization code with PKCE. Do not guess a hostname or use localhost for the hosted registration.

## 4. Initialise and start the demo

```bash
python3 infra/azure-demo/ppo_operator.py bootstrap ../ppo-demo-settings.local.json
```

This builds the checked-out source in ACR, creates the epoch's database and private Blob container, runs the operator setup job, waits for success, then creates/updates the web app and scheduled draft-recovery job. Runtime containers receive a distinct database role with no schema/access-administration rights. The operator job retains its own admin credential; do not give ordinary testers Azure access to it. Each command suppresses raw credential-bearing responses. Use the Azure deployment/job status and sanitised application logs to diagnose failures; do not enable debug logging or share private generated settings.

The final printed HTTPS address is the link to open in Chrome/Safari/Edge on another computer or phone. Dean's local computer and Docker Desktop can be off. Initial users must sign in and be both assigned in Entra and present in the app's tester list. The server rejects a local profile selection and all business requests without an active invited session. It does not trust an email domain or client-supplied identity headers.

Before sharing the link, verify: an anonymous browser sees sign-in and cannot read CRM APIs; the invited owner can sign in; a non-allowlisted account is denied; a new opportunity/Activity survives reload and an app restart; draft bytes survive worker/app restart and match the retained revision; removing a tester blocks an existing session; the phone journey is usable. Record the deployment SHA, epoch, time and outcomes in the PR. These live checks have **not yet run**.

## 5. Add or remove testers

The settings file contains `testers`, a list of `object_id` and `expires_at` entries. Use each user's Object ID from this same directory and an ISO UTC timestamp ending `Z`, no more than fourteen days ahead. Maximum five entries. Each receives the same bounded Commercial demo capability set. Names/emails never act as identity keys.

For a colleague outside this directory, first arrange their directory guest account and application assignment through the owner/admin. Sending an invitation is a separate explicit action; these scripts send no messages. To apply the complete desired list:

```bash
python3 infra/azure-demo/ppo_operator.py testers ../ppo-demo-settings.local.json
```

Entries omitted from this list are disabled and their sessions removed; retained users keep the same actor IDs and history. Also remove the corresponding Entra application assignment when retiring access. Sessions last up to one hour, with allowlist activity/expiry checked on every request. After sign-out, sign-in offers account selection; it does not sign the user out of unrelated Microsoft services.

## 6. Routine app updates

Continue editing locally. Merge reviewed changes normally; run the full regression when its applicable checks require it. A deployment is needed only when you want colleagues to see a new hosted version.

For GitHub updates, create **a separate** managed identity `id-ppo-demo-github-deploy`, with the same verified GitHub issuer/audience/immutable environment subject as the Reader connection. Assign **Contributor on rg-ppo-demo-aue only** for this bounded first deployment workflow (covers the reviewed app/job update and ACR build operations). Keep its trust restricted to the `ppo-demo` environment/main. Do not broaden or replace the Reader identity. Contributor cannot assign roles; bootstrap remains the owner's action.

Add environment secret **AZURE_DEMO_DEPLOY_CLIENT_ID** with this new identity's Client ID. Add environment variable **PPO_DEMO_SUFFIX** with the generated settings `suffix`. Retain the existing subscription/tenant secrets and resource-group variable. Then use **Actions → Update Azure private demo → Run workflow → main**. Its summary gives the URL and source SHA. This workflow changes images and checks anonymous access is refused; it does not run database migrations, seeds, resets or grant testers access. If a change adds migrations, complete its explicit operator migration procedure before updating the app.

For an image rollback, use **Container App → Revisions and replicas** to restore the recorded previously working revision and restore the worker's matching image tag. Verify compatibility with the current database first. Image rollback does not undo schema/data changes. Do not use the infrastructure provision command for ordinary UI refinements.

## 7. Reset and retirement

A reset starts a fresh epoch so old sessions, operation receipts and draft files cannot be replayed into a new dataset. Schedule a short demo outage and tell testers to finish/discard unsaved work. Save the current source SHA, epoch, scenario IDs and draft hashes. Retain a secure copy of the old settings and confirm database backup availability.

Copy the private settings **outside Git**, change only `epoch` to a new lowercase/digit value (8–20 characters, for example a new UTC date/time), generate a new `app_password` of at least 32 characters, and refresh the tester expiries as needed. Keep suffix, subscription, tenant, app registration and admin password unchanged. Run **bootstrap** with this new settings file. It creates a separate database/Blob container and switches the app only after successful setup. Reprepare the table of demonstration scenarios through the UI. Verify the new epoch and sign-in on desktop/phone. The prior database/files remain retained for recovery and may add storage charges; delete them only after the owner accepts the reset and identifies the exact retired epoch. Never run local `db:reset` against Azure.

If bootstrap fails before the web update, retain the previous deployment. If rollback is needed after an epoch switch, restore both web and worker to the old epoch's configuration, image and runtime password using the retained settings, then validate persisted data. Do not mix old database and new Blob epoch.

At the end of evaluation, remove app tester access and the deployment federation. Stopping compute can reduce some charges, but retained database/storage/registry resources can still incur costs. After preserving anything explicitly required and checking the group contains only this demo, the owner may delete those exact demo resources. Do not delete the Reader identity or whole resource group automatically.

## Verification and current limits

Local lint, type/unit/build checks and focused operator-definition tests are recorded in the PR. The `Azure demo preparation checks` workflow additionally exercises a disposable PostgreSQL identity/CRM persistence case, compiles Bicep and builds the container. Existing full application checks remain unchanged. Local PostgreSQL/Docker are unavailable in this execution environment, so those checks require CI. Azure provisioning, actual OIDC exchange, Blob integration, post-deployment startup, costs and invited phone/desktop acceptance remain unverified until executed. Prepared code is not a published demo URL or P12/production acceptance.

Sources: [Microsoft authorization code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow), [redirect URI setup](https://learn.microsoft.com/en-us/entra/identity-platform/reply-url), [Container Apps networking](https://learn.microsoft.com/en-us/azure/container-apps/vnet-custom), [jobs](https://learn.microsoft.com/en-us/azure/container-apps/jobs), [OIDC client](https://github.com/panva/openid-client). Dependencies added: `openid-client` 6.8.8 and `@azure/storage-blob` 12.33.0, exact versions/lockfile retained; runtime remains Node 24.20.0/npm 11.19.0.
