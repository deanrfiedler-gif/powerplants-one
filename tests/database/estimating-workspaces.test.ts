import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, migrate, seed } from "../../scripts/database";
import { createOpportunity } from "../../src/crm/opportunities";
import {
  createEstimate,
  saveEstimate,
  prepareQuote,
} from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import {
  runQuoteJob,
  readQuoteJob,
  draftBytes,
  retryQuote,
} from "../../src/estimating/worker";
import { readOperation } from "../../src/shared/receipts";
import {
  workspaceAuthority,
  requireDraftGroup,
} from "../../src/estimating/discovery-workspace-context";
import {
  createDiscoveryWorkspace,
  previewDiscoveryCreate,
  previewDiscoveryChange,
  changeDiscoveryWorkspace,
  changeDiscoveryOption,
  readDiscoveryWorkspace,
  readDiscoveryRevision,
} from "../../src/estimating/discovery-workspaces";
import type { DiscoveryChange } from "../../src/estimating/discovery-workspace-validation";
import { CRM, crmBase, crmCreate } from "../helpers/crm";
import { estimateInput, quoteCommand } from "../helpers/estimating";
import {
  discoveryInput,
  discoveryFacility,
} from "../helpers/estimating-discovery";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const rows = async (q: string, v: unknown[] = []) =>
  (await database().query(q, v)).rows;
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
async function setup() {
  const p = (await createSession("coordinator")).principal,
    o = crmCreate();
  await createOpportunity(p, o);
  const discovery = discoveryInput(),
    preview = await previewDiscoveryCreate(p, {
      opportunity_id: o.id,
      discovery,
    });
  const input = {
    ...crmBase(),
    id: randomUUID(),
    option_id: randomUUID(),
    revision_id: randomUUID(),
    opportunity_id: o.id,
    discovery,
    expected_opportunity_version: preview.expected_opportunity_version,
    context_hash: preview.context_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
  };
  return { p, o, input };
}
async function saved() {
  const s = await setup(),
    accepted = await createDiscoveryWorkspace(s.p, s.input);
  return {
    ...s,
    accepted,
    view: await readDiscoveryWorkspace(s.p, s.input.id),
  };
}
type Saved = Awaited<ReturnType<typeof saved>>;
type WorkspaceRef = { p: Saved["p"]; input: { id: string } };
async function proposal(
  s: WorkspaceRef,
  kind: "Save" | "Branch" = "Save",
  patch: Partial<DiscoveryChange> = {},
) {
  const view = await readDiscoveryWorkspace(s.p, s.input.id),
    current = view.options[0];
  const draft: DiscoveryChange = {
    kind,
    option_id: current.option.id,
    expected_version: view.workspace.version,
    expected_revision_id: current.revision.id,
    discovery: discoveryInput(),
    branch_mode: kind === "Branch" ? "Fresh" : null,
    copy_follow_up: null,
    ...patch,
  };
  const preview = await previewDiscoveryChange(s.p, s.input.id, draft);
  return {
    ...crmBase(),
    ...draft,
    revision_id: randomUUID(),
    ...(kind === "Branch" ? { new_option_id: randomUUID(), label: "B" } : {}),
    context_hash: preview.context_hash,
    comparison_hash: preview.comparison_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
  };
}
async function action(
  s: WorkspaceRef,
  optionId: string,
  action: "Select" | "Archive" | "Reopen",
) {
  const v = await readDiscoveryWorkspace(s.p, s.input.id),
    o = v.options.find((o) => o.option.id === optionId)!;
  return {
    ...crmBase(),
    action,
    option_id: optionId,
    expected_version: v.workspace.version,
    expected_revision_id: o.revision.id,
    expected_selected_option_id: v.workspace.selected_option_id,
  };
}
async function businessSnapshot() {
  const tables = [
    "estimating_workspaces",
    "estimating_options",
    "estimation_revisions",
    "estimating_scope_facilities",
    "estimating_scope_equipment",
    "estimates",
    "estimate_versions",
    "opportunities",
    "activities",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
    "business_identities",
  ];
  return Promise.all(
    tables.map((t) =>
      rows(
        `SELECT to_jsonb(r) value FROM ppo.${t} r ORDER BY to_jsonb(r)::text`,
      ),
    ),
  );
}
test("E2 persistence creates one selected option and exact immutable scope under identical operation races", async () => {
  const s = await setup(),
    results = await Promise.all([
      createDiscoveryWorkspace(s.p, s.input),
      createDiscoveryWorkspace(s.p, s.input),
    ]);
  assert.deepEqual(results[0].receipt, results[1].receipt);
  assert.equal(results.filter((r) => r.replayed).length, 1);
  const v = await readDiscoveryWorkspace(s.p, s.input.id),
    r = v.options[0].revision;
  assert.equal(v.workspace.selected_option_id, s.input.option_id);
  assert.equal(v.workspace.version, 1);
  assert.equal(v.options.length, 1);
  assert.equal(r.version, 1);
  assert.equal(r.scope_readiness, "Complete");
  assert.equal(
    new Set([
      v.workspace.id,
      s.input.option_id,
      r.id,
      r.scope_snapshot_id,
      r.answer_snapshot_id,
    ]).size,
    5,
  );
  assert.equal(v.delivery_routing.status, "NotConfigured");
  assert.equal(v.costing_import.status, "NotImplemented");
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.estimates"))[0].n,
    0,
  );
  assert.deepEqual(
    (
      await rows(
        "SELECT facility_id FROM ppo.estimating_scope_facilities WHERE scope_snapshot_id=$1",
        [r.scope_snapshot_id],
      )
    ).map((r) => r.facility_id),
    [discoveryFacility],
  );
  assert.equal(r.answer_attribution.Q01.confirmed_by, s.p.actor_id);
  assert.deepEqual(
    await readOperation(s.p, s.input.operation_id),
    results[0].receipt,
  );
  for (const t of ["audit_events", "operation_receipts", "outbox_jobs"])
    assert.equal(
      (
        await rows(
          `SELECT count(*)::int n FROM ppo.${t} WHERE operation_id=$1`,
          [s.input.operation_id],
        )
      )[0].n,
      1,
    );
  await assert.rejects(
    createDiscoveryWorkspace(s.p, {
      ...s.input,
      reason: "Changed same operation",
    }),
    code("OperationConflict"),
  );
  await assert.rejects(
    createDiscoveryWorkspace(s.p, {
      ...s.input,
      ...crmBase(),
      id: randomUUID(),
      option_id: randomUUID(),
      revision_id: randomUUID(),
    }),
    code("RelationshipConflict"),
  );
  assert.equal(
    (
      await rows("SELECT version,stage_id FROM ppo.opportunities WHERE id=$1", [
        s.o.id,
      ])
    )[0].version,
    1,
  );
  await assert.rejects(
    rows("UPDATE ppo.estimation_revisions SET reason='Overwrite' WHERE id=$1", [
      r.id,
    ]),
    code("55000"),
  );
  await assert.rejects(
    rows(
      "DELETE FROM ppo.estimating_scope_facilities WHERE scope_snapshot_id=$1",
      [r.scope_snapshot_id],
    ),
    code("55000"),
  );
});
test("E2 change comparisons reject stale writers and require explicit reconfirmation after membership changes", async () => {
  const s = await saved(),
    discovery = discoveryInput();
  discovery.scope.equipment_ids = [];
  const input = await proposal(s, "Save", { discovery }),
    before = await businessSnapshot();
  assert.ok(input.confirmed_question_ids.includes("Q01"));
  await assert.rejects(
    changeDiscoveryWorkspace(s.p, s.input.id, {
      ...input,
      confirmed_question_ids: [],
    }),
    code("DiscoveryConfirmationRequired"),
  );
  await assert.rejects(
    changeDiscoveryWorkspace(s.p, s.input.id, {
      ...input,
      comparison_hash: "0".repeat(64),
    }),
    code("DiscoveryComparisonChanged"),
  );
  assert.deepEqual(await businessSnapshot(), before);
  const commands = [
      input,
      { ...input, ...crmBase(), revision_id: randomUUID() },
    ],
    both = await Promise.allSettled(
      commands.map((c) => changeDiscoveryWorkspace(s.p, s.input.id, c)),
    );
  assert.equal(both.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    both.filter(
      (r) => r.status === "rejected" && code("VersionConflict")(r.reason),
    ).length,
    1,
  );
  const winner = commands[both.findIndex((r) => r.status === "fulfilled")],
    v = await readDiscoveryWorkspace(s.p, s.input.id);
  assert.equal(v.workspace.version, 2);
  assert.equal(v.options[0].revision.predecessor_id, s.input.revision_id);
  assert.equal(v.options[0].revision.version, 2);
  assert.deepEqual(
    await readDiscoveryRevision(s.p, s.input.id, s.input.revision_id),
    s.view.options[0].revision,
  );
  assert.deepEqual(
    (await changeDiscoveryWorkspace(s.p, s.input.id, winner)).receipt,
    await readOperation(s.p, winner.operation_id),
  );
});
test("E2 copies retained discovery as unconfirmed, fresh branches retain no inherited answers, and neither changes selection", async () => {
  const s = await saved(),
    copy = await proposal(s, "Branch", {
      branch_mode: "CopyDiscovery",
      discovery: null,
      copy_follow_up: {
        owner_id: s.p.actor_id,
        reason: "SYN reconfirm this alternative",
      },
    });
  assert.deepEqual(copy.confirmed_question_ids, []);
  await changeDiscoveryWorkspace(s.p, s.input.id, copy);
  const v = await readDiscoveryWorkspace(s.p, s.input.id),
    r = v.options[1].revision;
  assert.equal(v.workspace.selected_option_id, s.input.option_id);
  assert.equal(r.version, 1);
  assert.equal(r.copied_from_id, s.input.revision_id);
  assert.equal(r.scope_readiness, "Incomplete");
  assert.ok(
    r.input!.answers.every(
      (a) => a.state === "Answered" && a.follow_up?.owner_id === s.p.actor_id,
    ),
  );
  assert.ok(
    Object.values(r.answer_attribution).every((a) => a.confirmed_at === null),
  );
  assert.deepEqual(
    await readDiscoveryRevision(s.p, s.input.id, s.input.revision_id),
    s.view.options[0].revision,
  );
  const fresh = await proposal(s, "Branch");
  await changeDiscoveryWorkspace(s.p, s.input.id, fresh);
  const latest = await readDiscoveryWorkspace(s.p, s.input.id);
  assert.equal(latest.options[2].revision.copied_from_id, null);
  assert.deepEqual(latest.options[2].revision.retained_hidden_answers, []);
  assert.equal(latest.workspace.selected_option_id, s.input.option_id);
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.estimates"))[0].n,
    0,
  );
});
test("E2 hidden answers remain in their accepted predecessor and later activation requires deliberate confirmation", async () => {
  const s = await saved(),
    discovery = discoveryInput();
  discovery.scope.systems = [];
  discovery.answers = discovery.answers.filter(
    (a) => !["Q05", "Q06"].includes(a.question_id),
  );
  const hide = await proposal(s, "Save", { discovery });
  await changeDiscoveryWorkspace(s.p, s.input.id, hide);
  const hidden = (await readDiscoveryWorkspace(s.p, s.input.id)).options[0]
    .revision;
  assert.deepEqual(
    hidden.retained_hidden_answers.map((a) => a.question_id),
    ["Q05", "Q06"],
  );
  assert.equal(hidden.input!.answers.length, 4);
  const reactivate = await proposal(s);
  assert.ok(reactivate.confirmed_question_ids.includes("Q05"));
  await assert.rejects(
    changeDiscoveryWorkspace(s.p, s.input.id, {
      ...reactivate,
      confirmed_question_ids: reactivate.confirmed_question_ids.filter(
        (id) => id !== "Q05",
      ),
    }),
    code("DiscoveryConfirmationRequired"),
  );
  await changeDiscoveryWorkspace(s.p, s.input.id, reactivate);
  assert.deepEqual(
    await readDiscoveryRevision(s.p, s.input.id, hidden.id),
    hidden,
  );
});
test("E2 archived options keep exact original recovery; select/archive races use the whole workspace version", async () => {
  const s = await saved(),
    branch = await proposal(s, "Branch");
  await changeDiscoveryWorkspace(s.p, s.input.id, branch);
  const second = branch.new_option_id!;
  const selected = await action(s, s.input.option_id, "Archive");
  await assert.rejects(
    changeDiscoveryOption(s.p, s.input.id, selected),
    code("SelectedOptionRequired"),
  );
  const select = await action(s, second, "Select"),
    archive = await action(s, second, "Archive");
  const both = await Promise.allSettled([
    changeDiscoveryOption(s.p, s.input.id, select),
    changeDiscoveryOption(s.p, s.input.id, archive),
  ]);
  assert.equal(both.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    both.filter(
      (r) => r.status === "rejected" && code("VersionConflict")(r.reason),
    ).length,
    1,
  );
  let v = await readDiscoveryWorkspace(s.p, s.input.id);
  if (v.options[1].option.state === "Active") {
    await changeDiscoveryOption(
      s.p,
      s.input.id,
      await action(s, s.input.option_id, "Select"),
    );
    await changeDiscoveryOption(
      s.p,
      s.input.id,
      await action(s, second, "Archive"),
    );
  }
  assert.deepEqual(
    (await changeDiscoveryWorkspace(s.p, s.input.id, branch)).receipt,
    await readOperation(s.p, branch.operation_id),
  );
  v = await readDiscoveryWorkspace(s.p, s.input.id);
  await assert.rejects(
    previewDiscoveryChange(s.p, s.input.id, {
      kind: "Save",
      option_id: second,
      expected_version: v.workspace.version,
      expected_revision_id: branch.revision_id,
      discovery: discoveryInput(),
    }),
    code("OptionArchived"),
  );
  await changeDiscoveryOption(
    s.p,
    s.input.id,
    await action(s, second, "Reopen"),
  );
  v = await readDiscoveryWorkspace(s.p, s.input.id);
  assert.equal(v.workspace.selected_option_id, s.input.option_id);
  assert.equal(v.options[1].revision.id, branch.revision_id);
});
test("E2 original receipts and captured labels are hidden after current relationship revocation, including inactive source options", async () => {
  const s = await saved(),
    branch = await proposal(s, "Branch");
  await changeDiscoveryWorkspace(s.p, s.input.id, branch);
  for (const profile of [
    "observer",
    "systems",
    "assigned-technician",
    "second-company",
    "other-workspace",
  ]) {
    const other = (await createSession(profile)).principal;
    await assert.rejects(
      readDiscoveryWorkspace(other, s.input.id),
      code("RecordUnavailable"),
    );
    await assert.rejects(
      readOperation(other, s.input.operation_id),
      code("RecordUnavailable"),
    );
    await assert.rejects(
      changeDiscoveryWorkspace(other, s.input.id, branch),
      code("RecordUnavailable"),
    );
  }
  await rows(
    "UPDATE ppo.relationships SET valid_to=CURRENT_DATE WHERE workspace_id=$1 AND organisation_id=$2 AND person_id=$3",
    [CRM.workspace, CRM.org, CRM.person],
  );
  for (const read of [
    () => readDiscoveryWorkspace(s.p, s.input.id),
    () => readDiscoveryRevision(s.p, s.input.id, s.input.revision_id),
    () => readOperation(s.p, branch.operation_id),
    () => changeDiscoveryWorkspace(s.p, s.input.id, branch),
  ])
    await assert.rejects(read(), code("RecordUnavailable"));
});
test("E2 shared-context changes reject the original proposal without altering its retained source or silently refreshing it", async () => {
  const s = await saved(),
    input = await proposal(s);
  await rows(
    "UPDATE ppo.facilities SET name='SYN changed bay',version=version+1,updated_by=$2,updated_at=clock_timestamp() WHERE id=$1",
    [discoveryFacility, s.p.actor_id],
  );
  const before = await businessSnapshot();
  await assert.rejects(
    changeDiscoveryWorkspace(s.p, s.input.id, input),
    code("DiscoveryContextChanged"),
  );
  assert.deepEqual(await businessSnapshot(), before);
  const old = await readDiscoveryRevision(s.p, s.input.id, s.input.revision_id);
  assert.equal(old.observed_context!.facilities[0].name, "SYN irrigation bay");
  await changeDiscoveryWorkspace(s.p, s.input.id, await proposal(s));
  assert.equal(
    (await readDiscoveryWorkspace(s.p, s.input.id)).options[0].revision
      .observed_context!.facilities[0].name,
    "SYN changed bay",
  );
});
test("E2 receipt, audit and outbox failures roll back the entire option graph", async () => {
  const s = await saved(),
    input = await proposal(s, "Branch");
  for (const table of ["audit_events", "operation_receipts", "outbox_jobs"]) {
    const before = await businessSnapshot();
    await rows(
      `CREATE FUNCTION ppo.test_reject_e2() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.operation_id='${input.operation_id}'::uuid THEN RAISE EXCEPTION 'SYN injected transaction failure'; END IF; RETURN NEW; END $$`,
    );
    await rows(
      `CREATE TRIGGER test_reject_e2 BEFORE INSERT ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.test_reject_e2()`,
    );
    try {
      await assert.rejects(
        changeDiscoveryWorkspace(s.p, s.input.id, input),
        code("P0001"),
      );
    } finally {
      await rows(`DROP TRIGGER test_reject_e2 ON ppo.${table}`);
      await rows("DROP FUNCTION ppo.test_reject_e2()");
    }
    assert.deepEqual(await businessSnapshot(), before);
  }
  await changeDiscoveryWorkspace(s.p, s.input.id, input);
  assert.equal(
    (await readDiscoveryWorkspace(s.p, s.input.id)).options.length,
    2,
  );
});
test("E2 migration formalises exact E1 identities and preserves every accepted cost, quote, receipt and stored original", async () => {
  await rows(
    await readFile(
      new URL("../../db/migrations/0001-recover.sql", import.meta.url),
      "utf8",
    ),
  );
  await rows("DROP TABLE public.ppo_migrations");
  await migrate(25);
  await seed(25);
  const p = (await createSession("coordinator")).principal,
    o = crmCreate();
  await createOpportunity(p, o);
  const input = estimateInput(o.id),
    accepted = await createEstimate(p, input),
    e = await readEstimate(p, input.id),
    quote = quoteCommand(e.saved);
  await prepareQuote(p, e.id, quote);
  await runQuoteJob((await readQuoteJob(p, quote.id)).j.id);
  const bytes = await draftBytes(p, quote.id);
  const tables = [
    "estimates",
    "estimate_versions",
    "draft_quotes",
    "draft_quote_revisions",
    "estimate_quote_jobs",
    "estimate_quote_attempts",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
    "opportunities",
    "permission_grants",
  ];
  const capture = () =>
    Promise.all(
      tables.map((t) =>
        rows(`SELECT to_jsonb(r) v FROM ppo.${t} r ORDER BY to_jsonb(r)::text`),
      ),
    );
  const originals = await capture(),
    ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  await migrate();
  await seed();
  await seed();
  assert.deepEqual(await capture(), originals);
  assert.deepEqual(
    await rows(
      "SELECT * FROM public.ppo_migrations WHERE version<=25 ORDER BY version",
    ),
    ledger,
  );
  const g = (
      await rows(
        "SELECT id FROM ppo.estimating_workspaces WHERE legacy_estimate_id=$1",
        [e.id],
      )
    )[0],
    v = await readDiscoveryWorkspace(p, g.id);
  assert.equal(v.options[0].option.id, e.option_id);
  assert.equal(v.options[0].revision.id, e.estimation_revision_id);
  assert.equal(v.options[0].revision.kind, "LegacyManual");
  assert.equal(v.options[0].revision.input, null);
  assert.equal(
    v.options[0].revision.legacy_source_created_at!.getTime(),
    e.created_at.getTime(),
  );
  assert.deepEqual((await createEstimate(p, input)).receipt, accepted.receipt);
  assert.deepEqual(
    await readOperation(p, input.operation_id),
    accepted.receipt,
  );
  assert.deepEqual(await draftBytes(p, quote.id), bytes);
  const s = { p, input: { id: g.id } },
    branch = await proposal(s, "Branch");
  await changeDiscoveryWorkspace(p, g.id, branch);
  await changeDiscoveryOption(
    p,
    g.id,
    await action(s, branch.new_option_id!, "Select"),
  );
  await changeDiscoveryOption(p, g.id, await action(s, e.option_id, "Archive"));
  await assert.rejects(
    saveEstimate(p, e.id, {
      ...crmBase(),
      expected_version: 1,
      title: input.title,
      scope: input.scope,
      lines: input.lines,
      policy: input.policy,
    }),
    code("OptionArchived"),
  );
  await assert.rejects(
    prepareQuote(p, e.id, {
      ...quote,
      ...crmBase(),
      id: randomUUID(),
      expected_quote_version: 1,
    }),
    code("OptionArchived"),
  );
  await retryQuote(p, quote.id);
  await closeDatabase();
  assert.deepEqual(await draftBytes(p, quote.id), bytes);
  assert.deepEqual((await createEstimate(p, input)).receipt, accepted.receipt);
  assert.deepEqual((await readEstimate(p, e.id)).saved, e.saved);
});
test("E2 constraints refuse forged selection, related membership, history mutation and an eleventh retained option", async () => {
  const s = await saved();
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "UPDATE ppo.estimating_workspaces SET version=version+1,selected_option_id=$2 WHERE id=$1",
        [s.input.id, randomUUID()],
      );
    }),
    code("23503"),
  );
  const r = s.view.options[0].revision;
  await assert.rejects(
    rows(
      "INSERT INTO ppo.estimating_scope_facilities(workspace_id,company_id,site_id,scope_snapshot_id,facility_id) VALUES($1,$2,$3,$4,$5)",
      [CRM.workspace, CRM.company, CRM.site, r.scope_snapshot_id, randomUUID()],
    ),
    code("23503"),
  );
  await assert.rejects(
    rows(
      "UPDATE ppo.estimating_workspaces SET owner_id=$2,version=version+1 WHERE id=$1",
      [s.input.id, randomUUID()],
    ),
    code("55000"),
  );
  for (let i = 1; i < 10; i++)
    await changeDiscoveryWorkspace(s.p, s.input.id, {
      ...(await proposal(s, "Branch")),
      label: String.fromCharCode(65 + i),
    });
  const before = await businessSnapshot(),
    eleventh = await proposal(s, "Branch");
  await assert.rejects(
    changeDiscoveryWorkspace(s.p, s.input.id, eleventh),
    code("EstimatingOptionLimit"),
  );
  assert.deepEqual(await businessSnapshot(), before);
  const persisted = await readDiscoveryWorkspace(s.p, s.input.id);
  await closeDatabase();
  assert.deepEqual(await readDiscoveryWorkspace(s.p, s.input.id), persisted);
});

