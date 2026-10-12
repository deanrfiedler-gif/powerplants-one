import assert from "node:assert/strict";
import { CceError, Fraction, compileFormula, evaluateFormula } from "./expression.js";

const facts = new Map([
  ["CFO.SPECIFICATION.DISTANCE", "140"],
  ["distance_m", "140"],
  ["negative", "-0.25"]
]);
const allowed = new Set(facts.keys());
const calculate = (s: string, values = facts) => evaluateFormula(compileFormula(s, allowed), values);
let positiveCases = 0, refusalCases = 0, generatedCases = 0;
const exactCases: [string, string][] = [
  ["((CFO.SPECIFICATION.DISTANCE / 10) * 2) + 5", "33"],
  ["0.1 + 0.2", "0.3"], ["8 / 4 / 2", "1"], ["2 + 3 * 4", "14"],
  ["-(2 + 3) * 4", "-20"], ["2*-3+4", "-2"], ["1/3 + 2/3", "1"],
  ["-0.125 + 0.25", "0.125"], ["negative * 4", "-1"], ["0/5", "0"],
  ["00012.5000 / 5", "2.5"], ["+2--3", "5"], ["distance_m/10", "14"],
  [" 2 +\n 3 ", "5"], ["1/8", "0.125"], ["999999999999999999+1", "1000000000000000000"]
];
for (const [source, expected] of exactCases) {
  assert.equal(calculate(source).exactDecimal(), expected, source); positiveCases++;
}
assert.deepEqual(calculate("1/3").evidence(), {numerator:"1",denominator:"3",exactDecimal:null});
positiveCases++;
assert.equal(Fraction.fromDecimal("-0.000").exactDecimal(), "0"); positiveCases++;
const reusable = compileFormula("distance_m+1", allowed);
assert.equal(evaluateFormula(reusable, new Map([["distance_m","1"]])).exactDecimal(), "2");
assert.equal(evaluateFormula(reusable, new Map([["distance_m","9"]])).exactDecimal(), "10");
assert.deepEqual(reusable.dependencies, ["distance_m"]); positiveCases++;
assert.ok(Object.isFrozen(reusable) && Object.isFrozen(reusable.tree)); positiveCases++;

const bad = [
  "CFO.__proto__", "CFO.SPECIFICATION.DISTANCE.toString()", "process.exit()",
  "2**100", "1/0", "1;2", "[1,2]", "2x", "NaN", "1e400", "", " ",
  "1+".repeat(200)+"1", "(".repeat(40)+"1"+")".repeat(40),
  "1+".repeat(34)+"1", "9".repeat(2049), "1234567890123456789", "0.1234567890123",
  "1//2", "1%2", "x=1", "1<2", "1?2:3", "CFO['x']", "'1'", "Math.random()",
  "2(3)", "1,2", "1..2", "1/*x*/+2", "2π", "1\u200b+2", "(1+2", "1+2)"
];
for (const source of bad) {
  assert.throws(() => calculate(source), CceError, source); refusalCases++;
}
for (const value of ["NaN", "Infinity", "1e3", "", "1.2.3"]) {
  assert.throws(() => calculate("distance_m", new Map([["distance_m", value]])), CceError);
  refusalCases++;
}
assert.throws(() => calculate("distance_m", new Map()), CceError); refusalCases++;
assert.throws(() => evaluateFormula(JSON.parse(JSON.stringify(reusable)), facts), CceError); refusalCases++;
assert.throws(() => Fraction.fromDecimal("1").exactDecimal(13), CceError); refusalCases++;
assert.throws(() => new Fraction(10n**513n), CceError); refusalCases++;

// Independent exact oracle for bounded integer operations; no binary rounding.
for (let a=-5; a<=5; a++) for (let b=1; b<=5; b++) {
  for (const op of ["+","-","*","/"]) {
    const got = calculate(`(${a})${op}${b}`);
    const expectedN = op==="+" ? BigInt(a+b) : op==="-" ? BigInt(a-b) :
      op==="*" ? BigInt(a*b) : BigInt(a);
    const expectedD = op==="/" ? BigInt(b) : 1n;
    assert.equal(got.numerator*expectedD, expectedN*got.denominator);
    generatedCases++;
  }
}
console.log(JSON.stringify({positiveCases,refusalCases,generatedCases,
  example:calculate("((CFO.SPECIFICATION.DISTANCE / 10) * 2) + 5").evidence()}));
