import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { discoveryInput } from "./estimating-discovery";
import {
  workbookParts,
  workbookBytes,
  escapeXml,
  type WorkbookParts,
} from "./excel-workbook";
import type { ReviewTarget } from "../../src/estimating/import/review";

const fixture = JSON.parse(
  readFileSync(
    new URL(
      "../../docs/blueprints/excel-estimate-import/fixture.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
export function excelDiscovery() {
  const input = discoveryInput();
  for (let i = 0; i < 3; i++)
    input.answers[i].value = fixture.scope[i][2] as string;
  return input;
}
export function unitTarget(): ReviewTarget {
  const discovery = excelDiscovery();
  return {
    workspace_id: randomUUID(),
    company_id: randomUUID(),
    actor_id: randomUUID(),
    opportunity_id: randomUUID(),
    organisation_id: randomUUID(),
    site_id: discovery.scope.site_id!,
    option_id: randomUUID(),
    revision_id: randomUUID(),
    expected_workspace_version: 1,
    expected_estimate_version: 0,
    estimate_id: null,
    estimate_version_id: null,
    content_hash: "a".repeat(64),
    context_hash: "b".repeat(64),
    discovery,
  };
}
// Rebind a generated synthetic copy; retain the issued fixture bytes unchanged.
export function nativeWorkbook(target: ReviewTarget): WorkbookParts {
  const parts = workbookParts();
  const replacements = new Map([
    ["SYN-PPO-OPP-EXCEL-001", target.opportunity_id],
    ["SYN-PPO-OPT-EXCEL-A", target.option_id],
    ["SYN-PPO-ORG-EXCEL-001", target.organisation_id],
    ["SYN-PPO-SITE-EXCEL-001", target.site_id],
    ["SYN-PPO-FAC-EXCEL-001", target.discovery.scope.facility_ids[0] ?? ""],
    ["SYN-PPO-AREA-EXCEL-001", ""],
  ]);
  for (const path of Object.keys(parts))
    for (const [source, value] of replacements)
      parts[path] = parts[path].replaceAll(source, value);
  return parts;
}
export function setCell(
  parts: WorkbookParts,
  sheet: number,
  address: string,
  value: string | number | boolean | null,
  formula?: string,
) {
  const path = `xl/worksheets/sheet${sheet}.xml`;
  const content =
    value === null
      ? `<c r="${address}"/>`
      : typeof value === "string" && !formula
        ? `<c r="${address}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`
        : `<c r="${address}"${typeof value === "boolean" ? ' t="b"' : ""}>${formula ? `<f>${escapeXml(formula)}</f>` : ""}<v>${typeof value === "boolean" ? Number(value) : value}</v></c>`;
  const pattern = new RegExp(`<c r="${address}"[^>]*(?:/>|>[\\s\\S]*?</c>)`);
  if (!pattern.test(parts[path]))
    throw Error("Missing fixture cell: " + address);
  parts[path] = parts[path].replace(pattern, content);
}
export const excelUpload = (
  target: ReviewTarget,
  basis_hash: string,
  parts = nativeWorkbook(target),
) => ({
  option_id: target.option_id,
  revision_id: target.revision_id,
  basis_hash,
  file: {
    name: "SYN-reviewed-workbook.xlsx",
    base64: workbookBytes(parts).toString("base64"),
  },
});
