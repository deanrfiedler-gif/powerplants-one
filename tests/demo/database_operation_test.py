import importlib.util
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "infra/azure-demo"))
spec = importlib.util.spec_from_file_location("database_operation", ROOT / "infra/azure-demo/run_database_operation.py")
operation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(operation)


class DatabaseOperationTests(unittest.TestCase):
    def exercise(self, mode="upgrade-and-deploy", mismatch=False, running=False, failed=False):
        self.calls = []
        image = "ppodemosynthetic.azurecr.io/ppo-demo@sha256:" + "b" * 64
        context = {"epoch": ["ppo-demo-synthetic"], "tenant": ["synthetic-tenant"]}

        def az(*args):
            self.calls.append(args)
            if args[:3] == ("containerapp", "job", "show"):
                if "image:image" in args[-1]:
                    return {"image": image, "args": ["upgrade" if mode == "upgrade-and-deploy" else "verify"]}
                return {"trigger": "Manual", "containers": [{**context, "name": "ppo",
                        "command": ["node", "--import", "tsx", "scripts/demo-database.ts"]}]}
            if args[:2] == ("containerapp", "show"):
                return [{**context, **({"epoch": ["different"]} if mismatch else {})}]
            if args[:4] == ("containerapp", "job", "execution", "list"):
                return ["Running"] if running else ["Succeeded"]
            if args[:3] == ("containerapp", "job", "start"):
                return {"name": "job-ppo-operator-synthetic-abc123"}
            return {}

        with patch.object(operation, "az", side_effect=az), patch.object(operation, "wait_job",
                side_effect=RuntimeError("Failed") if failed else None) as wait:
            operation.run("rg-ppo-demo-aue", "synthetic", image, mode)
            wait.assert_called_once_with("job-ppo-operator-synthetic", "job-ppo-operator-synthetic-abc123")

    def test_upgrade_uses_existing_job_without_secrets_or_recreation(self):
        self.exercise()
        update = next(c for c in self.calls if c[:3] == ("containerapp", "job", "update"))
        self.assertEqual(update[-2:], ("--args", "upgrade"))
        self.assertFalse(any("secret" in c or "create" in c or "--yaml" in c for c in self.calls))

    def test_routine_deploy_only_verifies_database(self):
        self.exercise(mode="deploy")
        self.assertTrue(any(c[-2:] == ("--args", "verify") for c in self.calls))

    def test_mismatched_epoch_stops_before_update(self):
        with self.assertRaisesRegex(RuntimeError, "same existing demo epoch"):
            self.exercise(mismatch=True)
        self.assertFalse(any("update" in c or "start" in c for c in self.calls))

    def test_unfinished_execution_stops_before_update(self):
        with self.assertRaisesRegex(RuntimeError, "unfinished"):
            self.exercise(running=True)
        self.assertFalse(any("update" in c or "start" in c for c in self.calls))

    def test_failed_database_job_propagates_failure(self):
        with self.assertRaisesRegex(RuntimeError, "Failed"):
            self.exercise(failed=True)

    def test_other_registry_is_rejected_before_azure_calls(self):
        with patch.object(operation, "az") as az:
            with self.assertRaisesRegex(RuntimeError, "immutable image"):
                operation.run("rg-ppo-demo-aue", "synthetic", "other.azurecr.io/ppo-demo@sha256:" + "b" * 64, "deploy")
            az.assert_not_called()


if __name__ == "__main__":
    unittest.main()
