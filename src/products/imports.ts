import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { sharedOperation } from "../platform/operations";
import {
  hasPermission,
  requireCapability,
  scopeSql,
  type QueryClient,
} from "../platform/permissions";
import {
  common,
  commonKeys,
  choice,
  instant,
  invalid,
  label,
  object,
  optionalId,
  uuid,
  version,
} from "../shared/validation";
import { createInput, insertProduct, successor } from "./commands";
import {
  expectVersion,
  productAuthority,
  productContext,
  productRevision,
} from "./context";
import {
  boundedArray,
  compareContent,
  hash,
  productContent,
  type Content,
  type Product,
  type ProductCapability,
} from "./model";

export const importFormat = "PPO synthetic catalogue 1";
export type ImportBatch = {
  id: string;
  workspace_id: string;
  company_id: string;
  filename: string;
  source_description: string;
  provider: string;
  source_time: Date | null;
  content_hash: string;
  raw_content: string;
  version: number;
  state: "Staged" | "Mapped" | "Reviewed" | "Returned" | "Applied";
  current_plan_id: string | null;
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
};
export type Mapping = {
  row_number: number;
  action: "Resolve" | "New" | "Exclude";
  target_id: string | null;
  reason: string;
};
export type ImportRow = {
  row_number: number;
  raw: unknown;
  external_key: string | null;
  mapping: Mapping | null;
  errors: string[];
  warnings: string[];
  duplicate_candidates: {
    id: string;
    reference: string;
    model: string;
    variant: string;
  }[];
  target_id: string | null;
  target_revision_id: string | null;
  expected_version: number | null;
  proposed_id: string;
  parsed: Content | null;
  before: Content | null;
  changes: ReturnType<typeof compareContent>;
  create: ReturnType<typeof createInput> | null;
};
export function parseImport(raw: unknown) {
  if (typeof raw !== "string" || Buffer.byteLength(raw) > 12000)
    invalid(
      "raw_content",
      "Use a bounded synthetic JSON file up to 12,000 bytes.",
    );
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    invalid("raw_content", "The synthetic source is not valid JSON.");
  }
  const b = object(value, ["format", "rows"]);
  if (b.format !== importFormat)
    invalid(
      "format",
      `Only ${importFormat} is configured; production formats are not configured.`,
    );
  const rows = boundedArray(b.rows, "rows", 50);
  if (!rows.length) invalid("rows", "Stage at least one source row.");
  return rows;
}
async function context(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: ProductCapability = "products.read",
) {
  const row = (
    await c.query<ImportBatch>(
      "SELECT * FROM ppo.product_imports WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "batch_id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  await productAuthority(c, p, row.company_id, cap);
  if (
    cap === "products.read" &&
    !(await hasPermission(c, p, "products.import.stage", row.company_id)) &&
    !(await hasPermission(c, p, "products.import.review", row.company_id)) &&
    !(await hasPermission(c, p, "products.import.apply", row.company_id))
  )
    throw unavailable();
  return row;
}
async function event(
  c: PoolClient,
  p: Principal,
  row: ImportBatch,
  input: ReturnType<typeof common>,
  result: unknown = null,
) {
  await c.query(
    "INSERT INTO ppo.product_import_events(id,workspace_id,batch_id,plan_id,batch_version,action,reason,operation_id,created_by,result) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
    [
      randomUUID(),
      p.workspace_id,
      row.id,
      row.current_plan_id,
      row.version,
      row.state,
      input.reason,
      input.operation_id,
      p.actor_id,
      result === null ? null : JSON.stringify(result),
    ],
  );
  return { ...row, audit_details: { plan_id: row.current_plan_id } };
}
export async function stageImport(p: Principal, value: unknown) {
  const b = object(value, [
    ...commonKeys,
    "id",
    "company_id",
    "filename",
    "source_description",
    "provider",
    "source_time",
    "raw_content",
  ]);
  parseImport(b.raw_content);
  const raw_content = b.raw_content as string;
  const input = {
    ...common(b),
    id: uuid(b.id, "id"),
    company_id: uuid(b.company_id, "company_id"),
    filename: label(b.filename, "filename", 200),
    source_description: label(b.source_description, "source_description", 1000),
    provider: label(b.provider, "provider", 200),
    source_time:
      b.source_time == null ? null : instant(b.source_time, "source_time"),
    raw_content,
    content_hash: createHash("sha256").update(raw_content).digest("hex"),
  };
  return sharedOperation(
    p,
    input,
    "ProductImportStage",
    (c) => productAuthority(c, p, input.company_id, "products.import.stage"),
    async (c) => {
      const prior = (
        await c.query<ImportBatch>(
          "SELECT * FROM ppo.product_imports WHERE workspace_id=$1 AND company_id=$2 AND provider=$3 AND content_hash=$4",
          [
            p.workspace_id,
            input.company_id,
            input.provider,
            input.content_hash,
          ],
        )
      ).rows[0];
      if (prior)
        throw new AppError(
          409,
          "ImportAlreadyStaged",
          `This exact source is already staged as batch ${prior.id}. Open that batch and recover its original operation.`,
        );
      const row = (
        await c.query<ImportBatch>(
          "INSERT INTO ppo.product_imports(id,workspace_id,company_id,filename,source_description,provider,source_time,content_hash,raw_content,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING *",
          [
            input.id,
            p.workspace_id,
            input.company_id,
            input.filename,
            input.source_description,
            input.provider,
            input.source_time,
            input.content_hash,
            raw_content,
            p.actor_id,
          ],
        )
      ).rows[0];
      return event(c, p, row, input);
    },
    "ProductImport",
    "ProductImportChanged",
  );
}
function mappings(value: unknown): Mapping[] {
  const rows = boundedArray(value, "mappings", 50).map((v) => {
    const b = object(v, ["row_number", "action", "target_id", "reason"]);
    if (
      !Number.isInteger(b.row_number) ||
      Number(b.row_number) < 1 ||
      Number(b.row_number) > 50
    )
      invalid("row_number", "Select an original source row from 1 to 50.");
    return {
      row_number: Number(b.row_number),
      action: choice(b.action, "action", [
        "Resolve",
        "New",
        "Exclude",
      ] as const),
      target_id: optionalId(b.target_id, "target_id"),
      reason: label(b.reason, "mapping.reason", 1000),
    };
  });
  if (new Set(rows.map((r) => r.row_number)).size !== rows.length)
    invalid("mappings", "Map each original row only once.");
  return rows;
}
// All candidate matching stays inside the batch company/provider. Name matches
// are evidence for a human disposition, never an automatic merge.
async function planRows(
  c: QueryClient,
  p: Principal,
  batch: ImportBatch,
  decisions: Mapping[],
) {
  const rawRows = parseImport(batch.raw_content);
  if (decisions.some((m) => m.row_number > rawRows.length))
    invalid("mappings", "Mapping refers to a row outside the staged source.");
  const products = (
    await c.query<Product & { content: Content }>(
      "SELECT p.*,r.content FROM ppo.products p JOIN ppo.product_revisions r ON (r.workspace_id,r.id)=(p.workspace_id,p.current_revision_id) WHERE p.workspace_id=$1 AND p.company_id=$2",
      [p.workspace_id, batch.company_id],
    )
  ).rows;
  const rows: ImportRow[] = [];
  for (const [index, raw] of rawRows.entries()) {
    const decision = decisions.find((m) => m.row_number === index + 1) ?? null;
    const row: ImportRow = {
      row_number: index + 1,
      raw,
      external_key: null,
      mapping: decision,
      errors: [],
      warnings: [],
      duplicate_candidates: [],
      target_id: null,
      target_revision_id: null,
      expected_version: null,
      proposed_id: randomUUID(),
      parsed: null,
      before: null,
      changes: [],
      create: null,
    };
    rows.push(row);
    if (decision?.action === "Exclude") {
      row.warnings.push(
        "Explicitly excluded; raw evidence retained. No product change.",
      );
      continue;
    }
    try {
      const b = object(raw, [
        "external_key",
        "company_id",
        "provider",
        "kind",
        "parent_id",
        "reference",
        "content",
      ]);
      row.external_key = label(b.external_key, "external_key", 200);
      if (
        (b.company_id && b.company_id !== batch.company_id) ||
        (b.provider && b.provider !== batch.provider)
      )
        row.errors.push("Conflicting provider/company/entity context.");
      row.parsed = productContent(b.content);
      if (!decision)
        row.errors.push(
          "Unresolved mapping: explicitly select exact identity or New, or exclude with a reason.",
        );
      const exact = products.filter(
        (r) =>
          r.provider === batch.provider && r.entity_key === row.external_key,
      );
      const similar = products.filter(
        (r) =>
          r.content.title.toLocaleLowerCase() ===
            row.parsed!.title.toLocaleLowerCase() ||
          r.content.model.toLocaleLowerCase() ===
            row.parsed!.model.toLocaleLowerCase(),
      );
      row.duplicate_candidates = similar.map((r) => ({
        id: r.id,
        reference: r.reference,
        model: r.content.model,
        variant: r.content.variant,
      }));
      if (similar.length)
        row.warnings.push(
          "Same/similar name or model: inspect distinct identities. Similarity does not establish interchangeability.",
        );
      const duplicates = rawRows.flatMap((other, n) => {
        if (
          n === index ||
          decisions.find((m) => m.row_number === n + 1)?.action === "Exclude"
        )
          return [];
        const k =
          other && typeof other === "object" && "external_key" in other
            ? other.external_key
            : null;
        return k === row.external_key ? [n + 1] : [];
      });
      if (duplicates.length)
        row.errors.push(
          `Duplicate external key/rows: ${duplicates.join(", ")}. Exclude duplicate evidence before application.`,
        );
      if (decision?.action === "Resolve") {
        const target = products.find((r) => r.id === decision.target_id);
        if (!target || exact.length !== 1 || exact[0].id !== target.id)
          row.errors.push(
            "Unknown or ambiguous external key: no automatic merge or identity reassignment.",
          );
        else {
          row.target_id = target.id;
          row.target_revision_id = target.current_revision_id;
          row.expected_version = target.version;
          row.before = target.content;
          if (target.state === "Submitted")
            row.errors.push("Target has a submitted revision in review.");
          if (
            b.kind !== target.kind ||
            (b.parent_id ?? null) !== target.parent_id
          )
            row.errors.push("Conflicting family/model/variant identity.");
          if (target.published_revision_id)
            row.warnings.push(
              "Published content is immutable: application creates an unpublished draft successor.",
            );
        }
      } else if (decision?.action === "New") {
        if (exact.length)
          row.errors.push(
            "External key already exists. Resolve the exact existing identity; do not create a duplicate.",
          );
        row.create = createInput({
          schema_version: 1,
          operation_id: randomUUID(),
          reason: decision.reason,
          id: row.proposed_id,
          company_id: batch.company_id,
          provider: batch.provider,
          entity_key: row.external_key,
          reference: b.reference,
          kind: b.kind,
          parent_id: b.parent_id ?? null,
          content: row.parsed,
        });
        if (row.create.parent_id) {
          const parent = products.find((r) => r.id === row.create!.parent_id);
          if (
            !parent ||
            parent.kind !== (row.create.kind === "Model" ? "Family" : "Model")
          )
            row.errors.push(
              "Missing exact model/family context: choose an existing parent in this company.",
            );
        }
      } else if (!exact.length)
        row.errors.push(
          "Unknown external key; an explicit New disposition is required.",
        );
      row.changes = compareContent(row.before, row.parsed);
      if (row.target_id && !row.changes.length)
        row.errors.push("No content change; exclude the row with a reason.");
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      row.errors.push(
        e.field_errors.length
          ? e.field_errors.map((f) => `${f.field}: ${f.message}`).join("; ")
          : e.message,
      );
    }
  }
  const targets = rows.filter((r) => r.target_id).map((r) => r.target_id);
  for (const row of rows)
    if (
      row.target_id &&
      targets.filter((id) => id === row.target_id).length > 1
    )
      row.errors.push(
        "Multiple source rows target one revision; resolve the conflict.",
      );
  return rows;
}
export async function mapImport(p: Principal, id: string, value: unknown) {
  const b = object(value, [...commonKeys, "expected_version", "mappings"]);
  const input = {
    ...common(b),
    id: uuid(id, "id"),
    expected_version: version(b.expected_version),
    mappings: mappings(b.mappings),
  };
  return sharedOperation(
    p,
    input,
    "ProductImportMap",
    (c) => context(c, p, id, "products.import.stage"),
    async (c, batch) => {
      expectVersion(batch.version, input.expected_version);
      if (!["Staged", "Mapped", "Returned"].includes(batch.state))
        throw new AppError(
          409,
          "ImportFrozen",
          "Reviewed or applied plans cannot be edited.",
        );
      const rows = await planRows(c, p, batch, input.mappings),
        planId = randomUUID();
      await c.query(
        "INSERT INTO ppo.product_import_plans(id,workspace_id,batch_id,predecessor_id,rows,comparison_hash,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          planId,
          p.workspace_id,
          id,
          batch.current_plan_id,
          JSON.stringify(rows),
          hash(rows),
          p.actor_id,
        ],
      );
      const updated = (
        await c.query<ImportBatch>(
          "UPDATE ppo.product_imports SET current_plan_id=$3,state='Mapped',version=version+1,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, id, planId, p.actor_id],
        )
      ).rows[0];
      return event(c, p, updated, input);
    },
    "ProductImport",
    "ProductImportChanged",
  );
}
type Plan = {
  id: string;
  rows: ImportRow[];
  comparison_hash: string;
  created_by: string;
  created_at: Date;
};
async function exactPlan(
  c: QueryClient,
  p: Principal,
  batch: ImportBatch,
  plan_id: string,
  comparison_hash: string,
) {
  if (batch.current_plan_id !== plan_id)
    throw new AppError(
      409,
      "ImportPlanChanged",
      "Choose the exact current comparison plan.",
    );
  const plan = (
    await c.query<Plan>(
      "SELECT * FROM ppo.product_import_plans WHERE workspace_id=$1 AND batch_id=$2 AND id=$3",
      [p.workspace_id, batch.id, plan_id],
    )
  ).rows[0];
  if (
    !plan ||
    plan.comparison_hash !== comparison_hash ||
    hash(plan.rows) !== comparison_hash
  )
    throw new AppError(
      409,
      "ImportPlanChanged",
      "The comparison hash does not match the retained plan.",
    );
  return plan;
}
async function applyPreflight(c: QueryClient, p: Principal, rows: ImportRow[]) {
  if (rows.some((r) => r.errors.length || !r.mapping))
    invalid(
      "rows",
      "Resolve or explicitly exclude every exception before review/application.",
    );
  if (!rows.some((r) => r.mapping?.action !== "Exclude"))
    invalid("rows", "No product changes remain to apply.");
  for (const row of rows)
    if (row.target_id) {
      const target = await productContext(c, p, row.target_id);
      expectVersion(target.version, row.expected_version!);
      const prior = await productRevision(
        c,
        p,
        target,
        row.target_revision_id!,
      );
      if (hash(prior.content) !== hash(row.before))
        throw new AppError(
          409,
          "ImportTargetChanged",
          "Original target content changed.",
        );
    }
}
export async function decideImport(p: Principal, id: string, value: unknown) {
  const b = object(value, [
    ...commonKeys,
    "expected_version",
    "plan_id",
    "comparison_hash",
    "action",
  ]);
  const input = {
    ...common(b),
    id: uuid(id, "id"),
    expected_version: version(b.expected_version),
    plan_id: uuid(b.plan_id, "plan_id"),
    comparison_hash: label(b.comparison_hash, "comparison_hash", 64),
    action: choice(b.action, "action", [
      "Reviewed",
      "Returned",
      "Apply",
    ] as const),
  };
  return sharedOperation(
    p,
    input,
    `ProductImport${input.action}`,
    (c) =>
      context(
        c,
        p,
        id,
        input.action === "Apply"
          ? "products.import.apply"
          : "products.import.review",
      ),
    async (c, batch) => {
      expectVersion(batch.version, input.expected_version);
      const plan = await exactPlan(
        c,
        p,
        batch,
        input.plan_id,
        input.comparison_hash,
      );
      if (batch.state !== (input.action === "Apply" ? "Reviewed" : "Mapped"))
        throw new AppError(
          409,
          "ImportStateChanged",
          "The exact plan is no longer ready for this action.",
        );
      if (input.action !== "Apply" && plan.created_by === p.actor_id)
        throw new AppError(
          403,
          "IndependentReviewRequired",
          "A different explicitly granted actor must review the import plan.",
        );
      if (input.action !== "Returned") await applyPreflight(c, p, plan.rows);
      const results: {
        row_number: number;
        product_id: string;
        revision_id: string;
      }[] = [];
      if (input.action === "Apply")
        for (const row of plan.rows) {
          if (row.mapping?.action === "Exclude") continue;
          const command = {
            ...input,
            reason:
              `${input.reason} — row ${row.row_number}: ${row.mapping!.reason}`.slice(
                0,
                1000,
              ),
          };
          const product = row.target_id
            ? await successor(c, p, await productContext(c, p, row.target_id), {
                ...command,
                expected_version: row.expected_version!,
                content: row.parsed!,
              })
            : await insertProduct(c, p, {
                ...row.create!,
                ...command,
                id: row.proposed_id,
              });
          results.push({
            row_number: row.row_number,
            product_id: product.id,
            revision_id: product.current_revision_id,
          });
        }
      const updated = (
        await c.query<ImportBatch>(
          "UPDATE ppo.product_imports SET state=$3,version=version+1,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [
            p.workspace_id,
            id,
            input.action === "Apply" ? "Applied" : input.action,
            p.actor_id,
          ],
        )
      ).rows[0];
      return event(c, p, updated, input, results);
    },
    "ProductImport",
    "ProductImportChanged",
  );
}
export async function listImports(p: Principal) {
  return transaction(async (c) => {
    await requireCapability(c, p, "products.read");
    const items = (
      await c.query<Omit<ImportBatch, "raw_content">>(
        `SELECT id,workspace_id,company_id,filename,source_description,provider,source_time,content_hash,version,state,current_plan_id,created_by,updated_by,created_at,updated_at FROM ppo.product_imports b WHERE b.workspace_id=$1 AND ${scopeSql("b.company_id", "NULL", "products.read")} AND ${scopeSql("b.company_id", "NULL", "shared.read")} AND (${scopeSql("b.company_id", "NULL", "products.import.stage")} OR ${scopeSql("b.company_id", "NULL", "products.import.review")} OR ${scopeSql("b.company_id", "NULL", "products.import.apply")}) ORDER BY b.created_at DESC LIMIT 100`,
        [p.workspace_id, p.actor_id],
      )
    ).rows;
    return { items, limit: 100, format: importFormat };
  });
}
export async function readImport(p: Principal, id: string) {
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const batch = await context(c, p, id);
    const plans = (
      await c.query<Plan>(
        "SELECT * FROM ppo.product_import_plans WHERE workspace_id=$1 AND batch_id=$2 ORDER BY created_at DESC,id",
        [p.workspace_id, id],
      )
    ).rows;
    const current = plans.find((r) => r.id === batch.current_plan_id) ?? null;
    const rows = current?.rows ?? (await planRows(c, p, batch, []));
    const history = (
      await c.query<{
        id: string;
        action: string;
        plan_id: string | null;
        operation_id: string;
        reason: string;
        created_by: string;
        created_at: Date;
        result:
          | { row_number: number; product_id: string; revision_id: string }[]
          | null;
      }>(
        "SELECT * FROM ppo.product_import_events WHERE workspace_id=$1 AND batch_id=$2 ORDER BY batch_version DESC",
        [p.workspace_id, id],
      )
    ).rows;
    return {
      batch,
      rows,
      plans,
      current,
      history,
      can_map:
        ["Staged", "Mapped", "Returned"].includes(batch.state) &&
        (await hasPermission(c, p, "products.import.stage", batch.company_id)),
      can_review:
        batch.state === "Mapped" &&
        current?.created_by !== p.actor_id &&
        (await hasPermission(c, p, "products.import.review", batch.company_id)),
      can_apply:
        batch.state === "Reviewed" &&
        (await hasPermission(c, p, "products.import.apply", batch.company_id)),
      synthetic: true,
    };
  });
}
