#!/usr/bin/env python3
"""Enter the owned CI browser cgroup, then exec Chrome as the same normal user."""
import os
from pathlib import Path
import re
import subprocess
import sys

assert sys.platform == "linux" and os.environ.get("GITHUB_ACTIONS") == "true"
assert os.environ.get("PPO_BENCHMARK_FIXTURE") == "add-synthetic-load"
group = Path(os.environ["PPO_BROWSER_CGROUP"])
assert re.fullmatch(r"/sys/fs/cgroup/ppo-pt27-cpu-[a-z0-9-]+", str(group))
assert str(group.resolve()) == str(group)
assert os.geteuid() != 0, "Chrome must retain the runner's unprivileged identity"
# Only this PID enters the pre-created owned leaf. Chrome is never run as root.
subprocess.run(["sudo", "-n", "tee", str(group / "cgroup.procs")],
               input=str(os.getpid()) + "\n", text=True, stdout=subprocess.DEVNULL, check=True)
assert ("0::/" + group.name) in Path("/proc/self/cgroup").read_text().splitlines()
chrome = "/opt/google/chrome/chrome"
assert Path(chrome).is_file()
os.execv(chrome, [chrome, *sys.argv[1:]])
