import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import {
  previewNativeImport,
  confirmNativeImport,
} from "../../src/estimating/fertigation/import-service";
import { exportScope } from "../../src/estimating/fertigation/artifacts";
import { readScope } from "../../src/estimating/fertigation/reads";
import { readOperation } from "../../src/shared/receipts";
import { fertigationFixture, fertigationBase } from "../helpers/fertigation";
import { discoveryFacility } from "../helpers/estimating-discovery";
import { legacyProject, legacyRecord } from "../helpers/fertigation-legacy";
import {
  blankScope,
  blankValve,
} from "../../src/estimating/fertigation/definition";
import { valveCsv } from "../../src/estimating/fertigation/output";
import { proposedPlacement } from "../../src/estimating/fertigation/import-placement";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const code = (expected: string) => (e: unknown) =>
  (e as { code?: string }).code === expected;
async function proposal(f: Awaited<ReturnType<typeof fertigationFixture>>) {
  return {
    id: randomUUID(),
    name: "SYN imported native study",
    estimating_workspace_id: f.workspaceId,
    option_id: f.optionId,
    revision_id: f.revisionId,
    expected_workspace_version: 1,
    coverage: f.create.coverage,
    raw_json: (
      await exportScope(f.p, f.create.id, f.detail.revision.id, "json")
    ).body,
  };
}
test("FN-T42/T43/T44/T86 native export import is atomic, remaps valve/master IDs, replays once and retains unverified provenance", async () => {
  const f = await fertigationFixture(),
    input = await proposal(f),
    before = (
      await database().query(
        "SELECT to_jsonb(r) AS row FROM ppo.estimation_revisions r WHERE id=$1",
        [f.revisionId],
      )
    ).rows;
  const preview = await previewNativeImport(f.p, "", input);
  assert.equal(preview.held, false);
  assert.equal(preview.provenance.synthetic_origin, true);
  const command = {
    ...input,
    ...fertigationBase(),
    proposal_signature: preview.proposal_signature,
  };
  const accepted = await confirmNativeImport(f.p, "", command);
  assert.equal((await confirmNativeImport(f.p, "", command)).replayed, true);
  assert.deepEqual(
    await readOperation(f.p, command.operation_id),
    accepted.receipt,
  );
  const exact = await readScope(f.p, input.id);
  assert.notEqual(
    exact.revision.proposal.valves[0].id,
    f.proposal.valves[0].id,
  );
  assert.equal(
    exact.revision.proposal.valves[0].master_id,
    exact.revision.proposal.masters[0].id,
  );
  assert.equal(
    exact.revision.proposal.valves[0].label,
    f.proposal.valves[0].label,
  );
  assert.equal(exact.calculation.connected_flow_m3h.value, 2.5);
  assert.deepEqual(
    (
      await database().query(
        "SELECT to_jsonb(r) AS row FROM ppo.estimation_revisions r WHERE id=$1",
        [f.revisionId],
      )
    ).rows,
    before,
  );
  const provenance = (
    await database().query(
      "SELECT * FROM ppo.fertigation_imports WHERE scope_id=$1",
      [input.id],
    )
  ).rows;
  assert.equal(provenance.length, 1);
  assert.equal(provenance[0].source_hash, preview.source_hash);
  assert.equal(provenance[0].created_by, f.p.actor_id);
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::integer AS n FROM ppo.fertigation_reviews WHERE scope_id=$1",
        [input.id],
      )
    ).rows[0].n,
    0,
  );
  await assert.rejects(
    confirmNativeImport(f.p, "", {
      ...command,
      name: "Changed accepted intent",
    }),
    code("OperationConflict"),
  );
  const roundtrip = {
      ...input,
      id: randomUUID(),
      raw_json: (await exportScope(f.p, input.id, exact.revision.id, "json"))
        .body,
    },
    next = await previewNativeImport(f.p, "", roundtrip);
  assert.equal(next.held, false);
  assert.equal(
    next.provenance.inherited_sources[0].source_hash,
    preview.source_hash,
  );
  assert.notEqual(
    next.scope.valves[0].id,
    exact.revision.proposal.valves[0].id,
  );
});
test("FN-T08/T41/T42 imports reject foreign authority, stale previews, unsafe identity fields and attachment losses without any saved scope", async () => {
  const f = await fertigationFixture(),
    input = await proposal(f),
    preview = await previewNativeImport(f.p, "", input),
    command = {
      ...input,
      ...fertigationBase(),
      proposal_signature: preview.proposal_signature,
    };
  const foreign = (await createSession("second-company")).principal;
  await assert.rejects(
    previewNativeImport(foreign, "", input),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    confirmNativeImport(foreign, "", command),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    confirmNativeImport(f.p, "", { ...command, name: "Changed after preview" }),
    code("FertigationImportPreviewChanged"),
  );
  await assert.rejects(
    confirmNativeImport(f.p, "", { ...command, approved: true }),
    code("InvalidData"),
  );
  await assert.rejects(
    previewNativeImport(f.p, "", {
      ...input,
      raw_json: '{"format":"x","format":"y"}',
    }),
    code("InvalidFertigationImport"),
  );
  const portable = JSON.parse(input.raw_json);
  portable.scope.evidence = [
    {
      id: randomUUID(),
      label: "Foreign prepared attachment",
      kind: "document_reference",
      reference: `ppo-file:${randomUUID()}`,
      source_revision: "r01",
      sha256: "a".repeat(64),
      captured_date: null,
      attribution: "Unverified supplied file",
      applicability: "Not transferred",
      notes: "",
    },
  ];
  const heldInput = { ...input, raw_json: JSON.stringify(portable) },
    held = await previewNativeImport(f.p, "", heldInput);
  assert.equal(held.held, true);
  assert.ok(held.losses.some((l) => l.path.endsWith(".reference")));
  await assert.rejects(
    confirmNativeImport(f.p, "", {
      ...heldInput,
      ...fertigationBase(),
      proposal_signature: held.proposal_signature,
    }),
    code("HeldFertigationImport"),
  );
  await database().query(
    "UPDATE ppo.facilities SET version=version+1 WHERE id=$1",
    [discoveryFacility],
  );
  await assert.rejects(
    confirmNativeImport(f.p, "", command),
    code("FertigationImportPreviewChanged"),
  );
  assert.equal(
    (
      await database().query(
        "SELECT 1 FROM ppo.fertigation_scopes WHERE id=$1",
        [input.id],
      )
    ).rowCount,
    0,
  );
  assert.equal(
    (
      await database().query(
        "SELECT 1 FROM ppo.operation_receipts WHERE operation_id=$1",
        [command.operation_id],
      )
    ).rowCount,
    0,
  );
});

