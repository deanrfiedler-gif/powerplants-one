import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { CHANGES, changeScenarioIds, seedChangesScenario } from "../helpers/engineering-changes";
import type { Call, SignIn } from "../helpers/engineering-materials";

// EN-07 over HTTP: the envelope, the local-request guards, strict criteria, receipt recovery and the exports, which the
// in-process suites cannot see. The port follows PPO_PORT, as the application itself does.
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
const cookies = new Map<string, string>();
async function cookieFor(profile: string) {
  if (!cookies.has(profile)) {
    const r = await fetch(`${origin}/api/v1/local-session`, { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify({ profile }) });
    assert.equal(r.status, 200, profile);
    cookies.set(profile, r.headers.get("set-cookie")!.split(";")[0]);
  }
  return cookies.get(profile)!;
}
const signIn: SignIn = async (profile) => {
  const cookie = await cookieFor(profile);
  const call: Call = async (path, body) => {
    const response = await fetch(`${origin}/api/v1/${path}`, { method: body ? "POST" : "GET", headers: { cookie, origin, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    assert.equal(response.headers.get("cache-control"), "private, no-store", path);
    return { status: response.status, body: await response.json() };
  };
  return call;
};
const command = (reason: string, fields: Record<string, unknown>) => ({ operation_id: randomUUID(), schema_version: 1, reason, ...fields });

test("EN07-A01 A09 A27 A28 A36 A44 A45 A47 HTTP: private envelopes, strict criteria, local-request guards, receipt recovery and safe exports", async () => {
  const built = await seedChangesScenario(signIn, changeScenarioIds(false), ` http ${Date.now()}`), base = `engineering/${built.package_id}/changes`;
  const engineer = await signIn(CHANGES.engineer.profile), viewer = await signIn(CHANGES.viewer.profile), other = await signIn("second-company");
  const register = await engineer(base);
  assert.equal(register.status, 200);
  const body = register.body as { synthetic: boolean; observed_at: string; completeness: string; total: number; counts: { scope: string; package_total: number }; menu: { scope: string } };
  assert.deepEqual([body.synthetic, body.completeness, body.counts.scope, body.menu.scope, body.total, body.counts.package_total], [true, "Complete", "Package", "Package", 8, 8]);
  assert.ok(Date.parse(body.observed_at));
  // A09: every criterion is validated. An unknown one is refused, never ignored.
  for (const bad of ["view=everything", "page=0", "page_size=500", "sort=price", "owner_id=not-a-uuid", "stage=Approved", "attention=Urgent", "change=not-a-uuid", "colour=green"]) assert.equal((await engineer(`${base}?${bad}`)).status, 422, bad);
  // Unknown sort values stay last in either direction: the change with no due date ends both orders.
  for (const dir of ["asc", "desc"]) assert.equal(((await engineer(`${base}?sort=due&dir=${dir}`)).body as { items: { reference: string }[] }).items.at(-1)!.reference, "SYN-EN07-008", dir);
  // A01: a Project identity is never accepted in place of the Engineering package's, and another company sees nothing.
  assert.equal((await engineer(`engineering/${randomUUID()}/changes`)).status, 404);
  assert.equal((await other(base)).status, 404);
  assert.equal((await other(`${base}/impact?change=${built.selected}`)).status, 404);
  // A selection outside this package is reported as unavailable, with nothing in its place.
  const wrong = (await engineer(`${base}?change=${randomUUID()}`)).body as { selected: unknown; selection: string };
  assert.deepEqual([wrong.selected, wrong.selection], [null, "Unavailable"]);

  // A command must come from the local application, as JSON, from a signed-in identity, with only the keys it accepts.
  const cookie = await cookieFor(CHANGES.engineer.profile), createId = randomUUID(), create = command("SYN HTTP", { action: "create", id: createId, revision_id: randomUUID(), title: "SYN HTTP change", category: "DesignCorrection", discipline: "Controls", location: "Shed", system_name: "Controls" });
  const post = (headers: Record<string, string>, payload: unknown) => fetch(`${origin}/api/v1/${base}`, { method: "POST", headers, body: JSON.stringify(payload) });
  assert.equal((await post({ cookie, "Content-Type": "application/json" }, create)).status, 403); // no Origin
  assert.equal((await post({ cookie, origin: "http://127.0.0.1:9", "Content-Type": "application/json" }, create)).status, 403);
  assert.equal((await post({ origin, "Content-Type": "application/json" }, create)).status, 401);
  for (const smuggled of [{ stage: "DecisionRecorded" }, { author_id: CHANGES.reviewer.id }, { reference: "SYN-EN07-999" }, { approved: true }]) assert.equal((await engineer(base, { ...create, operation_id: randomUUID(), ...smuggled })).status, 422, JSON.stringify(smuggled));
  // A read-only identity cannot author, whatever the screen hides.
  assert.equal((await viewer(base, { ...create, operation_id: randomUUID(), id: randomUUID(), revision_id: randomUUID() })).status, 403);

  // A36 A37: first acceptance is 201, the identical original replays as 200, and a changed payload conflicts.
  const first = await engineer(base, create);
  assert.equal(first.status, 201);
  assert.equal((await engineer(base, create)).status, 200);
  assert.equal((await engineer(base, { ...create, title: "SYN different content" })).status, 409);
  const receipt = await engineer(`operations/${create.operation_id}`);
  assert.deepEqual([receipt.status, (receipt.body as { record_id: string }).record_id], [200, createId]);
  // A28: a command made against a version that has moved on is refused as a conflict; nothing is overwritten silently.
  const author = (fields: Record<string, unknown>) => engineer(base, command("SYN coordination", { action: "coordinate", change_id: createId, next_owner_id: CHANGES.author.id, due: "2026-10-09", ...fields }));
  assert.equal((await author({ expected_version: 1 })).status, 201);
  const stale = await author({ expected_version: 1, due: "2026-10-10" });
  assert.deepEqual([stale.status, (stale.body as { code: string }).code], [409, "VersionConflict"]);
  assert.equal(((await engineer(`${base}?change=${createId}`)).body as { selected: { due: string } }).selected.due, "2026-10-09");
  // A27: moving the owner and date is coordination. It advanced the change and left the proposal's content hash alone.
  const hashes = async () => ((await engineer(`${base}/impact?change=${createId}`)).body as { selected: { revision: { content_hash: string; version: number } } }).selected.revision;
  const before = await hashes();
  assert.equal((await author({ expected_version: 2, due: "2026-10-12" })).status, 201);
  assert.deepEqual(await hashes(), before);

  // A45: an operation ID is not a way around access. Another identity is told nothing about it.
  assert.equal((await viewer(`operations/${create.operation_id}`)).status, 404);
  assert.equal((await other(`operations/${create.operation_id}`)).status, 404);

  // A47: exports are files, labelled synthetic, scoped, formula-safe, and they follow the reader's projection.
  const file = async (who: string, query: string) => fetch(`${origin}/api/v1/${base}/export?${query}`, { headers: { cookie: await cookieFor(who), origin } });
  const csv = await file(CHANGES.engineer.profile, "kind=register");
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get("content-type")!, /^text\/csv/);
  assert.match(csv.headers.get("content-disposition")!, /attachment; filename=".*-changes\.csv"/);
  const text = await csv.text();
  assert.match(text, /"Synthetic local prototype"/);
  assert.match(text, /"Not an issue, approval, instruction or distribution of any controlled document"/);
  assert.match(text, /"Generated","20\d\d-/);
  assert.match(text, /of 9 changes/); // its stated scope is the whole permitted package, including the one just created
  assert.match(text, /"SYN-EN07-008","Valve isolation arrangement".*"Date needed"/);
  const assessment = await (await file(CHANGES.engineer.profile, `kind=assessment&change=${built.selected}`)).text();
  assert.match(assessment, /"Known cost impact \(partial where unknown components exist\)"/);
  assert.match(assessment, /"Cost","1250\.00","AUD","ExTax"/);
  assert.match(assessment, /"Unknown components","Remobilisation"/);
  const withheld = await (await file(CHANGES.viewer.profile, `kind=assessment&change=${built.selected}`)).text();
  assert.ok(!withheld.includes("1250.00")); // the amount as it is written; a bare "1250" can occur inside a content hash
  assert.match(withheld, /Cost detail is limited/);
  assert.equal((await file("second-company", "kind=register")).status, 404);
  assert.equal((await file(CHANGES.engineer.profile, "kind=everything")).status, 422);
  // A title a spreadsheet would run as a formula is neutralised in the file and stored exactly as typed.
  const formula = command("SYN formula title", { action: "create", id: randomUUID(), revision_id: randomUUID(), title: "=HYPERLINK(\"http://example.invalid\")", category: "DesignCorrection", discipline: "Controls", location: "Shed", system_name: "Controls" });
  assert.equal((await engineer(base, formula)).status, 201);
  assert.match(await (await file(CHANGES.engineer.profile, "kind=register")).text(), /"'=HYPERLINK\(""http:\/\/example\.invalid""\)"/);
});
