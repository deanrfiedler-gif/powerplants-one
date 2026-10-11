"""Retain original calibration bytes and summarize the declared per-browser gates."""
import gzip
import hashlib
import json
from pathlib import Path
import statistics
import sys


def run(root, output):
    protocol = json.loads((root / "protocol.json").read_bytes())
    output.mkdir(parents=True, exist_ok=False)
    rows = []
    for cohort in protocol["cohorts"]:
        samples = cohort["samples"]
        for sample in samples:
            assert json.loads((root / (sample["sample"] + ".json")).read_bytes()) == sample
        row = {key: cohort[key] for key in ["method", "users", "complete", "passed"]}
        row["samples"] = []
        for sample in samples:
            item = {key: sample[key] for key in ["sample", "stage", "issues"] if key in sample}
            if "error" in sample:
                item["error"] = sample["error"]
            if sample.get("latency"):
                item["median_latency_ms"] = statistics.median(sample["latency"])
            for name, rate in [("download", 1250000), ("upload", 625000)]:
                probes = sample.get(name, [])
                if len(probes) == 2:
                    elapsed = probes[1]["elapsed_ms"] - probes[0]["elapsed_ms"]
                    expected = 1000 * (probes[1]["bytes"] - probes[0]["bytes"]) / rate
                    item[name + "_slope_ms"] = elapsed
                    item[name + "_nominal_slope_ms"] = expected
                    item[name + "_exact"] = all(p["exact"] for p in probes)
            if "parallel" in sample:
                item["parallel"] = sample["parallel"]
            row["samples"].append(item)
        rows.append(row)
    summary = {key: protocol[key] for key in ["source", "started_at", "node", "platform", "logical_cpus", "conditions", "browser", "passed", "criteria"]}
    summary["cohorts"] = rows
    summary["limits"] = "Independent synthetic transfers, not application latency or production readiness. Both commands share Chromium's throttle engine. Missing probes and failed cohorts remain explicit; no retries, pooling, replacement or inferred success."
    artifacts = []
    for path in sorted(root.glob("*.json")):
        raw = path.read_bytes()
        compressed = gzip.compress(raw, mtime=0)
        target = output / "originals" / (path.name + ".gz")
        target.parent.mkdir(exist_ok=True)
        target.write_bytes(compressed)
        artifacts.append({"path": target.relative_to(output).as_posix(), "bytes": len(compressed),
                          "sha256": hashlib.sha256(compressed).hexdigest(), "original_bytes": len(raw),
                          "original_sha256": hashlib.sha256(raw).hexdigest()})
    for name, data in [("summary.json", summary), ("artifacts.json", artifacts)]:
        (output / name).write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"passed": protocol["passed"], "cohorts": len(rows), "retained_files": len(artifacts)}))


if __name__ == "__main__":
    run(Path(sys.argv[1]), Path(sys.argv[2]))
