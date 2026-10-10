"""Summarize one declared observer block without pooling or replacing attempts."""
import gzip
import hashlib
import json
import math
from pathlib import Path
import statistics
import subprocess
import sys


def distribution(values):
    if not values:
        return None
    ordered = sorted(values)
    return {"n": len(values), "min": ordered[0], "median": statistics.median(ordered),
            "p95": ordered[math.ceil(len(ordered) * .95) - 1], "max": ordered[-1]}


def resource_summary(rows, windows=None):
    # Window statistics use only whole sampled intervals inside a measured
    # browser action. Startup/login/screenshots remain in whole-run statistics.
    pairs = [(a, b) for a, b in zip(rows, rows[1:]) if windows is None or
             any(start <= a["at_ms"] <= b["at_ms"] <= end for start, end in windows)]
    points = [r for r in rows if windows is None or any(start <= r["at_ms"] <= end for start, end in windows)]
    host, process, waits, steal = [], [], [], []
    covered_ms = 0
    for a, b in pairs:
        elapsed = b["at_ms"] - a["at_ms"]
        ticks = [y - x for x, y in zip(a["host_cpu_ticks"], b["host_cpu_ticks"])]
        assert elapsed > 0 and all(n >= 0 for n in ticks)
        total = sum(ticks)
        if total:
            host.append(100 * sum(ticks[i] for i in [0, 1, 2, 5, 6]) / total)
            waits.append(100 * ticks[4] / total)
            steal.append(100 * ticks[7] / total)
        if a["server"] is not None and b["server"] is not None:
            used = b["server"]["cpu_ms"] - a["server"]["cpu_ms"]
            assert used >= 0
            process.append(used / elapsed)  # 1.0 means one logical CPU occupied.
        covered_ms += elapsed
    return {"sample_count": len(points), "interval_count": len(pairs), "covered_ms": covered_ms,
            "host_active_capacity_percent": distribution(host), "host_iowait_percent": distribution(waits),
            "host_steal_percent": distribution(steal), "server_cpu_cores": distribution(process),
            "available_memory_bytes": distribution([r["memory"]["MemAvailable"] for r in points]),
            "swap_used_bytes": distribution([r["memory"]["SwapTotal"] - r["memory"]["SwapFree"] for r in points]),
            "server_rss_bytes": distribution([r["server"]["rss_bytes"] for r in points if r["server"] is not None])}


def run(evidence, block, output):
    block_root = evidence / "pt27-observer" / block
    protocol = json.loads((block_root / "protocol.json").read_bytes())
    positions = protocol["positions"]
    assert [p["diagnostics"] for p in positions] == ["0", "1", "1", "0"]
    assert [r["label"] for r in protocol["results"]] == [p["label"] for p in positions], "Retain incomplete block before attempting summary"
    roots = [evidence / "pt27-loading" / p["label"] for p in positions]
    subprocess.run([sys.executable, str(Path(__file__).with_name("summarize-session-readiness.py")), str(output), *map(str, roots)], check=True)
    summary = json.loads((output / "summary.json").read_bytes())
    artifacts = json.loads((output / "artifacts.json").read_bytes())
    for position, root, row, outcome in zip(positions, roots, summary["runs"], protocol["results"]):
        data = json.loads((root / "results.json").read_bytes())
        assert data["compiled_source"] == protocol["source"] and data["build_id"] == protocol["build_id"]
        assert data["fixture"] == protocol["fixture"]["fixture"]
        assert data["detailed_diagnostics"] == (position["diagnostics"] == "1")
        if outcome["exit_code"] != 0:
            row["complete"], row["groups"] = False, []
        if row["complete"] and data["detailed_diagnostics"]:
            assert row["route_phase_count"] > 0 and row["pools"] and not row["diagnostic_cap_reached"]
        if not data["detailed_diagnostics"]:
            assert not (root / "gateway.jsonl").exists()
        resources = [json.loads(line) for line in (block_root / (root.name + "-resources.jsonl")).read_text().splitlines()]
        windows = sorted((s["started_at_ms"], s["started_at_ms"] + s["ready_ms"]) for s in data["samples"] + data["record_visits"] if "ready_ms" in s)
        # Combine concurrent browser windows into their union.
        merged = []
        for start, end in windows:
            if merged and start <= merged[-1][1]:
                merged[-1][1] = max(merged[-1][1], end)
            else:
                merged.append([start, end])
        row.update({"driver_exit_code": outcome["exit_code"], "resources_whole_run": resource_summary(resources),
                    "resources_successful_action_interiors": resource_summary(resources, merged),
                    "browser_http_errors": [{"viewport": s["viewport"], "wave": s["wave"], "user": s["user"], "path": r["path"], "status": r["status"]}
                                            for s in data["samples"] for r in s["network"] if r.get("status", 0) >= 400]})
        for group in row["groups"]:
            if group["phase"] == "record":
                continue
            samples = [s for s in data["samples"] if s["viewport"] == group["viewport"] and (s["wave"] == 0 if group["phase"] == "cold" else s["wave"] > 0)]
            cores = [next(r for r in s["network"] if r["path"] == "/api/v1/crm/directory") for s in samples]
            group["browser_phases_ms"] = {
                "core_request_start_from_document": distribution([r["start_ms"] for r in cores]),
                "core_response_headers_after_request": distribution([r["response_ms"] - r["start_ms"] for r in cores]),
                "cdp_finish_minus_headers": distribution([r["finish_ms"] - r["response_ms"] for r in cores if "finish_ms" in r]),
                "ready_after_core_json": distribution([s["ready_ms"] - s["core_json_processed_ms"] for s in samples]),
                "document_response_start": distribution([s["navigation"]["response_start_ms"] for s in samples]),
            }
            group["pre_core_fraction_of_readiness"] = distribution([r["start_ms"] / s["ready_ms"] for s, r in zip(samples, cores)])
    summary.update({"protocol": protocol, "resource_limits": "Two-second external samples, identical in both modes. Whole-run counters include startup, fixture identity setup and screenshots. Action-interior counters include only whole intervals within successful measured browser actions; missing process data are unknown, never zero. CPU values summarize sampled intervals, not isolated SQL execution. Host CPU includes browsers, database and runner work. Off/on/on/off bounds order effects but does not eliminate caches or cloud scheduling; one block cannot establish an observer effect or an earlier failure cause."})
    summary["browser_phase_limits"] = "Core request start includes document/asset loading, hydration and client/session gating; it is not isolated network or server time. CDP finish-minus-headers is the raw event timestamp difference under emulation, which can be negative when response events are delayed; do not interpret it as physical transfer time. Percentiles of separate components are not additive."
    for source in sorted(block_root.iterdir()):
        if not source.is_file():
            continue
        raw = source.read_bytes()
        stored = gzip.compress(raw, mtime=0)
        relative = "external/" + source.name + ".gz"
        target = output / relative
        target.parent.mkdir(exist_ok=True)
        target.write_bytes(stored)
        artifacts.append({"path": relative, "bytes": len(stored), "sha256": hashlib.sha256(stored).hexdigest(),
                          "original_bytes": len(raw), "original_sha256": hashlib.sha256(raw).hexdigest()})
    for name, value in [("summary.json", summary), ("artifacts.json", artifacts)]:
        (output / name).write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    run(Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3]))
