// The same EN-07 paths the application serves, answered in process by the same services, so the database suite
// builds the review scenario with the helper the browser journeys and the demonstration script use. Everything that
// is not EN-07's own (EN-06 materials, customers, sites, projects, packages, receipts) goes to EN-06's in-process
// router unchanged. A refusal is returned as the status and body the HTTP layer would send; anything else is thrown.
import type { Principal } from "../../src/platform/identity";
import { AppError } from "../../src/platform/errors";
import { createAsset } from "../../src/shared/commands";
import { assetContext, envelope } from "../../src/shared/reads";
import { changeCommand, handoverCommand, prerequisiteCommand, reviewCommand, revisionCommand, verificationCommand } from "../../src/engineering/changes/commands";
import { exportCsv, readCandidates, readEntry, readHistory, readPeople, readPreview, readRegister, readView } from "../../src/engineering/changes/reads";
import type { Call, SignIn } from "./engineering-materials";
import { directSignIn as materialsSignIn, principalOf } from "./engineering-materials-direct";

type Result = { receipt: unknown; replayed: boolean };
const commands: Record<string, (p: Principal, id: string, body: unknown) => Promise<Result>> = { "": changeCommand, impact: revisionCommand, reviews: reviewCommand, prerequisites: prerequisiteCommand, handovers: handoverCommand, verification: verificationCommand };
const reads: Record<string, (p: Principal, id: string, query: unknown) => Promise<unknown>> = {
  "": readRegister, impact: (p, id, q) => readView(p, id, q, "impact"), reviews: (p, id, q) => readView(p, id, q, "reviews"), handovers: (p, id, q) => readView(p, id, q, "handovers"),
  verification: (p, id, q) => readView(p, id, q, "verification"), history: readHistory, candidates: readCandidates, people: readPeople, "handovers/preview": readPreview, export: exportCsv,
};
async function route(p: Principal, target: string, body?: unknown): Promise<{ status: number; body: unknown } | null> {
  const [path, search = ""] = target.split("?"), query = Object.fromEntries(new URLSearchParams(search));
  const change = /^engineering\/([^/]+)\/changes(?:\/([a-z]+(?:\/preview)?))?$/.exec(path), asset = /^assets(?:\/([^/]+))?$/.exec(path);
  // The status is the one the route itself would send: a replay is 200, and so is the one route declared as creating
  // nothing (commandRoute(..., false)): resolving a prerequisite that already exists.
  const accepted = (r: Result, creates = true) => ({ status: r.replayed || !creates ? 200 : 201, body: r.receipt });
  if (change && body !== undefined) return accepted(await commands[change[2] ?? ""](p, change[1], body), change[2] !== "prerequisites");
  if (change) return { status: 200, body: await reads[change[2] ?? ""](p, change[1], query) };
  if (path === "engineering/changes") return { status: 200, body: await readEntry(p, query) };
  if (asset && body !== undefined) return accepted(await createAsset(p, body));
  if (asset?.[1]) return { status: 200, body: envelope([await assetContext(p, asset[1])]) };
  return null;
}
export { principalOf };
export const directSignIn: SignIn = async (profile) => {
  const p = await principalOf(profile), materials = await materialsSignIn(profile);
  const call: Call = async (target, body) => {
    try {
      return (await route(p, target, body)) ?? (await materials(target, body));
    } catch (e) {
      if (e instanceof AppError) return { status: e.status, body: { code: e.code, message: e.message, field_errors: e.field_errors } };
      throw e;
    }
  };
  return call;
};
