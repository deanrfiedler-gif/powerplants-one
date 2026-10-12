// Bounded synthetic research harness. Unsupported rule features fail closed.
// This is not the PPO service, authorization layer, or complete CCE language.
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {compileFormula,evaluateFormula,Fraction,CceError} from './expression.ts';
const require=createRequire(import.meta.url);
const Ajv=require('./validator/node_modules/ajv/dist/2020').default;
const addFormats=require('./validator/node_modules/ajv-formats');
const ajv=new Ajv({strict:true,allErrors:true,coerceTypes:false,removeAdditional:false,useDefaults:false});addFormats(ajv);
const structural=ajv.compile(JSON.parse(readFileSync(new URL('./rule-schema.json',import.meta.url),'utf8')));
const bad=(code,message=code)=>{throw new CceError(code,message);};
const dims={m:[1,0,0],each:[0,0,1],person_hours:[0,1,0],dimensionless:[0,0,0]};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function stable(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(stable).join(',')+']';return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';}
export const hash=value=>createHash('sha256').update(stable(value)).digest('hex');
const F=x=>Fraction.fromDecimal(x);
const cmp=(a,b)=>{const n=a.numerator*b.denominator-b.numerator*a.denominator;return n<0n?-1:n>0n?1:0;};
function quantize(value,increment,mode){const step=F(increment);if(step.numerator<=0n||value.numerator<0n)bad('ROUNDING_DOMAIN');const units=value.divide(step),n=units.numerator,d=units.denominator,q=n/d,r=n%d;let k=q;if(mode==='CEILING'&&r>0n)k++;else if(mode==='HALF_UP'&&2n*r>=d)k++;else if(mode==='HALF_EVEN'&&(2n*r>d||(2n*r===d&&q%2n===1n)))k++;else if(!['FLOOR','CEILING','HALF_UP','HALF_EVEN'].includes(mode))bad('ROUNDING_MODE');return new Fraction(k).multiply(step);}
function dimension(node,symbols){if(node.kind==='literal')return dims.dimensionless;if(node.kind==='fact')return symbols.get(node.name);if(node.kind==='unary')return dimension(node.value,symbols);const a=dimension(node.left,symbols),b=dimension(node.right,symbols);if(node.op==='+'||node.op==='-'){if(!same(a,b))bad('UNIT_MISMATCH');return a;}return a.map((x,i)=>x+(node.op==='*'?b[i]:-b[i]));}
function prepare(rule,dictionary){if(!Number.isInteger(rule.priority)||rule.priority<0||rule.priority>100000)bad('PRIORITY_INVALID');const envelope=[{value:rule.definition,depth:0}];let envelopeNodes=0;while(envelope.length){const {value,depth}=envelope.pop();if(++envelopeNodes>4096||depth>32)bad('DEFINITION_LIMIT');if(value&&typeof value==='object')for(const child of Object.values(value))envelope.push({value:child,depth:depth+1});}if(Buffer.byteLength(JSON.stringify(rule.definition))>262144)bad('DEFINITION_LIMIT');if(!structural(rule.definition))bad('RULE_SCHEMA_INVALID');const ids=new Set(),pending=[{node:rule.definition.when,depth:0}];let count=0;
 while(pending.length){const {node,depth}=pending.pop();if(++count>200||depth>8)bad('CONDITION_LIMIT');if(ids.has(node.nodeId))bad('DUPLICATE_NODE_ID');ids.add(node.nodeId);
  if(['all','any'].includes(node.kind)){for(const child of node.children)pending.push({node:child,depth:depth+1});}
  else if(node.kind==='not')pending.push({node:node.child,depth:depth+1});
  else{if(!['boolean','comparison'].includes(node.kind))bad('PROFILE_UNSUPPORTED');const fact=dictionary[node.factId];if(!fact)bad('FACT_UNKNOWN');if(node.kind==='boolean'){if(fact.type!=='boolean')bad('OPERATOR_TYPE');if(!['IS_TRUE','IS_FALSE'].includes(node.operator))bad('PROFILE_UNSUPPORTED');}
   else if(node.kind==='comparison'){if(!['decimal','integer'].includes(fact.type)||!['decimal','integer'].includes(node.value.type))bad('OPERATOR_TYPE');if(node.value.unit!==fact.unit)bad('UNIT_MISMATCH');F(node.value.value);}
   else bad('PROFILE_UNSUPPORTED');}
 }
 const actions=rule.definition.actions.map(action=>{if(ids.has(action.actionId))bad('DUPLICATE_ACTION_ID');ids.add(action.actionId);if(action.kind!=='MATERIAL_REQUIREMENT')bad('PROFILE_UNSUPPORTED');if(action.rounding.stage!=='AFTER_GROUP_RESOLUTION')bad('PROFILE_UNSUPPORTED');if(!dims[action.unit])bad('UNIT_UNKNOWN');
  const spec=action.quantity,values=new Map(),dimensions=new Map();for(const [symbol,id] of Object.entries(spec.bindings)){const fact=dictionary[id];if(!fact||!['decimal','integer'].includes(fact.type)||!dims[fact.unit])bad('FACT_TYPE');dimensions.set(symbol,dims[fact.unit]);}
  for(const [symbol,parameter] of Object.entries(spec.parameters)){if(dimensions.has(symbol))bad('SYMBOL_COLLISION');if(!dims[parameter.unit])bad('UNIT_UNKNOWN');dimensions.set(symbol,dims[parameter.unit]);values.set(symbol,parameter.value);F(parameter.value);}
  const compiled=compileFormula(spec.expression,new Set(dimensions.keys()));if(!same(dimension(compiled.tree,dimensions),dims[action.unit]))bad('UNIT_MISMATCH');return {action,compiled,values};});return {rule,actions};
}
function condition(node,cfo,trace){let result;if(node.kind==='all'||node.kind==='any'){const xs=node.children.map(x=>condition(x,cfo,trace));result=node.kind==='all'?(xs.includes(false)?false:xs.includes(null)?null:true):(xs.includes(true)?true:xs.includes(null)?null:false);}
 else if(node.kind==='not'){const value=condition(node.child,cfo,trace);result=value===null?null:!value;}
 else{const fact=cfo[node.factId];if(!fact||fact.state!=='CONFIRMED'){result=null;}else if(node.kind==='boolean'){if(typeof fact.value!=='boolean')bad('FACT_TYPE');result=node.operator==='IS_TRUE'?fact.value:!fact.value;}else{const c=cmp(F(fact.value),F(node.value.value));const operations={EQ:c===0,NEQ:c!==0,GT:c>0,GTE:c>=0,LT:c<0,LTE:c<=0};if(!(node.operator in operations))bad('PROFILE_UNSUPPORTED');result=operations[node.operator];}}
 trace.push({nodeId:node.nodeId,factId:node.factId??null,input:node.factId?(cfo[node.factId]??null):null,result});return result;
}
export function calculate({rules,dictionary,cfo,costs,overrides=[],margin='0.20'}){try{
 if(rules.length>1000)bad('RULE_LIMIT');const identities=new Set();for(const rule of rules){if(identities.has(rule.id))bad('DUPLICATE_RULE');identities.add(rule.id);}
 const prepared=[...rules].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0).map(x=>prepare(x,dictionary));const trace=[],contributions=[];
 for(const {rule,actions} of prepared){const nodes=[],pass=condition(rule.definition.when,cfo,nodes);trace.push({ruleId:rule.id,version:rule.version,pass,nodes});if(pass===null)bad('FACT_UNKNOWN');if(!pass)continue;
  for(const {action,compiled,values} of actions){const bindings=new Map(values);for(const [symbol,id] of Object.entries(action.quantity.bindings)){const fact=cfo[id];if(!fact||fact.state!=='CONFIRMED')bad('FACT_UNKNOWN');bindings.set(symbol,fact.value);}
   const exact=evaluateFormula(compiled,bindings);if(exact.numerator<0n)bad('NEGATIVE_QUANTITY');contributions.push({ruleId:rule.id,version:rule.version,priority:rule.priority,action,exact,substitutions:Object.fromEntries(bindings)});}
 }
 const groups=new Map();for(const c of contributions){const key=stable([c.action.outputSlot,c.action.productId,c.action.unit,c.action.resolution.group]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c);}
 const lines=new Map(),resolution=[];
 for(const [key,cs] of [...groups].sort(([a],[b])=>a<b?-1:1)){const policy=cs[0].action.resolution.policy,rounding=cs[0].action.rounding;if(cs.some(c=>c.action.resolution.policy!==policy||!same(c.action.rounding,rounding)))bad('GROUP_POLICY_CONFLICT');let winners;
  if(policy==='SUM')winners=cs;else if(policy==='UNIQUE'){if(cs.length!==1)bad('RULE_CONFLICT');winners=cs;}else if(policy==='HIGHEST_PRIORITY'){const max=Math.max(...cs.map(x=>x.priority));winners=cs.filter(c=>c.priority===max);if(winners.length!==1)bad('RULE_CONFLICT');}else bad('PROFILE_UNSUPPORTED');
  const quantity=quantize(winners.reduce((a,c)=>a.add(c.exact),F('0')),rounding.increment,rounding.mode),a=cs[0].action,lineKey=stable([a.outputSlot,a.productId,a.unit]);
  const line=lines.get(lineKey)??{lineKey,productId:a.productId,unit:a.unit,quantity:F('0')};line.quantity=line.quantity.add(quantity);lines.set(lineKey,line);
  resolution.push({group:key,policy,winnerIds:winners.map(x=>x.ruleId),loserIds:cs.filter(x=>!winners.includes(x)).map(x=>x.ruleId),expressions:winners.map(x=>({formula:x.action.quantity.expression,substitutions:x.substitutions})),rounding,exact:winners.map(x=>x.exact.evidence()),quantity:quantity.evidence()});
 }
 const base=[...lines.values()].sort((a,b)=>a.lineKey<b.lineKey?-1:1).map(x=>({...x,quantity:x.quantity.exactDecimal()}));if(base.some(x=>x.quantity===null))bad('RECEIVING_PRECISION');const baseHash=hash({base,rules:prepared.map(x=>x.rule),dictionary,cfo,costs,margin}),effective=structuredClone(base),overrideTargets=new Set();
 for(const override of overrides){if(override.basisHash!==baseHash)bad('OVERRIDE_REBASE_REQUIRED');if(!override.reason?.trim())bad('OVERRIDE_REASON_REQUIRED');if(overrideTargets.has(override.lineKey))bad('OVERRIDE_CONFLICT');overrideTargets.add(override.lineKey);const i=effective.findIndex(x=>x.lineKey===override.lineKey);if(i<0)bad('OVERRIDE_ORPHAN');if(override.kind==='SUPPRESS')effective.splice(i,1);else if(override.kind==='SET_QUANTITY'){const q=F(override.quantity);if(q.numerator<0n)bad('NEGATIVE_QUANTITY');effective[i].quantity=q.exactDecimal();}else bad('PROFILE_UNSUPPORTED');}
 let total=F('0');for(const line of effective){const source=costs[line.productId];if(!source||source.currency!=='AUD'||source.unit!==line.unit)bad('COST_BASIS_INVALID');const unitCost=F(source.unitCost);if(unitCost.numerator<0n)bad('COST_BASIS_INVALID');line.cost=quantize(F(line.quantity).multiply(unitCost),'0.01','HALF_UP').exactDecimal();total=total.add(F(line.cost));}
 const m=F(margin);if(m.numerator<0n||cmp(m,F('1'))>=0)bad('MARGIN_INVALID');const sell=quantize(total.divide(F('1').subtract(m)),'0.01','HALF_UP');
 return {status:'READY',baseHash,base,effective,trace,resolution,cost:total.exactDecimal(),sell:sell.exactDecimal(),currency:'AUD',evidenceHash:hash({base,effective,trace,resolution,margin,cfo,costs,overrides})};
 }catch(error){if(error instanceof CceError)return {status:'BLOCKED',code:error.code};throw error;}}

