"""Retain every declared session-readiness attempt; incomplete runs are not pooled."""
import collections
import gzip
import hashlib
import json
import math
from pathlib import Path
import statistics
import sys

output = Path(sys.argv[1])
roots = list(map(Path, sys.argv[2:]))
assert roots
output.mkdir(parents=True, exist_ok=False)
artifacts, runs = [], []
fixture = None


def distribution(values):
    if not values:
        return None
    ordered = sorted(values)
    return {"n": len(values), "min": ordered[0], "median": statistics.median(ordered),
            "p95": ordered[math.ceil(len(ordered) * .95) - 1], "max": ordered[-1]}


for root in roots:
    data = json.loads((root / "results.json").read_bytes())
    if fixture is None:
        fixture = data["fixture"]
    assert data["fixture"] == fixture
    complete = data["complete"] and not data["errors"]
    if complete:
        assert len(data["samples"]) == 80 and len(data["record_visits"]) == 20
        assert json.loads((root / "fixture-after.json").read_bytes()) == fixture
    rows = [json.loads(line) for line in (root / "gateway.jsonl").read_text(encoding="utf-8").splitlines()] if (root / "gateway.jsonl").exists() else []
    observed = {r["proof_request_id"]: r["path"] for s in data["samples"] for r in s["network"] if "proof_request_id" in r}
    failures = []
    for row in rows:
        if row["event"] != "http-finished" or row["status"] < 500:
            continue
        request = row["request_id"]
        phases = [{k: r[k] for k in ["event", "at_ms", "phase", "pool_id", "acquisition_id", "total", "idle", "waiting", "elapsed_ms", "held_ms", "event_loop_active_ms", "event_loop_idle_ms", "error_category"] if k in r}
                  for r in rows if r.get("request_id") == request and (r["event"] == "read-phase" or r["event"].startswith("database-"))]
        failures.append({"request_id": request, "path": observed.get(request, row["path"]), "status": row["status"], "gateway_ms": row["elapsed_ms"], "phases": phases})
    pools = []
    for created in (r for r in rows if r["event"] == "database-pool-created"):
        pool_id = created["pool_id"]
        events = [r for r in rows if r.get("pool_id") == pool_id]
        pools.append({"id": pool_id, "max": created["max"], "peak_total": max(r.get("total", 0) for r in events), "peak_waiting": max(r.get("waiting", 0) for r in events),
                      "acquired_ms": distribution([r["elapsed_ms"] for r in events if r["event"] == "database-acquired"]),
                      "held_ms": distribution([r["held_ms"] for r in events if r["event"] == "database-release"]),
                      "acquire_failures": dict(collections.Counter(r["error_category"] for r in events if r["event"] == "database-acquire-failed"))})
    groups = []
    if complete:
        for viewport in ["desktop", "phone"]:
            for phase in ["cold", "warm", "record"]:
                samples = [s["ready_ms"] for s in (data["record_visits"] if phase == "record" else data["samples"])
                           if s["viewport"] == viewport and (phase == "record" or (s["wave"] == 0 if phase == "cold" else s["wave"] > 0))]
                groups.append({"viewport": viewport, "phase": phase, "ready_ms": distribution(samples)})
    runtime = [r for r in rows if r["event"] == "server-runtime"]
    run = {k: data.get(k) for k in ["label", "source", "compiled_source", "build_id", "started_at", "comparison_block", "comparison_position", "node", "browser", "platform", "network"]}
    run.update({"complete": complete, "sample_count": len(data["samples"]), "failed_samples": sum("error" in s for s in data["samples"]), "record_count": len(data["record_visits"]), "errors": data["errors"], "groups": groups,
                "route_phase_count": sum(r["event"] == "read-phase" for r in rows), "pools": pools, "http_failures": failures,
                "runtime": {key: distribution([r[key] for r in runtime if key in r]) for key in ["interval_ms", "event_loop_active_ms", "event_loop_idle_ms", "cpu_user_ms", "cpu_system_ms", "system_free_bytes"]}})
    runs.append(run)
    for name in ["results.json", "gateway.jsonl", "fixture-after.json", "desktop-directory.png", "desktop-record.png", "phone-directory.png", "phone-record.png"]:
        source = root / name
        if not source.exists():
            continue
        raw = source.read_bytes()
        relative = root.name + "/" + name + ("" if name.endswith(".png") else ".gz")
        stored = raw if name.endswith(".png") else gzip.compress(raw, mtime=0)
        target = output / relative
        target.parent.mkdir(exist_ok=True)
        target.write_bytes(stored)
        artifacts.append({"path": relative, "bytes": len(stored), "sha256": hashlib.sha256(stored).hexdigest(), "original_bytes": len(raw), "original_sha256": hashlib.sha256(raw).hexdigest()})

(output / "summary.json").write_text(json.dumps({"fixture": fixture, "runs": runs, "pooled": None, "limits": "Separate attempts on a shared Windows host; failures and absent phases remain explicit. Connection acquisition includes event-loop scheduling and PostgreSQL connection establishment. Held time includes queries and scheduling, not isolated database execution. No SQL, payloads or credentials recorded; incomplete runs have no timing groups."}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
(output / "artifacts.json").write_text(json.dumps(artifacts, indent=2) + "\n", encoding="utf-8", newline="\n")
print(json.dumps([{"label": r["label"], "complete": r["complete"], "failed_samples": r["failed_samples"], "pools": len(r["pools"]), "http_failures": len(r["http_failures"])} for r in runs]))
