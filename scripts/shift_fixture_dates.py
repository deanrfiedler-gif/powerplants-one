#!/usr/bin/env python3
"""Move the absolute synthetic fixture dates forward by a whole number of weeks.

The P01-P12 fixtures carry absolute dates. Dates that were future when they were
written become past as the clock runs, and the suites then fail on wall-clock time
rather than on the change under test. ADR-0030 records the evidence.

Three properties keep the transform honest:

Only dates that are still in the future move. A fixture that is deliberately in the
past -- expired evidence, a visit that has already started, a superseded policy --
stays where it is, so every past-to-future relation the suites rely on is preserved.

Shifting by whole weeks keeps each date's weekday. ppo.calendar_intervals binds crew
availability to weekday against a Brisbane 08:00-17:00 calendar, so an appointment
that changed weekday would land outside its crew's working window.

The application's own synthetic anchors move with the fixtures. src/ holds a few
hard-coded dates that point at the seeded data -- the planner's default day is
useState("2026-09-21") -- and leaving them behind aims the UI at a week the fixtures
have left. That is what CI caught the first time this ran.

Migrations are never touched: their bytes are checksummed against applied databases.

    python3 scripts/shift_fixture_dates.py            # report only
    python3 scripts/shift_fixture_dates.py --apply    # rewrite the files
"""

from __future__ import annotations

import argparse
import datetime as dt
import pathlib
import re
import sys

# One maintenance event, years out, announced by tests/unit/fixture-expiry.test.ts.
DEFAULT_WEEKS = 261  # 1827 days: ~5 years and a whole number of weeks.

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Seeds, the suites that run against a real clock, and the application's own
# synthetic anchors. tests/unit is excluded because those tests inject the instant
# they judge against, so they never expire -- and some assert calendar semantics
# (tests/unit/projects-gantt.test.ts checks that 2028-02-29 exists) that a shift
# across leap years would silently destroy. db/migrations is excluded because
# scripts/database.ts compares each migration's sha256 against public.ppo_migrations.
GLOBS = (
    "db/seed*.sql",
    "db/demo/*.sql",
    "src/**/*.ts",
    "src/**/*.tsx",
    "tests/database/**/*.ts",
    "tests/http/**/*.ts",
    "tests/browser/**/*.ts",
    "tests/integration/**/*.ts",
    "tests/demo/**/*.ts",
    "tests/helpers/**/*.ts",
)

# Shared with tests/unit, which is not shifted. Moving these would desynchronise a
# helper from a unit test that hard-codes the value it returns.
EXCLUDE = {"tests/helpers/projects.ts"}

# The time separator is captured so it can be written back exactly as found: query
# strings carry it percent-encoded (2026-09-20T14%3A00%3A00Z), and a literal that
# did not match here stayed behind while its data moved.
DATE = re.compile(
    r"(?<![0-9A-Za-z-])"
    r"(?P<date>20\d{2}-\d{2}-\d{2})"
    r"(?:T(?P<hour>\d{2})(?P<sep>:|%3[Aa])(?P<minute>\d{2})"
    r"(?:(?P=sep)(?P<second>\d{2}))?(?P<fraction>\.\d+)?(?P<zulu>Z)?)?"
    r"(?![0-9A-Za-z-])"
)


def stamp_of(m: re.Match[str]) -> dt.datetime | None:
    try:
        day = dt.datetime.strptime(m.group("date"), "%Y-%m-%d")
    except ValueError:
        return None
    if m.group("hour") is None:
        return day.replace(tzinfo=dt.timezone.utc)
    micro = 0
    if m.group("fraction"):
        micro = int(float(m.group("fraction")) * 1_000_000)
    return day.replace(
        hour=int(m.group("hour")),
        minute=int(m.group("minute")),
        second=int(m.group("second") or 0),
        microsecond=micro,
        tzinfo=dt.timezone.utc,
    )


def render(moved: dt.datetime, m: re.Match[str]) -> str:
    out = moved.strftime("%Y-%m-%d")
    if m.group("hour") is None:
        return out
    sep = m.group("sep")
    out += "T" + moved.strftime("%H") + sep + moved.strftime("%M")
    if m.group("second") is not None:
        out += sep + moved.strftime("%S")
    if m.group("fraction"):
        digits = len(m.group("fraction")) - 1
        out += "." + f"{moved.microsecond:06d}"[:digits]
    return out + (m.group("zulu") or "")


def shift_text(text: str, delta: dt.timedelta, threshold: dt.datetime):
    changes: list[tuple[str, str]] = []

    def replace(m: re.Match[str]) -> str:
        stamp = stamp_of(m)
        if stamp is None or stamp < threshold:
            return m.group(0)
        out = render(stamp + delta, m)
        changes.append((m.group(0), out))
        return out

    return DATE.sub(replace, text), changes


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="rewrite the files in place")
    ap.add_argument("--weeks", type=int, default=DEFAULT_WEEKS)
    ap.add_argument(
        "--threshold",
        default=None,
        help="ISO instant; dates at or after it move. Defaults to now (UTC).",
    )
    args = ap.parse_args()

    threshold = (
        dt.datetime.fromisoformat(args.threshold.replace("Z", "+00:00"))
        if args.threshold
        else dt.datetime.now(dt.timezone.utc)
    )
    delta = dt.timedelta(weeks=args.weeks)

    total, touched = 0, 0
    mapping: dict[str, str] = {}
    for glob in GLOBS:
        for path in sorted(ROOT.glob(glob)):
            rel = path.relative_to(ROOT).as_posix()
            if "migrations" in path.parts or rel in EXCLUDE:
                continue
            original = path.read_text(encoding="utf-8", newline="")
            updated, changes = shift_text(original, delta, threshold)
            if not changes:
                continue
            touched += 1
            total += len(changes)
            mapping.update(dict(changes))
            print(f"{len(changes):5d}  {rel}")
            if args.apply:
                path.write_text(updated, encoding="utf-8", newline="")

    print(
        f"\n{total} literals in {touched} files move +{args.weeks} weeks "
        f"({delta.days} days); threshold {threshold.isoformat()}"
    )
    print(f"{len(mapping)} distinct values. Sample:")
    for before, after in sorted(mapping.items())[:8]:
        print(f"  {before}  ->  {after}")
    if not args.apply:
        print("\nReport only. Re-run with --apply to rewrite.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
