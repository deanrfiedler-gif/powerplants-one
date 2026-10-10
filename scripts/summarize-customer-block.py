"""Retain and describe every sample in the declared main/candidate/candidate/main block."""
import gzip
import hashlib
import json
import math
from pathlib import Path
import statistics
import sys

roots = list(map(Path, sys.argv[1:5]))
output = Path(sys.argv[5])
assert len(roots) == 4
output.mkdir(parents=True, exist_ok=False)
artifacts, runs, all_data = [], [], []


def distribution(values):
    assert values
    values = sorted(values)
    return {"n": len(values), "min": values[0], "median": statistics.median(values),
            "p95": values[math.ceil(len(values) * .95) - 1], "max": values[-1]}


def groups(data):
    result = []
    for viewport in ["desktop", "phone"]:
        for phase in ["cold", "warm", "record"]:
            rows = [s for d in data for s in (d["record_visits"] if phase == "record" else d["samples"])
                    if s["viewport"] == viewport and (phase == "record" or
                    (s["wave"] == 0 if phase == "cold" else s["wave"] > 0))]
            assert len(rows) == len(data) * (30 if phase == "warm" else 10)
            result.append({"viewport": viewport, "phase": phase,
                           "ready_ms": distribution([s["ready_ms"] for s in rows])})
    return result


for position, root in enumerate(roots, 1):
    data = json.loads((root / "results.json").read_bytes())
    assert data["complete"] and not data["errors"]
    assert len(data["samples"]) == 80 and len(data["record_visits"]) == 20
    assert data["comparison_position"] == str(position)
    assert data["fixture"] == json.loads((root / "fixture-after.json").read_bytes())
    all_data.append(data)
    gateway = [json.loads(line) for line in (root / "gateway.jsonl").read_text(encoding="utf-8").splitlines()]
    finished = {r["request_id"]: r for r in gateway if r["event"] == "http-finished"}
    cold = [s for s in data["samples"] if s["viewport"] == "phone" and s["wave"] == 0]
    stages = {}
    for path in ["/customers", "/api/v1/local-session", "/api/v1/crm/directory"]:
        rows = [r for s in cold for r in s["network"] if r["path"] == path and not r["prefetch"]]
        assert len(rows) == 10
        stages[path] = {"start_ms": distribution([r["start_ms"] for r in rows]),
                        "headers_ms": distribution([r["response_ms"] for r in rows])}
        if path.startswith("/api/"):
            stages[path]["gateway_elapsed_ms"] = distribution([finished[r["proof_request_id"]]["elapsed_ms"] for r in rows])
    assets = {}
    for kind in ["Script", "Stylesheet", "Font"]:
        rows = [[r for r in s["network"] if r.get("type") == kind and not r["prefetch"]] for s in cold]
        assets[kind] = {"observed_encoded_bytes": distribution([sum(r.get("encoded_bytes", 0) for r in rs) for rs in rows]),
                        "last_finished_ms": distribution([max((r.get("finish_ms", 0) for r in rs), default=0) for rs in rows]),
                        "unfinished_requests": sum("finish_ms" not in r for rs in rows for r in rs)}
    runs.append({k: data[k] for k in ["label", "started_at", "comparison_position", "source", "compiled_source", "build_id", "browser", "node", "platform", "comparison_block"]})
    runs[-1].update({"groups": groups([data]), "phone_cold_stages": stages, "phone_cold_assets": assets,
                    "phone_cold_readiness": {"core_headers_ms": distribution([s["core_headers_ms"] for s in cold]),
                                             "core_json_processed_ms": distribution([s["core_json_processed_ms"] for s in cold]),
                                             "post_core_json_to_ready_ms": distribution([s["ready_ms"] - s["core_json_processed_ms"] for s in cold]),
                                             "dom_interactive_ms": distribution([s["navigation"]["dom_interactive_ms"] for s in cold])},
                    "phone_cold_free_memory_bytes": distribution([s["free_memory_bytes"] for s in cold]),
                    "prefetch_requests": sum(r["prefetch"] for s in data["samples"] for r in s["network"])})
    for name in ["results.json", "gateway.jsonl", "fixture-after.json", "desktop-directory.png", "desktop-record.png", "phone-directory.png", "phone-record.png"]:
        raw = (root / name).read_bytes()
        relative = f"{position}-{root.name}/{name}" + ("" if name.endswith(".png") else ".gz")
        target = output / relative
        target.parent.mkdir(exist_ok=True)
        stored = gzip.compress(raw, mtime=0) if relative.endswith(".gz") else raw
        target.write_bytes(stored)
        artifacts.append({"path": relative, "sha256": hashlib.sha256(stored).hexdigest(),
                          "original_sha256": hashlib.sha256(raw).hexdigest()})

for field in ["fixture", "browser", "node", "platform", "network", "memory_bytes", "comparison_block"]:
    assert all(d[field] == all_data[0][field] for d in all_data), field
assert [d["started_at"] for d in all_data] == sorted(d["started_at"] for d in all_data)
for indices in [(0, 3), (1, 2)]:
    assert all_data[indices[0]]["compiled_source"] == all_data[indices[1]]["compiled_source"]
    assert all_data[indices[0]]["build_id"] == all_data[indices[1]]["build_id"]
assert all_data[0]["compiled_source"] != all_data[1]["compiled_source"]
summary = {"schema_version": 1, "order": "main/candidate/candidate/main", "runs": runs,
           "pooled": {"main": groups([all_data[0], all_data[3]]), "candidate": groups([all_data[1], all_data[2]])},
           "fixture": all_data[0]["fixture"], "network": all_data[0]["network"],
           "limits": "All declared runs retained; no sample exclusions. Fixed-order replication on a shared Windows host, not a randomised trial or production/physical-device acceptance. Pooled cold/record n=20 and warm n=60 per build/viewport. Nearest-rank descriptive p95; no confidence interval or causal attribution. Asset byte/finish statistics describe observations up to readiness, with incomplete requests explicit. Full PT-27 target remains separate."}
(output / "summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8", newline="\n")
(output / "artifacts.json").write_text(json.dumps(artifacts, indent=2) + "\n", encoding="utf-8", newline="\n")
print(json.dumps({"runs": [{"label": r["label"], "prefetch": r["prefetch_requests"], "groups": r["groups"]} for r in runs], "pooled": summary["pooled"]}, indent=2))
