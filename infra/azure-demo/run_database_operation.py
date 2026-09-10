"""Run the existing operator with the selected release, preserving its secrets."""
import re
import sys

from ppo_operator import az, wait_job


def run(group, suffix, image, operation):
    if group != "rg-ppo-demo-aue" or not re.fullmatch(r"[a-z0-9]{8,12}", suffix):
        raise RuntimeError("Only the existing private demo is supported.")
    if not re.fullmatch(rf"ppodemo{suffix}\.azurecr\.io/ppo-demo@sha256:[a-f0-9]{{64}}", image):
        raise RuntimeError("Use the immutable image from this demo registry.")
    if operation not in ("deploy", "upgrade-and-deploy"):
        raise RuntimeError("Choose deploy or upgrade-and-deploy.")
    name = "job-ppo-operator-" + suffix
    target = ("--resource-group", group, "--name", name)
    # This projection excludes credentials and connection strings.
    state = az("containerapp", "job", "show", *target, "--query",
               "{trigger:properties.configuration.triggerType,containers:properties.template.containers[].{name:name,command:command,epoch:env[?name=='PPO_BLOB_CONTAINER'].value,tenant:env[?name=='PPO_ENTRA_TENANT_ID'].value}}")
    containers = state.get("containers", [])
    if state.get("trigger") != "Manual" or len(containers) != 1:
        raise RuntimeError("Expected one existing manual operator container.")
    container = containers[0]
    if container.get("command") != ["node", "--import", "tsx", "scripts/demo-database.ts"]:
        raise RuntimeError("The existing operator command needs review.")
    web = az("containerapp", "show", "--resource-group", group, "--name", "ca-ppo-demo-" + suffix,
             "--query", "properties.template.containers[].{epoch:env[?name=='PPO_BLOB_CONTAINER'].value,tenant:env[?name=='PPO_ENTRA_TENANT_ID'].value}")
    if (len(web) != 1 or len(container.get("epoch", [])) != 1 or len(container.get("tenant", [])) != 1 or
            any(web[0].get(key) != container[key] for key in ("epoch", "tenant"))):
        raise RuntimeError("Operator and web must retain the same existing demo epoch and tenant.")
    executions = az("containerapp", "job", "execution", "list", *target,
                    "--query", "[].properties.status")
    if any(status not in ("Succeeded", "Failed", "Stopped") for status in executions):
        raise RuntimeError("An operator execution is unfinished; inspect it before retrying.")
    command = "upgrade" if operation == "upgrade-and-deploy" else "verify"
    # Do not recreate the job, retrieve secrets, or run setup/tester reconciliation.
    az("containerapp", "job", "update", *target, "--container-name", container["name"],
       "--image", image, "--args", command)
    actual = az("containerapp", "job", "show", *target,
                "--query", "properties.template.containers[0].{image:image,args:args}")
    if actual != {"image": image, "args": [command]}:
        raise RuntimeError("Operator image/operation did not match; execution not started.")
    execution = az("containerapp", "job", "start", *target)
    if not re.fullmatch(re.escape(name) + r"-[a-z0-9-]+", execution.get("name", "")):
        raise RuntimeError("No valid execution receipt; inspect the operator before retrying.")
    print(f"Database {command} execution: {execution['name']}", flush=True)
    wait_job(name, execution["name"])


if __name__ == "__main__":
    try:
        if len(sys.argv) != 5:
            raise RuntimeError("Supply resource group, suffix, image digest and operation.")
        run(*sys.argv[1:])
    except (RuntimeError, KeyError, TypeError) as error:
        print(str(error) if isinstance(error, RuntimeError) else "Unexpected Azure response; rollout stopped.", file=sys.stderr)
        sys.exit(1)
