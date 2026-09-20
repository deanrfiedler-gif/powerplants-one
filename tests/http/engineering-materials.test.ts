import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { MATERIALS, scenarioIds, seedMaterialsScenario, type Call, type SignIn } from "../helpers/engineering-materials";

// EN-06 over HTTP: the envelope, the local-request guards and the export, which the in-process suites cannot see.
const origin = "http://127.0.0.1:3000";
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

test("EN06-A28 A41 HTTP: private envelopes, local-request guards, exact retry status and a safe export", async () => {
  const ids = scenarioIds(false);
  await seedMaterialsScenario(signIn, ids, ` http ${Date.now()}`);
  const base = `engineering/${ids.package}/materials`, author = await signIn(MATERIALS.author.profile), viewer = await signIn(MATERIALS.viewer.profile), other = await signIn("second-company");
  const register = await author(`${base}?set=${ids.set}`);
  assert.equal(register.status, 200);
  const body = register.body as { synthetic: boolean; observed_at: string; completeness: string; counts: { scope: string; all: number } };
  assert.deepEqual([body.synthetic, body.completeness, body.counts.scope, body.counts.all], [true, "Complete", "MaterialSet", 8]);
  assert.ok(Date.parse(body.observed_at));
  // Every criterion is validated: an unknown one is refused rather than ignored.
  for (const bad of ["view=everything", "page=0", "page_size=500", "sort=price", "owner_id=not-a-uuid", "colour=green"]) assert.equal((await author(`${base}?${bad}`)).status, 422, bad);

  // A command must come from the local application, as JSON, from a signed-in identity.
  const cookie = await cookieFor(MATERIALS.author.profile), url = `${origin}/api/v1/${base}/lines`, payload = JSON.stringify(command("SYN", { action: "remove", line_id: ids.lines["070"], expected_version: 1, removed_reason: "SYN" }));
  assert.equal((await fetch(url, { method: "POST", headers: { cookie, "Content-Type": "application/json" }, body: payload })).status, 403);
  assert.equal((await fetch(url, { method: "POST", headers: { cookie, origin: "http://127.0.0.1:9999", "Content-Type": "application/json" }, body: payload })).status, 403);
  assert.equal((await fetch(url, { method: "POST", headers: { cookie, origin, "Content-Type": "text/plain" }, body: payload })).status, 422);
  assert.equal((await fetch(url, { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: payload })).status, 401);
  assert.equal((await fetch(`${origin}/api/v1/${base}`)).status, 401);
  const huge = await (await signIn(MATERIALS.coordinator.profile))(`${base}/sources`, command("SYN oversize", { action: "publish", id: randomUUID(), kind: "DrawingIssue", reference: "H-999", title: "SYN", revision: "A", file_version: "1", permitted_purpose: "Procurement", content: "x".repeat(70000) }));
  assert.deepEqual([huge.status, (huge.body as { code: string }).code], [422, "PayloadTooLarge"]);

  // A first acceptance is 201; the same original again is 200 with the same receipt; the same ID with other content is 409.
  const lineId = randomUUID(), save = command("SYN formula-leading description", { action: "save", line_id: lineId, set_id: ids.set, line_number: "090", description: '=HYPERLINK("http://example.invalid","SYN")', category: "SYN", specification: "SYN spec", discipline: "Hydraulics", system_name: "SYN", location: "+SYN Shed", served_areas: ["@SYN area"], quantity: "2", unit: "EA", quantity_basis: "SYN", purpose: "InformationOnly", next_owner_id: MATERIALS.author.id, next_action: "SYN" });
  const first = await author(`${base}/lines`, save), again = await author(`${base}/lines`, save);
  assert.deepEqual([first.status, again.status], [201, 200]);
  assert.equal((again.body as { receipt_id: string }).receipt_id, (first.body as { receipt_id: string }).receipt_id);
  assert.equal((await author(`${base}/lines`, { ...save, description: "SYN different" })).status, 409);
  assert.equal((await author(`operations/${save.operation_id}`)).status, 200);
  assert.equal((await viewer(`operations/${save.operation_id}`)).status, 404);

  // The export is a file, under the same guards: formula-leading text is neutralised, every field is quoted, units stay with their numbers.
  const exported = (path: string, who: string) => cookieFor(who).then((c) => fetch(`${origin}/api/v1/${base}/export?${path}`, { headers: { cookie: c } }));
  const file = await exported(`kind=register&set=${ids.set}`, MATERIALS.viewer.profile);
  assert.equal(file.status, 200);
  assert.match(file.headers.get("content-type") ?? "", /^text\/csv/);
  assert.match(file.headers.get("content-disposition") ?? "", /^attachment; filename="SYN-PPO-ENG-\d+-materials-A\.csv"$/);
  assert.deepEqual([file.headers.get("cache-control"), file.headers.get("x-content-type-options")], ["private, no-store", "nosniff"]);
  const text = await file.text();
  assert.ok(text.includes(`"'=HYPERLINK(""http://example.invalid"",""SYN"")"`), "formula-leading description");
  assert.ok(text.includes(`"'+SYN Shed"`) && text.includes(`"'@SYN area"`), "formula-leading location and area");
  assert.ok(text.includes('"Not an order, approval or authority to spend"'));
  assert.ok(text.includes('"Date needed"'), "an unknown required-by date is said, not left blank or invented");
  // Unlike units are never added together: one total per unit.
  assert.ok(text.includes('"120 M"') && text.includes('"3 PACK"') && /"\d+ EA"/.test(text));
  assert.equal((await exported(`kind=register&set=${ids.set}`, "second-company")).status, 404);
  assert.equal((await exported("kind=prices", MATERIALS.author.profile)).status, 422);
  void other;
});
