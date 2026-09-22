import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, migrate, seed } from "../../scripts/database";
import {
  createActivity,
  activityCommand,
  readActivity,
} from "../../src/activities/activities";
import {
  notificationInbox,
  notificationTarget,
  changeNotices,
  notificationPreferences,
  saveNotificationPreferences,
  projectActivityNotices,
} from "../../src/notifications/service";
import {
  applicationSearch,
  searchPreview,
} from "../../src/shell/search-service";
import { readSavedViews, saveSavedViews } from "../../src/platform/saved-views";
import { readWorkViews, saveWorkViews } from "../../src/activities/work-views";
import { defaultCriteria } from "../../src/activities/work-criteria";
import { reviewInbox, reviewTarget } from "../../src/reviews/service";
import { CRM, crmBase } from "../helpers/crm";
import { submitted, decision } from "../helpers/reports";
import { createSite } from "../../src/shared/commands";
import { createFacilityDetails } from "../../src/shared/facilities/commands";
import { reviewReport } from "../../src/reports/service";
import { financeDraft } from "../helpers/finance";
import { submitFinance } from "../../src/finance/service";
import {
  CHANGES,
  changeScenarioIds,
  seedChangesScenario,
} from "../helpers/engineering-changes";
import { directSignIn } from "../helpers/engineering-changes-direct";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const code = (expected: string) => (e: unknown) =>
  (e as { code: string }).code === expected;
const activity = () => ({
  ...crmBase(),
  id: randomUUID(),
  company_id: CRM.company,
  site_id: CRM.site,
  kind: "CustomerContact",
  owner_id: CRM.owner,
  summary: "SYN SH platform contract",
  due_at: null,
  due_needed: true,
  access_class: "RestrictedService",
  links: [{ object_type: "Site", object_id: CRM.site }],
});

