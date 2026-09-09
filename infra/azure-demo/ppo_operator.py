"""Explicit Azure operator actions. Settings and generated secret files stay outside Git."""
import argparse
import contextlib
import datetime as dt
import getpass
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import tempfile
import time
from urllib.parse import quote

GROUP = "rg-ppo-demo-aue"
ROOT = Path(__file__).resolve().parents[2]


class OperatorActionError(RuntimeError):
    """A deliberately safe operator message; never includes raw Azure output."""


def az(*args):
    result = subprocess.run(["az", *args, "--output", "json", "--only-show-errors"],
                            text=True, capture_output=True, check=False)
    if result.returncode:
        if args[:2] == ("acr", "build") and "TasksOperationsNotAllowed" in result.stderr:
            raise OperatorActionError(
                "Azure rejected the image build (TasksOperationsNotAllowed). "
                "Build and push this checkout with Docker Desktop, then run bootstrap with "
                "--use-existing-image. See docs/delivery/azure-private-demo.md."
            )
        # Only show the fixed CLI command group, never arguments, stdout or stderr.
        raise OperatorActionError(
            f"Azure operation 'az {' '.join(args[:2])}' failed. "
            "Inspect that resource's deployment/execution status in Azure; private values are not printed."
        )
    return json.loads(result.stdout) if result.stdout.strip() else None


@contextlib.contextmanager
def private_json(value):
    fd, name = tempfile.mkstemp(prefix="ppo-demo-", suffix=".json")
    try:
        with os.fdopen(fd, "w") as stream:
            json.dump(value, stream)
        yield name
    finally:
        Path(name).unlink(missing_ok=True)


def validate(settings):
    for field in ["subscription_id", "tenant_id", "client_id"]:
        if not re.fullmatch(r"[a-fA-F0-9]{8}-(?:[a-fA-F0-9]{4}-){3}[a-fA-F0-9]{12}", settings[field]):
            raise ValueError(f"Invalid {field}.")
    if not re.fullmatch(r"[a-z0-9]{8,12}", settings["suffix"]) or not re.fullmatch(r"[a-z0-9]{8,20}", settings["epoch"]):
        raise ValueError("Invalid resource suffix or data epoch.")
    if len(settings["client_secret"]) < 16 or min(len(settings[k]) for k in ["admin_password", "app_password"]) < 32:
        raise ValueError("Missing private credentials.")
    if not isinstance(settings["testers"], list) or len(settings["testers"]) > 5:
        raise ValueError("At most five testers.")


def configure(path):
    if path.exists():
        raise ValueError("Settings already exist; retain them and edit the tester list or create a separate reset copy.")
    if path.resolve().is_relative_to(ROOT):
        raise ValueError("Save private settings outside the repository.")
    account = az("account", "show")
    settings = {"subscription_id": account["id"], "tenant_id": account["tenantId"],
                "suffix": secrets.token_hex(4), "epoch": dt.datetime.now(dt.timezone.utc).strftime("%Y%m%d%H%M"),
                "client_id": input("Demo application (client) ID: ").strip(),
                "client_secret": getpass.getpass("Demo application client secret VALUE: ").strip(),
                "admin_password": secrets.token_urlsafe(40), "app_password": secrets.token_urlsafe(40)}
    object_id = input("Your user Object ID in this Azure tenant: ").strip()
    expires = (dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=13)).isoformat().replace("+00:00", "Z")
    settings["testers"] = [{"object_id": object_id, "expires_at": expires}]
    validate(settings)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(settings, stream, indent=2)
    print("Private settings saved. Back up this file securely; it contains generated database passwords.")


def outputs():
    value = az("deployment", "group", "show", "--resource-group", GROUP, "--name", "ppo-demo-core")
    return {k: v["value"] for k, v in value["properties"]["outputs"].items()}


def bootstrap_image(out, head, use_existing):
    tag = f"ppo-demo:{head}"
    if use_existing:
        print("Checking the existing registry image for this source commit.", flush=True)
    else:
        print("Building the reviewed application image. This can take several minutes.", flush=True)
        az("acr", "build", "--registry", out["registryName"], "--image", tag,
           "--file", "infra/azure-demo/Dockerfile", "--no-logs", ".")
    # Require the selected checkout's tag in this demo's registry before changing
    # the database or storage. All three containers then use the same immutable image.
    digest = az("acr", "repository", "show", "--name", out["registryName"], "--image", tag, "--query", "digest")
    if not isinstance(digest, str) or not re.fullmatch(r"sha256:[a-f0-9]{64}", digest):
        raise OperatorActionError("The selected source image has no valid registry digest. Build and push this checkout before bootstrap.")
    image = f"{out['registryServer']}/ppo-demo@{digest}"
    print(f"Using image {image}", flush=True)
    return image


def image_source_commit(head, requested):
    if requested is None:
        return head
    result = subprocess.run(["git", "merge-base", "--is-ancestor", requested, head],
                            text=True, capture_output=True, check=False)
    if result.returncode:
        raise OperatorActionError("The selected image commit must exist in this checkout's history. Fetch the reviewed source before bootstrap.")
    return requested


