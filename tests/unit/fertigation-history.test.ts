import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { remapScope } from "../../src/estimating/fertigation/history";
import {
  blankScope,
  blankMaster,
  blankValve,
  blankGroup,
} from "../../src/estimating/fertigation/definition";
import { bounded } from "../../src/estimating/fertigation/context";

test("FN-T41 full native envelope rejects undefined and excessive nesting as validation errors", () => {
  const invalid = (e: unknown) =>
    (e as { code?: string }).code === "InvalidData";
  assert.throws(() => bounded(undefined), invalid);
  let nested: unknown = {};
  for (let i = 0; i < 18; i++) nested = { value: nested };
  assert.throws(() => bounded(nested), invalid);
});

test("FN-T14 copying remaps only semantic local identities and retains UUID-looking prose and external identity", () => {
  const source = blankScope(),
    master = blankMaster(randomUUID()),
    valve = blankValve(randomUUID()),
    group = blankGroup(randomUUID());
  master.label = "SYN master";
  valve.label = valve.id;
  valve.notes = master.id;
  valve.master_id = master.id;
  valve.asset_id = randomUUID();
  group.label = "SYN group";
  group.valve_ids = [valve.id];
  source.masters = [master];
  source.valves = [valve];
  source.groups = [group];
  const namespace = randomUUID(),
    copy = remapScope(source, namespace),
    again = remapScope(source, namespace),
    other = remapScope(source, randomUUID());
  assert.deepEqual(copy, again);
  assert.notEqual(copy.proposal.valves[0].id, valve.id);
  assert.notEqual(copy.proposal.valves[0].id, other.proposal.valves[0].id);
  assert.equal(copy.proposal.valves[0].master_id, copy.proposal.masters[0].id);
  assert.deepEqual(copy.proposal.groups[0].valve_ids, [
    copy.proposal.valves[0].id,
  ]);
  assert.equal(copy.proposal.valves[0].label, valve.id);
  assert.equal(copy.proposal.valves[0].notes, master.id);
  assert.equal(copy.proposal.valves[0].asset_id, valve.asset_id);
  assert.equal(source.valves[0].id, valve.id);
  assert.equal(Object.keys(copy.identity_map).length, 3);
});
