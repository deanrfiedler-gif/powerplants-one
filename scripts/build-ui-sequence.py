#!/usr/bin/env python3
"""Derive the proposed UI build and review sequence from the live design register.

The phases, their order and every ranked entry come from the r02 build plan issued inside the r05
App Page Register. The live working master supplies today's entries and statuses. Entries added
after r05 are placed by their primary related scope, so every register entry lands in exactly one
phase or in the stated exclusions. Run with --check to confirm the committed outputs are current.
"""
from pathlib import Path
import hashlib
import json
import re
import sys

root = Path(__file__).resolve().parents[1]
register_path = root / "docs/design/development/register.json"
plan_path = root / "docs/reference/ui/app-page-register/PPO-App-Page-Register-r05.html"
json_out = root / "docs/design/development/ui-build-sequence.json"
md_out = root / "docs/design/development/ui-build-sequence.md"

# Development tooling is not a business page; it stays outside the business sequence.
EXCLUDED_MODULES = {"Development": "Development tooling, not a business page"}
# The shared systems already exist and carry every page, so they are verified with the baseline.
SYSTEM_PHASE = "00"
STATES = {
    "build": "To build",
    "refine": "To refine",
    "review": "Built; owner review pending",
    "decide": "Scope decision first",
}
# One synthetic job, in the order it happens. Walk it after each phase as far as the built pages reach.
JOURNEY = [
    ("Customer, contacts and site recorded", ["scope:CS-01", "scope:CS-02", "scope:CS-04"]),
    ("Site survey and as-found brief", ["scope:CS-08"]),
    ("Lead qualified into a deal", ["scope:CR-01"]),
    ("Handover to estimating and estimate prepared", ["scope:CR-02", "scope:ES-01", "scope:ES-02", "scope:ES-03"]),
    ("Estimate reviewed; quotation issued and answered", ["scope:ES-04", "scope:ES-05", "scope:ES-06"]),
    ("Deal won and received for delivery", ["scope:CR-03", "scope:ES-07"]),
    ("Project initiated and baselined", ["scope:PJ-01", "scope:PJ-03"]),
    ("Design basis and released materials", ["scope:EN-02", "scope:EN-06"]),
    ("Materials purchased, received and delivered", ["scope:SC-02", "scope:SC-04", "scope:SC-06", "scope:SC-07"]),
    ("Installed, commissioned and accepted", ["scope:EN-08", "scope:FI-03", "scope:PJ-09"]),
    ("Service agreement and maintenance plan", ["scope:MA-01", "scope:MA-03"]),
    ("Service request to scheduled field visit", ["scope:SV-01", "scope:SV-03", "scope:PL-01", "scope:FI-01"]),
    ("Service report reviewed and answered", ["scope:SV-06", "scope:FI-07"]),
    ("Finance handoff and customer account", ["scope:FN-01", "scope:FN-02"]),
    ("Management reporting", ["scope:RP-01"]),
]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def state(status: str) -> str:
    s = status.strip().lower()
    if s == "unbuilt":
        return "build"
    if s == "refine":
        return "refine"
    if s == "conditional":
        return "decide"
    return "review"


def build() -> dict:
    register = json.loads(register_path.read_text(encoding="utf-8"))
    plan_html = plan_path.read_text(encoding="utf-8")
    issued = json.loads(re.search(r'id="registerData">(.*?)</script>', plan_html, re.S)[1])
    plan = issued["buildPlan"]
    phases = plan["phases"]
    phase_of_rank = {r: p["id"] for p in phases for r in range(p["start"], p["end"] + 1)}
    entries = register["entries"]
    by_key = {e["key"]: e for e in entries}
    issued_after = {"scope:" + s["key"].removeprefix("scope:"): s["build"]["after"] for s in issued["scopes"]}

    placed, excluded = {}, []
    for e in entries:
        if e["module"] in EXCLUDED_MODULES:
            excluded.append({"key": e["key"], "title": e["title"], "reason": EXCLUDED_MODULES[e["module"]]})
            continue
        if e["kind"] == "system":
            placed[e["key"]] = (SYSTEM_PHASE, None, "Shared system: verified with the existing baseline")
            continue
        if e.get("build_rank") is not None:
            placed[e["key"]] = (phase_of_rank[e["build_rank"]], e["build_rank"], "Issued r02 rank")
            continue
        primary = next((k for k in e.get("related_keys") or [] if k.startswith("scope:") and by_key.get(k, {}).get("build_rank")), None)
        assert primary, f"{e['key']} has no rank and no ranked related scope"
        rank = by_key[primary]["build_rank"]
        placed[e["key"]] = (phase_of_rank[rank], rank, f"Added after r05; placed with {primary.removeprefix('scope:')}")

    unplaced = [e["key"] for e in entries if e["key"] not in placed and e["key"] not in {x["key"] for x in excluded}]
    assert not unplaced, f"Unplaced entries: {unplaced}"

    out_phases = []
    for p in phases:
        rows = []
        for e in entries:
            if e["key"] in placed and placed[e["key"]][0] == p["id"]:
                ph, rank, basis = placed[e["key"]]
                rows.append({
                    "key": e["key"], "title": e["title"], "kind": e["kind"], "module": e["module"],
                    "path": e.get("path") or "", "rank": rank, "state": state(e["scope_status"]),
                    "visual_review": "Owner review recorded" if e.get("reviewed_at") else "Pending", "placement": basis,
                })
        rows.sort(key=lambda r: (r["rank"] if r["rank"] is not None else 0, r["kind"] != "scope", r["key"]))
        counts = {k: sum(1 for r in rows if r["state"] == k) for k in STATES}
        after = set()
        for r in rows:
            for dep in issued_after.get(r["key"], []):
                dep_phase = placed.get("scope:" + dep, (None,))[0]
                if dep_phase and dep_phase < p["id"]:
                    after.add(dep_phase)
        out_phases.append({
            "id": p["id"], "title": p["title"], "reason": p["reason"], "ranks": [p["start"], p["end"]],
            "depends_on": sorted(after), "counts": counts,
            "scopes": sum(1 for r in rows if r["kind"] == "scope"), "routes": sum(1 for r in rows if r["kind"] == "route"),
            "systems": sum(1 for r in rows if r["kind"] == "system"), "entries": rows,
        })

    def first(states: set[str]) -> str | None:
        return next((p["id"] for p in out_phases if any(r["state"] in states for r in p["entries"])), None)

    journey = []
    for step, keys in JOURNEY:
        missing = [k for k in keys if k not in placed]
        assert not missing, f"Journey step '{step}' names unknown entries {missing}"
        journey.append({"step": step, "scopes": [{"key": k, "phase": placed[k][0], "state": state(by_key[k]["scope_status"])} for k in keys]})

    return {
        "title": "Powerplants One UI build and review sequence",
        "status": "Rules SD-01 to SD-05 adopted 9 October 2026; derived from the register; pages not owner-reviewed",
        "sources": {
            "register": str(register_path.relative_to(root)), "register_sha256": sha(register_path),
            "build_plan": str(plan_path.relative_to(root)), "build_plan_revision": plan["revision"], "build_plan_sha256": sha(plan_path),
            "build_plan_basis": plan["basis"],
        },
        "states": STATES,
        "cursors": {
            "review": first({"review", "refine"}),
            "build": first({"build"}),
        },
        "totals": {
            "entries": len(entries), "placed": len(placed), "excluded": len(excluded),
            **{k: sum(p["counts"][k] for p in out_phases) for k in STATES},
            "owner_reviewed": sum(1 for e in entries if e.get("reviewed_at")),
        },
        "phases": out_phases,
        "excluded": excluded,
        "journey": journey,
    }