test("SH03 durable events deduplicate, explicit read is personal, and required archive is refused atomically", async () => {
  const p = await principal(),
    a = activity();
  await createActivity(p, a);
  const before = await readActivity(p, a.id);
  await Promise.all([projectActivityNotices(p), projectActivityNotices(p)]);
  let inbox = await notificationInbox(p),
    notices = inbox.items.filter((n) => n.source_id === a.id);
  assert.equal(notices.length, 1);
  assert.equal(notices[0].is_read, false);
  assert.equal(notices[0].due_at, null);
  const item = () => ({
    id: notices[0].id,
    expected_version: notices[0].version,
  });
  await notificationTarget(p, notices[0].id);
  assert.equal((await notificationTarget(p, notices[0].id)).is_read, false);
  await changeNotices(p, { action: "read", items: [item()] });
  await changeNotices(p, { action: "read", items: [item()] });
  assert.deepEqual(await readActivity(p, a.id), before);
  await assert.rejects(
    changeNotices(p, { action: "archive", items: [item()] }),
    code("RequiredWork"),
  );
  await activityCommand(
    p,
    a.id,
    {
      ...crmBase(),
      expected_version: 1,
      owner_id: CRM.owner,
      due_at: null,
      due_needed: true,
      summary: "SYN SH newer activity",
      reason: "SYN change title",
    },
    "update",
  );
  inbox = await notificationInbox(p);
  notices = inbox.items.filter((n) => n.source_id === a.id);
  assert.equal(notices.length, 2);
  assert.equal(notices.filter((n) => !n.is_read).length, 1);
  assert.equal(inbox.obligations.filter((o) => o.id === a.id).length, 1);
  assert.equal(
    (await notificationTarget(p, notices.find((n) => n.is_read)!.id)).stale,
    true,
  );
  await activityCommand(
    p,
    a.id,
    {
      ...crmBase(),
      expected_version: 2,
      outcome: "SYN completed in the owning source",
    },
    "complete",
  );
  notices = (await notificationInbox(p)).items.filter(
    (n) => n.source_id === a.id,
  );
  await changeNotices(p, {
    action: "archive",
    items: notices.map((n) => ({ id: n.id, expected_version: n.version })),
  });
  const archived = await notificationTarget(p, notices[0].id);
  assert.equal(archived.archived, true);
  assert.equal(archived.required, false);
  await changeNotices(p, {
    action: "restore",
    items: [{ id: archived.id, expected_version: archived.version }],
  });
  assert.equal((await notificationTarget(p, archived.id)).archived, false);
});
test("SH03/04/05 current permissions protect events, totals, direct preview and saved criteria after revocation", async () => {
  const p = await principal(),
    a = activity();
  await createActivity(p, a);
  const notice = (await notificationInbox(p)).items.find(
    (n) => n.source_id === a.id,
  )!;
  const view = {
    id: randomUUID(),
    name: "Personal search",
    scope: "personal",
    schema_version: 1,
    target: "search",
    pinned: true,
    criteria: { q: a.summary, kind: "Activity" },
  };
  await saveSavedViews(p, { expected_version: 0, views: [view] });
  assert.equal(
    (await readSavedViews(await principal("second-company"))).settings.views
      .length,
    0,
  );
  assert.ok(
    (await applicationSearch(p, { q: a.summary, kind: "Activity" })).items.some(
      (i) => i.id.endsWith(a.id),
    ),
  );
  assert.equal(
    (await searchPreview(p, { kind: "Activity", id: a.id })).label,
    a.summary,
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='activity.read'",
    [p.workspace_id, p.actor_id],
  );
  await assert.rejects(notificationInbox(p), code("Forbidden"));
  await assert.rejects(notificationTarget(p, notice.id), code("Forbidden"));
  await assert.rejects(
    searchPreview(p, { kind: "Activity", id: a.id }),
    code("Forbidden"),
  );
  assert.equal((await applicationSearch(p, view.criteria)).items.length, 0);
  assert.equal((await readSavedViews(p)).settings.views.length, 1);
});
test("SH03/05 concurrent preference edits conflict and saved-view operations survive reload", async () => {
  const p = await principal(),
    prefs = await notificationPreferences(p),
    proposal = {
      expected_version: 0,
      settings: { ...prefs.settings, time: "09:00" },
    };
  const results = await Promise.allSettled([
    saveNotificationPreferences(p, proposal),
    saveNotificationPreferences(p, {
      ...proposal,
      settings: { ...proposal.settings, time: "10:00" },
    }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    results.filter(
      (r) => r.status === "rejected" && code("VersionConflict")(r.reason),
    ).length,
    1,
  );
  const v = {
    id: randomUUID(),
    name: "Reviews",
    target: "reviews",
    schema_version: 1,
    scope: "personal",
    pinned: false,
    criteria: { view: "all" },
  };
  await saveSavedViews(p, { expected_version: 0, views: [v] });
  await saveSavedViews(p, {
    expected_version: 1,
    views: [
      {
        ...v,
        name: "My renamed view",
        pinned: true,
        criteria: { view: "sent" },
      },
      { ...v, id: randomUUID(), name: "Duplicate" },
    ],
  });
  const current = await readSavedViews(p);
  assert.equal(current.settings.views.length, 2);
  assert.equal(current.settings.views[0].criteria.view, "sent");
  await assert.rejects(
    saveSavedViews(p, { expected_version: 1, views: [v] }),
    code("VersionConflict"),
  );
  await saveSavedViews(p, { expected_version: 2, views: [] });
  assert.equal((await readSavedViews(p)).settings.views.length, 0);
});
test("SH04 source cursors page scoped results and reject changed query bindings", async () => {
  const p = await principal();
  for (let i = 0; i < 22; i++)
    await createActivity(p, { ...activity(), summary: `SYN SH paging ${i}` });
  const first = await applicationSearch(p, {
    q: "SYN SH paging",
    kind: "Activity",
  });
  assert.equal(first.items.length, 20);
  assert.ok(first.next_cursor);
  const next = await applicationSearch(p, {
    q: "SYN SH paging",
    kind: "Activity",
    cursor: first.next_cursor,
  });
  assert.equal(next.items.length, 2);
  assert.ok(next.items.every((i) => !first.items.some((j) => i.id === j.id)));
  await assert.rejects(
    applicationSearch(p, {
      q: "different",
      kind: "Activity",
      cursor: first.next_cursor,
    }),
  );
  const facilities = await applicationSearch(p, {
    q: "SYN",
    kind: "Facility / growing area",
  });
  assert.ok(facilities.items.every((f) => f.context?.includes(" → ")));
});
test("SH04 identical growing-area names retain site context, stable IDs and current access", async () => {
  const p = await principal(),
    site = randomUUID();
  await createSite(p, {
    ...crmBase(),
    id: site,
    company_id: CRM.company,
    display_name: "SYN SH second site",
    location_description: "Fictional",
    timezone: "Australia/Brisbane",
    owner_id: CRM.owner,
  });
  const ids = [randomUUID(), randomUUID()];
  for (const [i, site_id] of [CRM.site, site].entries())
    await createFacilityDetails(p, {
      ...crmBase(),
      id: ids[i],
      company_id: CRM.company,
      site_id,
      details: {
        name: "SYN SH repeated area",
        structure_type: "open_growing_area",
        use: "production",
      },
    });
  const result = await applicationSearch(p, {
    q: "SYN SH repeated area",
    kind: "Facility / growing area",
  });
  assert.equal(result.items.length, 2);
  assert.equal(new Set(result.items.map((r) => r.id)).size, 2);
  assert.equal(new Set(result.items.map((r) => r.context)).size, 2);
  assert.ok(
    result.items.some((r) => r.context?.includes("SYN SH second site")),
  );
  const selected = await searchPreview(p, {
    kind: "Facility / growing area",
    id: ids[1],
  });
  assert.ok(selected.context?.includes("SYN SH second site"));
  assert.equal(
    (
      await applicationSearch(await principal("second-company"), {
        q: "SYN SH repeated area",
      })
    ).items.length,
    0,
  );
});
test("SH06 source perspectives are permission scoped and selection rechecks current version without commands", async () => {
  const p = await principal();
  for (const view of [
    "mine",
    "all",
    "returned",
    "handovers",
    "sent",
    "history",
  ]) {
    const result = await reviewInbox(p, { view });
    assert.notEqual(result.state, "unavailable");
    assert.equal(
      new Set(result.items.map((i) => i.id)).size,
      result.items.length,
    );
    for (const item of result.items.slice(0, 1)) {
      const selected = await reviewTarget(p, {
        id: item.id,
        version: item.version,
      });
      assert.equal(selected.stale, false);
      assert.equal(
        (await reviewTarget(p, { id: item.id, version: -1 })).stale,
        true,
      );
    }
  }
  assert.equal(
    (await reviewInbox(await principal("other-workspace"), { view: "all" }))
      .items.length,
    0,
  );
});
test("0043 upgrades retained 0028 personal views and Activities across later migrations without rewriting them", async () => {
  await database().query(
    await readFile(
      new URL("../../db/migrations/0001-recover.sql", import.meta.url),
      "utf8",
    ),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(28);
  await seed(28);
  const p = await principal(),
    a = activity();
  await createActivity(p, a);
  await saveWorkViews(p, {
    expected_version: 0,
    views: [
      {
        id: randomUUID(),
        name: "Retained old view",
        target: "overview",
        pinned: true,
        criteria: defaultCriteria,
      },
    ],
  });
  const before = await readWorkViews(p),
    source = await readActivity(p, a.id);
  await migrate();
  await seed();
  assert.deepEqual(await readWorkViews(p), before);
  assert.deepEqual(await readActivity(p, a.id), source);
  assert.equal(
    (await notificationInbox(p)).items.filter((n) => n.source_id === a.id)
      .length,
    1,
  );
  await migrate();
  assert.deepEqual(await readWorkViews(p), before);
});

test("SH06 real Service submission and return reflect the exact source decision and author", async () => {
  const q = await submitted(),
    before = await reviewInbox(q.reviewer, { view: "mine", module: "Service" });
  const task = before.items.find((t) => t.record_id === q.report.id);
  assert.ok(task);
  assert.equal(task.revision, "r01");
  assert.ok(task.submitted_at);
  assert.equal(task.owner_id, q.reviewer.actor_id);
  await reviewReport(q.reviewer, q.report.id, decision(q.report, "Returned"));
  const returned = await reviewInbox(q.p, {
    view: "returned",
    module: "Service",
  });
  assert.ok(
    returned.items.some((t) => t.record_id === q.report.id && t.returned),
  );
  assert.equal(
    (await reviewTarget(q.reviewer, { id: task.id, version: task.version }))
      .stale,
    true,
  );
});
test("SH06 real Finance handoff appears for the eligible reviewer and sending owner", async () => {
  const f = await financeDraft();
  await submitFinance(f.p, f.id, {
    ...crmBase(),
    expected_version: f.result.receipt.record_version,
  });
  const reviewers = await reviewInbox(f.reviewer, {
      view: "mine",
      module: "Finance",
    }),
    task = reviewers.items.find((t) => t.record_id === f.id);
  assert.ok(task);
  assert.equal(task.owner_id, null);
  assert.ok(task.submitted_at);
  assert.ok(
    (await reviewInbox(f.p, { view: "sent" })).items.some(
      (t) => t.record_id === f.id,
    ),
  );
  assert.ok(
    !(await reviewInbox(f.p, { view: "mine" })).items.some(
      (t) => t.record_id === f.id,
    ),
  );
});
test("SH06 Engineering retains independent reviewer, returned author and receiving handover identities", async () => {
  const ids = changeScenarioIds(false);
  await seedChangesScenario(directSignIn, ids);
  const reviewer = await principal(CHANGES.reviewer.profile),
    author = await principal(CHANGES.author.profile);
  const reviews = await reviewInbox(reviewer, {
    view: "mine",
    module: "Engineering",
  });
  assert.ok(
    reviews.items.some(
      (t) =>
        t.source === "EngineeringChange" && t.owner_id === reviewer.actor_id,
    ),
  );
  assert.ok(
    (await reviewInbox(author, { view: "returned", module: "Engineering" }))
      .items.length > 0,
  );
  const handovers = await reviewInbox(await principal(CHANGES.supply.profile), {
    view: "handovers",
    module: "Engineering",
  });
  assert.ok(handovers.items.length > 0);
  for (const t of handovers.items) assert.equal(t.kind, "Handover");
});
