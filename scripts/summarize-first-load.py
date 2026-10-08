"""Retain sanitized first-load probes and derive reproducible, bounded summaries."""
import gzip
import hashlib
import json
from pathlib import Path
from statistics import median

source = Path("verification-evidence/customer-first-load")
destination = Path("docs/testing/evidence/customer-first-load")
destination.mkdir(parents=True, exist_ok=True)


def save(path, value):
    path.write_bytes((json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode())


def span(values):
    return {"minimum": min(values), "median": median(values), "maximum": max(values)}


summaries = []
artifacts = []
fixtures = []
for label in ("baseline", "candidate"):
    raw = (source / label / "results.json").read_bytes()
    result = json.loads(raw)
    assert result["complete"] and len(result["samples"]) == 12 and len(result["record_visits"]) == 6
    fixtures.append(result["fixture"])
    # Retain all original network/coverage values without a 16 MB text diff.
    compressed = gzip.compress(raw, mtime=0)
    (destination / f"{label}-results.json.gz").write_bytes(compressed)
    artifacts.append({"path": f"{label}-results.json.gz", "uncompressed_sha256": hashlib.sha256(raw).hexdigest()})
    for name in ("gateway.jsonl", "customer-client-manifest.json"):
        data = (source / label / name).read_bytes()
        (destination / f"{label}-{name}").write_bytes(data)
        artifacts.append({"path": f"{label}-{name}"})
    gateway = [json.loads(line) for line in (source / label / "gateway.jsonl").read_text().splitlines()]
    assert all(row["pid"] == result["server_pid"] for row in gateway)
    summary = {key: result[key] for key in ("label", "source_head", "compiled_source", "build_id", "browser", "server_pid", "limits")}
    summary["groups"] = []
    summary["core_matches"] = []
    for viewport in ("desktop", "phone"):
        for wave in (0, 1):
            samples = [s for s in result["samples"] if s["viewport"] == viewport and s["wave"] == wave]
            assert len(samples) == 3
            rows = []
            for sample in samples:
                network = sample["network"]
                assets = [n for n in network if n["type"] in ("Script", "Stylesheet") and n["path"].startswith("/_next/static/")]
                sessions = [n for n in network if n["path"] == "/api/v1/local-session" and n["method"] == "GET"]
                directories = [n for n in network if n["path"] == "/api/v1/crm/directory" and n["method"] == "GET"]
                assert len(sessions) == len(directories) == 1
                session, directory = sessions[0], directories[0]
                for request in (session, directory):
                    assert request["status"] == 200 and "error" not in request
                    proof_id = request["proof_request_id"]
                    received = [r for r in gateway if r.get("request_id") == proof_id and r["event"] == "http-received"]
                    finished = [r for r in gateway if r.get("request_id") == proof_id and r["event"] == "http-finished"]
                    assert len(received) == len(finished) == 1
                    # Gateway privacy masking groups CRM subpaths; the exact response
                    # header binds this browser path to its numeric request identity.
                    gateway_path = "/api/v1/crm/:other" if request["path"] == "/api/v1/crm/directory" else request["path"]
                    assert received[0]["path"] == finished[0]["path"] == gateway_path
                    assert received[0]["method"] == "GET" and finished[0]["status"] == 200
                    summary["core_matches"].append({"viewport": viewport, "wave": wave, "cycle": sample["cycle"], "request_id": proof_id, "path": request["path"], "gateway_path": gateway_path, "gateway_elapsed_ms": finished[0]["elapsed_ms"]})
                last_asset = max(n["finish_ms"] for n in assets)
                rows.append({"cycle": sample["cycle"], "ready_ms": sample["ready_ms"], "last_asset_ms": last_asset,
                             "session_start_ms": session["start_ms"], "session_finish_ms": session["finish_ms"],
                             "directory_start_ms": directory["start_ms"], "directory_finish_ms": directory["finish_ms"],
                             "asset_to_session_ms": session["start_ms"] - last_asset,
                             "session_body_ms": session["finish_ms"] - session["start_ms"],
                             "session_to_directory_ms": directory["start_ms"] - session["finish_ms"],
                             "directory_body_ms": directory["finish_ms"] - directory["start_ms"],
                             "js_count": sum(n["type"] == "Script" for n in assets),
                             "css_count": sum(n["type"] == "Stylesheet" for n in assets),
                             "js_encoded_bytes": sum(n["encoded_bytes"] for n in assets if n["type"] == "Script"),
                             "css_encoded_bytes": sum(n["encoded_bytes"] for n in assets if n["type"] == "Stylesheet"),
                             "js_source_utf16_chars": sum(n["source_utf16_chars"] for n in sample["js_coverage"] if n["path"].startswith("/_next/static/"))})
            summary["groups"].append({"viewport": viewport, "wave": wave, "samples": rows,
                                     "statistics": {key: span([r[key] for r in rows]) for key in rows[0] if key != "cycle"}})
    assert len(summary["core_matches"]) == len({x["request_id"] for x in summary["core_matches"]}) == 24
    summary["record_visits"] = result["record_visits"]
    manifest = json.loads((source / label / "customer-client-manifest.json").read_text())
    manifest = next(iter(manifest.values()))
    summary["frame_chunks"] = manifest["clientModules"]["[project]/src/components/application-frame.tsx"]["chunks"]
    summary["my_work_in_ssr_mapping"] = "my-work" in json.dumps(manifest["ssrModuleMapping"])
    summary["gateway_events"] = {event: sum(r["event"] == event for r in gateway) for event in sorted({r["event"] for r in gateway})}
    summaries.append(summary)
assert fixtures[0] == fixtures[1]
save(destination / "summary.json", {"runs": summaries, "fixture": fixtures[0], "method": "Statistics are min/median/max of three sequential contexts per viewport/wave, not p95 or ten-user PT-27. Ready timings use the driver wall clock; network phase offsets use the document CDP request clock. Source UTF-16 character counts are not transfer bytes; V8 coverage ranges overlap and are retained raw, not summed into an unused-byte claim. Fixture after-equality is an executed assertion; only the reference fingerprint is retained."})
artifacts.append({"path": "summary.json"})
for artifact in artifacts:
    data = (destination / artifact["path"]).read_bytes()
    artifact.update(bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
save(destination / "artifacts.json", artifacts)
print(json.dumps([{
    "label": s["label"],
    "groups": [{"viewport": g["viewport"], "wave": g["wave"],
                "ready_ms": g["statistics"]["ready_ms"],
                "js_bytes": g["statistics"]["js_encoded_bytes"],
                "js_count": g["statistics"]["js_count"]} for g in s["groups"]],
    "record_ms": {v: span([x["ready_ms"] for x in s["record_visits"] if x["viewport"] == v])
                  for v in ("desktop", "phone")}
} for s in summaries], indent=2))
