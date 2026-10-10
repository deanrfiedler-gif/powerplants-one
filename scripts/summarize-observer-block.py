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


def role_summary(rows, windows=None):
    pairs = [(a, b) for a, b in zip(rows, rows[1:]) if "roles" in a and "roles" in b and
             (windows is None or any(start <= a["at_ms"] <= b["at_ms"] <= end for start, end in windows))]
    points = [r for r in rows if "roles" in r and
              (windows is None or any(start <= r["at_ms"] <= end for start, end in windows))]
    result = {}
    for role in ["server", "database", "browser_driver"]:
        rates, unmatched = [], 0
        for a, b in pairs:
            before = {(p["pid"], p["start_ticks"]): p for p in a["roles"][role]}
            after = {(p["pid"], p["start_ticks"]): p for p in b["roles"][role]}
            matched = before.keys() & after.keys()
            unmatched += len(before.keys() ^ after.keys())
            deltas = [after[key]["cpu_ms"] - before[key]["cpu_ms"] for key in matched]
            assert all(n >= 0 for n in deltas)
            if matched:
                rates.append(sum(deltas) / (b["at_ms"] - a["at_ms"]))
        result[role] = {"matched_process_cpu_cores": distribution(rates), "unmatched_process_endpoints": unmatched,
                        "process_count": distribution([len(r["roles"][role]) for r in points]),
                        "threads_checked": sum(p["threads_checked"] for r in points for p in r["roles"][role]),
                        "escaped_threads": sum(p["escaped_threads"] for r in points for p in r["roles"][role])}
    return result