def markdown(data: dict) -> str:
    t, s = data["totals"], data["sources"]
    lines = [
        "# UI build and review sequence",
        "",
        "<!-- Generated by scripts/build-ui-sequence.py from the register and the issued r02 build plan. Do not edit by hand. -->",
        "",
        f"Status: **{data['status']}**. The proposal and its departures from r02 are in",
        "[the decision record](../../decisions/ui-build-sequence.md).",
        "",
        f"- Register: `{s['register']}` (SHA-256 `{s['register_sha256'][:16]}…`).",
        f"- Phases and ranks: build plan {s['build_plan_revision']} in `{s['build_plan']}` (SHA-256 `{s['build_plan_sha256'][:16]}…`). {s['build_plan_basis']}",
        f"- {t['entries']} entries: {t['placed']} placed in a phase and {t['excluded']} excluded. {t['owner_reviewed']} have an owner visual review recorded.",
        f"- {t['review']} built and awaiting owner review; {t['refine']} to refine; {t['build']} to build; {t['decide']} awaiting a scope decision.",
        f"- Review track starts at phase {data['cursors']['review']}; build track starts at phase {data['cursors']['build']}.",
        "",
        "| Phase | Title | After phases | Scopes | Routes | Review | Refine | Build | Decide |",
        "|---|---|---|---:|---:|---:|---:|---:|---:|",
    ]
    for p in data["phases"]:
        c = p["counts"]
        lines.append(f"| {p['id']} | {p['title']} | {', '.join(p['depends_on']) or '—'} | {p['scopes']} | {p['routes']} | {c['review']} | {c['refine']} | {c['build']} | {c['decide']} |")
    lines += ["", "## Synthetic job walk", "", "Walk this job after each phase, as far as the built pages reach.", ""]
    for i, j in enumerate(data["journey"], 1):
        lines.append(f"{i}. {j['step']}: " + ", ".join(f"{x['key'].removeprefix('scope:')} (phase {x['phase']}, {data['states'][x['state']].lower()})" for x in j["scopes"]) + ".")
    for p in data["phases"]:
        lines += ["", f"## Phase {p['id']} · {p['title']}", "", p["reason"], "", "| Rank | Entry | Title | State | Placement |", "|---:|---|---|---|---|"]
        for r in p["entries"]:
            lines.append(f"| {r['rank'] if r['rank'] is not None else '—'} | `{r['key']}` | {r['title']} | {data['states'][r['state']]} | {r['placement']} |")
    lines += ["", "## Excluded", ""] + [f"- `{x['key']}`: {x['reason']}." for x in data["excluded"]]
    return "\n".join(lines) + "\n"


data = build()
text_json = json.dumps(data, indent=1, ensure_ascii=False) + "\n"
text_md = markdown(data)
if "--check" in sys.argv:
    stale = [str(p.relative_to(root)) for p, t in ((json_out, text_json), (md_out, text_md)) if not p.exists() or p.read_text(encoding="utf-8") != t]
    if stale:
        sys.exit("Stale UI build sequence: " + ", ".join(stale) + ". Run python3 scripts/build-ui-sequence.py.")
    print("UI build sequence current:", data["totals"])
else:
    json_out.write_text(text_json, encoding="utf-8", newline="\n")
    md_out.write_text(text_md, encoding="utf-8", newline="\n")
    print("Wrote", json_out.relative_to(root), "and", md_out.relative_to(root), data["totals"], data["cursors"])
