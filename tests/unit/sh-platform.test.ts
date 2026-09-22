import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../../src/platform/errors";
import {
  collectApplicationSearch,
  type SearchAdapter,
} from "../../src/shell/search-service";
import {
  defaultNotificationPreferences,
  inQuietHours,
  parseNotificationPreferences,
} from "../../src/notifications/model";
import {
  parseSavedView,
  parseViewCriteria,
  sameViewCriteria,
} from "../../src/platform/view-targets";
import { inReviewView, type ReviewTask } from "../../src/reviews/model";

test("SH04 partial sources retain authorised results; failure, denial and empty remain distinct", async () => {
  const source = (kind: string, status = 200): SearchAdapter => ({
    kind,
    path: "/work",
    label: "title",
    detail: async () => ({}),
    list: async () => {
      if (status !== 200) throw new AppError(status, "Synthetic", "Synthetic");
      return {
        items: [{ id: "a", title: "Visible", secret: "Never project" }],
        next_cursor: null,
      };
    },
  });
  const partial = await collectApplicationSearch(
    "SYN",
    [source("ok"), source("failed", 503), source("denied", 403)],
    5,
  );
  assert.equal(partial.state, "partial");
  assert.equal(partial.items.length, 1);
  assert.ok(!JSON.stringify(partial.items).includes("Never project"));
  assert.equal(
    (await collectApplicationSearch("SYN", [source("failed", 503)], 5)).state,
    "unavailable",
  );
  assert.equal(
    (await collectApplicationSearch("SYN", [source("denied", 403)], 5)).state,
    "denied",
  );
  const empty = source("empty");
  empty.list = async () => ({ items: [], next_cursor: null });
  assert.equal(
    (await collectApplicationSearch("SYN", [empty], 5)).state,
    "complete",
  );
});
test("SH03 preference validation and quiet hours include start, exclude end and cross midnight", () => {
  const prefs = { ...defaultNotificationPreferences, quiet_enabled: true };
  assert.equal(inQuietHours("18:00", prefs), true);
  assert.equal(inQuietHours("07:59", prefs), true);
  assert.equal(inQuietHours("08:00", prefs), false);
  assert.deepEqual(parseNotificationPreferences(prefs), prefs);
  for (const change of [
    { quiet_end: "18:00" },
    { time: "25:00" },
    { timezone: "Invented/Zone" },
    { weekday: 7 },
    {
      categories: {
        ...prefs.categories,
        OwnedWork: { in_app: false, email: "Off" },
      },
    },
  ])
    assert.throws(() => parseNotificationPreferences({ ...prefs, ...change }));
});
test("SH05 schema changes and unknown filters cannot silently widen stored views", () => {
  const view = {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Search",
    target: "search",
    schema_version: 1,
    scope: "personal",
    pinned: false,
    criteria: { q: "SYN", kind: "Site" },
  };
  assert.deepEqual(parseSavedView(view), view);
  assert.throws(() => parseSavedView({ ...view, schema_version: 2 }));
  assert.throws(() => parseSavedView({ ...view, scope: "team" }));
  assert.throws(() =>
    parseViewCriteria("search", { q: "SYN", permission: "all" }),
  );
  assert.throws(() =>
    parseViewCriteria("search", { kind: "Unavailable type" }),
  );
  assert.equal(sameViewCriteria({ q: "SYN", kind: "" }, { q: "SYN" }), true);
});
test("SH06 perspectives preserve ownership, return, handover and closed source meanings", () => {
  const t = {
    current: true,
    actionable: true,
    owner_id: "me",
    author_id: "author",
    returned: false,
    kind: "Review",
  } as ReviewTask;
  assert.equal(inReviewView(t, "mine", "me"), true);
  assert.equal(inReviewView(t, "sent", "me"), false);
  assert.equal(
    inReviewView({ ...t, returned: true }, "returned", "author"),
    true,
  );
  assert.equal(
    inReviewView({ ...t, kind: "Handover" }, "handovers", "reader"),
    true,
  );
  assert.equal(
    inReviewView({ ...t, current: false }, "history", "reader"),
    true,
  );
  assert.equal(inReviewView({ ...t, current: false }, "all", "reader"), false);
});
