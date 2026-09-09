import argparse
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

    def test_image_commit_requires_existing_image_mode_and_a_full_commit(self):
        for options in [["--image-commit", "a" * 40],
                        ["--use-existing-image", "--image-commit", "main"],
                        ["--use-existing-image", "--image-commit", "a" * 39],
                        ["--use-existing-image", "--image-commit", "A" * 40]]:
            with self.subTest(options=options):
                result = subprocess.run([sys.executable, "-E", spec.origin, "bootstrap", "/missing/settings.json", *options],
                                        text=True, capture_output=True, timeout=10)
                self.assertEqual(result.returncode, 2)
                self.assertIn("--image-commit requires", result.stderr)


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

    def test_bootstrap_uses_documented_database_arguments_and_one_image_for_all_containers(self):
        self._check_successful_bootstrap()

    def test_operator_fix_can_reuse_the_existing_ancestor_image_for_the_whole_bootstrap(self):
        self._check_successful_bootstrap("c" * 40)

    def test_image_commit_must_be_available_in_the_operator_history(self):
        ancestor = "c" * 40
        with patch.object(operator.subprocess, "run", return_value=subprocess.CompletedProcess([], 0)) as git:
            self.assertEqual(operator.image_source_commit(self.head, None), self.head)
            git.assert_not_called()
            self.assertEqual(operator.image_source_commit(self.head, ancestor), ancestor)
            self.assertEqual(git.call_args.args[0], ["git", "merge-base", "--is-ancestor", ancestor, self.head])
        for exit_code in [1, 128]:
            with self.subTest(exit_code=exit_code), \
                 patch.object(operator.subprocess, "run", return_value=subprocess.CompletedProcess([], exit_code)):
                with self.assertRaises(operator.OperatorActionError):
                    operator.image_source_commit(self.head, ancestor)

    def _check_successful_bootstrap(self, image_commit=None):
        # Azure's public db-create contract requires --name, not the parent
        # flexible-server command's --database-name option.
        database_cli = argparse.ArgumentParser()
        for flag in ["--resource-group", "--server-name", "--name"]:
            database_cli.add_argument(flag, required=True)
        settings = {"subscription_id": "subscription", "tenant_id": "tenant", "epoch": "20260909",
                    "suffix": "aabbccdd", "admin_password": "synthetic-admin", "app_password": "synthetic-runtime",
                    "client_secret": "synthetic-client", "client_id": "client", "testers": []}
        outputs = {**self.out, "databaseServer": "pg-demo", "databaseHost": "pg-demo.postgres.database.azure.com",
                   "storageAccount": "demo", "demoOrigin": "https://demo.azurecontainerapps.io",
                   "environmentId": "/synthetic/environment", "pullIdentityId": "/synthetic/identity"}
        database_requests = []
        image_requests = []

        def fake_az(*args):
            if args[:2] == ("account", "show"):
                return {"id": "subscription", "tenantId": "tenant"}
            if args[:2] == ("group", "show"):
                return {}
            if args[:3] == ("acr", "repository", "show"):
                image_requests.append(args[args.index("--image") + 1])
                return self.digest
            if args[:4] == ("postgres", "flexible-server", "db", "create"):
                database_requests.append(database_cli.parse_args(args[4:]))
                return {}
            if args[:4] == ("storage", "account", "keys", "list"):
                return [{"value": "synthetic-blob"}]
            if args[:3] == ("storage", "container", "create"):
                return {}
            if args[:3] == ("containerapp", "job", "start"):
                return {"name": "synthetic-execution"}
            self.fail("Unexpected Azure operation: " + str(args[:4]))

        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "settings.json"
            path.write_text(json.dumps(settings))
            argv = [spec.origin, "bootstrap", str(path), "--use-existing-image"]
            if image_commit:
                argv.extend(["--image-commit", image_commit])
            with patch.object(sys, "argv", argv), \
                 patch.object(operator, "validate"), patch.object(operator, "outputs", return_value=outputs), \
                 patch.object(operator.subprocess, "check_output", side_effect=[self.head, ""]), \
                 patch.object(operator.subprocess, "run", return_value=subprocess.CompletedProcess([], 0)), \
                 patch.object(operator, "az", side_effect=fake_az), \
                 patch.object(operator, "apply_container") as apply, patch.object(operator, "wait_job") as wait:
                operator.main()
        self.assertEqual(len(database_requests), 1)
        self.assertEqual(image_requests, ["ppo-demo:" + (image_commit or self.head)])
        self.assertEqual(vars(database_requests[0]), {"resource_group": operator.GROUP, "server_name": "pg-demo", "name": "ppo_demo_20260909"})
        self.assertEqual([c.args[1] for c in apply.call_args_list], ["operator", "worker", "web"])
        images = [c.args[0]["properties"]["template"]["containers"][0]["image"] for c in apply.call_args_list]
        self.assertEqual(images, ["demo.azurecr.io/ppo-demo@" + self.digest] * 3)
        wait.assert_called_once_with("job-ppo-operator-aabbccdd", "synthetic-execution")


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
