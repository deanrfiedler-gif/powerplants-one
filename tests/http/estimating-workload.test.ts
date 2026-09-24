import assert from "node:assert/strict";
import { test } from "node:test";
import { crmCreate } from "../helpers/crm";
const origin = process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000";
async function session(profile: string) {
  const response = await fetch(`${origin}/api/v1/local-session`, {method: "POST", headers: {Origin: origin, "Content-Type": "application/json"}, body: JSON.stringify({profile})});
  assert.equal(response.status, 200);
  return response.headers.get("set-cookie")!.split(";")[0];
}
test("ES01 HTTP workload is current-authority, no-store, read-only and strictly validates filters", async () => {
  const cookie = await session("coordinator"), input = crmCreate();
  const created = await fetch(`${origin}/api/v1/crm/opportunities`, {method: "POST", headers: {Cookie: cookie, Origin: origin, "Content-Type": "application/json"}, body: JSON.stringify(input)});
  assert.equal(created.status, 201);
  const response = await fetch(`${origin}/api/v1/estimating/workload`, {headers: {Cookie: cookie}});
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control")!, /no-store/);
  const body = await response.json(), row = body.items.find((x: {opportunity: {id: string}}) => x.opportunity.id === input.id);
  assert.equal(row.opportunity.need_summary, input.need_summary);
  assert.equal(row.intake_acceptance, "NotConfigured");
  assert.equal((await fetch(`${origin}/api/v1/estimating/workload?view=approved`, {headers: {Cookie: cookie}})).status, 422);
  assert.equal((await fetch(`${origin}/api/v1/estimating/workload`, {method: "POST", headers: {Cookie: cookie, Origin: origin}})).status, 405);
  const second = await session("second-company");
  const hidden = await (await fetch(`${origin}/api/v1/estimating/workload`, {headers: {Cookie: second}})).json();
  assert.equal(hidden.items.some((x: {opportunity: {id: string}}) => x.opportunity.id === input.id), false);
  const technician = await session("assigned-technician");
  assert.equal((await fetch(`${origin}/api/v1/estimating/workload`, {headers: {Cookie: technician}})).status, 403);
});
