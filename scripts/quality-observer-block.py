"""Run one predeclared off/on/on/off block; never retry or replace samples."""
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import sys
import time


def process_counters(text, ticks, page_size):
    # /proc/PID/stat's parenthesised comm may contain spaces or parentheses.
    # Never return it, process arguments, environment or arbitrary text.
    fields = text.rpartition(")")[2].split()
    return {"cpu_ms": (int(fields[11]) + int(fields[12])) * 1000 / ticks,
            "minor_faults": int(fields[7]), "major_faults": int(fields[9]),
            "rss_bytes": int(fields[21]) * page_size}


def resource_sample(server_pid=None, proc=Path("/proc")):
    memory = {}
    for line in (proc / "meminfo").read_text().splitlines():
        key, value = line.split(":", 1)
        if key in {"MemTotal", "MemAvailable", "SwapTotal", "SwapFree"}:
            memory[key] = int(value.split()[0]) * 1024
    cpu = [int(n) for n in (proc / "stat").read_text().splitlines()[0].split()[1:9]]
    sample = {"at_ms": time.time_ns() // 1_000_000, "memory": memory,
              "host_cpu_ticks": cpu, "server": None}
    if server_pid is not None:
        try:
            sample["server"] = process_counters((proc / str(server_pid) / "stat").read_text(),
                                                 os.sysconf("SC_CLK_TCK"), os.sysconf("SC_PAGE_SIZE"))
        except FileNotFoundError:
            pass  # Process exit is not an inferred zero CPU/memory reading.
    return sample


def port_open(port):
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=.5):
            return True
    except OSError:
        return False


def run(block):
    assert sys.platform == "linux", "External runner sampling requires Linux /proc"
    assert re.fullmatch(r"observer-[a-z0-9-]+", block)
    assert os.environ.get("PPO_BENCHMARK_FIXTURE") == "add-synthetic-load"
    source = os.environ["PPO_COMPILED_SOURCE"]
    assert re.fullmatch(r"[0-9a-f]{40}", source)
    assert subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip() == source
    root = Path("verification-evidence/pt27-observer") / block
    root.mkdir(parents=True, exist_ok=False)
    port = int(os.environ.get("PPO_PORT", "3000"))
    assert not port_open(port), "An earlier app must not be reused"
    positions = [("off-a1", "0"), ("on-b1", "1"), ("on-b2", "1"), ("off-a2", "0")]
    protocol = {"block": block, "source": source, "build_id": Path(".next/BUILD_ID").read_text().strip(),
                "platform": sys.platform, "logical_cpus": os.cpu_count(), "clock_ticks_per_second": os.sysconf("SC_CLK_TCK"),
                "fixture": json.loads(Path("verification-evidence/customer-loading-diagnosis/fixture.json").read_text()),
                "positions": [{"label": block + "-" + name, "diagnostics": mode} for name, mode in positions],
                "resource_interval_seconds": 2, "results": [],
                "boundary": "One fresh runner, one build, one fixture, fresh app/browser processes per attempt. No retries, resets or substituted samples. External CPU/memory observation is identical in both modes. Separate from retained Windows samples."}
    (root / "protocol.json").write_text(json.dumps(protocol, indent=2) + "\n")
    for position, (suffix, mode) in enumerate(positions, 1):
        label = block + "-" + suffix
        env = {**os.environ, "PPO_PROOF_DIAGNOSTICS": mode,
               "PPO_COMPARISON_BLOCK": block, "PPO_COMPARISON_POSITION": str(position)}
        server_pid = None
        metadata = Path("verification-evidence/pt27-loading") / label / "run.json"
        with (root / (label + ".log")).open("wb") as log, (root / (label + "-resources.jsonl")).open("w") as counters:
            child = subprocess.Popen(["node", "--env-file=.env.local", "--import", "tsx",
                                      "scripts/quality-customer-comparison.ts", label], env=env, stdout=log, stderr=subprocess.STDOUT)
            try:
                while True:
                    if server_pid is None and metadata.exists():
                        try:
                            server_pid = int(json.loads(metadata.read_text())["server_pid"])
                        except (json.JSONDecodeError, KeyError):
                            pass
                    counters.write(json.dumps(resource_sample(server_pid)) + "\n")
                    counters.flush()
                    if child.poll() is not None:
                        break
                    time.sleep(2)
            finally:
                if child.poll() is None:
                    child.terminate()
                    child.wait(timeout=15)
        protocol["results"].append({"label": label, "exit_code": child.returncode})
        (root / "protocol.json").write_text(json.dumps(protocol, indent=2) + "\n")
        # A failed run stays failed. Continue only after its owned app is gone.
        deadline = time.monotonic() + 10
        while port_open(port) and time.monotonic() < deadline:
            time.sleep(.25)
        assert not port_open(port), "Owned app did not stop; retain incomplete block"
        print(json.dumps(protocol["results"][-1]), flush=True)
    return int(any(row["exit_code"] != 0 for row in protocol["results"]))


if __name__ == "__main__":
    sys.exit(run(sys.argv[1]))
