#!/usr/bin/env python3
"""Move the absolute synthetic fixture dates forward by a whole number of weeks.

The P01-P12 fixtures carry absolute dates. Dates that were future when they were
written become past as the clock runs, and the suites then fail on wall-clock time
rather than on the change under test. ADR-0030 records the evidence and why the
alternatives were rejected.

Only dates that are still in the future move. A fixture that is deliberately in the
past -- expired evidence, a visit that has already started, a superseded policy --
stays where it is, so every past-to-future relation the suites rely on is preserved.
Shifting by whole weeks keeps each date's weekday.

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

# Seeds and tests only. db/migrations is excluded on purpose: scripts/database.ts
# compares each migration's sha256 against public.ppo_migrations and refuses a
# mismatch, so editing one would break every database the migration is applied to.
# Only the suites that run against a real clock: a real database, a real server or a
# real browser. tests/unit is excluded because those tests inject the instant they
# judge against, so they never expire -- and some of them assert calendar semantics
# (tests/unit/projects-gantt.test.ts checks that 2028-02-29 exists) that a shift
# across leap years would silently destroy.
GLOBS = (
    "db/seed*.sql",
    "db/demo/*.sql",
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

DATE = re.compile(
    r"(?<![0-9A-Za-z-])"
    r"(?P<date>20\d{2}-\d{2}-\d{2})"
    r"(?P<time>T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?Z?)?"
    r"(?![0-9A-Za-z-])"
)


def parse(date: str, time: str | None) -> dt.datetime | None:
    try:
        stamp = dt.datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=dt.timezone.utc)
    except ValueError:
        return None
    if not time:
        return stamp
    body = time[1:].rstrip("Z")
    for fmt in ("%H:%M:%S.%f", "%H:%M:%S", "%H:%M"):
        try:
            clock = dt.datetime.strptime(body, fmt).time()
        except ValueError:
            continue
        return stamp.replace(
            hour=clock.hour,
            minute=clock.minute,
            second=clock.second,
            microsecond=clock.microsecond,
        )
    return None


def shift_text(text: str, delta: dt.timedelta, threshold: dt.datetime):
    changes: list[tuple[str, str]] = []

    def replace(match: re.Match[str]) -> str:
        date, time = match.group("date"), match.group("time")
        stamp = parse(date, time)
        if stamp is None or stamp < threshold:
            return match.group(0)
        moved = stamp + delta
        # Re-emit in the exact shape that was matched, so only the digits change.
        out = moved.strftime("%Y-%m-%d")
        if time:
            body = time[1:].rstrip("Z")
            if "." in body:
                digits = len(body.split(".")[1])
                clock = moved.strftime("%H:%M:%S.") + f"{moved.microsecond:06d}"[:digits]
            elif body.count(":") == 2:
                clock = moved.strftime("%H:%M:%S")
            else:
                clock = moved.strftime("%H:%M")
            out += "T" + clock + ("Z" if time.endswith("Z") else "")
        changes.append((match.group(0), out))
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
