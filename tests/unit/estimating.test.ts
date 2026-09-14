import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { calculate, quoteAmounts, extended } from "../../src/estimating/math";
import { amount, parseLines, createInput, saveInput, quoteInput } from "../../src/estimating/validation";
import { canonical } from "../../src/platform/operations";
import { versionHash } from "../../src/estimating/service";
import { digest } from "../../src/documents/store";
import { manualLines, estimateInput, quoteCommand } from "../helpers/estimating";
test("E1 arithmetic: exact manual totals and separately named margin and markup",()=>{
  const lines=parseLines(manualLines()),t=calculate(lines);
  assert.equal(t.cost,"480.00");assert.equal(t.sell,"720.00");assert.equal(t.difference,"240.00");assert.equal(t.margin_percent,"33.33");assert.equal(t.markup_percent,"50.00");
  assert.equal(t.tax_calculated,false);assert.equal(t.policy,"SYN-EST-ARITHMETIC-01");
});
test("E1 arithmetic: HALF_UP each extension then sum catches a different aggregate rounding order",()=>{
  assert.equal(extended("1.005","1.00"),101n);
  const lines=parseLines(manualLines().slice(0,2).map(l=>({...l,quantity:"0.335",unit_cost:"1",unit_sell:"1.5"})));
  const t=calculate(lines);assert.equal(t.cost,"0.68");assert.equal(t.sell,"1.00");
});
test("E1 arithmetic: hidden included allowance reconciles; excluded lines are removed; source is never projected",()=>{
  const lines=parseLines(manualLines()),choices=quoteCommand({id:randomUUID(),lines}).choices;
  let q=quoteAmounts(lines,choices);assert.equal(q.total,"720.00");assert.equal(q.items.at(-1)!.amount,"320.00");
  assert.equal(q.items.at(-1)!.description,"Included scope allowance");assert.doesNotMatch(JSON.stringify(q),/unit_cost|source|margin|labour assumption/);
  choices[1].included=false;q=quoteAmounts(lines,choices);assert.equal(q.total,"400.00");assert.equal(q.items.length,2);
});
test("E1 arithmetic: scope-only is unknown, explicit zero is valid and zero denominator is N/A",()=>{
  const empty=calculate([]);assert.equal(empty.cost,null);assert.equal(empty.sell,null);assert.equal(empty.complete,false);
  const zero=calculate(parseLines(manualLines().slice(0,1).map(l=>({...l,unit_cost:"0",unit_sell:"0"}))));
  assert.equal(zero.sell,"0.00");assert.equal(zero.margin_percent,null);assert.equal(zero.markup_percent,null);
});
test("E1 validation: unknown, exponential, nonfinite, negative, overprecision, bounds and below-cost rejected",()=>{
  for(const v of [null,undefined,"","NaN","Infinity","1e2","-1","01","1.001","1000000.01",1])assert.throws(()=>amount(v,"cost"));
  for(const v of ["0","-1","0.0001","100000.001"])assert.throws(()=>amount(v,"quantity",true));
  assert.equal(amount("1000000","cost"),"1000000.00");assert.equal(amount("100000","quantity",true),"100000.000");
  assert.throws(()=>parseLines(manualLines().map(l=>({...l,unit_sell:"1"}))));
  assert.throws(()=>parseLines(manualLines().map(l=>({...l,effective_date:"2026-02-30"}))));
  assert.throws(()=>parseLines(manualLines().map(l=>({...l,source:""}))));
});
test("E1 validation: strict commands reject invented issue, tax, duplicate membership and loose booleans",()=>{
  const input=estimateInput(randomUUID());assert.throws(()=>createInput({...input,state:"Issued"}));assert.throws(()=>createInput({...input,tax_rate:"10"}));
  const q=quoteCommand({id:randomUUID(),lines:input.lines});assert.throws(()=>quoteInput(input.id,{...q,choices:[q.choices[0],q.choices[0]]}));
  assert.throws(()=>quoteInput(input.id,{...q,choices:[{...q.choices[0],print:"false"}]}));
  assert.throws(()=>quoteInput(input.id,{...q,expected_quote_version:-1}));
});
test("DR01 preserves the exact legacy canonical command and content-hash basis",()=>{
  const input=estimateInput(randomUUID()), parsed=createInput(input);
  const lines=input.lines.map(l=>({...l,quantity:`${l.quantity}.000`,unit_cost:`${l.unit_cost}.00`,unit_sell:`${l.unit_sell}.00`}));
  assert.equal(canonical(parsed),canonical({...input,lines}));
  assert.equal(versionHash(parsed),digest(canonical({title:input.title,scope:input.scope,lines,policy:input.policy})));
  assert.equal(Object.hasOwn(parsed,"cost_schema_version"),false);
  assert.ok(parsed.lines.every(l=>!Object.hasOwn(l,"allowance")));
  for(const category of ["Engineering","Subcontract"])assert.throws(()=>createInput({...input,lines:[{...input.lines[0],category}]}));
  assert.throws(()=>createInput({...input,lines:input.lines.map(l=>({...l,allowance:false}))}));
});
test("DR01 strict schema 2 records five categories and explicit flags independently of arithmetic and quote printing",()=>{
  const input=estimateInput(randomUUID());
  const lines=["Product","Labour","Freight","Engineering","Subcontract"].map((category,i)=>({...input.lines[0],id:randomUUID(),category,allowance:i%2===0}));
  const parsed=createInput({...input,schema_version:2,lines});
  assert.deepEqual(parsed.lines.map(l=>l.category),lines.map(l=>l.category));
  assert.equal(calculate(parsed.lines).sell,"1750.00");
  const choices=parsed.lines.map(l=>({line_id:l.id,included:true,print:true}));
  const quote=quoteAmounts(parsed.lines,choices);
  assert.equal(quote.items.length,5);assert.equal(quote.total,"1750.00");
  assert.doesNotMatch(JSON.stringify(quote),/category|allowance|Engineering|Subcontract/);
  assert.notEqual(versionHash({...parsed,cost_schema_version:2}),versionHash(parsed));
  assert.notEqual(versionHash({...parsed,cost_schema_version:2}),versionHash({...parsed,cost_schema_version:2,lines:parsed.lines.map(l=>({...l,allowance:!l.allowance}))}));
  for(const allowance of [undefined,null,"false",0,1,{}])assert.throws(()=>createInput({...input,schema_version:2,lines:[{...lines[0],allowance}]}));
  assert.throws(()=>createInput({...input,schema_version:2,lines:[{...lines[0],category:"Allowance"}]}));
  const save={operation_id:input.operation_id,schema_version:2,reason:input.reason,expected_version:1,title:input.title,scope:input.scope,lines,policy:input.policy};
  assert.equal(saveInput(input.id,save).schema_version,2);
  assert.throws(()=>quoteInput(input.id,{...quoteCommand(parsed),schema_version:2}));
});
