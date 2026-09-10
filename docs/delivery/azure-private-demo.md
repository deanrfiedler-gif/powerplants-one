# Azure private demo deployment

**Document ID:** PPO-DEMO-RUNTIME · **Revision:** r06 · **Date:** 10 September 2026 · **Owner:** Dean Fiedler · **State:** GitHub runner update workflow prepared; live deployment prerequisites and app acceptance remain unverified.

**Latest owner-run result:** Docker build/push succeeded for source `5ce4d20f6d897ed2e9e9da9496130c2bb706a0cd`. Cloud Shell resolved `ppodemo90deea5d.azurecr.io/ppo-demo@sha256:3b5744dd9830449fc4e5ce0f3dc102c0f0f455e6a2358a36b3b00865a09ae4dd`, then failed at database creation. The operator used `--database-name`, while Azure's `postgres flexible-server db create` requires `--name`. The [database argument correction](#database-create-argument-correction) lets the owner update the deployment helper and reuse that existing image. Earlier ACR-rejection statements below describe the preceding attempt.

**Current owner-run result:** Dean successfully configured and provisioned the Australia East demo with suffix `90deea5d`. Azure returned the Web redirect URI `https://ca-ppo-demo-90deea5d.ashyglacier-e6fb2158.australiaeast.azurecontainerapps.io/auth/callback`. He then authorised initial private bootstrap from the pinned integration checkout while full application regression remained in progress. The registry returned `TasksOperationsNotAllowed` before creating a build run. This establishes a remote-build restriction, not its billing/offer cause and not an application build failure. No running app or live sign-in acceptance has been established. Use the [Docker Desktop build procedure](#acr-tasks-rejected-build-with-docker-desktop) below; preserve the existing private Cloud Shell settings.

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

This builds the checked-out source in ACR, resolves its commit tag to a fixed image digest, creates the epoch's database and private Blob container, runs the operator setup job, waits for success, then creates/updates the web app and scheduled draft-recovery job. Runtime containers receive a distinct database role with no schema/access-administration rights. The operator job retains its own admin credential; do not give ordinary testers Azure access to it. Each command suppresses raw credential-bearing responses. Safe stage messages identify progress; an ACR Tasks rejection names the known code and the existing-image option. Use the Azure deployment/job status and sanitised application logs to diagnose other failures; do not enable debug logging or share private generated settings.

The final printed HTTPS address is the link to open in Chrome/Safari/Edge on another computer or phone. Dean's local computer and Docker Desktop can be off. Initial users must sign in and be both assigned in Entra and present in the app's tester list. The server rejects a local profile selection and all business requests without an active invited session. It does not trust an email domain or client-supplied identity headers.

Before sharing the link, verify: an anonymous browser sees sign-in and cannot read CRM APIs; the invited owner can sign in; a non-allowlisted account is denied; a new opportunity/Activity survives reload and an app restart; draft bytes survive worker/app restart and match the retained revision; removing a tester blocks an existing session; the phone journey is usable. Record the deployment SHA, epoch, time and outcomes in the PR. These live checks have **not yet run**.

### ACR Tasks rejected: build with Docker Desktop

Microsoft documents a pause on [ACR Tasks using Azure free credits](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-tasks-overview). The owner's `TasksOperationsNotAllowed` error does not prove which subscription condition caused it. A [support request](https://azure.microsoft.com/en-au/support/create-ticket/) can establish that cause; a registry SKU upgrade is not an evidenced fix. The supported alternative is to [build locally and push using Docker](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-get-started-docker-cli), using the owner's existing Azure permissions. The GitHub Reader identity remains unchanged.

Use the exact full source commit in the deployment handoff on both machines. This build must include the new `--use-existing-image` option; the old `f0898b7` checkout does not. The steps below create a separate Windows checkout and keep credentials/settings in Cloud Shell. Run each command group successfully before proceeding to the next. If Git reports an existing destination or local changes, preserve that work and choose an unused build folder.

**On Windows, open Docker Desktop and wait for its Linux engine to run.** Open a local PowerShell window. Check `docker version`, `git --version` and `az version`. If Azure CLI is missing, install it with `winget install --exact --id Microsoft.AzureCLI`, then close and reopen PowerShell ([Microsoft installation instructions](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-windows)). Cloud Shell has Azure CLI, but it does not provide the local Docker engine needed for this build.

```powershell
$PpoDemoCommit = 'REPLACE_WITH_FULL_DEPLOYMENT_COMMIT'
git clone --config core.autocrlf=false --branch feature/demo-email-crm-integration --single-branch https://github.com/deanrfiedler-gif/powerplants-one.git "$env:USERPROFILE\ppo-demo-image-build"
if ($LASTEXITCODE -ne 0) { throw 'Clone did not complete; preserve existing folders.' }
Set-Location "$env:USERPROFILE\ppo-demo-image-build"
git checkout --detach $PpoDemoCommit
if ($LASTEXITCODE -ne 0) { throw 'The selected source commit could not be checked out.' }
if (git status --porcelain) { throw 'Use a clean build checkout.' }
```

Sign in as the same owner who provisioned the demo. Use normal interactive Microsoft sign-in; do not use the web application's client secret or enable registry admin credentials.

```powershell
az login
az account set --subscription 'PPO Prototype Demo'
az account show --query '{Subscription:name,Status:state}' --output table
az acr login --name ppodemo90deea5d
```

After the account is correct and registry login succeeds, build and push. Obtain the actual registry hostname from Azure rather than assuming its format. `core.autocrlf=false` in the new clone preserves source/migration bytes for the Linux build. No local database or local app configuration is needed.

```powershell
$PpoDemoSha = (git rev-parse HEAD).Trim()
if ($PpoDemoSha -ne $PpoDemoCommit) { throw 'Source commit mismatch.' }
$PpoDemoRegistry = (az acr show --name ppodemo90deea5d --resource-group rg-ppo-demo-aue --query loginServer --output tsv).Trim()
if ($LASTEXITCODE -ne 0 -or -not $PpoDemoRegistry) { throw 'Could not read the registry hostname.' }
$PpoDemoImage = "$PpoDemoRegistry/ppo-demo:$PpoDemoSha"
docker build --platform linux/amd64 --label "org.opencontainers.image.revision=$PpoDemoSha" --file infra/azure-demo/Dockerfile --tag $PpoDemoImage .
if ($LASTEXITCODE -ne 0) { throw 'Image build failed; do not push or bootstrap.' }
docker push $PpoDemoImage
if ($LASTEXITCODE -ne 0) { throw 'Image push failed; do not bootstrap.' }
```

The existing demo owner normally has the registry access required by the current RBAC registry configuration. If login/push is denied, inspect that error and the actual assignment before changing permissions. A local build uses Windows computer resources; the pushed image still incurs ordinary ACR storage charges. It does not invoke ACR Tasks or require the computer to host the running demo.

**Return to the Azure Cloud Shell Bash window.** Replace the placeholder below with the same full commit used on Windows, then run each line successfully. Do not overwrite/recreate `../ppo-demo-settings.local.json`.

```bash
cd ~/ppo-demo-deployment/powerplants-one
git fetch origin feature/demo-email-crm-integration
git checkout --detach REPLACE_WITH_FULL_DEPLOYMENT_COMMIT
git status --short
python3 infra/azure-demo/ppo_operator.py bootstrap ../ppo-demo-settings.local.json --use-existing-image
```

`git status --short` must be empty. The new command uses the renamed script, so it needs no `-P`. By default it looks up only `ppo-demo:<current HEAD>` in the registry recorded in the existing deployment outputs, validates its SHA-256 digest and uses the same digest for operator, worker and web. The explicit `--image-commit` option below allows a reviewed ancestor image after a helper-only correction. Missing/inaccessible images stop before database/storage mutations. A matching tag is an operator-controlled source convention, not independent attestation of image contents; the clean checkout and recorded build commit remain essential. Bootstrap still runs the same database setup, access reconciliation and private storage steps. It does not silently fall back to ACR Tasks.

Local verification: all 16 operator tests pass, including existing-image lookup, normal build behaviour, rejection of malformed/missing digests, refusal before downstream mutations, option/action validation, ancestor image selection, Azure's documented database argument contract and secret-safe error messages. Cloud push and digest resolution are now confirmed by the owner's output; resumed database creation and downstream deployment remain unverified. The routine GitHub update workflow now uses Docker on its GitHub runner (section 6); this Docker Desktop alternative covers initial bootstrap and explicitly requested operator bootstrap/reset runs. Do not use bootstrap for ordinary UI updates.

### Database-create argument correction

The uploaded application's source `5ce4d20f6d897ed2e9e9da9496130c2bb706a0cd` now has all eight workflows passing, including [full Application assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34328878974) and [Azure demo preparation](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34328878861). These checks are separate from actual Azure deployment; fresh checks for the helper correction remain pending.

The failure after `Creating the demo database` exposed an operator defect: [Azure CLI's database-create command](https://learn.microsoft.com/en-us/cli/azure/postgres/flexible-server/db#az-postgres-flexible-server-db-create) requires `--name`. The previous `--database-name` belongs to other command contexts and does not satisfy this required argument. A regression against the documented argument contract fails before the correction and passes after it; the earlier definition/image-lookup tests did not reach a successful database-create call. The owner's underlying stderr was suppressed, so the complete Azure response was not captured. No database/server deletion or firewall change is justified by this failure.

For this helper-only fix, preserve the already uploaded application image. In Cloud Shell, use the exact helper commit from the handoff, then reuse the known application source:

```bash
cd ~/ppo-demo-deployment/powerplants-one
git fetch origin feature/demo-email-crm-integration
git checkout --detach REPLACE_WITH_OPERATOR_FIX_COMMIT
git status --short
python3 infra/azure-demo/ppo_operator.py bootstrap ../ppo-demo-settings.local.json \
  --use-existing-image \
  --image-commit 5ce4d20f6d897ed2e9e9da9496130c2bb706a0cd
```

Run each line successfully before the next; the status must be empty. `--image-commit` accepts only a full lowercase commit SHA, only with `bootstrap --use-existing-image`, and only when that commit is present in the checked-out helper's history. It prints both source commits, resolves the selected image in the same demo registry, and uses one fixed digest throughout bootstrap. It does not retag/rebuild the image or change its migrations and application code. Record both commits when using this option; it is an explicit reuse of the reviewed older image, not a release of the newer checkout's application changes. Existing private settings, Entra registration, database epoch, registry and provisioned infrastructure remain in use.

## 5. Add or remove testers

The settings file contains `testers`, a list of `object_id` and `expires_at` entries. Use each user's Object ID from this same directory and an ISO UTC timestamp ending `Z`, no more than fourteen days ahead. Maximum five entries. Each receives the same bounded Commercial demo capability set. Names/emails never act as identity keys.

For a colleague outside this directory, first arrange their directory guest account and application assignment through the owner/admin. Sending an invitation is a separate explicit action; these scripts send no messages. To apply the complete desired list:

```bash
python3 infra/azure-demo/ppo_operator.py testers ../ppo-demo-settings.local.json
```

Entries omitted from this list are disabled and their sessions removed; retained users keep the same actor IDs and history. Also remove the corresponding Entra application assignment when retiring access. Sessions last up to one hour, with allowlist activity/expiry checked on every request. After sign-out, sign-in offers account selection; it does not sign the user out of unrelated Microsoft services.

## 6. Routine app updates

The manually dispatched [update workflow](../../.github/workflows/azure-demo-deploy.yml) builds Docker images on GitHub's Ubuntu runner and pushes to the existing private Azure Container Registry. It no longer invokes ACR Tasks, the service that returned `TasksOperationsNotAllowed`. The app remains on Azure Container Apps. Merging a PR does not deploy it. No Docker Desktop session is required for routine updates after this workflow is available on main.

### One-time prerequisites

Retain the separate deployment identity `id-ppo-demo-github-deploy`, with the same verified issuer/audience/immutable environment subject as the [Reader connection](azure-demo-connection.md#4-link-the-identity-to-this-github-environment). Its documented initial assignment is Contributor on **rg-ppo-demo-aue only**, for existing app/job updates and registry access. Do not replace or broaden the Reader identity. The identity needs registry push/pull and web/job update rights; check the registry's actual RBAC/ABAC permission mode if access fails. Successful registry login or read access alone does not prove push rights. This change creates no identities, role assignments, federated credentials or GitHub settings.

In **Settings → Environments → ppo-demo**, verify:

| Setting | Required value/source |
|---|---|
| Deployment branches and tags | Selected branch `main` only; retain the existing restriction |
| Secret `AZURE_DEMO_DEPLOY_CLIENT_ID` | Deployment identity Client ID, distinct from the Reader Client ID |
| Secret `AZURE_TENANT_ID` | Existing verified demo tenant |
| Secret `AZURE_SUBSCRIPTION_ID` | Existing verified PPO Prototype Demo subscription |
| Variable `AZURE_RESOURCE_GROUP` | `rg-ppo-demo-aue` |
| Variable `PPO_DEMO_SUFFIX` | `90deea5d` for the existing owner-provisioned demo |

Initial bootstrap must have completed: `ca-ppo-demo-90deea5d`, `job-ppo-worker-90deea5d` and the registry repository must exist. The web app must retain its Single revision mode. The workflow refuses missing resources or changed revision mode and creates neither. The latest recorded bootstrap failure is historical evidence, not proof of current live state.

### Check the connection before releasing

1. After this PR is merged, open **Actions → Update Azure private demo → Run workflow**.
2. Select branch **main**, choose operation **check** (the default), then run it.
3. Inspect its summary and any failed step. It verifies configured ID formats, deployment identity sign-in, the exact active subscription/tenant, registry metadata, existing web/worker image references, Single revision mode, and registry authentication/read access.
4. Retain the run URL. Check mode builds/pushes no image, changes no Azure resource and touches no application data. Authentication creates temporary credentials only on the runner; these are removed afterwards. It cannot verify IAM write permissions without exercising writes, database compatibility, Entra tester access or business acceptance.

A missing deployment identity secret is a setup failure, not an ACR build error. If resources are absent, finish the separately authorised initial bootstrap; do not use routine updates to create them. If registry authentication is denied, inspect the deployment identity's actual permissions and federation before proposing any permission change.

### Release a reviewed update

1. Merge the intended changes into main and confirm the applicable checks passed for the selected source. This workflow does not run the full application regression or automatically establish release acceptance.
2. Compare the deployed source with the proposed release for database/runtime requirements. This is an **image-only** update. It does not inspect the live database, run migrations, seed data, change the epoch, reconcile testers or update the operator job. The existing operator offers setup/testers operations, not a standalone routine migration action. If new migrations or runtime configuration are needed, prepare and verify that explicit release procedure first; do not substitute bootstrap or local `db:reset` for it.
3. Open the same workflow, choose **main** and operation **deploy**. It builds the selected run's full source commit for Linux/amd64, with a source label. Tags include source SHA, run ID and attempt so repeated runs do not overwrite the same tag. Docker build/push failures stop before any app update.
4. The workflow resolves the pushed image to a validated SHA-256 digest and updates the web app. It waits for the latest revision to be ready, healthy and using that exact digest; an old healthy revision cannot pass the check. It then configures the worker with the same digest and verifies the saved worker image.
5. The HTTPS health endpoint must return 200 and the anonymous CRM API must return 401, without following redirects. The summary records source SHA, new digest, previous web/worker image references and the existing app URL.
6. Sign in with an invited account, exercise the changed screen, verify an existing saved record and a new save/reload, and check draft output. Check a scheduled worker execution separately. Updating its configuration is not evidence of a completed worker run, and `/healthz` is not a database or sign-in acceptance check.

The selected source is the commit recorded on the workflow run, not necessarily a later main head. Keep that run URL as the deployment receipt. Deployment still uses GitHub runner minutes and ordinary registry/storage/compute usage; removing ACR Tasks is not a claim of zero cost.

### Failure and rollback

Build or push failure leaves app images unchanged. A web readiness failure does not advance the worker. A later worker or smoke-check failure can leave a partial update; the summary explicitly says deployment did not complete. Inspect both actual images and the failed step before retrying. No automatic rollback is attempted and existing scheduled worker executions may finish using the old image.

For an image rollback, restore the recorded previously working web revision using **Container App → Revisions and replicas**, and restore the worker's recorded prior image. Confirm database compatibility first. Image rollback does not undo schema/data changes. Do not use infrastructure provisioning or reset for ordinary UI refinements.

### Verification of this change — 10 September 2026

Inspected main `1de7821a380514712e93babd4766fc32a62f76e9` and its tree `33d9845204506acf8825e5d4d1a67d358c24791f`. Available manual GitHub run history includes the successful Reader connection check but no execution of the update workflow. The connector does not expose environment secrets/settings or a live Azure session; actual deployment identity configuration, IAM, registry access and current app readiness remain unverified. No Azure deployment or permission change was executed in preparing this change.

Local verification: 26 Python cases pass, including the existing 16 operator cases, five revision cases and five executable build-shell/syntax cases. Tests exercise build/push failure stopping, invalid digest rejection, run-specific image selection and refusal of old/unhealthy revisions. Foundation, prototype and naming checks pass. Docker/Azure CLI are unavailable locally; actual image build is covered by the existing Azure demo preparation CI job after publication. Mocks and syntax checks do not establish live Azure success. Final PR checks and publication are recorded in the linked PR, separately from the first authenticated check/deploy run.

Primary references reviewed 10 September 2026: [Microsoft Docker build/push](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-get-started-docker-cli), [registry identity permissions](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-authentication-managed-identity), [Container Apps revisions](https://learn.microsoft.com/en-us/azure/container-apps/revisions), [revision CLI](https://learn.microsoft.com/en-us/cli/azure/containerapp/revision#az-containerapp-revision-show).

## 7. Reset and retirement

A reset starts a fresh epoch so old sessions, operation receipts and draft files cannot be replayed into a new dataset. Schedule a short demo outage and tell testers to finish/discard unsaved work. Save the current source SHA, epoch, scenario IDs and draft hashes. Retain a secure copy of the old settings and confirm database backup availability.

Copy the private settings **outside Git**, change only `epoch` to a new lowercase/digit value (8–20 characters, for example a new UTC date/time), generate a new `app_password` of at least 32 characters, and refresh the tester expiries as needed. Keep suffix, subscription, tenant, app registration and admin password unchanged. Run **bootstrap** with this new settings file. It creates a separate database/Blob container and switches the app only after successful setup. Reprepare the table of demonstration scenarios through the UI. Verify the new epoch and sign-in on desktop/phone. The prior database/files remain retained for recovery and may add storage charges; delete them only after the owner accepts the reset and identifies the exact retired epoch. Never run local `db:reset` against Azure.

If bootstrap fails before the web update, retain the previous deployment. If rollback is needed after an epoch switch, restore both web and worker to the old epoch's configuration, image and runtime password using the retained settings, then validate persisted data. Do not mix old database and new Blob epoch.

At the end of evaluation, remove app tester access and the deployment federation. Stopping compute can reduce some charges, but retained database/storage/registry resources can still incur costs. After preserving anything explicitly required and checking the group contains only this demo, the owner may delete those exact demo resources. Do not delete the Reader identity or whole resource group automatically.

## Verification and current limits

Local lint, type/unit/build checks and focused operator-definition tests are recorded in the PR. The `Azure demo preparation checks` workflow additionally exercises a disposable PostgreSQL identity/CRM persistence case, compiles Bicep and builds the container. Existing full application checks remain unchanged. Local PostgreSQL/Docker are unavailable in this execution environment, so those checks require CI. Core provisioning is confirmed by Dean's Cloud Shell result. Actual OIDC exchange, Blob integration, post-deployment startup, billed cost and invited phone/desktop acceptance remain unverified until executed. Prepared code and provisioned infrastructure do not establish a working app or P12/production acceptance.

Sources: [Microsoft authorization code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow), [redirect URI setup](https://learn.microsoft.com/en-us/entra/identity-platform/reply-url), [Container Apps networking](https://learn.microsoft.com/en-us/azure/container-apps/vnet-custom), [jobs](https://learn.microsoft.com/en-us/azure/container-apps/jobs), [OIDC client](https://github.com/panva/openid-client). Dependencies added: `openid-client` 6.8.8 and `@azure/storage-blob` 12.33.0, exact versions/lockfile retained; runtime remains Node 24.20.0/npm 11.19.0.