export function assertAcyclic(edges){const names=new Set(edges.flat()),degree=new Map([...names].map(n=>[n,0])),next=new Map([...names].map(n=>[n,[]]));for(const [a,b] of edges){degree.set(b,degree.get(b)+1);next.get(a).push(b);}const pending=[...names].filter(n=>degree.get(n)===0).sort();let seen=0;while(pending.length){const a=pending.shift();seen++;for(const b of next.get(a)){degree.set(b,degree.get(b)-1);if(degree.get(b)===0){pending.push(b);pending.sort();}}}if(seen!==names.size)bad('DEPENDENCY_CYCLE');}

export class SyntheticDelivery {
 constructor(){this.state='READY';this.remote=new Map();this.submissions=0;this.operation='synthetic-original';this.payloadHash=null;}
 submit(payload,{loseResponse=false}={}){const digest=hash(payload);if(this.payloadHash&&this.payloadHash!==digest)bad('OPERATION_CONFLICT');if(this.state==='UNKNOWN')bad('RECONCILIATION_REQUIRED');if(this.state==='CONFIRMED')return this.remote.get(this.operation);this.payloadHash=digest;this.submissions++;const record={id:'synthetic-remote',payloadHash:digest};this.remote.set(this.operation,record);this.state=loseResponse?'UNKNOWN':'CONFIRMED';return loseResponse?null:record;}
 reconcile(){const record=this.remote.get(this.operation);if(!record||record.payloadHash!==this.payloadHash)bad('RECONCILIATION_REQUIRED');this.state='CONFIRMED';return record;}
}
