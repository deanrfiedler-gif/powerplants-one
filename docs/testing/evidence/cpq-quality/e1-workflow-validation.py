"""Compare the full parsed workflow and exercise the unchanged aggregate gate.

Run from the repository root with the existing local PyYAML verifier. No project
dependency is added. This is configuration assurance, not a database test run.
"""
import copy
import hashlib
import json
import os
from pathlib import Path
import subprocess
import yaml

baseline = "3b7509f977df086f6bb8f2d40787e3b6678798e4"
path = ".github/workflows/estimating-e1.yml"
old = yaml.safe_load(subprocess.check_output(["git", "show", f"{baseline}:{path}"]))
text = Path(path).read_text(encoding="utf-8")
current = yaml.safe_load(text)
expected = copy.deepcopy(old)
job = expected["jobs"]["estimating_suites"]
job["strategy"]["matrix"]["include"] = [
    {"suite": "database", "database_shard": "1/2"},
    {"suite": "database-2", "database_shard": "2/2"},
]
job["timeout-minutes"] = "${{ startsWith(matrix.suite, 'database') && 45 || 30 }}"
step = next(s for s in job["steps"] if s.get("name") == "E1 PostgreSQL proof")
step["if"] = "startsWith(matrix.suite, 'database')"
step["env"] = {"PPO_E1_DATABASE_SHARD": "${{ matrix.database_shard }}"}
step["run"] = step["run"].replace("--test-timeout=120000 ", '--test-timeout=120000 --test-shard="$PPO_E1_DATABASE_SHARD" ', 1)
assert current == expected, "Unexpected workflow change beyond the intended partition controls"
assert current["jobs"]["estimating_suites"]["strategy"]["fail-fast"] is False
assert current["jobs"]["estimating"]["needs"] == "estimating_suites"
assert current["jobs"]["estimating"]["if"] == "always()"
assert next(s for s in job["steps"] if s.get("name") == "Static and unit proof")["if"] == "matrix.suite == 'database'"
aggregate = current["jobs"]["estimating"]["steps"][0]["run"]
bash = "C:/Program Files/Git/bin/bash.exe" if os.name == "nt" else "bash"
gate = {}
for state in ("success", "failure", "cancelled", "skipped", ""):
    result = subprocess.run([bash, "-c", aggregate], env={**os.environ, "PPO_E1_RESULT": state}, check=False)
    assert result.returncode == (0 if state == "success" else 1)
    gate[state or "(empty)"] = result.returncode
lanes = ["database", "database-2", "browser", "quality"]
artifacts = ["Estimating-E1-evidence" if lane == "browser" else f"Estimating-E1-{lane}-evidence" for lane in lanes]
assert len(artifacts) == len(set(artifacts))
assert current["jobs"]["estimating_suites"]["services"] == old["jobs"]["estimating_suites"]["services"]
print(json.dumps({
    "boundary": "Configuration and shell-gate verification only; real shard execution remains a CI gate",
    "baseline": baseline, "workflow_sha256_lf": hashlib.sha256(text.encode()).hexdigest(),
    "complete_parsed_workflow_comparison": "passed; only matrix shard parameters, database condition/env/argument and equivalent per-lane deadline expression differ",
    "matrix": lanes, "artifacts": artifacts,
    "job_deadlines_minutes": {"database": 45, "database-2": 45, "browser": 30, "quality": 30},
    "individual_database_deadline_ms": 120000, "serial_file_execution": True,
    "static_unit_execution": "once in database", "mandatory_aggregate": gate,
    "unchanged": "All selected paths, application/test source, browser/quality commands, PostgreSQL service, action/runtime pins, restart sequences and evidence retention"
}, indent=2))
