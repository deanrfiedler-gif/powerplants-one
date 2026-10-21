"""Local evidence check; requires the existing verification environment's PyYAML."""
import argparse
from copy import deepcopy
import json
import os
from pathlib import Path
import shutil
import subprocess

import yaml

parser = argparse.ArgumentParser()
parser.add_argument("--base", default="f13bd157835c3fb511885cefae321ba98cc32d86")
args = parser.parse_args()
workflow = Path(".github/workflows/application.yml")
baseline_text = subprocess.run(
    ["git", "show", f"{args.base}:{workflow.as_posix()}"],
    text=True, capture_output=True, check=True,
).stdout
baseline = yaml.safe_load(baseline_text)
current = yaml.safe_load(workflow.read_text(encoding="utf-8"))
expected = deepcopy(baseline)
matrix = expected["jobs"]["p01_suites"]["strategy"]["matrix"]
old_shards = [entry for entry in matrix["include"] if "database_shard" in entry]
assert old_shards == [
    {"suite": f"database-{index}", "database_shard": f"{index}/4"}
    for index in range(1, 5)
], "The comparison baseline must retain its four original database lanes"
for entry in old_shards:
    entry["database_shard"] = entry["database_shard"].replace("/4", "/8")
matrix["include"].extend(
    {"suite": f"database-{index}", "database_shard": f"{index}/8"}
    for index in range(5, 9)
)
assert current == expected, "Only the four-to-eight native database matrix change is permitted"

primary = current["jobs"]["p01_suites"]
assert primary["timeout-minutes"] == 90
assert primary["strategy"]["fail-fast"] is False
native_step = next(step for step in primary["steps"] if step.get("name") == "Real PostgreSQL behaviour and competing transactions")
assert "--test-concurrency=1 --test-timeout=120000" in native_step["run"]
assert 'tests/database/*.test.ts' in native_step["run"]
assert '--test-shard="$PPO_DATABASE_SHARD"' in native_step["run"]
assert "--test-reporter-destination=verification-evidence/native-database/results.tap" in native_step["run"]
gate = current["jobs"]["p01"]
assert gate["needs"] == ["scope", "p01_suites"]
assert "always()" in gate["if"]
assert gate["steps"][0]["env"]["PPO_SUITE_RESULT"] == "${{ needs.p01_suites.result }}"

bash = shutil.which("bash")
if os.name == "nt":
    git_bash = Path(os.environ.get("ProgramFiles", "C:/Program Files")) / "Git/bin/bash.exe"
    if git_bash.is_file():
        bash = str(git_bash)
assert bash, "Bash is required to execute the actual aggregate truth table"
truth_table = {}
for value in ["success", "failure", "cancelled", "skipped", ""]:
    result = subprocess.run(
        [bash, "-c", gate["steps"][0]["run"]],
        env={**os.environ, "PPO_SUITE_RESULT": value},
        text=True, capture_output=True, timeout=10,
    )
    assert (result.returncode == 0) == (value == "success")
    truth_table[value or "missing"] = result.returncode

checked_shell_steps = 0
for job in current["jobs"].values():
    for step in job.get("steps", []):
        if "run" not in step:
            continue
        result = subprocess.run([bash, "-n"], input=step["run"], text=True, capture_output=True, timeout=10)
        assert result.returncode == 0, f"Shell syntax failed: {step.get('name', 'unnamed step')}"
        checked_shell_steps += 1

print(json.dumps({
    "baseline": args.base,
    "boundary": "Configuration and aggregate execution proof only; no application or database tests executed.",
    "whole_workflow_comparison": "Only database_shard 1/4..4/4 to 1/8..8/8 differs in parsed workflow",
    "retained": ["all jobs and commands", "90-minute job deadline", "120-second test deadline", "serial database files", "complete database glob", "pinned actions/runtime/services", "evidence paths and lane-specific names", "mandatory aggregate"],
    "database_lanes": [entry for entry in primary["strategy"]["matrix"]["include"] if "database_shard" in entry],
    "aggregate_truth_table_exit_codes": truth_table,
    "bash_syntax_steps_checked": checked_shell_steps,
}, indent=2))