def definition(settings, out, image, blob_key, kind, operation="setup"):
    db = f"ppo_demo_{settings['epoch']}"
    admin = kind == "operator"
    user = "ppo_demo_admin" if admin else f"{db}_app"
    password = settings["admin_password" if admin else "app_password"]
    secret_values = {"database-url": f"postgresql://{user}:{quote(password, safe='')}@{out['databaseHost']}:5432/{db}",
                     "entra-secret": settings["client_secret"], "blob-key": blob_key}
    values = {"NODE_ENV": "production", "PPO_ENV": "azure-demo", "PPO_EXPOSURE": "https", "PPO_IDENTITY": "entra",
              "PPO_DEMO_ORIGIN": out["demoOrigin"], "PPO_ENTRA_TENANT_ID": settings["tenant_id"],
              "PPO_ENTRA_CLIENT_ID": settings["client_id"], "PPO_BLOB_ACCOUNT": out["storageAccount"],
              "PPO_BLOB_CONTAINER": f"ppo-demo-{settings['epoch']}", "NEXT_TELEMETRY_DISABLED": "1"}
    secret_env = {"DATABASE_URL": "database-url", "PPO_ENTRA_CLIENT_SECRET": "entra-secret", "PPO_BLOB_KEY": "blob-key"}
    if admin:
        secret_values.update({"app-password": settings["app_password"], "testers": json.dumps(settings["testers"])})
        secret_env.update({"PPO_DEMO_APP_PASSWORD": "app-password", "PPO_DEMO_TESTERS": "testers"})
    env = [{"name": k, "value": v} for k, v in values.items()] + [{"name": k, "secretRef": v} for k, v in secret_env.items()]
    container = {"name": "ppo", "image": image, "env": env, "resources": {"cpu": 1.0, "memory": "2Gi"}}
    configuration = {"secrets": [{"name": k, "value": v} for k, v in secret_values.items()],
                     "registries": [{"server": out["registryServer"], "identity": out["pullIdentityId"]}]}
    properties = {"workloadProfileName": "Consumption", "configuration": configuration, "template": {"containers": [container]}}
    result = {"location": "australiaeast", "identity": {"type": "UserAssigned", "userAssignedIdentities": {out["pullIdentityId"]: {}}},
              "properties": properties, "tags": {"purpose": "private-synthetic-demo", "epoch": settings["epoch"]}}
    if kind == "web":
        result["name"] = f"ca-ppo-demo-{settings['suffix']}"
        properties["managedEnvironmentId"] = out["environmentId"]
        configuration.update({"activeRevisionsMode": "Single", "ingress": {"external": True, "targetPort": 3000, "transport": "http", "allowInsecure": False}})
        properties["template"]["scale"] = {"minReplicas": 1, "maxReplicas": 1}
        container["probes"] = [{"type": "Startup", "httpGet": {"path": "/healthz", "port": 3000}, "periodSeconds": 5, "failureThreshold": 60},
                               {"type": "Readiness", "httpGet": {"path": "/healthz", "port": 3000}, "periodSeconds": 10}]
    else:
        result["name"] = f"job-ppo-{kind}-{settings['suffix']}"
        properties["environmentId"] = out["environmentId"]
        configuration.update({"triggerType": "Manual" if admin else "Schedule", "replicaTimeout": 600, "replicaRetryLimit": 0})
        configuration["manualTriggerConfig" if admin else "scheduleTriggerConfig"] = {"parallelism": 1, "replicaCompletionCount": 1}
        if not admin:
            configuration["scheduleTriggerConfig"]["cronExpression"] = "*/2 * * * *"
        container["command"] = ["node", "--import", "tsx", "scripts/demo-database.ts" if admin else "scripts/demo-worker.ts"]
        if admin:
            container["args"] = [operation]
    return result


def wait_job(name, execution):
    for _ in range(120):
        value = az("containerapp", "job", "execution", "show", "--resource-group", GROUP, "--name", name, "--job-execution-name", execution)
        status = value["properties"]["status"]
        if status == "Succeeded":
            return
        if status in ["Failed", "Stopped"]:
            raise RuntimeError("The operator job failed. The web deployment was not advanced.")
        time.sleep(5)
    raise RuntimeError("Operator job still running; inspect its result before retrying.")


