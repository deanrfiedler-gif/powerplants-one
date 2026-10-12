import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Fraction} from './expression.ts';
const F=x=>Fraction.fromDecimal(x),ceil=x=>new Fraction((x.numerator+x.denominator-1n)/x.denominator),ledger=[];
const check=(id,fn)=>{fn();ledger.push({id,status:'PASS'});};
function allocate(total,shares){assert(total>=0n);assert.equal(shares.reduce((a,s)=>a+s.basisPoints,0),10000);assert.equal(new Set(shares.map(s=>s.key)).size,shares.length);assert(shares.every(s=>Number.isInteger(s.basisPoints)&&s.basisPoints>=0));const parts=shares.map(s=>({...s,minor:total*BigInt(s.basisPoints)/10000n,remainder:total*BigInt(s.basisPoints)%10000n}));let residual=total-parts.reduce((a,s)=>a+s.minor,0n);parts.sort((a,b)=>a.remainder!==b.remainder?(a.remainder>b.remainder?-1:1):a.tieRank-b.tieRank||(a.key<b.key?-1:1));for(const part of parts){if(residual===0n)break;part.minor++;residual--;}assert.equal(residual,0n);assert.equal(parts.reduce((a,p)=>a+p.minor,0n),total);return Object.fromEntries(parts.sort((a,b)=>a.key<b.key?-1:1).map(p=>[p.key,p.minor.toString()]));}
check('FIN-01',()=>{assert.equal(F('140').divide(F('10')).multiply(F('2')).add(F('5')).exactDecimal(),'33');assert.equal(F('145').divide(F('10')).multiply(F('2')).add(F('5')).exactDecimal(),'34');assert.equal(ceil(F('145').divide(F('10'))).multiply(F('2')).add(F('5')).exactDecimal(),'35');});
check('FIN-02',()=>{const cost=F('33').multiply(F('2')).add(F('2').multiply(F('50'))),sell=cost.divide(F('1').subtract(F('0.2'))),profit=sell.subtract(cost);assert.equal(cost.exactDecimal(),'166');assert.equal(sell.exactDecimal(),'207.5');assert.equal(profit.exactDecimal(),'41.5');assert.equal(profit.divide(sell).exactDecimal(),'0.2');assert.equal(profit.divide(cost).exactDecimal(),'0.25');assert.equal(F('33').multiply(F('2.5')).add(F('2').multiply(F('62.5'))).exactDecimal(),'207.5');});
const shares=[{key:'deposit',basisPoints:1500,tieRank:0},{key:'completion',basisPoints:8500,tieRank:1}];
check('FIN-03',()=>assert.deepEqual(allocate(20750n,shares),{completion:'17637',deposit:'3113'}));
check('FIN-04',()=>assert.deepEqual(allocate(20750n,[...shares].reverse()),allocate(20750n,shares)));
check('FIN-05',()=>assert.deepEqual(allocate(0n,shares),{completion:'0',deposit:'0'}));
check('FIN-06',()=>assert.throws(()=>allocate(20750n,[{key:'bad',basisPoints:9999,tieRank:0}])));
check('FIN-07',()=>assert.equal(F('4').multiply(F('4.5')).exactDecimal(),'18'));
check('FIN-08',()=>{assert.equal(new Date(Date.UTC(2026,11,1)-14*86400000).toISOString().slice(0,10),'2026-11-17');});
writeFileSync(new URL('./commercial-result.json',import.meta.url),JSON.stringify({passed:ledger.length,cases:ledger,limits:'Synthetic examples only; operating rates, tax, billing policy and business-day calendars are not accepted'},null,2));console.log(JSON.stringify({passed:ledger.length,cases:ledger}));
