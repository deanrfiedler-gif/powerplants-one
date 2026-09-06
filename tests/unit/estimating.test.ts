import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { calculate, quoteAmounts, extended } from "../../src/estimating/math";
import { amount, parseLines, createInput, quoteInput } from "../../src/estimating/validation";
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
