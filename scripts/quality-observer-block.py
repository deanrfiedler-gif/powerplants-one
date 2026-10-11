"""Run one predeclared comparison block; never retry or replace samples."""
import json
import os
from pathlib import Path
import re
import shutil
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


def cpu_list(text):
    cpus = set()
    for part in text.strip().split(","):
        bounds = [int(n) for n in part.split("-")]
        assert 1 <= len(bounds) <= 2 and min(bounds) >= 0
        assert bounds[0] <= bounds[-1]
        cpus.update(range(bounds[0], bounds[-1] + 1))
    return sorted(cpus)


def role_processes(roots, allocations, proc=Path("/proc"), ticks=None, page_size=None, browser_members=()):
    """Allowlisted counters only; process identity includes start time, never args."""
    ticks = ticks or os.sysconf("SC_CLK_TCK")
    page_size = page_size or os.sysconf("SC_PAGE_SIZE")
    processes = {}
    for path in proc.iterdir():
        if not path.name.isdigit():
            continue
        try:
            raw = (path / "stat").read_text()
            fields = raw.rpartition(")")[2].split()
            processes[int(path.name)] = (int(fields[1]), int(fields[19]), raw)
        except (FileNotFoundError, ProcessLookupError):
            pass
    def descendant(pid, root):
        seen = set()
        while pid in processes and pid not in seen:
            if pid == root:
                return True
            seen.add(pid)
            pid = processes[pid][0]
        return False
    result = {role: [] for role in roots}
    for pid, (_, started, raw) in processes.items():
        # Server is also a driver descendant: take the most specific role first.
        role = next((role for role in ["server", "database", "browser_driver"]
                     if roots.get(role) and descendant(pid, roots[role])), None)
        if role is None and pid in browser_members:
            role = "browser_driver"  # Include reparented Chrome helpers in the owned cgroup.
        if role is None:
            continue
        checked, escaped = 0, 0
        allowed = set()
        try:
            for thread in (proc / str(pid) / "task").iterdir():
                try:
                    status = (thread / "status").read_text()
                    actual = cpu_list(next(line.split(":", 1)[1] for line in status.splitlines()
                                           if line.startswith("Cpus_allowed_list:")))
                    allowed.update(actual)
                    checked += 1
                    escaped += int(not set(actual).issubset(allocations[role]))
                except (FileNotFoundError, ProcessLookupError):
                    pass
        except (FileNotFoundError, ProcessLookupError):
            continue
        result[role].append({"pid": pid, "start_ticks": started,
                             **process_counters(raw, ticks, page_size),
                             "allowed_cpus": sorted(allowed), "threads_checked": checked,
                             "escaped_threads": escaped})
    return result


def create_browser_cgroup(label, cpus):
    assert os.environ.get("GITHUB_ACTIONS") == "true" and re.fullmatch(r"cpu-[a-z0-9-]+", label)
    root = Path("/sys/fs/cgroup")
    # Docker's CPU-set update must already have enabled this existing controller.
    assert "cpuset" in (root / "cgroup.subtree_control").read_text().split()
    group = root / ("ppo-pt27-" + label)
    assert not group.exists()
    subprocess.run(["sudo", "-n", "mkdir", str(group)], check=True)
    try:
        for name, value in [("cpuset.mems", (root / "cpuset.mems.effective").read_text()),
                            ("cpuset.cpus", ",".join(map(str, cpus)))]:
            subprocess.run(["sudo", "-n", "tee", str(group / name)], input=value + "\n", text=True,
                           check=True, stdout=subprocess.DEVNULL)
        assert cpu_list((group / "cpuset.cpus.effective").read_text()) == cpus
    except BaseException:
        subprocess.run(["sudo", "-n", "rmdir", str(group)], check=True)
        raise
    return group


def whole_core_allocation(available, topology):
    core = cpu_list(topology[0]["thread_siblings_list"])
    remaining = sorted(set(available) - set(core))
    assert len(core) == len(remaining) == 2 and set(core) <= set(available)
    assert sorted(row["cpu"] for row in topology) == available
    assert all(cpu_list(row["thread_siblings_list"]) == (core if row["cpu"] in core else remaining)
               for row in topology), "Require two complete sibling groups; never split a physical core"
    return core, remaining


