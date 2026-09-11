"""Execute the actual workflow build shell with fake Docker/Azure commands."""
import os
from pathlib import Path
import re
import subprocess
import tempfile
import textwrap
import unittest

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = ROOT / ".github/workflows/azure-demo-deploy.yml"


def shell_step(name):
    # Only extracts a named literal block; no YAML dependency on the CI runner.
    text = WORKFLOW.read_text().split("      - name: " + name + "\n", 1)[1].split("      - name: ", 1)[0]
    return textwrap.dedent(text.split("        run: |\n", 1)[1])


class BuildShellTests(unittest.TestCase):
    def run_build(self, failure="", digest=None):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            log, output, summary = (root / name for name in ["commands", "output", "summary"])
            for name in ["docker", "az"]:
                command = root / name
                command.write_text("#!/bin/bash\n" + textwrap.dedent('''\
                    printf '%s %s\\n' "${0##*/}" "$*" >> "$PPO_TEST_LOG"
                    if [[ "$1" == "$PPO_TEST_FAILURE" ]]; then exit 1; fi
                    if [[ "${0##*/}" == az ]]; then printf '%s\\n' "$PPO_TEST_DIGEST"; fi
                    '''))
                command.chmod(0o700)
            env = {**os.environ, "PATH": f"{root}:{os.environ['PATH']}",
                   "PPO_TEST_LOG": str(log), "PPO_TEST_FAILURE": failure,
                   "PPO_TEST_DIGEST": digest if digest is not None else "sha256:" + "b" * 64,
                   "PPO_REGISTRY": "ppodemosynthetic.azurecr.io", "PPO_DEMO_SUFFIX": "synthetic",
                   "GITHUB_SHA": "a" * 40, "GITHUB_RUN_ID": "123", "GITHUB_RUN_ATTEMPT": "2",
                   "GITHUB_OUTPUT": str(output), "GITHUB_STEP_SUMMARY": str(summary)}
            result = subprocess.run(["bash", "-c", shell_step("Build and push the selected main commit on GitHub")],
                                    env=env, text=True, capture_output=True, timeout=10)
            return result, log.read_text(), output.read_text() if output.exists() else ""

    def test_build_push_and_digest_select_the_same_run_image(self):
        result, log, output = self.run_build()
        self.assertEqual(result.returncode, 0, result.stderr)
        commands = log.splitlines()
        self.assertTrue(commands[0].startswith("docker build --platform linux/amd64"))
        tag = "ppo-demo:" + "a" * 40 + "-123-2"
        self.assertIn(tag, commands[0])
        self.assertIn(tag, commands[1])
        self.assertTrue(commands[1].startswith("docker push "))
        self.assertIn("--image " + tag, commands[2])
        self.assertNotIn("acr build", log)
        self.assertEqual(output, "ref=ppodemosynthetic.azurecr.io/ppo-demo@sha256:" + "b" * 64 + "\n")

    def test_build_failure_never_pushes_or_exports_deployable_image(self):
        result, log, output = self.run_build(failure="build")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(len(log.splitlines()), 1)
        self.assertEqual(output, "")

    def test_push_failure_never_resolves_or_exports_deployable_image(self):
        result, log, output = self.run_build(failure="push")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(len(log.splitlines()), 2)
        self.assertEqual(output, "")

    def test_invalid_digest_never_exports_deployable_image(self):
        result, _, output = self.run_build(digest="sha256:invalid")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(output, "")

    def test_every_literal_shell_step_has_valid_bash_syntax(self):
        for block in re.findall(r"        run: \|\n((?:          .*\n|\n)+)", WORKFLOW.read_text()):
            result = subprocess.run(["bash", "-n"], input=textwrap.dedent(block),
                                    text=True, capture_output=True, timeout=10)
            self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
