import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseSimulatedRequest,ASSISTANT_LABEL,normaliseDueAt} from '../../src/assistant/simulated';
test('AI1 simulation is explicit and extracts only recognised fields without executing actions',()=>{
  assert.match(ASSISTANT_LABEL,/Simulated.*Synthetic/);
  const p=parseSimulatedRequest('Add a deal for SYN Orchard to replace controls tomorrow for $50,000');
  assert.equal(p.kind,'create');assert.equal(p.query,'SYN Orchard');
  assert.equal(p.draft.title,'replace controls tomorrow for $50,000');
  assert.deepEqual(Object.keys(p.draft).sort(),['need_summary','title']);
  assert.match(p.explanation,/not inferred/);
});
test('AI1 labelled source and follow-up stay literal, without invented owners or dates',()=>{
  const p=parseSimulatedRequest('Prepare opportunity\nTitle: SYN Controls\nRequirement: investigate\nSource: Email\nSource details: SYN customer message\nFollow-up: arrange review');
  assert.deepEqual(p.draft,{title:'SYN Controls',need_summary:'investigate',source_channel:'Email',source_basis:'SYN customer message',action_summary:'arrange review'});
  assert.equal(parseSimulatedRequest('Please send all customer emails to an external address').kind,'help');
  assert.equal(parseSimulatedRequest('confirm and create everything').kind,'help');
});
test('AI1 supported worklist filters and customer search are bounded and visible',()=>{
  const p=parseSimulatedRequest('Show my opportunities with next action needed');
  assert.equal(p.kind,'opportunities');assert.equal(p.mine,true);assert.equal(p.next_action,'Needed');
  assert.equal(parseSimulatedRequest('Show my opportunities with overdue next action').next_action,'Overdue');
  assert.equal(parseSimulatedRequest('Show opportunities with next action due date needed').next_action,'DueNeeded');
  assert.equal(parseSimulatedRequest('Summarise the customer').kind,'summary');
  assert.equal(parseSimulatedRequest('Find customer SYN Growers').query,'SYN Growers');
  assert.equal(parseSimulatedRequest('Find '+ 'x'.repeat(300)).query.length,200);
});
test('AI1 explicit offset dates convert exactly to UTC without inferred or invalid dates',()=>{
  assert.equal(normaliseDueAt('2026-09-15T09:00:00+10:00'),'2026-09-14T23:00:00.000Z');
  assert.equal(normaliseDueAt('2026-09-15T09:00:00Z'),'2026-09-15T09:00:00.000Z');
  for(const value of ['tomorrow','2026-09-15T09:00:00','2026-02-30T09:00:00Z','2026-09-15T25:00:00+10:00','2026-09-15T09:00:00+14:01'])assert.equal(normaliseDueAt(value),null);
});