test("E2 recovery rechecks edit access to the exact original selected Site even after another option is selected", async () => {
  const s = await setup(),
    site2 = "70000000-0000-4000-8000-000000000002";
  await rows(
    "INSERT INTO ppo.site_parties(id,workspace_id,created_by,updated_by,company_id,site_id,organisation_id,role,valid_from) VALUES($1,$2,$3,$3,$4,$5,$6,'Operator','2026-01-01')",
    [randomUUID(), CRM.workspace, s.p.actor_id, CRM.company, site2, CRM.org],
  );
  s.input.discovery.scope = {
    ...s.input.discovery.scope,
    site_id: site2,
    facility_ids: [],
    equipment_ids: [],
    systems: [{ tag: "ProductSupply", facility_ids: [] }],
  };
  const preview = await previewDiscoveryCreate(s.p, {
    opportunity_id: s.o.id,
    discovery: s.input.discovery,
  });
  s.input.context_hash = preview.context_hash;
  await createDiscoveryWorkspace(s.p, s.input);
  const branch = await proposal(s, "Branch");
  await changeDiscoveryWorkspace(s.p, s.input.id, branch);
  await changeDiscoveryOption(
    s.p,
    s.input.id,
    await action(s, branch.new_option_id!, "Select"),
  );
  await changeDiscoveryOption(
    s.p,
    s.input.id,
    await action(s, s.input.option_id, "Archive"),
  );
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.edit'",
    [s.p.actor_id],
  );
  await rows(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,valid_from) VALUES($1,$2,$3,'estimating.edit','Site',$4,'2026-01-01')",
    [CRM.workspace, s.p.actor_id, CRM.company, CRM.site],
  );
  assert.equal(
    (await readDiscoveryWorkspace(s.p, s.input.id)).workspace
      .selected_option_id,
    branch.new_option_id,
  );
  assert.equal(
    (await readDiscoveryRevision(s.p, s.input.id, s.input.revision_id)).site_id,
    site2,
  );
  await assert.rejects(
    readOperation(s.p, s.input.operation_id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    createDiscoveryWorkspace(s.p, s.input),
    code("RecordUnavailable"),
  );
  // The current selected option's own receipt still uses its own source. A
  // branch receipt additionally discloses the original Site and is held too.
  await assert.rejects(
    readOperation(s.p, branch.operation_id),
    code("RecordUnavailable"),
  );
});