def remove_browser_cgroup(group):
    assert group.parent == Path("/sys/fs/cgroup") and re.fullmatch(r"ppo-pt27-cpu-[a-z0-9-]+", group.name)
    # Only after the driver has exited; remove any surviving owned crash helpers.
    subprocess.run(["sudo", "-n", "tee", str(group / "cgroup.kill")], input="1\n", text=True,
                   check=True, stdout=subprocess.DEVNULL)
    deadline = time.monotonic() + 10
    while "populated 1" in (group / "cgroup.events").read_text() and time.monotonic() < deadline:
        time.sleep(.1)
    subprocess.run(["sudo", "-n", "rmdir", str(group)], check=True)


def positions_for(profile, network_candidate="global"):
    if profile == "cpu-assets-network":
        assert network_candidate in ["global", "packet"]
        return [("rule-a1", "0", 10), (network_candidate + "-b1", "0", 10), (network_candidate + "-b2", "0", 10), ("rule-a2", "0", 10)]
    if profile == "observer":
        return [("off-a1", "0", 10), ("on-b1", "1", 10), ("on-b2", "1", 10), ("off-a2", "0", 10)]
    if profile == "candidate":
        return [("control-a1", "0", 10), ("candidate-b1", "0", 10), ("candidate-b2", "0", 10), ("control-a2", "0", 10)]
    if profile in ["cpu", "cpu-core", "cpu-assets", "cpu-assets-release"]:
        return [("shared-a1", "0", 10), ("partitioned-b1", "0", 10), ("partitioned-b2", "0", 10), ("shared-a2", "0", 10)]
    assert profile == "startup", "Unknown block profile"
    return [("single-a1", "0", 1), ("ten-b1", "0", 10), ("ten-b2", "0", 10), ("single-a2", "0", 1)]


