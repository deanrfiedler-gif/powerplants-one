"""Retain exact diagnostic bytes and report all declared comparison groups."""

import gzip
import hashlib
import json
import math
from pathlib import Path
import statistics
import sys

baseline, candidate, output = map(Path, sys.argv[1:4])
output.mkdir(parents=True, exist_ok=True)
artifacts = []
runs = {}


def retain(source, destination):
    raw = source.read_bytes()
    target = output / destination
    target.parent.mkdir(parents=True, exist_ok=True)
    encoded = gzip.compress(raw, mtime=0) if destination.endswith(".gz") else raw
    target.write_bytes(encoded)
    artifacts.append({"path": destination, "bytes": len(encoded),
                      "sha256": hashlib.sha256(encoded).hexdigest(),
                      "original_bytes": len(raw),
                      "original_sha256": hashlib.sha256(raw).hexdigest()})


for label, root in [("baseline", baseline), ("candidate", candidate)]:
    data = json.loads((root / "results.json").read_text(encoding="utf-8"))
    assert data["complete"] and not data["errors"]
    assert len(data["samples"]) == 80 and len(data["record_visits"]) == 20
    after = json.loads((root / "fixture-after.json").read_text(encoding="utf-8"))
    assert after == data["fixture"]
    groups = []
    for viewport in ["desktop", "phone"]:
        for phase in ["cold", "warm", "record"]:
            selected = [s for s in (data["record_visits"] if phase == "record" else data["samples"])
                        if s["viewport"] == viewport and (phase == "record" or
                        (s["wave"] == 0 if phase == "cold" else s["wave"] > 0))]
            assert len(selected) == (30 if phase == "warm" else 10)
            values = sorted(s["ready_ms"] for s in selected)
            p95 = values[math.ceil(len(values) * .95) - 1]
            groups.append({"viewport": viewport, "phase": phase, "n": len(values),
                           "min_ms": min(values), "median_ms": statistics.median(values),
                           "p95_ms": p95, "max_ms": max(values),
                           "target_ms": 3000, "meets_target": p95 <= 3000})
    prefetch = [r for s in data["samples"] for r in s["network"] if r["prefetch"]]
    by_path = {p: sum(r["path"] == p for r in prefetch) for p in sorted({r["path"] for r in prefetch})}
    runs[label] = {k: data[k] for k in ["source", "compiled_source", "build_id", "browser", "node", "platform", "network", "fixture"]}
    runs[label].update({"groups": groups, "directory_samples": 80, "record_visits": 20,
                       "failures": 0, "fixture_after_equal": True,
                       "prefetch_requests": len(prefetch), "prefetch_by_path": by_path})
    for name in ["results.json", "gateway.jsonl", "fixture-after.json"]:
        retain(root / name, f"{label}/{name}.gz")
    for viewport in ["desktop", "phone"]:
        for view in ["directory", "record"]:
            retain(root / f"{viewport}-{view}.png", f"{label}/{viewport}-{view}.png")

assert runs["baseline"]["fixture"] == runs["candidate"]["fixture"]
assert runs["baseline"]["network"] == runs["candidate"]["network"]
assert runs["baseline"]["browser"] == runs["candidate"]["browser"]
summary = {"schema_version": 1, "runs": runs,
           "limits": "Ordered baseline/candidate local diagnostic observations on the same fixture. No randomised/reversed-order control; shared host, retained OS/database caches and gateway logging overhead. Cold p95 is the maximum of ten samples; warm p95 is nearest-rank among thirty. All six groups, including regressions and misses, remain visible. Speculative request count is observed before the sample snapshot, not whole-session traffic or a causal attribution of every millisecond. Full PT-27, hosted and owner/device/accessibility acceptance remain open."}
(output / "summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8", newline="\n")
(output / "artifacts.json").write_text(json.dumps(artifacts, indent=2) + "\n", encoding="utf-8", newline="\n")
print(json.dumps({k: {"prefetch": v["prefetch_requests"], "groups": v["groups"]} for k, v in runs.items()}, indent=2))