test("E2 application and SQL guards hold unsupported states anywhere in the group while ordinary render Pending remains editable", async () => {
  const s = await setup(),
    input = estimateInput(s.o.id);
  await createEstimate(s.p, input);
  const e = await readEstimate(s.p, input.id),
    q = quoteCommand(e.saved);
  await prepareQuote(s.p, e.id, q);
  const g = (
      await rows(
        "SELECT id FROM ppo.estimating_workspaces WHERE legacy_estimate_id=$1",
        [e.id],
      )
    )[0],
    qrow = (await readQuoteJob(s.p, q.id)).q;
  await transaction(async (c) =>
    requireDraftGroup(c, s.p, await workspaceAuthority(c, s.p, g.id, true)),
  );
  const before = await businessSnapshot();
  for (const [table, id] of [
    ["estimating_workspaces", g.id],
    ["estimates", e.id],
    ["draft_quotes", qrow.quote_id],
    ["draft_quote_revisions", q.id],
  ]) {
    const c = await database().connect();
    try {
      await c.query("BEGIN");
      // Isolated future-state fixture; all constraint/trigger changes and the
      // unsupported row are rolled back on this connection before release.
      const constraints = (
        await c.query<{ conname: string }>(
          "SELECT conname FROM pg_constraint WHERE conrelid=$1::regclass AND contype='c' AND conkey @> ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid=$1::regclass AND attname='state')]::smallint[]",
          [`ppo.${table}`],
        )
      ).rows;
      for (const constraint of constraints) {
        assert.match(constraint.conname, /^[a-z_0-9]+$/);
        await c.query(
          `ALTER TABLE ppo.${table} DROP CONSTRAINT ${constraint.conname}`,
        );
      }
      await c.query(`ALTER TABLE ppo.${table} DISABLE TRIGGER USER`);
      await c.query(
        `UPDATE ppo.${table} SET state='FutureUnsupported' WHERE id=$1`,
        [id],
      );
      await c.query(`ALTER TABLE ppo.${table} ENABLE TRIGGER USER`);
      await assert.rejects(
        requireDraftGroup(c, s.p, await workspaceAuthority(c, s.p, g.id, true)),
        code("EstimatingGroupHeld"),
      );
      await assert.rejects(
        c.query("SELECT ppo.assert_estimating_group_draft($1)", [g.id]),
        code("55000"),
      );
    } finally {
      await c.query("ROLLBACK");
      c.release();
    }
  }
  assert.deepEqual(await businessSnapshot(), before);
});
