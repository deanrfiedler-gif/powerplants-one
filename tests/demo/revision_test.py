import importlib.util
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("verify_revision", Path(__file__).resolve().parents[2] / "infra/azure-demo/verify_revision.py")
revision = importlib.util.module_from_spec(spec)
spec.loader.exec_module(revision)


class RevisionTests(unittest.TestCase):
    image = "ppodemo90deea5d.azurecr.io/ppo-demo@sha256:" + "a" * 64

    def wait(self, attempts=2):
        return revision.wait_for_revision("rg-ppo-demo-aue", "ca-ppo-demo-90deea5d", self.image, attempts)

    def test_old_ready_revision_cannot_pass_while_new_revision_starts(self):
        with patch.object(revision, "azure", side_effect=[
            {"latest": "new", "ready": "old"},
            {"latest": "new", "ready": "new"},
            {"image": self.image, "health": "Healthy"},
        ]) as azure, patch.object(revision.time, "sleep") as sleep:
            self.wait()
        self.assertEqual(azure.call_count, 3)
        sleep.assert_called_once_with(5)

    def test_healthy_old_image_cannot_pass_even_if_latest_and_ready_match(self):
        with patch.object(revision, "azure", side_effect=[
            {"latest": "old", "ready": "old"},
            {"image": "old-image", "health": "Healthy"},
        ]):
            with self.assertRaisesRegex(RuntimeError, "did not become ready"):
                self.wait(attempts=1)

    def test_matching_digest_must_also_be_healthy(self):
        with patch.object(revision, "azure", side_effect=[
            {"latest": "new", "ready": "new"},
            {"image": self.image, "health": "Unhealthy"},
        ]):
            with self.assertRaisesRegex(RuntimeError, "did not become ready"):
                self.wait(attempts=1)

    def test_missing_revision_times_out_without_any_mutation(self):
        with patch.object(revision, "azure", return_value={}) as azure, patch.object(revision.time, "sleep"):
            with self.assertRaisesRegex(RuntimeError, "no rollback"):
                self.wait()
        self.assertEqual(azure.call_count, 2)
        self.assertTrue(all(c.args[:2] == ("containerapp", "show") for c in azure.call_args_list))

    def test_cli_failure_does_not_expose_response(self):
        result = subprocess.CompletedProcess([], 1, "private-response", "private-error")
        with patch.object(revision.subprocess, "run", return_value=result):
            with self.assertRaises(RuntimeError) as error:
                revision.azure("containerapp", "show")
        self.assertNotIn("private-", str(error.exception))


if __name__ == "__main__":
    unittest.main()
