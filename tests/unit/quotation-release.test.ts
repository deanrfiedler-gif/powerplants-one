import assert from "node:assert/strict";
import {test} from "node:test";
import {randomUUID} from "node:crypto";
import {releaseTemplate} from "../../src/estimating/release/template";
import {quoteTemplate,type SafeQuote} from "../../src/estimating/template";
import {prepareInput,approvalInput,distributionInput} from "../../src/estimating/release/validation";
import {crmBase} from "../helpers/crm";
test("ES05 non-operative exact template preserves E1 originals and escapes every customer field",async()=>{
  const s:SafeQuote={synthetic:true,state:"Draft",display_number:"SYN-QUOTE-001",revision:2,title:'<img src=x onerror="alert(1)">',customer:"SYN & Co",contact:"SYN Person",site:"SYN Site",scope:{included:"<script>bad()</script>",excluded:"None",assumptions:"Synthetic"},items:[{description:"<script>x</script>",quantity:"1",unit:"ea",amount:"100.00"}],total:"100.00",currency:"AUD",tax_basis:"ExcludingTax",tax_calculated:false};
  const original=await quoteTemplate(s),release=await releaseTemplate(s);
  assert.deepEqual(await quoteTemplate(s),original);
  assert.deepEqual(await releaseTemplate(s),release);
  assert.notEqual(release.input_hash,original.input_hash);
  assert.match(release.html,/SYNTHETIC · NO COMMERCIAL VALIDITY/);
  assert.match(release.html,/Operative commercial terms and validity period: Not configured/);
  assert.doesNotMatch(release.html,/<script>|unit_cost|payment due|accepted on behalf/i);
  assert.match(release.html,/&lt;img/);
  assert.match(original.html,/DRAFT · SYNTHETIC/);
});
test("ES05 strict exact inputs refuse operational assumptions and missing original hashes",()=>{
  const id=randomUUID(),base={...crmBase(),synthetic_only:true,expected_quote_version:1,expected_release_sequence:0},prepare={...base,id:randomUUID(),basis_hash:"a".repeat(64),predecessor_issue_id:null};
  assert.equal(prepareInput(id,prepare).synthetic_only,true);
  for(const patch of [{synthetic_only:false},{basis_hash:""},{threshold:1000},{expected_release_sequence:-1},{terms:"invented"}])assert.throws(()=>prepareInput(id,{...prepare,...patch}));
  assert.throws(()=>approvalInput(id,{...base,outcome:"LiveApproved",output_hash:"a".repeat(64)}));
  assert.throws(()=>distributionInput(id,{...base,issue_id:randomUUID(),attempt_id:randomUUID(),resolves_event_id:null,outcome:"Delivered"}));
});
