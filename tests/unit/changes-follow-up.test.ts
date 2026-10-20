import { test } from "node:test";
import assert from "node:assert/strict";
import { changesFixture } from "../helpers/changes-follow-up";
import {
  changeQueueCounts,
  inChangeQueue,
  staleBookingChanges,
} from "../../src/scheduling/changes-model";
test("PL-04 counts visits per selected read; policy holds and terminal tasks do not create Needs review", () => {
  const a = changesFixture(),
    clear = {
      ...a,
      requests: [],
      customer_commitment: "Confirmed",
      followups: a.followups.map((f) => ({ ...f, status: "Completed" })),
    };
  assert.equal(inChangeQueue(clear, "review"), false);
  assert.equal(inChangeQueue(clear, "contact"), false);
  assert.equal(
    inChangeQueue({ ...clear, followups: a.followups }, "contact"),
    true,
  );
  assert.deepEqual(changeQueueCounts([a, clear]), {
    review: 1,
    requests: 1,
    contact: 1,
    cancellations: 0,
    history: 2,
  });
  assert.equal(
    inChangeQueue({ ...clear, status: "Cancelled" }, "cancellations"),
    true,
  );
});
test("PL-04 stale evidence names retained crew changes with their saved local time", () => {
  const a = changesFixture(),
    r = a.requests[0];
  assert.deepEqual(staleBookingChanges(a, r), []);
  a.schedule_version = 8;
  a.assignment_version = 4;
  a.assignments.push({
    ...a.assignments[0],
    id: "new",
    name: "Jordan Kim",
    resource_id: "new-person",
    assignment_version: 4,
  });
  a.history.push({
    ...a.history[0],
    version: 7,
    snapshot: {
      ...a.history[0].snapshot,
      schedule_version: 8,
      assignment_version: 4,
      updated_at: "2031-09-22T22:40:00Z",
    },
  });
  const labels = staleBookingChanges(a, r);
  assert.ok(labels.some((x) => x.includes("Jordan Kim was added at 08:40")));
  assert.ok(labels.some((x) => x.includes("Casey Ward was removed")));
  a.history = [];
  assert.deepEqual(staleBookingChanges(a, r), [
    "The booking changed; the original schedule details are unavailable.",
  ]);
});
