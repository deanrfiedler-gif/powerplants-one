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
    def test_spaced_private_process_name_is_not_exported(self):
        fields = ["S"] + [str(n) for n in range(4, 53)]
        result = observer.process_counters("123 (SYN private (process) name) " + " ".join(fields), 100, 4096)
        self.assertEqual(result, {"cpu_ms": 290, "minor_faults": 10,
                                  "major_faults": 12, "rss_bytes": 24 * 4096})

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