test("FN-T40/T41/T42 strict standalone schema1/2 and bounded CSV confirm new drafts atomically with immutable unverified provenance", async () => {
  const f = await fertigationFixture();
  const csvScope = blankScope();
  csvScope.valves = [
    {
      ...blankValve(randomUUID()),
      label: "SYN CSV measured zero",
      phase: "proposed",
      flow_basis: "measured",
      measured_flow_m3h: 0,
    },
    {
      ...blankValve(randomUUID()),
      label: "SYN CSV design",
      phase: "proposed",
      flow_basis: "design_allowance",
      design_flow_m3h: 2.5,
    },
  ];
  const inputs: { raw: string; schema: string }[] = [
    { raw: valveCsv(csvScope), schema: "native_valves_csv_r01" },
  ];
  for (const schema of [1, 2] as const) {
    const legacy = legacyProject(schema);
    legacy.sources = [
      legacyRecord(
        "sources",
        { id: "s-1", name: "SYN source", phase: "Proposed" },
        schema,
      ),
    ];
    legacy.mainlines = [
      legacyRecord(
        "mainlines",
        { id: "m-1", name: "SYN master", phase: "Proposed", source_id: "s-1" },
        schema,
      ),
    ];
    legacy.valves = [
      legacyRecord(
        "valves",
        {
          id: "v-1",
          name: "SYN legacy valve",
          phase: "Proposed",
          mainline_id: "m-1",
          flow_basis: "Design allowance",
          design_flow_m3h: 2.5,
        },
        schema,
      ),
    ];
    inputs.push({
      raw: JSON.stringify(legacy),
      schema: `standalone_${schema}`,
    });
  }
  for (const source of inputs) {
    const input = {
      ...(await proposal(f)),
      id: randomUUID(),
      name: `SYN ${source.schema} import`,
      raw_json: source.raw,
    };
    const preview = await previewNativeImport(f.p, "", input);
    assert.equal(preview.held, false);
    assert.equal(preview.source_schema, source.schema);
    const command = {
      ...input,
      ...fertigationBase(),
      proposal_signature: preview.proposal_signature,
    };
    await confirmNativeImport(f.p, "", command);
    assert.equal((await confirmNativeImport(f.p, "", command)).replayed, true);
    const exact = await readScope(f.p, input.id);
    assert.equal(exact.revision.version, 1);
    assert.equal(exact.calculation.connected_flow_m3h.value, 2.5);
    assert.equal(
      exact.revision.proposal.valves[0].id,
      preview.scope.valves[0].id,
    );
    if (source.schema === "native_valves_csv_r01")
      assert.equal(exact.revision.proposal.valves[0].measured_flow_m3h, 0);
    else
      assert.equal(
        exact.revision.proposal.valves[0].master_id,
        exact.revision.proposal.masters[0].id,
      );
    const rows = (
      await database().query(
        "SELECT source_schema, source_hash, provenance FROM ppo.fertigation_imports WHERE scope_id=$1",
        [input.id],
      )
    ).rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].source_schema, source.schema);
    assert.equal(rows[0].source_hash, preview.source_hash);
    assert.equal(rows[0].provenance.historical_reviews, "none");
    assert.equal(
      (
        await database().query(
          "SELECT count(*)::integer AS n FROM ppo.fertigation_reviews WHERE scope_id=$1",
          [input.id],
        )
      ).rows[0].n,
      0,
    );
  }
  const heldSource = legacyProject(2);
  heldSource.activity = [
    { action: "Unverified legacy edit", date: "2026-09-22", revision: 3 },
  ];
  const heldInput = {
      ...(await proposal(f)),
      id: randomUUID(),
      raw_json: JSON.stringify(heldSource),
    },
    held = await previewNativeImport(f.p, "", heldInput);
  assert.equal(held.held, true);
  const heldCommand = {
    ...heldInput,
    ...fertigationBase(),
    proposal_signature: held.proposal_signature,
  };
  await assert.rejects(
    confirmNativeImport(f.p, "", heldCommand),
    code("HeldFertigationImport"),
  );
  assert.equal(
    (
      await database().query(
        "SELECT 1 FROM ppo.fertigation_scopes WHERE id=$1",
        [heldInput.id],
      )
    ).rowCount,
    0,
  );
  assert.equal(
    (
      await database().query(
        "SELECT 1 FROM ppo.operation_receipts WHERE operation_id=$1",
        [heldCommand.operation_id],
      )
    ).rowCount,
    0,
  );
});
test("FN-T111 a genuine r02 project imports once every held field is placed, and the placements are retained with the import", async () => {
  const f = await fertigationFixture();
  const input = {
    ...(await proposal(f)),
    name: "SYN imported r02 sample",
    raw_json: readFileSync(
      "tests/fixtures/fertigation-r02-sample-export.json",
      "utf8",
    ),
  };
  const preview = await previewNativeImport(f.p, "", input);
  assert.equal(preview.held, true);
  const command = {
    ...input,
    ...fertigationBase(),
    proposal_signature: preview.proposal_signature,
  };
  await assert.rejects(
    confirmNativeImport(f.p, "", command),
    code("HeldFertigationImport"),
  );
  const placements = preview.losses.map((l) => ({
    path: l.path,
    disposition: proposedPlacement(l.path),
  }));
  const accepted = await confirmNativeImport(f.p, "", {
    ...command,
    ...fertigationBase(),
    placements,
  });
  const detail = await readScope(f.p, input.id);
  assert.equal(detail.revision.version, 1);
  assert.ok(
    detail.revision.proposal.evidence.some((e) =>
      e.label.startsWith("Legacy r02 source values"),
    ),
  );
  const stored = (
    await database().query<{ provenance: { placements: unknown[] } }>(
      "SELECT provenance FROM ppo.fertigation_imports WHERE scope_id=$1",
      [input.id],
    )
  ).rows[0];
  assert.equal(stored.provenance.placements.length, preview.losses.length);
  assert.ok(accepted);
});
