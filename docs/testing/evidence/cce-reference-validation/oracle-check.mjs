import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {compileFormula,evaluateFormula} from './expression.ts';
const cases=JSON.parse(readFileSync(new URL('./arithmetic-oracle.json',import.meta.url),'utf8'));
const compiled=new Map(),started=performance.now();
for(const test of cases){if(!compiled.has(test.expression))compiled.set(test.expression,compileFormula(test.expression,new Set('abcd')));const actual=evaluateFormula(compiled.get(test.expression),new Map(Object.entries(test.facts)));assert.equal(actual.numerator.toString(),test.numerator);assert.equal(actual.denominator.toString(),test.denominator);}
const result={oracle:'Python fractions.Fraction',seed:20261012,passed:cases.length,localElapsedMs:Math.round(performance.now()-started),limit:'Generated differential arithmetic checks; not exhaustive parser security or production load testing'};writeFileSync(new URL('./oracle-result.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
