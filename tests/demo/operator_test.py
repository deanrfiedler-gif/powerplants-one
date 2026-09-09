import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("ppo_operator", Path(__file__).resolve().parents[2] / "infra/azure-demo/ppo_operator.py")
operator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(operator)


class CommandLineTests(unittest.TestCase):
    def test_direct_entrypoint_starts_in_a_fresh_interpreter(self):
        # Import-based tests preload standard-library modules and can hide a
        # script filename that shadows one of them during ordinary CLI startup.
        result = subprocess.run(
            [sys.executable, "-E", spec.origin, "--help"],
            cwd=Path(__file__).resolve().parents[2],
            text=True, capture_output=True, timeout=10,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("{configure,plan,provision,bootstrap,testers}", result.stdout)


class DefinitionTests(unittest.TestCase):
    def setUp(self):
        self.settings = {"epoch": "20260909", "suffix": "aabbccdd", "admin_password": "synthetic-admin", "app_password": "synthetic-runtime",
                         "client_secret": "synthetic-client", "client_id": "client", "tenant_id": "tenant", "testers": []}
        self.out = {"databaseHost": "demo.postgres.database.azure.com", "storageAccount": "ppodemoaabbccdd", "demoOrigin": "https://demo.azurecontainerapps.io",
                    "registryServer": "demo.azurecr.io", "pullIdentityId": "/subscriptions/s/resourceGroups/g/providers/Microsoft.ManagedIdentity/userAssignedIdentities/pull",
                    "environmentId": "/subscriptions/s/resourceGroups/g/providers/Microsoft.App/managedEnvironments/demo"}

    def test_web_has_only_runtime_credentials_and_https(self):
        value = operator.definition(self.settings, self.out, "demo.azurecr.io/ppo:source", "synthetic-blob", "web")
        cfg = value["properties"]["configuration"]
        secret_values = {x["name"]: x["value"] for x in cfg["secrets"]}
        self.assertIn("ppo_demo_20260909_app:synthetic-runtime@", secret_values["database-url"])
        self.assertNotIn("synthetic-admin", str(value))
        self.assertNotIn("testers", secret_values)
        self.assertFalse(cfg["ingress"]["allowInsecure"])
        self.assertEqual(value["properties"]["template"]["scale"], {"minReplicas": 1, "maxReplicas": 1})
        self.assertNotIn("args", value["properties"]["template"]["containers"][0])

    def test_admin_job_is_manual_worker_uses_runtime_credentials(self):
        admin = operator.definition(self.settings, self.out, "image", "synthetic-blob", "operator", "testers")
        worker = operator.definition(self.settings, self.out, "image", "synthetic-blob", "worker")
        self.assertEqual(admin["properties"]["configuration"]["triggerType"], "Manual")
        self.assertEqual(admin["properties"]["template"]["containers"][0]["args"], ["testers"])
        self.assertNotIn("synthetic-admin", str(worker))
        self.assertNotIn("ingress", worker["properties"]["configuration"])
        self.assertEqual(worker["properties"]["configuration"]["replicaRetryLimit"], 0)

    def test_settings_never_accept_arbitrary_resource_names(self):
        s = {**self.settings, "subscription_id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "tenant_id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
             "client_id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "client_secret": "x"*32, "admin_password": "x"*40, "app_password": "y"*40}
        operator.validate(s)
        for patch in [{"suffix": "bad;command"}, {"epoch": "production/db"}, {"subscription_id": "default"}]:
            with self.assertRaises(ValueError):
                operator.validate({**s, **patch})

    def test_existing_operator_is_updated_and_private_file_is_removed_on_failure(self):
        value = operator.definition(self.settings, self.out, "image", "synthetic-blob", "operator", "testers")
        private_path = None

        def fake_az(*args):
            nonlocal private_path
            if args[:3] == ("containerapp", "job", "list"):
                return [value["name"]]
            self.assertEqual(args[:3], ("containerapp", "job", "update"))
            private_path = Path(args[args.index("--yaml") + 1])
            self.assertEqual(private_path.stat().st_mode & 0o777, 0o600)
            raise RuntimeError("simulated Azure failure")

        with patch.object(operator, "az", side_effect=fake_az):
            with self.assertRaises(RuntimeError):
                operator.apply_container(value, "operator")
        self.assertIsNotNone(private_path)
        self.assertFalse(private_path.exists())


if __name__ == "__main__":
    unittest.main()
