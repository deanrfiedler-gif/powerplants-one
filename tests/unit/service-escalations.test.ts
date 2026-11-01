import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  actionInput,
  allowedAction,
  createCaseInput,
  hashBytes,
  hashValue,
  pastInstant,
  technicalText,
} from "../../src/service/escalations/model";
import { caseActions, caseStates } from "../../src/service/escalations/states";
import {
  evidenceHtml,
  fileInput,
  redactedTechnical,
  type TechnicalEvidence,
} from "../../src/service/escalations/evidence";
const base = () => ({
  schema_version: 1,
  operation_id: randomUUID(),
  reason: "SYN unit proof",
});
const evidence: TechnicalEvidence = {
  schema_version: 1,
  case_reference: "SYN-ESC-000001",
  fault: "Travel fault <script>alert(1)</script>",
  site: "SYN Test Site",
  equipment: {
    reference: "SYN-AST-000001",
    manufacturer: null,
    model: null,
    serial: null,
  },
  configuration: {
    source_id: randomUUID(),
    revision: 1,
    description:
      "Limit 10 mm; contact grower@example.invalid; price AUD 300; phone +61 400 123 456",
    sha256: "a".repeat(64),
  },
  diagnostics: [
    {
      attempted_at: "2026-11-01T00:00:00Z",
      recorded_by: "SYN Technician",
      diagnostic: "Cycle tested",
      result: "Travel stopped at 4 mm",
      source_reference: "SYN-DEF-001",
    },
  ],
  observations: [
    {
      attempt_id: randomUUID(),
      occurred_at: null,
      state: "Submitted",
      readings: [
        {
          check: "Travel",
          value: "4",
          unit: "mm",
          instrument: "SYN-INS-001",
          calibration: "SYN-CAL-001 / 1",
        },
      ],
    },
  ],
  finding: {
    reference: "SYN-DEF-001",
    source: "inspection",
    state: "Open",
    summary: "SYN pressure outside range",
    correction: {
      note: "SYN replaced sensor; contact grower@example.invalid; AUD 200",
      recorded_at: "2026-11-01T00:00:00Z",
    },
  },
  photos: [],
};
test("SV08 lifecycle permits only the accepted next duties and retains terminal cases", () => {
  const permitted: Record<string, string[]> = {
    Diagnosing: [
      "diagnose",
      "photo",
      "capture_configuration",
      "prepare_pack",
      "review_pack",
      "record_sent",
      "withdraw",
    ],
    WaitingOnManufacturer: ["record_reply", "withdraw"],
    ReplyToActOn: ["next_action", "follow_up", "close", "withdraw"],
    Closed: [],
    Withdrawn: [],
  };
  for (const state of caseStates)
    assert.deepEqual(
      caseActions.filter((action) => allowedAction(state, action)),
      permitted[state],
    );
});
test("SV08 opening requires a finding, equipment and owner; command payloads cannot smuggle another action's fields", () => {
  const input = {
    ...base(),
    id: randomUUID(),
    finding_key: `inspection:${randomUUID()}`,
    asset_id: randomUUID(),
    owner_id: randomUUID(),
    fault: "SYN travel fault",
    fault_type: "Travel",
  };
  assert.equal(createCaseInput(input).finding_key, input.finding_key);
  assert.throws(() => createCaseInput({ ...input, finding_key: undefined }));
  assert.throws(() =>
    actionInput({
      ...base(),
      action: "withdraw",
      expected_version: 1,
      outcome: "SYN withdrawn",
      recipient: "support@example.invalid",
    }),
  );
  assert.throws(() =>
    actionInput({ ...base(), action: "record_sent", expected_version: 0 }),
  );
  assert.throws(() =>
    pastInstant(
      "2099-01-01T00:00:00Z",
      "sent_at",
      new Date("2026-11-01T00:00:00Z"),
    ),
  );
});
test("SV08 technical output projects its allowlist, escapes markup and leaves contact and price fields out", () => {
  const input = {
    ...evidence,
    customer: {
      contact_name: "DO-NOT-EXPORT-CUSTOMER",
      email: "hidden@example.invalid",
    },
    prices: { total: "DO-NOT-EXPORT-PRICE" },
    equipment: {
      ...evidence.equipment,
      customer_email: "equipment@example.invalid",
      price: 12345,
    },
  };
  const html = evidenceHtml(input);
  for (const excluded of [
    "DO-NOT-EXPORT",
    "grower@example.invalid",
    "hidden@example.invalid",
    "equipment@example.invalid",
    "AUD 300",
    "+61 400 123 456",
    "<script>alert",
  ])
    assert.ok(!html.includes(excluded), excluded);
  for (const retained of [
    "SYN Test Site",
    "SYN-INS-001",
    "SYN-CAL-001",
    "Travel stopped at 4 mm",
    "&lt;script&gt;",
  ])
    assert.ok(html.includes(retained), retained);
  assert.equal(hashBytes(html), hashBytes(evidenceHtml(input)));
  assert.notEqual(
    hashBytes(html),
    hashBytes(evidenceHtml({ ...input, fault: "Changed fault" })),
  );
  assert.equal(hashValue({ b: 1, a: 2 }), hashValue({ a: 2, b: 1 }));
  assert.equal(redactedTechnical("price $12.00"), "price [price left out]");
  assert.throws(() => technicalText("password=synthetic-secret", "diagnostic"));
  assert.throws(() =>
    technicalText("Email grower@example.invalid", "diagnostic"),
  );
});
test("SV08 attachments retain exact bytes and reject wrong hashes, disguised content and oversized uploads", () => {
  const bytes = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jKx8AAAAASUVORK5CYII=",
      "base64",
    ),
    input = {
      media_type: "image/png",
      content_base64: bytes.toString("base64"),
      sha256: hashBytes(bytes),
    };
  assert.deepEqual(fileInput(input, true).bytes, bytes);
  assert.throws(() => fileInput({ ...input, sha256: "0".repeat(64) }, true));
  assert.throws(() => fileInput({ ...input, media_type: "text/html" }, true));
  const pdf = Buffer.from("%PDF-1.7\nSYN test");
  assert.throws(() =>
    fileInput(
      {
        media_type: "application/pdf",
        content_base64: pdf.toString("base64"),
        sha256: hashBytes(pdf),
      },
      true,
    ),
  );
  assert.throws(() =>
    fileInput(
      { ...input, content_base64: Buffer.alloc(2097153).toString("base64") },
      true,
    ),
  );
});
