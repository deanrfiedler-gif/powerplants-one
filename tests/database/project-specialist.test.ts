import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset, migrate, seed } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { readOperation } from "../../src/shared/receipts";
import { commandPackage } from "../../src/projects/specialist/commands";
import { readPackages } from "../../src/projects/specialist/reads";
import {
  specialistFixture,
  packageAction,
} from "../helpers/project-specialist";
import { coordinateEngineering } from "../../src/engineering/service";
import { engineeringUpdate } from "../helpers/engineering";
import { createProject } from "../../src/projects/service";
import { projectInput } from "../helpers/projects";
import { recordFinding, withdrawDocument } from "../../src/library/commands";
import { readDocument } from "../../src/library/reads";
import { saveRecord } from "../../src/supply/commands";
import { crmBase } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
const rows = async (sql: string, args: unknown[] = []) =>
  (await database().query(sql, args)).rows;
const snapshot = async (tables: string[]) =>
  Promise.all(
    tables.map((t) =>
      rows(`SELECT to_jsonb(x) row FROM ppo.${t} x ORDER BY to_jsonb(x)::text`),
    ),
  );
const graph = [
  "project_specialist_packages",
  "project_specialist_events",
  "business_identities",
  "audit_events",
  "operation_receipts",
  "outbox_jobs",
];

test("PJ06-01 native commercial/Engineering/Supply sources, independent receiving, exact units, history and original recovery", async () => {
  const f = await specialistFixture(),
    route = f.project.id,
    id = f.package.id;
  const sourceTables = [
    "projects",
    "project_tasks",
    "project_dependencies",
    "engineering_packages",
    "supply_records",
    "project_commercial_events",
  ];
  const sources = await snapshot(sourceTables);
  const created = await commandPackage(f.owner, route, f.package);
  await commandPackage(f.owner, route, packageAction(id, 1, "Submit"));
  await commandPackage(f.reviewer, route, packageAction(id, 2, "Return"));
  await commandPackage(f.owner, route, {
    ...packageAction(id, 3, "Revise"),
    content: { ...f.package.content, scope: "SYN clarified scope" },
  });
  await commandPackage(f.owner, route, packageAction(id, 4, "Submit"));
  const accept = packageAction(id, 5, "Accept"),
    accepted = await commandPackage(f.reviewer, route, accept);
  const detail = await readPackages(f.owner, route, { id });
  assert.equal(detail.current!.state, "Accepted");
  assert.deepEqual(
    detail.history!.map((x) => x.state),
    ["Accepted", "Submitted", "Draft", "Returned", "Submitted", "Draft"],
  );
  assert.deepEqual(detail.history![0].content, detail.history![1].content);
  assert.deepEqual(detail.history![0].source, detail.history![1].source);
  assert.equal(detail.current!.source.demand!.unit, "EA");
  assert.equal(
    detail.current!.source.demand!.quantity,
    (
      await rows("SELECT quantity FROM ppo.supply_records WHERE id=$1", [
        f.demand.id,
      ])
    )[0].quantity,
  );
  assert.deepEqual(await snapshot(sourceTables), sources);
  const before = await snapshot(graph);
  await migrate();
  await seed();
  assert.deepEqual(
    (await commandPackage(f.owner, route, f.package)).receipt,
    created.receipt,
  );
  assert.deepEqual(
    (await commandPackage(f.reviewer, route, accept)).receipt,
    accepted.receipt,
  );
  assert.deepEqual(
    await readOperation(f.reviewer, accept.operation_id),
    accepted.receipt,
  );
  assert.deepEqual(await snapshot(graph), before);
  await assert.rejects(
    commandPackage(f.owner, route, packageAction(id, 6, "Withdraw")),
    code("InvalidData"),
  );
  const correction = {
    ...f.package,
    ...packageAction(randomUUID(), 0, "Create"),
    predecessor_id: id,
  };
  await commandPackage(f.owner, route, correction);
  await assert.rejects(
    commandPackage(f.owner, route, {
      ...correction,
      ...packageAction(randomUUID(), 0, "Create"),
    }),
    code("RelationshipConflict"),
  );
  assert.equal(
    (await readPackages(f.owner, route, { id })).current!.version,
    6,
  );
});

