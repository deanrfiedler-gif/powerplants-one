import assert from "node:assert/strict";
import { test } from "node:test";
import { utcFromLocal, localDateTime } from "../../src/scheduling/time";
test("planner civil-time conversion uses site timezone and refuses DST gaps and ambiguous repeats", () => {
  assert.equal(
    utcFromLocal("2026-09-21T10:00", "Australia/Brisbane"),
    "2026-09-21T00:00:00.000Z",
  );
  assert.equal(
    localDateTime("2026-10-05T00:00:00Z", "Australia/Melbourne"),
    "2026-10-05T11:00",
  );
  assert.throws(
    () => utcFromLocal("2026-10-04T02:30", "Australia/Melbourne"),
    /ambiguous or does not exist/,
  );
  assert.throws(
    () => utcFromLocal("2026-04-05T02:30", "Australia/Melbourne"),
    /ambiguous or does not exist/,
  );
  assert.equal(
    utcFromLocal("2026-10-04T03:30", "Australia/Melbourne"),
    "2026-10-03T16:30:00.000Z",
  );
});
