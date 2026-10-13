import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, test } from "node:test";
import pg from "pg";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { withWorkingCompany } from "../../src/platform/working-company";
import { AppError } from "../../src/platform/errors";
import { createProject } from "../../src/projects/service";
import {
  createEngineeringRequest,
  coordinateEngineering,
  readEngineering,
  listEngineering,
} from "../../src/engineering/service";
import { engineeringRegister } from "../../src/engineering/register";
import { engineeringInput, engineeringUpdate } from "../helpers/engineering";
import { projectInput } from "../helpers/projects";
import { CRM } from "../helpers/crm";
import { MATERIALS } from "../helpers/engineering-materials";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const code = (expected: string) => (e: unknown) =>
  e instanceof AppError && e.code === expected;
async function scenario() {
  const p = await principal(),
    project = projectInput();
  await createProject(p, project);
  const marker = "SYN EN01 " + randomUUID();
  const add = async (
    fields: Partial<ReturnType<typeof engineeringInput>> = {},
  ) => {
    const input = { ...engineeringInput(project.id), title: marker, ...fields };
    await createEngineeringRequest(p, input);
    return input;
  };
  return { p, project, marker, add };
}

test("EN01 register sorts the whole authorised set, counts 101 matches and pages without loss", async () => {
  const s = await scenario(),
    ids: string[] = [];
  for (let i = 100; i >= 0; i--) {
    const item = await s.add({
      title: s.marker + " " + String(i).padStart(3, "0"),
    });
    ids.unshift(item.id);
  }
  const query = { q: s.marker, sort: "Name", limit: 50 };
  const first = await engineeringRegister(s.p, query);
  assert.equal(first.counts.all, 101);
  assert.equal(first.counts.mine, 101);
  assert.equal(first.matching_count, 101);
  assert.equal(first.count_scope, "AllAuthorisedMatches");
  assert.equal(first.items.length, 50);
  assert(first.next_cursor);
  const second = await engineeringRegister(s.p, {
    ...query,
    cursor: first.next_cursor,
  });
  assert(second.next_cursor);
  const third = await engineeringRegister(s.p, {
    ...query,
    cursor: second.next_cursor,
  });
  assert.equal(third.items.length, 1);
  assert.equal(third.next_cursor, null);
  assert.equal(third.completeness, "Complete");
  assert.deepEqual(
    [...first.items, ...second.items, ...third.items].map((r) => r.id),
    ids,
  );
  assert.equal(third.counts.all, 101);
  assert.equal(first.engineers.items.length, 1);
  const old = await listEngineering(s.p, { q: s.marker, limit: 100 });
  assert.equal(old.items.length, 100);
  assert(!("counts" in old));
});

test("EN01 date ordering keeps nulls last both ways, stable ties and exact attention rules", async () => {
  const s = await scenario();
  const a = await s.add({
    required_date: "2000-01-01",
    action_due: "2099-01-01",
  });
  const b = await s.add({
    required_date: "2099-01-01",
    action_due: "2000-01-01",
  });
  const c = await s.add();
  await coordinateEngineering(s.p, c.id, {
    ...engineeringUpdate(),
    required_date: null,
    action_due: null,
  });
  const d = await s.add({
    required_date: "2099-01-01",
    action_due: "2099-01-01",
  });
  const tied = [b.id, d.id].sort();
  assert.deepEqual(
    (await engineeringRegister(s.p, { q: s.marker })).items.map((r) => r.id),
    [a.id, ...tied, c.id],
  );
  assert.deepEqual(
    (
      await engineeringRegister(s.p, { q: s.marker, direction: "desc" })
    ).items.map((r) => r.id),
    [...tied, a.id, c.id],
  );
  const attention = await engineeringRegister(s.p, {
    q: s.marker,
    attention: "true",
  });
  assert.equal(attention.matching_count, 2);
  assert.deepEqual(
    new Set(attention.items.map((r) => r.id)),
    new Set([a.id, b.id]),
  );
  const action = await engineeringRegister(s.p, {
    q: s.marker,
    sort: "ActionDate",
  });
  assert.equal(action.items[0].id, b.id);
  assert.equal(action.items.at(-1)!.id, c.id);
  await coordinateEngineering(s.p, d.id, {
    ...engineeringUpdate(),
    state: "Awaiting information",
    blocker: "SYN missing design input",
    required_date: null,
    action_due: null,
  });
  assert.equal(
    (await engineeringRegister(s.p, { q: s.marker })).counts.attention,
    3,
  );
});