test("PJ06-02 source drift holds acceptance; return/revise and exact historical recovery survive", async () => {
  const f = await specialistFixture(),
    id = f.package.id,
    pr = f.project.id;
  const created = await commandPackage(f.owner, pr, f.package);
  await commandPackage(f.owner, pr, packageAction(id, 1, "Submit"));
  await coordinateEngineering(f.owner, f.engineering.id, engineeringUpdate(1));
  await assert.rejects(
    commandPackage(f.reviewer, pr, packageAction(id, 2, "Accept")),
    code("SpecialistSourceChanged"),
  );
  const changed = await readPackages(f.owner, pr, { id });
  assert.equal(changed.current!.source_status, "Changed");
  assert.equal(changed.current!.source.engineering!.version, 1);
  await commandPackage(f.reviewer, pr, packageAction(id, 2, "Return"));
  await commandPackage(f.owner, pr, {
    ...packageAction(id, 3, "Revise"),
    content: {
      ...f.package.content,
      engineering: { id: f.engineering.id, version: 2 },
    },
  });
  await commandPackage(f.owner, pr, packageAction(id, 4, "Submit"));
  await commandPackage(f.reviewer, pr, packageAction(id, 5, "Accept"));
  assert.deepEqual(
    await readOperation(f.owner, f.package.operation_id),
    created.receipt,
  );
  const d = await readDocument(f.owner, f.document.id);
  await recordFinding(f.owner, f.document.id, {
    ...crmBase(),
    expected_version: d.document.version,
    revision_id: f.document.revision_id,
    action: "Open",
    finding_id: randomUUID(),
    text: "SYN new source finding",
    owner_id: f.owner.actor_id,
    due_date: "2031-10-01",
  });
  assert.equal(
    (await readPackages(f.owner, pr, { id })).current!.source_status,
    "Changed",
  );
  assert.deepEqual(
    (await commandPackage(f.owner, pr, f.package)).receipt,
    created.receipt,
  );
  await assert.rejects(
    commandPackage(f.owner, pr, {
      ...f.package,
      ...packageAction(randomUUID(), 0, "Create"),
      content: {
        ...f.package.content,
        engineering: { id: f.engineering.id, version: 2 },
      },
    }),
    code("SpecialistSourceChanged"),
  );
  const latestDocument = await readDocument(f.owner, f.document.id);
  await withdrawDocument(f.owner, f.document.id, {
    ...crmBase(),
    revision_id: f.document.revision_id,
    expected_version: latestDocument.document.version,
  });
  assert.equal(
    (await readPackages(f.owner, pr, { id })).current!.source_status,
    "Changed",
  );
  assert.deepEqual(
    await readOperation(f.owner, f.package.operation_id),
    created.receipt,
  );
});

