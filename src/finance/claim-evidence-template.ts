import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { canonical } from "../platform/operations";
import { digest } from "../documents/store";
import { blocked } from "./context";

export type BaseTemplate = {
  id: string;
  version: number;
  content_hash: string;
  policy_version: number;
};
export const claimRenderer = "PPO-OUT14-CLAIMS-1";
export async function claimEvidenceDefinition(base: BaseTemplate) {
  const paths = [
    "src/finance/claim-evidence-render.ts",
    "src/finance/claim-evidence-source.ts",
    "src/documents/render.ts",
    "src/platform/browser.ts",
    "src/projects/commercial/model.ts",
    "public/brand/Roboto-variable.woff",
    "public/brand/powerplants-logo-green-white.png",
  ];
  const bytes = await Promise.all([
    readFile(join(process.cwd(), "src/finance/claim-evidence-render.ts")),
    readFile(join(process.cwd(), "src/finance/claim-evidence-source.ts")),
    readFile(join(process.cwd(), "src/documents/render.ts")),
    readFile(join(process.cwd(), "src/platform/browser.ts")),
    readFile(join(process.cwd(), "src/projects/commercial/model.ts")),
    readFile(join(process.cwd(), "public/brand/Roboto-variable.woff")),
    readFile(
      join(process.cwd(), "public/brand/powerplants-logo-green-white.png"),
    ),
  ]);
  const lock = JSON.parse(
    await readFile(join(process.cwd(), "package-lock.json"), "utf8"),
  );
  return canonical({
    family: "OUT-14",
    version: 3,
    renderer: claimRenderer,
    base_template: base,
    definition:
      "Fixed internal reconciled monetary claim evidence; whole ProjectClaim or AgreementCharge entitlements; no invoice or customer distribution",
    dependencies: ["playwright", "playwright-core"].map((name) => ({
      name,
      version: lock.packages[`node_modules/${name}`].version,
    })),
    sources: paths.map((path, i) => ({
      path,
      sha256: digest(bytes[i]),
      byte_count: bytes[i].length,
    })),
  });
}
export async function supportedClaimDefinition(text: string) {
  try {
    const d = JSON.parse(text),
      b = d.base_template;
    if (
      d.family !== "OUT-14" ||
      d.version !== 3 ||
      d.renderer !== claimRenderer ||
      !b ||
      ![1, 2].includes(b.version) ||
      !Number.isSafeInteger(b.policy_version) ||
      b.policy_version < 1 ||
      typeof b.id !== "string" ||
      !/^[0-9a-f-]{36}$/.test(b.id) ||
      !/^[0-9a-f]{64}$/.test(b.content_hash) ||
      Object.keys(b).sort().join() !== "content_hash,id,policy_version,version"
    )
      return null;
    return claimEvidenceDefinition(b);
  } catch {
    return null;
  }
}
// Built-in format, not editable publication: materialise an immutable definition
// under the selected Finance policy without moving that policy or changing v1/v2.
export async function claimEvidenceTemplate(
  c: PoolClient,
  p: Principal,
  base: BaseTemplate,
  register: boolean,
) {
  const definition = await claimEvidenceDefinition(base),
    content_hash = digest(definition);
  const key = digest(canonical({ workspace: p.workspace_id, definition }));
  const id = `${key.slice(0, 8)}-${key.slice(8, 12)}-5${key.slice(13, 16)}-a${key.slice(17, 20)}-${key.slice(20, 32)}`;
  if (register)
    await c.query(
      "INSERT INTO ppo.finance_templates(id,workspace_id,version,definition,content_hash) VALUES($1,$2,3,$3,$4) ON CONFLICT(id) DO NOTHING",
      [id, p.workspace_id, definition, content_hash],
    );
  const row = (
    await c.query(
      "SELECT * FROM ppo.finance_templates WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, id],
    )
  ).rows[0];
  if (
    !row ||
    row.version !== 3 ||
    row.definition !== definition ||
    row.content_hash !== content_hash
  )
    blocked(
      "TemplateUnavailable",
      "The exact retained claim evidence definition is unavailable.",
    );
  return {
    id,
    version: 3,
    content_hash,
    policy_version: base.policy_version,
    base_template: base,
  };
}
