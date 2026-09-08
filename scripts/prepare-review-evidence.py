"""Exclude session diagnostics from review artifacts; never rewrite issued bytes."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys


TOKEN = re.compile(rb"ppo_local_session=[0-9a-f]{32,}", re.IGNORECASE)
TEXT = {".json", ".jsonl", ".md", ".txt", ".log", ".tap", ".html"}


def prepare(roots):
    changed = []
    for root in roots:
        if not root.exists():
            continue
        for path in sorted(root.rglob("*")):
            if not path.is_file() or path.suffix not in TEXT:
                continue
            original = path.read_bytes()
            count = len(TOKEN.findall(original))
            if not count:
                continue
            if path.name not in {"results.json", "error-context.md"} and path.suffix not in {".log", ".tap"}:
                raise RuntimeError(f"Session material in non-diagnostic evidence: {path}; refusing to alter source bytes")
            clean = TOKEN.sub(b"ppo_local_session=[REDACTED_DISPOSABLE_SESSION]", original)
            path.write_bytes(clean)
            changed.append({"path": str(path), "redactions": count,
                            "original_byte_count": len(original),
                            "original_sha256": hashlib.sha256(original).hexdigest(),
                            "review_byte_count": len(clean),
                            "review_sha256": hashlib.sha256(clean).hexdigest()})
    return changed


if __name__ == "__main__":
    roots = [Path(p) for p in sys.argv[1:]] or [Path("verification-evidence"), Path("test-results")]
    changed = prepare(roots)
    root = Path("verification-evidence")
    root.mkdir(exist_ok=True)
    record = root / "review-diagnostic-redactions.json"
    earlier = json.loads(record.read_text()) if record.exists() else {"records": []}
    earlier.update({
        "source_head": os.environ.get("PPO_SOURCE_HEAD") or subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip(),
        "executed_checkout": subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip(),
        "executed_tree": subprocess.check_output(["git", "rev-parse", "HEAD^{tree}"], text=True).strip(),
        "run_id": os.environ.get("GITHUB_RUN_ID"), "run_attempt": os.environ.get("GITHUB_RUN_ATTEMPT"),
        "boundary": "Only disposable session values in textual test diagnostics are redacted. Test status, errors, original PNG/HTML/PDF and proof bytes remain unchanged. Raw trace ZIPs and generated Playwright HTML diagnostic reports are excluded from review uploads.",
    })
    earlier["records"].extend(changed)
    record.write_text(json.dumps(earlier, indent=2) + "\n")
    print(f"Review evidence prepared: {len(changed)} diagnostic files redacted; issued outputs untouched")