test("PJ06-03 access and company isolation cover detail, history, list cursors, command and receipt", async () => {
  const f = await specialistFixture(),
    pr = f.project.id,
    id = f.package.id;
  await commandPackage(f.owner, pr, f.package);
  const other = (await createSession("second-company")).principal;
  await assert.rejects(readPackages(other, pr, { id }));
  await assert.rejects(
    commandPackage(other, pr, packageAction(id, 1, "Submit")),
  );
  const alternate = projectInput();
  await createProject(f.owner, alternate);
  await assert.rejects(
    readPackages(f.owner, alternate.id, { id }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    commandPackage(f.owner, alternate.id, packageAction(id, 1, "Submit")),
    code("RecordUnavailable"),
  );
  await rows(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='engineering.read'",
    [f.owner.workspace_id, f.owner.actor_id],
  );
  assert.deepEqual((await readPackages(f.owner, pr)).items, []);
  await assert.rejects(readPackages(f.owner, pr, { id }));
  await assert.rejects(readOperation(f.owner, f.package.operation_id));
  await assert.rejects(commandPackage(f.owner, pr, f.package));
  // An empty visibility-filtered page cannot disclose a hidden UUID through its cursor.
  assert.equal(
    (await readPackages(f.owner, pr, { limit: "1" })).next_cursor,
    null,
  );
});

test("PJ06-04 optimistic concurrency, altered retries and atomic evidence rollback", async () => {
  const f = await specialistFixture(),
    pr = f.project.id,
    id = f.package.id;
  await commandPackage(f.owner, pr, {
    ...f.package,
    content: { ...f.package.content, due_date: "2031-10-01", date_needed_reason: null },
  });
  for (const [content, expected] of [
    [{ ...f.package.content, technical_release: "Approved" }, /Closed specialist content required/],
    [{ ...f.package.content, engineering: { ...f.package.content.engineering, technical_release: "Approved" } }, /Exact source reference fields required/],
    [{ ...f.package.content, demand: { ...f.package.content.demand, purchase_order: "Approved" } }, /Exact source reference fields required/],
    [{ ...f.package.content, engineering: { ...f.package.content.engineering, version: "1" } }, /Exact source reference fields required/],
    [{ ...f.package.content, demand: { id: f.package.content.demand.id } }, /Exact source reference fields required/],
    [{ ...f.package.content, title: null }, /Typed specialist text required/],
    [{ ...f.package.content, date_needed_reason: true }, /Bounded unresolved context required/],
  ] as const) {
    await assert.rejects(transaction(async (c) => {
      await c.query(
        "INSERT INTO ppo.project_specialist_events(workspace_id,package_id,version,command,state,content,source,source_hash,note,reason,created_by,operation_id) SELECT workspace_id,package_id,2,'Revise','Draft',$3,source,source_hash,note,reason,created_by,$2 FROM ppo.project_specialist_events WHERE package_id=$1 AND version=1",
        [id, randomUUID(), content],
      );
    }), expected);
  }
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "INSERT INTO ppo.project_specialist_events(workspace_id,package_id,version,command,state,content,source,source_hash,note,reason,created_by,operation_id) SELECT workspace_id,package_id,2,'Revise','Draft',content,source,repeat('0',64),note,reason,created_by,$2 FROM ppo.project_specialist_events WHERE package_id=$1 AND version=1",
        [id, randomUUID()],
      );
    }),
    /Exact source snapshot hash required/,
  );
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "WITH original AS (SELECT *,source || '{\"technical_release\":\"Approved\"}'::jsonb AS invented FROM ppo.project_specialist_events WHERE package_id=$1 AND version=1) INSERT INTO ppo.project_specialist_events(workspace_id,package_id,version,command,state,content,source,source_hash,note,reason,created_by,operation_id) SELECT workspace_id,package_id,2,'Revise','Draft',content,invented,encode(sha256(convert_to(ppo.project_specialist_source_json(invented),'UTF8')),'hex'),note,reason,created_by,$2 FROM original",
        [id, randomUUID()],
      );
    }),
    /Closed specialist source snapshot required/,
  );
  const contenders = await Promise.allSettled(
    [1, 2].map(() =>
      commandPackage(f.owner, pr, packageAction(id, 1, "Submit")),
    ),
  );
  assert.equal(contenders.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    contenders.filter(
      (x) => x.status === "rejected" && x.reason.code === "VersionConflict",
    ).length,
    1,
  );
  await assert.rejects(
    commandPackage(f.owner, pr, { ...f.package, note: "SYN altered retry" }),
    code("OperationConflict"),
  );
  const before = await snapshot(graph);
  await rows(
    "CREATE FUNCTION ppo.fail_specialist_proof() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.payload->>'object_type'='ProjectSpecialistPackage' THEN RAISE EXCEPTION 'SYN injected outbox failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER fail_specialist_proof BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.fail_specialist_proof()",
  );
  try {
    await assert.rejects(
      commandPackage(f.reviewer, pr, packageAction(id, 2, "Accept")),
    );
  } finally {
    await rows(
      "DROP TRIGGER fail_specialist_proof ON ppo.outbox_jobs; DROP FUNCTION ppo.fail_specialist_proof()",
    );
  }
  assert.deepEqual(await snapshot(graph), before);
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "INSERT INTO ppo.project_specialist_events(workspace_id,package_id,version,command,state,content,source,source_hash,note,reason,created_by,operation_id) SELECT workspace_id,package_id,3,'Accept','Accepted',content,source,repeat('0',64),note,reason,$2,$3 FROM ppo.project_specialist_events WHERE package_id=$1 AND version=2",
        [id, f.reviewer.actor_id, randomUUID()],
      );
    }),
    /Exact source snapshot hash required/,
  );
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "UPDATE ppo.project_specialist_events SET note='SYN overwrite' WHERE package_id=$1",
        [id],
      );
    }),
  );
  assert.deepEqual(await snapshot(graph), before);
});

