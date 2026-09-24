import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  basisBlockers,
  sourceBlockers,
  deliverableState,
  sourceIds,
  type ControlRecord,
} from "../../src/engineering/control/model";
import {
  parseContent,
  parseControlCommand,
} from "../../src/engineering/control/validation";
import {
  controlPath,
  controlHref,
} from "../../src/engineering/control/navigation";
import { authority, type Access } from "../../src/engineering/control/context";
import {
  basisContent,
  command,
  saveFields,
} from "../helpers/engineering-control";
import { MATERIALS } from "../helpers/engineering-materials";
test("basis uncertainty is retained and cannot count as checked evidence", () => {
  const source = randomUUID(),
    base = basisContent(source);
  const uncertain = {
    ...base,
    inputs: [
      {
        id: randomUUID(),
        kind: "Question",
        title: "SYN unknown supply",
        owner_id: MATERIALS.author.id,
        due_date: null,
        blocking: true,
        state: "Unknown",
        response: null,
        source_ids: [],
        deliverable_ids: [],
      },
    ],
  };
  const parsed = parseContent("basis", uncertain);
  assert.equal(parsed.inputs[0].state, "Unknown");
  assert.match(basisBlockers(parsed).join(" "), /unknown/);
  assert.equal(basisBlockers(parseContent("basis", base)).length, 0);
  assert.throws(() =>
    parseContent("basis", {
      ...uncertain,
      inputs: [{ ...uncertain.inputs[0], state: "AssumedGood" }],
    }),
  );
});
test("interfaces need distinct named parties, exact sources and both confirmations", () => {
  const source = randomUUID(),
    id = randomUUID(),
    basis = parseContent("basis", {
      ...basisContent(source),
      interfaces: [
        {
          id,
          title: "SYN shared connection",
          provider_id: MATERIALS.author.id,
          receiver_id: MATERIALS.engineer.id,
          required_input: "SYN input",
          expected_output: "SYN output",
          criterion: "SYN criterion",
          source_ids: [source],
        },
      ],
    });
  assert.equal(basisBlockers(basis).length, 1);
  assert.equal(
    basisBlockers(basis, new Set([`${id}:${MATERIALS.author.id}`])).length,
    1,
  );
  assert.equal(
    basisBlockers(
      basis,
      new Set([
        `${id}:${MATERIALS.author.id}`,
        `${id}:${MATERIALS.engineer.id}`,
      ]),
    ).length,
    0,
  );
  assert.throws(() =>
    parseContent("basis", {
      ...basis,
      interfaces: [basis.interfaces[0], basis.interfaces[0]],
    }),
  );
});
test("calculation references require versioned check evidence, never an invented result", () => {
  const source = randomUUID(),
    basis = parseContent("basis", {
      ...basisContent(source),
      calculations: [
        {
          id: randomUUID(),
          title: "SYN retained model",
          model_reference: "SYN-PPO native model",
          model_version: "7.2",
          check_evidence: null,
          source_ids: [source],
        },
      ],
    });
  assert.match(basisBlockers(basis).join(" "), /check evidence/);
  assert.deepEqual(sourceIds(basis), [source]);
  assert.ok(sourceBlockers([source], []).length);
});
test("formal answer cannot be injected by a draft save, and server-built submissions reject client content", () => {
  const source = randomUUID(),
    q = {
      schema_version: 1,
      source_ids: [source],
      question: "SYN question",
      deliverable_ids: [],
      change_id: null,
      review_required: true,
    };
  assert.equal(parseContent("query", q).response, null);
  assert.throws(() =>
    parseContent("query", { ...q, response: "SYN fabricated" }),
  );
  assert.throws(() => parseContent("review", {}));
  assert.throws(() =>
    parseControlCommand(
      command({
        ...saveFields("basis", basisContent(source)),
        approval: "Reviewed",
      }),
    ),
  );
  assert.throws(() =>
    parseControlCommand(
      command({
        kind: "review",
        action: "decide_review",
        id: randomUUID(),
        expected_version: 0,
        outcome: "Reviewed",
        rationale: "SYN",
      }),
    ),
  );
});
test("effort stays unknown without governed sources, and coordination state cannot establish release", () => {
  const c = {
    schema_version: 1,
    source_ids: [],
    discipline: "Hydraulics",
    document_id: null,
    prerequisite: "SYN input",
    prerequisite_evidence: null,
    next_action: "Obtain owned evidence",
    planned_hours: null,
    authorised_hours: null,
    effort_source: null,
    authorisation_reference: null,
  };
  const content = parseContent("deliverable", c);
  assert.equal(content.planned_hours, null);
  assert.throws(() =>
    parseContent("deliverable", { ...c, planned_hours: "40" }),
  );
  assert.equal(
    deliverableState(
      { content, state: "Planned" } as ControlRecord<"deliverable">,
      false,
    ),
    "Blocked — prerequisite evidence needed",
  );
  assert.equal(
    deliverableState(
      { content, state: "Planned" } as ControlRecord<"deliverable">,
      true,
    ),
    "Released",
  );
});
test("purpose-specific authority fails closed without a policy or matching duty/discipline", () => {
  const actor = randomUUID(),
    principal = {
      actor_id: actor,
      workspace_id: randomUUID(),
      display_name: "SYN reviewer",
    };
  const access = {
    pkg: { discipline: "Hydraulics" },
    can: { review: true },
    policy: null,
  } as unknown as Access;
  assert.throws(
    () => authority(access, principal, "review", "DesignPreparation"),
    /not configured/,
  );
  const allowed = {
    ...access,
    policy: {
      id: randomUUID(),
      policy_version: 1,
      independent_review: true,
      independent_issue: true,
      grants: [
        {
          actor_id: actor,
          duty: "review" as const,
          purposes: ["DesignPreparation" as const],
          disciplines: ["Hydraulics"],
        },
      ],
    },
  };
  authority(allowed, principal, "review", "DesignPreparation");
  assert.throws(() =>
    authority(allowed, principal, "review", "TechnicalReleaseForProcurement"),
  );
  assert.throws(() =>
    authority(
      { ...allowed, pkg: { ...allowed.pkg, discipline: "Electrical" } },
      principal,
      "review",
      "DesignPreparation",
    ),
  );
});
test("native routes retain six basis views and contextual query navigation", () => {
  const id = randomUUID();
  for (const view of [
    "basis",
    "requirements",
    "assumptions",
    "interfaces",
    "sources",
    "review",
  ]) {
    const path = controlHref(id, "basis", view);
    assert.equal(controlPath(path)?.view, view);
  }
  assert.equal(controlPath("/engineering/queries")?.packageId, null);
  assert.equal(
    controlPath(`/engineering/${id}/queries/submittals`)?.view,
    "submittals",
  );
  assert.equal(controlPath(`/engineering/${id}/basis/invented`), undefined);
});
