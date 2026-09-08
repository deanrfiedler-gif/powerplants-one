import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseSimulatedRequest,ASSISTANT_LABEL} from '../../src/assistant/simulated';
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
  assert.equal(parseSimulatedRequest('Summarise the customer').kind,'summary');
  assert.equal(parseSimulatedRequest('Find customer SYN Growers').query,'SYN Growers');
  assert.equal(parseSimulatedRequest('Find '+ 'x'.repeat(300)).query.length,200);
});