test("PJ06-05 explicit missing context, owner boundary, independent receiver, pagination and strict inputs", async () => {
  const f = await specialistFixture(),
    pr = f.project.id;
  const missing = {
    ...f.package,
    content: {
      ...f.package.content,
      engineering: null,
      engineering_needed_reason: "SYN technical context not provided",
      demand: null,
      demand_needed_reason: "SYN Supply scope not provided",
    },
  };
  await assert.rejects(
    commandPackage(f.reviewer, pr, {
      ...missing,
      content: { ...missing.content, owner_id: f.reviewer.actor_id },
    }),
  );
  await assert.rejects(
    commandPackage(f.owner, pr, {
      ...missing,
      content: { ...missing.content, date_needed_reason: null },
    }),
    code("InvalidData"),
  );
  await commandPackage(f.owner, pr, missing);
  await commandPackage(f.owner, pr, packageAction(missing.id, 1, "Submit"));
  await assert.rejects(
    commandPackage(f.owner, pr, packageAction(missing.id, 2, "Accept")),
  );
  await assert.rejects(
    commandPackage(f.reviewer, pr, {
      ...packageAction(missing.id, 2, "Accept"),
      content: missing.content,
    }),
    code("InvalidData"),
  );
  await commandPackage(f.reviewer, pr, packageAction(missing.id, 2, "Accept"));
  const self = {
    ...missing,
    ...packageAction(randomUUID(), 0, "Create"),
    content: { ...missing.content, receiver_id: f.owner.actor_id },
  };
  await commandPackage(f.owner, pr, self);
  await commandPackage(f.owner, pr, packageAction(self.id, 1, "Submit"));
  await assert.rejects(
    commandPackage(f.owner, pr, packageAction(self.id, 2, "Accept")),
    code("IndependentReceivingRequired"),
  );
  const second = { ...missing, ...packageAction(randomUUID(), 0, "Create") };
  await commandPackage(f.owner, pr, second);
  const first = await readPackages(f.owner, pr, { limit: "1" });
  assert.equal(first.items!.length, 1);
  assert.ok(first.next_cursor);
  const next = await readPackages(f.owner, pr, {
    limit: "1",
    cursor: first.next_cursor!,
  });
  assert.equal(next.items!.length, 1);
  assert.notEqual(first.items![0].id, next.items![0].id);
  const earlier = await readPackages(f.owner, pr, {
    id: missing.id,
    before_version: "3",
  });
  assert.deepEqual(
    earlier.history!.map((x) => x.version),
    [2, 1],
  );
  assert.equal(earlier.current!.version, 3);
  await assert.rejects(
    readPackages(f.owner, pr, { id: missing.id, before_version: "Infinity" }),
    code("InvalidData"),
  );
});

test("PJ06-06 exact Supply demand revision drift retains original quantity and allows withdrawal recovery", async () => {
  const f = await specialistFixture(),
    pr = f.project.id,
    id = f.package.id;
  const saved = await commandPackage(f.owner, pr, f.package);
  const original = (await readPackages(f.owner, pr, { id })).current!.source
    .demand!;
  await saveRecord(
    f.owner,
    { ...f.demand, ...crmBase(), expected_version: 1, quantity: "12" },
    true,
  );
  await assert.rejects(
    commandPackage(f.owner, pr, packageAction(id, 1, "Submit")),
    code("SpecialistSourceChanged"),
  );
  const changed = await readPackages(f.owner, pr, { id });
  assert.equal(changed.current!.source_status, "Changed");
  assert.deepEqual(changed.current!.source.demand, original);
  const withdrawal = packageAction(id, 1, "Withdraw"),
    withdrawn = await commandPackage(f.owner, pr, withdrawal);
  assert.deepEqual(
    (await commandPackage(f.owner, pr, withdrawal)).receipt,
    withdrawn.receipt,
  );
  assert.deepEqual(
    await readOperation(f.owner, f.package.operation_id),
    saved.receipt,
  );
});
