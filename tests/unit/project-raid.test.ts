import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { parseRaid, raidKinds } from "../../src/projects/raid-validation";
import { raidInput } from "../helpers/project-raid";
import { AppError } from "../../src/platform/errors";
test("RAID kinds stay distinct; IDs and action order have one canonical command", () => {
  const project=randomUUID(), input=raidInput(), ids=[randomUUID(),randomUUID()];
  for (const kind of raidKinds) assert.equal(parseRaid(project,{...input,kind}).kind,kind);
  assert.deepEqual(parseRaid(project,{...input,action_ids:ids}),parseRaid(project.toUpperCase(),{...input,id:input.id.toUpperCase(),action_ids:ids.reverse()}));
});
test("RAID rejects invalid lifecycle, ownership, dates, duplicates and unrecognised authority", () => {
  for (const changes of [{state:"Closed"},{state:"Monitoring"},{outcome:"already closed"},{kind:"Task"},{owner_id:null},{expected_version:-1},{expected_version:1.5},{due_at:"2026-02-30T12:00:00Z",due_needed:false},{due_needed:false},{action_ids:Array(21).fill(randomUUID())},{action_ids:["bad"]},{approved:true},{company_id:randomUUID()},{title:" "}]) {
    assert.throws(()=>parseRaid(randomUUID(),{...raidInput(),...changes}),(e:unknown)=>e instanceof AppError && e.code==="InvalidData");
  }
  const id=randomUUID(); assert.throws(()=>parseRaid(randomUUID(),{...raidInput(),action_ids:[id,id]}));
  assert.equal(parseRaid(randomUUID(),{...raidInput(1),state:"Closed",outcome:"SYN resolved"}).state,"Closed");
});
