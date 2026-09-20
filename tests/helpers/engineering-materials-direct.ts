// The same EN-06 paths the application serves, answered in process by the same services, so the database suite
// builds the review scenario with the helper the browser journeys and the demonstration script use. A refusal is
// returned as the status and body the HTTP layer would send; anything else is a real failure and is thrown.
import { createSession, type Principal } from "../../src/platform/identity";
import { AppError } from "../../src/platform/errors";
import { createOrganisation, createSite } from "../../src/shared/commands";
import { readOperation } from "../../src/shared/receipts";
import { createProject } from "../../src/projects/service";
import { createEngineeringRequest } from "../../src/engineering/service";
import { handoverCommand, impactCommand, lineCommand, releaseCommand, setCommand, sourceCommand, substitutionCommand } from "../../src/engineering/materials/commands";
import { readEntry, readHandovers, readHistory, readLine, readMapping, readPeople, readRegister, readReleases, readSources, readSubstitutions } from "../../src/engineering/materials/reads";
import type { Call, SignIn } from "./engineering-materials";

type Result = { receipt: unknown; replayed: boolean };
const commands: Record<string, (p: Principal, id: string, body: unknown) => Promise<Result>> = { "": setCommand, lines: lineCommand, sources: sourceCommand, substitutions: substitutionCommand, releases: releaseCommand, handover: handoverCommand, impacts: impactCommand };
const reads: Record<string, (p: Principal, id: string, query: unknown) => Promise<unknown>> = { "": readRegister, lines: readLine, mapping: readMapping, people: readPeople, substitutions: readSubstitutions, releases: readReleases, handover: readHandovers, history: readHistory, sources: readSources };
const created: Record<string, (p: Principal, body: unknown) => Promise<Result>> = { customers: createOrganisation, sites: createSite, projects: createProject, engineering: createEngineeringRequest };

async function route(p: Principal, target: string, body?: unknown): Promise<{ status: number; body: unknown }> {
  const [path, search = ""] = target.split("?"), query = Object.fromEntries(new URLSearchParams(search));
  const material = /^engineering\/([^/]+)\/materials(?:\/([a-z]+))?$/.exec(path), operation = /^operations\/([^/]+)$/.exec(path);
  const accepted = (r: Result) => ({ status: r.replayed ? 200 : 201, body: r.receipt });
  if (material && body !== undefined) return accepted(await commands[material[2] ?? ""](p, material[1], body));
  if (material) return { status: 200, body: await reads[material[2] ?? ""](p, material[1], query) };
  if (operation) return { status: 200, body: await readOperation(p, operation[1]) };
  if (path === "engineering/materials") return { status: 200, body: await readEntry(p, query) };
  if (body !== undefined && created[path]) return accepted(await created[path](p, body));
  throw Error(`No in-process route for ${target}`);
}
export const principalOf = async (profile: string) => (await createSession(profile)).principal;
export const directSignIn: SignIn = async (profile) => {
  const p = await principalOf(profile);
  const call: Call = async (target, body) => {
    try {
      return await route(p, target, body);
    } catch (e) {
      if (e instanceof AppError) return { status: e.status, body: { code: e.code, message: e.message, field_errors: e.field_errors } };
      throw e;
    }
  };
  return call;
};