def run(evidence, block, output):
    block_root = evidence / "pt27-observer" / block
    protocol = json.loads((block_root / "protocol.json").read_bytes())
    positions = protocol["positions"]
    profile = protocol.get("profile", "observer")
    assert profile in ["observer", "startup", "candidate", "cpu"]
    assert [p["diagnostics"] for p in positions] == (["0", "1", "1", "0"] if profile == "observer" else ["0"] * 4)
    assert [p.get("browser_count", 10) for p in positions] == ([1, 10, 10, 1] if profile == "startup" else [10] * 4)
    if profile == "candidate":
        sources = [p["compiled_source"] for p in positions]
        builds = [p["build_id"] for p in positions]
        assert sources[0] == sources[3] != sources[1] == sources[2]
        assert builds[0] == builds[3] != builds[1] == builds[2]
    if profile == "cpu":
        assert [p["label"] for p in positions] == [block + "-" + suffix for suffix in
                ["shared-a1", "partitioned-b1", "partitioned-b2", "shared-a2"]]
        assert all(p["compiled_source"] == protocol["source"] and p["build_id"] == protocol["build_id"] for p in positions)
    assert [r["label"] for r in protocol["results"]] == [p["label"] for p in positions], "Retain incomplete block before attempting summary"
    roots = [evidence / "pt27-loading" / p["label"] for p in positions]
    subprocess.run([sys.executable, str(Path(__file__).with_name("summarize-session-readiness.py")), str(output), *map(str, roots)], check=True)
    summary = json.loads((output / "summary.json").read_bytes())
    artifacts = json.loads((output / "artifacts.json").read_bytes())
    for position, root, row, outcome in zip(positions, roots, summary["runs"], protocol["results"]):
        data = json.loads((root / "results.json").read_bytes())
        assert data["compiled_source"] == position.get("compiled_source", protocol["source"])
        assert data["build_id"] == position.get("build_id", protocol["build_id"])
        if profile == "candidate":
            assert data["driver_source"] == protocol["source"]
        assert data["fixture"] == protocol["fixture"]["fixture"]
        assert data["detailed_diagnostics"] == (position["diagnostics"] == "1")
        assert data.get("browser_count", 10) == position.get("browser_count", 10)
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
        if profile == "cpu":
            index = positions.index(position)
            allocation = protocol["cpu_allocation"]
            partitioned = index in [1, 2]
            assert data["cpu_allocation"] == {"mode": "partitioned" if partitioned else "shared",
                "server": allocation["service"] if partitioned else allocation["available"],
                "browser_driver": allocation["browsers"] if partitioned else allocation["available"]}
            assert data["driver_source"] == protocol["source"]
            row["cpu_allocation"] = data["cpu_allocation"]
            row["roles_whole_run"] = role_summary(resources)
            row["roles_successful_action_interiors"] = role_summary(resources, merged)
            assert outcome["affinity_violations"] == 0
            for role in row["roles_whole_run"].values():
                assert role["escaped_threads"] == 0 and role["threads_checked"] > 0
        for group in row["groups"]:
            if profile == "cpu":
                observed = [s for s in data["samples"] if s["viewport"] == group["viewport"] and
                            (s["wave"] == 0 if group["phase"] == "cold" else s["wave"] > 0)] if group["phase"] != "record" else [s for s in data["record_visits"] if s["viewport"] == group["viewport"]]
                windows = [(s["started_at_ms"], s["started_at_ms"] + s["ready_ms"]) for s in observed if "ready_ms" in s]
                group["role_cpu_action_interiors"] = role_summary(resources, windows)
            if group["phase"] == "record":
                continue
            samples = [s for s in data["samples"] if s["viewport"] == group["viewport"] and (s["wave"] == 0 if group["phase"] == "cold" else s["wave"] > 0)]
            cores = [next(r for r in s["network"] if r["path"] == "/api/v1/crm/directory") for s in samples]
            sessions = [next(r for r in s["network"] if r["path"] == "/api/v1/local-session" and r["method"] == "GET") for s in samples]
            group["browser_phases_ms"] = {
                "core_request_start_from_document": distribution([r["start_ms"] for r in cores]),
                "core_response_headers_after_request": distribution([r["response_ms"] - r["start_ms"] for r in cores]),
                "cdp_finish_minus_headers": distribution([r["finish_ms"] - r["response_ms"] for r in cores if "finish_ms" in r]),
                "ready_after_core_json": distribution([s["ready_ms"] - s["core_json_processed_ms"] for s in samples]),
                "document_response_start": distribution([s["navigation"]["response_start_ms"] for s in samples]),
                "session_request_start_from_document": distribution([r["start_ms"] for r in sessions]),
                "session_headers_after_request": distribution([r["response_ms"] - r["start_ms"] for r in sessions]),
                "core_request_after_session_headers": distribution([c["start_ms"] - s["response_ms"] for c, s in zip(cores, sessions)]),
            }
            group["pre_core_fraction_of_readiness"] = distribution([r["start_ms"] / s["ready_ms"] for s, r in zip(samples, cores)])
            group["observed_transfer_bytes"] = {kind: distribution([sum(r.get("encoded_bytes", 0) for r in s["network"] if r.get("type") == kind) for s in samples]) for kind in ["Script", "Stylesheet", "Font", "Image"]}
            group["browser_work_seconds"] = None
    summary.update({"protocol": protocol, "resource_limits": "Two-second external samples, identical in both modes. Whole-run counters include startup, fixture identity setup and screenshots. Action-interior counters include only whole intervals within successful measured browser actions; missing process data are unknown, never zero. CPU values summarize sampled intervals, not isolated SQL execution. Host CPU includes browsers, database and runner work. The declared block order bounds order effects but does not eliminate caches or cloud scheduling; one block cannot establish an observer effect or an earlier failure cause."})
    summary["browser_phase_limits"] = "Core request start includes document/asset loading, hydration and client/session gating; it is not isolated network or server time. CDP finish-minus-headers is the raw event timestamp difference under emulation, which can be negative when response events are delayed; do not interpret it as physical transfer time. Percentiles of separate components are not additive."
    summary["browser_counter_limits"] = "Cross-navigation Performance.getMetrics differences in startup block 38086160387 can be negative. All derived browser_work_seconds, including positive values, are excluded from interpretation; their original bytes remain retained. New drivers keep raw before/after counters without deriving action duration. Readiness, network events and external /proc counters have independent clocks and are unaffected by this diagnostic limitation."
    if profile == "cpu":
        summary["cpu_allocation_limits"] = "Shared 4 versus service 1 / browsers and driver 3 logical CPUs on one existing runner. Not extra capacity, independent hardware, isolated physical cores or a representative device. Topology, shared memory/I/O, hypervisor scheduling and caches remain limits. Per-role CPU uses only identical PID/start-time pairs across two-second samples; exited/new processes are unmatched and their interval work is omitted, never inferred zero. Transient processes between samples are unseen. No CPU percentage establishes SQL execution time. Thread affinity is checked at sample times only; no kernel-wide isolation or ownership of unclassified runner work is claimed."
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
