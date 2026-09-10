"""Wait for the selected Container Apps image, not a still-healthy old revision."""
import argparse
import json
import re
import subprocess
import time


def azure(*args):
    result = subprocess.run(["az", *args, "--output", "json", "--only-show-errors"],
                            text=True, capture_output=True, timeout=30, check=False)
    if result.returncode:
        raise RuntimeError("Could not read revision status. Inspect the Azure resource; raw output is suppressed.")
    return json.loads(result.stdout)


def wait_for_revision(group, app, image, attempts=60):
    for attempt in range(attempts):
        state = azure("containerapp", "show", "--resource-group", group, "--name", app,
                      "--query", "{latest:properties.latestRevisionName,ready:properties.latestReadyRevisionName}")
        latest = state.get("latest")
        if latest and latest == state.get("ready"):
            revision = azure("containerapp", "revision", "show", "--resource-group", group,
                             "--name", app, "--revision", latest,
                             "--query", "{image:properties.template.containers[0].image,health:properties.healthState}")
            if revision.get("image") == image and revision.get("health") == "Healthy":
                print("Selected image revision is healthy and ready.")
                return
        if attempt + 1 < attempts:
            time.sleep(5)
    raise RuntimeError("Selected image did not become ready. Inspect revisions before retrying; no rollback was run.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("group")
    parser.add_argument("app")
    parser.add_argument("image")
    args = parser.parse_args()
    if args.group != "rg-ppo-demo-aue" or not re.fullmatch(r"ca-ppo-demo-[a-z0-9]{8,12}", args.app):
        parser.error("Use the existing PPO demo resource group and app.")
    if not re.fullmatch(r"[a-z0-9.-]+\.azurecr\.io/ppo-demo@sha256:[a-f0-9]{64}", args.image):
        parser.error("Use a fixed registry image digest.")
    wait_for_revision(args.group, args.app, args.image)


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as error:
        raise SystemExit(str(error))
    except (OSError, ValueError, TypeError, AttributeError, subprocess.TimeoutExpired):
        raise SystemExit("Revision verification did not complete. Inspect Azure status; raw output is suppressed.")