def run(block, profile="observer"):
    assert sys.platform == "linux", "External runner sampling requires Linux /proc"
    network_candidate = os.environ.get("PPO_NETWORK_CANDIDATE", "global")
    positions = positions_for(profile, network_candidate)
    assert re.fullmatch(profile + r"-[a-z0-9-]+", block)
    assert os.environ.get("PPO_BENCHMARK_FIXTURE") == "add-synthetic-load"
    source = os.environ["PPO_COMPILED_SOURCE"]
    assert re.fullmatch(r"[0-9a-f]{40}", source)
    assert subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip() == source
    working = Path.cwd()
    cpu_protocol = None
    if profile in ["cpu", "cpu-core", "cpu-assets", "cpu-assets-release", "cpu-assets-network"]:
        assert os.environ.get("GITHUB_ACTIONS") == "true", "Only the disposable existing CI service may be constrained"
        assert shutil.which("taskset") and shutil.which("docker")
        available = sorted(os.sched_getaffinity(0))
        assert len(available) == 4, "Retain unexpected runner topology; do not silently change allocation"
        container = os.environ["PPO_POSTGRES_CONTAINER"]
        assert re.fullmatch(r"[0-9a-f]{64}", container)
        image, database_pid, original_cpus = subprocess.check_output(
            ["docker", "inspect", "--format", "{{.Config.Image}}|{{.State.Pid}}|{{.HostConfig.CpusetCpus}}", container], text=True).strip().split("|")
        assert image == "postgres:16.15" and int(database_pid) > 0
        cpu_protocol = {"available": available, "service": available[:1], "browsers": available[1:],
                        "browser_constraint": "cgroup-v2-cpuset",
                        "database_pid": int(database_pid), "original_database_cpuset": original_cpus,
                        "topology": [{"cpu": cpu, **{key: (Path(f"/sys/devices/system/cpu/cpu{cpu}/topology") / key).read_text().strip()
                                      for key in ["core_id", "physical_package_id", "thread_siblings_list"]}} for cpu in available]}
        if profile in ["cpu-core", "cpu-assets", "cpu-assets-release"]:
            core, remaining = whole_core_allocation(available, cpu_protocol["topology"])
            cpu_protocol.update({"service": core, "browsers": remaining, "layout": "physical-core"})
        if profile == "cpu-assets-network":
            cpu_protocol.update({"service": available, "browsers": available, "layout": "shared-four"})
    control = Path(os.environ["PPO_CONTROL_ROOT"]).resolve() if profile == "candidate" else working
    if profile == "candidate":
        assert control != working and control.is_dir()
        # Same driver, dependencies and database/fixture contract in both sources.
        for name in ["package.json", "package-lock.json", "scripts/quality-customer-comparison.ts",
                     "scripts/quality-comparison-profile.ts", "scripts/quality-asset-observer.ts", "scripts/quality-network-conditioning.ts", "scripts/quality-packet-network.ts", "scripts/quality-performance-fixture.ts",
                     "scripts/quality-core-response.ts", "verification-evidence/customer-loading-diagnosis/fixture.json"]:
            assert (control / name).read_bytes() == (working / name).read_bytes(), name
        subprocess.run(["git", "diff", "--exit-code", os.environ["PPO_CONTROL_SOURCE"], source, "--", "db"], check=True)
    attempts = []
    for name, mode, users in positions:
        cwd = control if name.startswith("control-") else working
        compiled = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=cwd, text=True).strip()
        if cwd == control and profile == "candidate":
            assert compiled == os.environ["PPO_CONTROL_SOURCE"]
        attempts.append({"label": block + "-" + name, "diagnostics": mode, "browser_count": users,
                         "asset_diagnostics": profile in ["cpu-assets", "cpu-assets-release", "cpu-assets-network"],
                         "compiled_source": compiled, "build_id": (cwd / ".next/BUILD_ID").read_text().strip()})
    root = Path("verification-evidence/pt27-observer") / block
    root.mkdir(parents=True, exist_ok=False)
    port = int(os.environ.get("PPO_PORT", "3000"))
    assert not port_open(port), "An earlier app must not be reused"
    protocol = {"block": block, "profile": profile, "source": source, "build_id": Path(".next/BUILD_ID").read_text().strip(),
                "platform": sys.platform, "logical_cpus": os.cpu_count(), "clock_ticks_per_second": os.sysconf("SC_CLK_TCK"),
                "fixture": json.loads(Path("verification-evidence/customer-loading-diagnosis/fixture.json").read_text()),
                "positions": attempts,
                "resource_interval_seconds": 2, "results": [],
                "boundary": "One fresh runner, one build per declared source, one fixture, fresh app/browser processes per attempt. No retries, resets or substituted samples. External CPU/memory observation is identical in all positions. Separate from retained Windows samples."}
    if cpu_protocol:
        protocol["cpu_allocation"] = cpu_protocol
    if profile == "cpu-assets-network":
        protocol["network_candidate"] = network_candidate
    (root / "protocol.json").write_text(json.dumps(protocol, indent=2) + "\n")
    for position, (suffix, mode, users) in enumerate(positions, 1):
        label = block + "-" + suffix
        cwd = control if suffix.startswith("control-") else working
        env = {**os.environ, "PPO_PROOF_DIAGNOSTICS": mode,
               "PPO_COMPILED_SOURCE": attempts[position - 1]["compiled_source"], "PPO_DRIVER_SOURCE": source,
               "PPO_COMPARISON_PROFILE": "startup-single" if users == 1 else "ten-user",
               "PPO_COMPARISON_BLOCK": block, "PPO_COMPARISON_POSITION": str(position)}
        if profile in ["cpu-assets", "cpu-assets-release", "cpu-assets-network"]:
            env["PPO_ASSET_DIAGNOSTICS"] = "1"
        if profile == "cpu-assets-network":
            env["PPO_NETWORK_METHOD"] = network_candidate if suffix.startswith(network_candidate + "-") else "rule"
        if profile == "cpu-assets-release":
            env["PPO_ASSET_RELEASE_PROBE"] = "1"
        server_pid = None
        attempt_root = cwd / "verification-evidence/pt27-loading" / label
        metadata = attempt_root / "run.json"
        allocations = None
        browser_group = None
        command = ["node", "--env-file=.env.local", "--import", "tsx", "scripts/quality-customer-comparison.ts", label]
        if cpu_protocol:
            partitioned = suffix.startswith("partitioned-")
            service = cpu_protocol["service"] if partitioned else available
            clients = cpu_protocol["browsers"] if partitioned else available
            allocations = {"server": service, "database": service, "browser_driver": clients}
            service_csv, client_csv = (",".join(map(str, group)) for group in [service, clients])
            subprocess.run(["docker", "update", "--cpuset-cpus", service_csv, container], check=True, stdout=subprocess.DEVNULL)
            try:
                browser_group = create_browser_cgroup(label, clients)
            except BaseException:
                subprocess.run(["docker", "update", "--cpuset-cpus", original_cpus, container], check=True, stdout=subprocess.DEVNULL)
                raise
            wrapper = (root / (label + "-browser-wrapper.py")).resolve()
            shutil.copyfile("scripts/quality-browser-cpuset.py", wrapper)
            wrapper.chmod(0o700)
            (root / (label + "-browser-constraint.json")).write_text(json.dumps({
                "group": browser_group.name, "requested_cpus": clients,
                "effective_cpus": cpu_list((browser_group / "cpuset.cpus.effective").read_text()),
                "chrome": "/opt/google/chrome/chrome", "launcher": "same-uid-exec", "shared_memory_and_io": True}, indent=2) + "\n")
            env.update({"PPO_CPU_MODE": "partitioned" if partitioned else "shared",
                        "PPO_SERVER_CPUS": service_csv, "PPO_BROWSER_CPUS": client_csv,
                        "PPO_BROWSER_WRAPPER": str(wrapper), "PPO_BROWSER_CGROUP": str(browser_group)})
            if profile in ["cpu-core", "cpu-assets", "cpu-assets-release"]:
                env["PPO_CPU_LAYOUT"] = "physical-core"
            command = ["taskset", "--cpu-list", client_csv, *command]
        affinity_violations = 0
        with (root / (label + ".log")).open("wb") as log, (root / (label + "-resources.jsonl")).open("w") as counters:
            child = None
            try:
                child = subprocess.Popen(command, cwd=cwd, env=env, stdout=log, stderr=subprocess.STDOUT)
                while True:
                    if server_pid is None and metadata.exists():
                        try:
                            server_pid = int(json.loads(metadata.read_text())["server_pid"])
                        except (json.JSONDecodeError, KeyError):
                            pass
                    sample = resource_sample(server_pid)
                    if allocations and server_pid is not None:
                        effective = cpu_list((browser_group / "cpuset.cpus.effective").read_text())
                        assert effective == clients
                        members = [int(pid) for pid in (browser_group / "cgroup.procs").read_text().split()]
                        sample["browser_cgroup"] = {"effective_cpus": effective, "processes": members}
                        sample["roles"] = role_processes({"server": server_pid, "database": cpu_protocol["database_pid"], "browser_driver": child.pid}, allocations, browser_members=members)
                        affinity_violations += sum(p["escaped_threads"] for group in sample["roles"].values() for p in group)
                    counters.write(json.dumps(sample) + "\n")
                    counters.flush()
                    if child.poll() is not None:
                        break
                    time.sleep(2)
            finally:
                try:
                    if child is not None and child.poll() is None:
                        child.terminate()
                        child.wait(timeout=15)
                finally:
                    try:
                        if cpu_protocol:
                            subprocess.run(["docker", "update", "--cpuset-cpus", original_cpus, container], check=True, stdout=subprocess.DEVNULL)
                    finally:
                        if browser_group:
                            remove_browser_cgroup(browser_group)
        protocol["results"].append({"label": label, "exit_code": child.returncode or int(affinity_violations > 0),
                                    **({"affinity_violations": affinity_violations} if cpu_protocol else {})})
        (root / "protocol.json").write_text(json.dumps(protocol, indent=2) + "\n")
        if cwd != working and attempt_root.exists():
            shutil.copytree(attempt_root, working / "verification-evidence/pt27-loading" / label)
        # A failed run stays failed. Continue only after its owned app is gone.
        deadline = time.monotonic() + 10
        while port_open(port) and time.monotonic() < deadline:
            time.sleep(.25)
        assert not port_open(port), "Owned app did not stop; retain incomplete block"
        print(json.dumps(protocol["results"][-1]), flush=True)
    return int(any(row["exit_code"] != 0 for row in protocol["results"]))


if __name__ == "__main__":
    sys.exit(run(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "observer"))
