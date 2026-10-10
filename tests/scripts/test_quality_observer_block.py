"""Counter parsing must keep process names out and preserve field positions."""
import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

spec = importlib.util.spec_from_file_location("observer", Path(__file__).resolve().parents[2] / "scripts/quality-observer-block.py")
observer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(observer)


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


if __name__ == "__main__":
    unittest.main()
