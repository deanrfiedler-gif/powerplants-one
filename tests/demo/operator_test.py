import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import call, patch

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
        self.assertIn("--use-existing-image", result.stdout)

    def test_existing_image_option_is_rejected_for_other_actions_before_azure_access(self):
        result = subprocess.run(
            [sys.executable, "-E", spec.origin, "configure", "/missing/settings.json", "--use-existing-image"],
            text=True, capture_output=True, timeout=10,
        )
        self.assertEqual(result.returncode, 2)
        self.assertIn("only valid with bootstrap", result.stderr)


class BootstrapImageTests(unittest.TestCase):
    def setUp(self):
        self.head = "a" * 40
        self.digest = "sha256:" + "b" * 64
        self.out = {"registryName": "demo", "registryServer": "demo.azurecr.io"}

    def test_existing_image_uses_only_the_selected_commit_and_pins_its_digest(self):
        with patch.object(operator, "az", return_value=self.digest) as azure:
            image = operator.bootstrap_image(self.out, self.head, True)
        azure.assert_called_once_with("acr", "repository", "show", "--name", "demo",
                                      "--image", "ppo-demo:" + self.head, "--query", "digest")
        self.assertEqual(image, "demo.azurecr.io/ppo-demo@" + self.digest)

    def test_normal_bootstrap_still_builds_before_resolving_the_same_tag(self):
        with patch.object(operator, "az", side_effect=[None, self.digest]) as azure:
            image = operator.bootstrap_image(self.out, self.head, False)
        self.assertEqual(azure.call_args_list, [
            call("acr", "build", "--registry", "demo", "--image", "ppo-demo:" + self.head,
                 "--file", "infra/azure-demo/Dockerfile", "--no-logs", "."),
            call("acr", "repository", "show", "--name", "demo", "--image", "ppo-demo:" + self.head, "--query", "digest"),
        ])
        self.assertEqual(image, "demo.azurecr.io/ppo-demo@" + self.digest)

    def test_missing_or_malformed_digest_is_refused(self):
        for digest in [None, {}, "", "latest", "sha256:abc", self.digest + "\n"]:
            with self.subTest(digest=digest), patch.object(operator, "az", return_value=digest):
                with self.assertRaises(operator.OperatorActionError):
                    operator.bootstrap_image(self.out, self.head, True)

    def test_failed_image_lookup_stops_before_any_database_or_storage_operation(self):
        commands = []

        def fake_az(*args):
            commands.append(args)
            if args[:2] == ("account", "show"):
                return {"id": "subscription", "tenantId": "tenant"}
            if args[:2] == ("group", "show"):
                return {}
            if args[:3] == ("acr", "repository", "show"):
                raise operator.OperatorActionError("Image lookup failed.")
            self.fail("Unexpected Azure operation: " + str(args[:3]))

        with tempfile.TemporaryDirectory() as folder:
            settings = Path(folder) / "settings.json"
            settings.write_text(json.dumps({"subscription_id": "subscription", "tenant_id": "tenant"}))
            with patch.object(sys, "argv", [spec.origin, "bootstrap", str(settings), "--use-existing-image"]), \
                 patch.object(operator, "validate"), patch.object(operator, "outputs", return_value=self.out), \
                 patch.object(operator.subprocess, "check_output", side_effect=[self.head, ""]), \
                 patch.object(operator, "az", side_effect=fake_az):
                with self.assertRaisesRegex(operator.OperatorActionError, "Image lookup failed"):
                    operator.main()
        self.assertEqual([args[:2] for args in commands], [("account", "show"), ("group", "show"), ("acr", "repository")])

    def test_tasks_rejection_is_actionable_without_revealing_azure_output(self):
        failure = subprocess.CompletedProcess([], 1, stdout="synthetic-private-output",
                                              stderr="(TasksOperationsNotAllowed) synthetic-private-token")
        with patch.object(operator.subprocess, "run", return_value=failure):
            with self.assertRaises(operator.OperatorActionError) as caught:
                operator.az("acr", "build", "--registry", "demo")
        self.assertIn("TasksOperationsNotAllowed", str(caught.exception))
        self.assertIn("--use-existing-image", str(caught.exception))
        self.assertNotIn("synthetic-private", str(caught.exception))

    def test_other_azure_errors_hide_arguments_and_raw_output(self):
        failure = subprocess.CompletedProcess([], 1, stdout="synthetic-private-output", stderr="synthetic-private-token")
        with patch.object(operator.subprocess, "run", return_value=failure):
            with self.assertRaises(operator.OperatorActionError) as caught:
                operator.az("storage", "container", "create", "--account-key", "synthetic-private-key")
        self.assertIn("az storage container", str(caught.exception))
        self.assertNotIn("synthetic-private", str(caught.exception))


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