def apply_container(value, kind):
    command = ["containerapp"] if kind == "web" else ["containerapp", "job"]
    existing = az(*command, "list", "--resource-group", GROUP, "--query", "[].name")
    action = "update" if value["name"] in existing else "create"
    with private_json(value) as file:
        az(*command, action, "--resource-group", GROUP, "--name", value["name"], "--yaml", file)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["configure", "plan", "provision", "bootstrap", "testers"])
    parser.add_argument("settings", type=Path)
    parser.add_argument("--use-existing-image", action="store_true",
                        help="Bootstrap from this checkout's existing ppo-demo:<commit> image in the demo registry, without ACR Tasks.")
    parser.add_argument("--image-commit", help="Reuse an explicitly selected full ancestor commit's image with --use-existing-image after an operator-only fix.")
    args = parser.parse_args()
    if args.use_existing_image and args.action != "bootstrap":
        parser.error("--use-existing-image is only valid with bootstrap")
    if args.image_commit is not None:
        if args.action != "bootstrap" or not args.use_existing_image:
            parser.error("--image-commit requires bootstrap --use-existing-image")
        if not re.fullmatch(r"[a-f0-9]{40}", args.image_commit):
            parser.error("--image-commit requires a full lowercase 40-character Git commit")
    os.chdir(ROOT)
    if args.action == "configure":
        configure(args.settings)
        return
    if args.settings.resolve().is_relative_to(ROOT):
        raise ValueError("Private settings must be outside the repository.")
    settings = json.loads(args.settings.read_text())
    validate(settings)
    account = az("account", "show")
    if account["id"] != settings["subscription_id"] or account["tenantId"].lower() != settings["tenant_id"].lower():
        raise ValueError("Select the exact demo subscription and tenant before continuing.")
    az("group", "show", "--name", GROUP)
    if args.action in ["plan", "provision"]:
        params = {"$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
                  "contentVersion": "1.0.0.0", "parameters": {"suffix": {"value": settings["suffix"]},
                  "databaseAdminPassword": {"value": settings["admin_password"]}}}
        with private_json(params) as file:
            result = az("deployment", "group", "what-if" if args.action == "plan" else "create", "--resource-group", GROUP,
                        "--name", "ppo-demo-core", "--template-file", "infra/azure-demo/main.bicep", "--parameters", f"@{file}",
                        *(["--no-pretty-print"] if args.action == "plan" else []))
        if args.action == "plan":
            print("Review these proposed resource changes and the pricing calculator before provisioning:")
            for change in result.get("changes", []):
                print(change["changeType"], change["resourceId"])
        else:
            print("Core resources created. Add this Web redirect URI to your Entra application:")
            print(outputs()["demoOrigin"] + "/auth/callback")
        return
    out = outputs()
    head = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
    if subprocess.check_output(["git", "status", "--porcelain"], text=True).strip():
        raise ValueError("Use a clean, reviewed checkout for deployment.")
    image = f"{out['registryServer']}/ppo-demo:{head}"
    if args.action == "testers":
        image = az("containerapp", "job", "show", "--resource-group", GROUP,
                   "--name", f"job-ppo-operator-{settings['suffix']}", "--query", "properties.template.containers[0].image")
    if args.action == "bootstrap":
        image_head = image_source_commit(head, args.image_commit)
        print(f"Operator source: {head}; application image source: {image_head}", flush=True)
        image = bootstrap_image(out, image_head, args.use_existing_image)
        print("Creating the demo database.", flush=True)
        az("postgres", "flexible-server", "db", "create", "--resource-group", GROUP, "--server-name", out["databaseServer"], "--name", f"ppo_demo_{settings['epoch']}")
    print("Reading the private storage credential.", flush=True)
    blob_key = az("storage", "account", "keys", "list", "--resource-group", GROUP, "--account-name", out["storageAccount"])[0]["value"]
    if args.action == "bootstrap":
        print("Preparing the private demo file container.", flush=True)
        # Secret account key is passed through the process environment, not command arguments.
        previous = os.environ.get("AZURE_STORAGE_KEY")
        os.environ["AZURE_STORAGE_KEY"] = blob_key
        try:
            az("storage", "container", "create", "--name", f"ppo-demo-{settings['epoch']}", "--account-name", out["storageAccount"], "--public-access", "off")
        finally:
            if previous is None: os.environ.pop("AZURE_STORAGE_KEY", None)
            else: os.environ["AZURE_STORAGE_KEY"] = previous
    operator = definition(settings, out, image, blob_key, "operator", "setup" if args.action == "bootstrap" else "testers")
    print("Preparing and starting the database setup job.", flush=True)
    apply_container(operator, "operator")
    execution = az("containerapp", "job", "start", "--resource-group", GROUP, "--name", operator["name"])
    print("Waiting for the operator job to finish.")
    wait_job(operator["name"], execution["name"])
    if args.action == "bootstrap":
        for kind in ["worker", "web"]:
            print(f"Starting the demo {kind}.", flush=True)
            value = definition(settings, out, image, blob_key, kind)
            apply_container(value, kind)
        print("Demo deployed. Verify sign-in, denied access, saved records and draft recovery before sharing:")
        print(out["demoOrigin"])
    else:
        print("Tester list reconciled. No invitation messages were sent.")


if __name__ == "__main__":
    try:
        main()
    except OperatorActionError as error:
        raise SystemExit(str(error))
    except (KeyError, ValueError, RuntimeError, OSError, json.JSONDecodeError):
        raise SystemExit("Operator action did not complete. Check the selected subscription, settings and Azure resource status. Private values are not printed.")
