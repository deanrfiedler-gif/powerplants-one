"""Counter parsing must keep process names out and preserve field positions."""
import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

spec = importlib.util.spec_from_file_location("observer", Path(__file__).resolve().parents[2] / "scripts/quality-observer-block.py")
observer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(observer)
summary_spec = importlib.util.spec_from_file_location("observer_summary", Path(__file__).resolve().parents[2] / "scripts/summarize-observer-block.py")
summary = importlib.util.module_from_spec(summary_spec)
summary_spec.loader.exec_module(summary)


class Counters(unittest.TestCase):
    def test_asset_receipt_finish_cache_and_absent_receipt_are_distinct(self):
        data = {"samples": [{"asset_sample": "phone-0-2", "error": "timeout", "network": [
            {"path": "/_next/static/chunks/a.js", "type": "Script"},
            {"path": "/_next/static/chunks/b.js", "type": "Script", "failed_ms": 5},
            {"path": "/_next/static/chunks/c.css", "type": "Stylesheet", "finish_ms": 4, "disk_cache": True}]}]}
        identity = {"sample": "phone-0-2", "path": "/_next/static/chunks/a.js", "request_id": 1}
        events = [{**identity, "event": event} for event in ["asset-received", "asset-finished"]]
        result = summary.asset_summary(data, events)
        self.assertEqual(result["counts"], {"browser_assets": 3, "server_received": 1, "server_finished": 1,
            "browser_finished": 1, "browser_failed": 1, "server_finished_browser_unfinished": 1, "without_server_receipt": 2})
        self.assertEqual(result["failed_samples"][0]["assets"][0]["server"], events)
        data["samples"][0]["observed_until_ms"] = 100
        for event in events:
            event["at_ms"] = 101
        after = summary.asset_summary(data, events)
        self.assertEqual(after["counts"]["server_received"], 0)
        self.assertEqual(after["failed_samples"][0]["assets"][0]["server_after_window"], events)

    def test_whole_core_profile_rejects_partial_or_unexpected_topology(self):
        rows = [{"cpu": n, "thread_siblings_list": "2-3" if n < 4 else "4-5"} for n in [2, 3, 4, 5]]
        self.assertEqual(observer.whole_core_allocation([2, 3, 4, 5], rows), ([2, 3], [4, 5]))
        with self.assertRaises(AssertionError):
            observer.whole_core_allocation([2, 3, 4, 5], rows[:3])
        with self.assertRaises(AssertionError):
            observer.whole_core_allocation([2, 3, 4, 5], [{"cpu": n, "thread_siblings_list": str(n)} for n in [2, 3, 4, 5]])
        with self.assertRaises(AssertionError):
            observer.whole_core_allocation([2, 3, 4, 6], rows)

    def test_startup_diagnostic_keeps_ten_user_positions_and_logging_off(self):
        self.assertEqual([p[2] for p in observer.positions_for("startup")], [1, 10, 10, 1])
        self.assertEqual([p[1] for p in observer.positions_for("startup")], ["0"] * 4)
        self.assertEqual([p[2] for p in observer.positions_for("observer")], [10] * 4)
        self.assertEqual(observer.positions_for("candidate"), [("control-a1", "0", 10), ("candidate-b1", "0", 10), ("candidate-b2", "0", 10), ("control-a2", "0", 10)])
        self.assertEqual(observer.positions_for("cpu"), [("shared-a1", "0", 10), ("partitioned-b1", "0", 10), ("partitioned-b2", "0", 10), ("shared-a2", "0", 10)])
        self.assertEqual(observer.positions_for("cpu-core"), observer.positions_for("cpu"))
        self.assertEqual(observer.positions_for("cpu-assets"), observer.positions_for("cpu-core"))
        self.assertEqual(observer.positions_for("cpu-assets-release"), observer.positions_for("cpu-core"))
        with self.assertRaises(AssertionError):
            observer.positions_for("unknown")

    def test_spaced_private_process_name_is_not_exported(self):
        fields = ["S"] + [str(n) for n in range(4, 53)]
        result = observer.process_counters("123 (SYN private (process) name) " + " ".join(fields), 100, 4096)
        self.assertEqual(result, {"cpu_ms": 290, "minor_faults": 10,
                                  "major_faults": 12, "rss_bytes": 24 * 4096})

    def test_cpu_roles_resolve_server_before_driver_and_verify_every_thread(self):
        with TemporaryDirectory() as directory:
            proc = Path(directory)
            for pid, parent, allowed in [(10, 1, "1-3"), (11, 10, "0"), (12, 11, "0"), (13, 10, "1,2,3"), (14, 1, "1-3"), (20, 1, "0"), (21, 20, "0-1")]:
                path = proc / str(pid)
                (path / "task" / str(pid)).mkdir(parents=True)
                fields = ["S"] + [str(n) for n in range(4, 53)]
                fields[1] = str(parent)
                (path / "stat").write_text(f"{pid} (DO NOT EXPORT (private)) " + " ".join(fields))
                (path / "task" / str(pid) / "status").write_text("Cpus_allowed_list:\t" + allowed + "\n")
            roles = observer.role_processes({"server": 11, "database": 20, "browser_driver": 10},
                {"server": [0], "database": [0], "browser_driver": [1, 2, 3]}, proc, 100, 4096, browser_members=[14])
            self.assertCountEqual([r["pid"] for r in roles["server"]], [11, 12])
            self.assertCountEqual([r["pid"] for r in roles["browser_driver"]], [10, 13, 14])
            self.assertEqual(sum(r["escaped_threads"] for r in roles["database"]), 1)
            self.assertNotIn("private", str(roles))

    def test_reused_pid_is_not_counted_as_continuous_cpu(self):
        def point(at, started, used):
            return {"at_ms": at, "roles": {role: [{"pid": 1, "start_ticks": started,
                "cpu_ms": used, "threads_checked": 1, "escaped_threads": 0}] for role in ["server", "database", "browser_driver"]}}
        result = summary.role_summary([point(0, 1, 100), point(2000, 1, 1100), point(4000, 2, 10)])
        self.assertEqual(result["server"]["matched_process_cpu_cores"]["median"], .5)
        self.assertEqual(result["server"]["unmatched_process_endpoints"], 2)
        self.assertEqual(observer.cpu_list("2-4,7"), [2, 3, 4, 7])

    def test_missing_process_is_unknown_and_memory_fields_are_allowlisted(self):
        with TemporaryDirectory() as directory:
            proc = Path(directory)
            (proc / "meminfo").write_text("MemTotal: 100 kB\nMemAvailable: 20 kB\nSwapTotal: 30 kB\nSwapFree: 4 kB\nPrivateOther: 42 kB\n")
            (proc / "stat").write_text("cpu 1 2 3 4 5 6 7 8 9 10\n")
            result = observer.resource_sample(999999, proc)
            self.assertIsNone(result["server"])
            self.assertEqual(result["memory"], {"MemTotal": 102400, "MemAvailable": 20480, "SwapTotal": 30720, "SwapFree": 4096})
            self.assertEqual(result["host_cpu_ticks"], list(range(1, 9)))

    def test_cpu_capacity_windows_and_missing_process_are_distinct(self):
        def point(at, ticks, cpu):
            return {"at_ms": at, "host_cpu_ticks": ticks,
                    "memory": {"MemAvailable": 200, "SwapTotal": 40, "SwapFree": 30},
                    "server": None if cpu is None else {"cpu_ms": cpu, "rss_bytes": 123}}
        rows = [point(0, [0] * 8, None),
                point(2000, [100, 0, 0, 100, 0, 0, 0, 0], 100),
                point(4000, [150, 0, 0, 240, 10, 0, 0, 0], 1100)]
        whole = summary.resource_summary(rows)
        self.assertEqual(whole["host_active_capacity_percent"]["median"], 37.5)
        self.assertEqual(whole["server_cpu_cores"], {"n": 1, "min": .5, "median": .5, "p95": .5, "max": .5})
        measured = summary.resource_summary(rows, [(1999, 4001)])
        self.assertEqual(measured["covered_ms"], 2000)
        self.assertEqual(measured["host_active_capacity_percent"]["median"], 25)
        self.assertEqual(measured["host_iowait_percent"]["median"], 5)
        self.assertEqual(measured["swap_used_bytes"]["min"], 10)
        empty = summary.resource_summary(rows, [(2100, 3900)])
        self.assertEqual(empty["interval_count"], 0)
        self.assertIsNone(empty["server_cpu_cores"])


if __name__ == "__main__":
    unittest.main()