test("EN01 filter choices retain recorded inactive owners without granting assignment or leaking directory identities", async () => {
  const s = await scenario();
  const a = await s.add({ title: s.marker + " 100%_Pump" });
  const b = await s.add({
    owner_id: MATERIALS.author.id,
    title: s.marker + " other",
    discipline: "Hydraulics",
  });
  const filtered = await engineeringRegister(s.p, {
    q: s.marker,
    owner_id: MATERIALS.author.id,
    view: "mine",
  });
  assert.equal(filtered.counts.all, 1);
  assert.equal(filtered.counts.mine, 0);
  assert.equal(filtered.items.length, 0);
  assert.deepEqual(
    new Set(filtered.engineers.items.map((e) => e.id)),
    new Set([s.p.actor_id, MATERIALS.author.id]),
  );
  assert.deepEqual(
    (await engineeringRegister(s.p, { q: "100%_Pump" })).items.map((r) => r.id),
    [a.id],
  );
  assert.deepEqual(
    (
      await engineeringRegister(s.p, { q: s.marker, discipline: "Hydraulics" })
    ).items.map((r) => r.id),
    [b.id],
  );
  await database().query("UPDATE ppo.users SET active=false WHERE id=$1", [
    MATERIALS.author.id,
  ]);
  try {
    const inactive = await engineeringRegister(s.p, { q: b.id });
    assert.equal(inactive.items[0].owner_active, false);
    assert.equal(inactive.engineers.items[0].active, false);
    assert.equal(
      (await readEngineering(s.p, b.id)).package.owner_id,
      MATERIALS.author.id,
    );
  } finally {
    await database().query("UPDATE ppo.users SET active=true WHERE id=$1", [
      MATERIALS.author.id,
    ]);
  }
});

test("EN01 continuation binds filters, actor, source and working company; source edits require a fresh page", async () => {
  const s = await scenario(),
    a = await s.add(),
    b = await s.add();
  const query = { q: s.marker, limit: 1 };
  const first = await engineeringRegister(s.p, query);
  assert(first.next_cursor);
  for (const changes of [
    { sort: "Name" },
    { view: "mine" },
    { limit: 2 },
    { q: a.id },
    { direction: "desc" },
  ])
    await assert.rejects(
      engineeringRegister(s.p, {
        ...query,
        ...changes,
        cursor: first.next_cursor,
      }),
      code("InvalidData"),
    );
  await assert.rejects(
    engineeringRegister(s.p, {
      ...query,
      cursor: first.next_cursor + "broken",
    }),
  );
  await assert.rejects(
    engineeringRegister(await principal("materials-author"), {
      ...query,
      cursor: first.next_cursor,
    }),
  );
  await assert.rejects(
    withWorkingCompany(s.p.actor_id, CRM.company, () =>
      engineeringRegister(s.p, { ...query, cursor: first.next_cursor }),
    ),
  );
  await coordinateEngineering(s.p, b.id, engineeringUpdate());
  await assert.rejects(
    engineeringRegister(s.p, { ...query, cursor: first.next_cursor }),
  );
  const refresh = await engineeringRegister(s.p, query);
  assert(refresh.next_cursor);
  assert.equal(
    (await engineeringRegister(s.p, { ...query, cursor: refresh.next_cursor }))
      .items.length,
    1,
  );
});

test("EN01 company, workspace, working-company and source-context access scope counts and options together", async () => {
  const s = await scenario(),
    item = await s.add();
  const outsider = await principal("second-company");
  const empty = await engineeringRegister(outsider, { q: s.marker });
  assert.equal(empty.counts.all, 0);
  assert.deepEqual(empty.engineers.items, []);
  assert.deepEqual(empty.items, []);
  await assert.rejects(
    engineeringRegister(await principal("observer"), {}),
    code("Forbidden"),
  );
  await assert.rejects(
    engineeringRegister({ ...s.p, workspace_id: randomUUID() }, {}),
    code("Forbidden"),
  );
  const narrowed = await withWorkingCompany(s.p.actor_id, CRM.companyB, () =>
    engineeringRegister(s.p, { q: s.marker }),
  );
  assert.equal(narrowed.counts.all, 0);
  assert.equal(narrowed.engineers.items.length, 0);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='project.read'",
    [s.p.actor_id],
  );
  try {
    const hidden = await engineeringRegister(s.p, { q: item.id });
    assert.equal(hidden.matching_count, 0);
    assert.deepEqual(hidden.engineers.items, []);
  } finally {
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='project.read'",
      [s.p.actor_id],
    );
  }
});

test("EN01 final source check refuses late scope revocation before any captured rows or counts escape", async (t) => {
  const s = await scenario();
  await s.add();
  const real = pg.Client.prototype.query;
  let injected = false;
  t.mock.method(
    pg.Client.prototype,
    "query",
    async function (this: pg.Client, ...args: Parameters<pg.Client["query"]>) {
      const result = await Reflect.apply(real, this, args);
      if (
        !injected &&
        typeof args[0] === "string" &&
        args[0].includes("SELECT * FROM ordered WHERE")
      ) {
        injected = true;
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='shared.internal.read'",
          [s.p.actor_id],
        );
      }
      return result;
    },
  );
  try {
    await assert.rejects(
      engineeringRegister(s.p, { q: s.marker }),
      code("ReadConflict"),
    );
    assert(injected);
  } finally {
    t.mock.restoreAll();
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='shared.internal.read'",
      [s.p.actor_id],
    );
  }
});
