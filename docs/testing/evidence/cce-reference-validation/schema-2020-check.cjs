const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const localRequire = require('node:module').createRequire(path.join(process.cwd(), 'package.json'));
const Ajv = require('./validator/node_modules/ajv/dist/2020').default;
const addFormats = require('./validator/node_modules/ajv-formats');
const schema = JSON.parse(fs.readFileSync(path.join(__dirname, 'rule-schema.json'), 'utf8'));
const ajv = new Ajv({allErrors:true, strict:true, validateFormats:true, coerceTypes:false, useDefaults:false, removeAdditional:false});
addFormats(ajv);
assert.equal(ajv.validateSchema(schema),true,JSON.stringify(ajv.errors));
const validate = ajv.compile(schema);
const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const base = {actionId:uuid(3),outputSlot:'installation.brackets',explanation:'Synthetic bracket allowance.'};
const expression = {language:'cce-arithmetic-v1',expression:'distance_m / spacing_m * per_span + spare',
  bindings:{distance_m:'installation.distance'},parameters:{
    spacing_m:{type:'decimal',value:'10',unit:'m'},
    per_span:{type:'decimal',value:'2',unit:'each'},
    spare:{type:'decimal',value:'5',unit:'each'}}};
const rule = {schemaVersion:1,name:'Synthetic support spacing',when:{nodeId:uuid(1),kind:'all',children:[
  {nodeId:uuid(2),kind:'boolean',factId:'site.is_outdoor',operator:'IS_TRUE'}]},actions:[{
    ...base,kind:'MATERIAL_REQUIREMENT',productId:uuid(4),unit:'each',
    resolution:{group:'installation.brackets.base',policy:'HIGHEST_PRIORITY'},
    quantity:expression,rounding:{increment:'1',mode:'CEILING',stage:'AFTER_GROUP_RESOLUTION'}
  }]};
const valid = [rule,
 {...rule,actions:[{...base,kind:'LABOUR_REQUIREMENT',labourCode:'INSTALLATION',unit:'person_hours',
   resolution:{group:'installation.labour',policy:'SUM'},hours:expression,
   rounding:{increment:'0.25',mode:'CEILING',stage:'AFTER_GROUP_RESOLUTION'}}]},
 {...rule,actions:[{...base,kind:'TARGET_MARGIN',commercialScope:'estimate',costBasisPolicyId:'synthetic-cost',margin:'0.20'}]},
 {...rule,actions:[{...base,kind:'MILESTONE_PROPOSAL',milestoneKey:'inspection',name:'Inspection',anchor:'delivery',
   offsetDays:-14,calendarMode:'CALENDAR_DAYS',calendarId:null,timezone:'Australia/Brisbane',dependsOn:[]}]},
 {...rule,actions:[{...base,kind:'REVIEW_REQUIREMENT',severity:'BLOCK',message:'Resolve the installation fact.'}]}
];
for (const candidate of valid) assert.ok(validate(candidate), JSON.stringify(validate.errors));
const changes = [
 x=>{x.when.children[0]={nodeId:uuid(2),kind:'comparison',factId:'site.description',operator:'GT',value:{type:'text',value:'100'}}},
 x=>{x.when.children=[]}, x=>{x.when.unexpected=true}, x=>{x.actions=[]},
 x=>{delete x.actions[0].productId}, x=>{x.actions[0].productId='bad'},
 x=>{x.actions[0].rounding.increment='0'}, x=>{x.actions[0].quantity.expression='1'.repeat(2049)},
 x=>{x.actions[0].quantity.bindings.bad={callback:'not a fact id'}},
 x=>{x.actions[0].kind='EXECUTE_CODE'}, x=>{x.schemaVersion=99},
 x=>{x.when.children[0].operator='GT'}, x=>{x.actions[0].resolution.policy='LAST_WRITER'},
 x=>{x.actions[0].quantity.parameters.spacing_m.value=10},
 x=>{x.when={nodeId:uuid(1),kind:'not',children:[]}}, x=>{x.name=''}
];
for (const change of changes) {
 const candidate=structuredClone(rule); change(candidate);
 assert.equal(validate(candidate),false,JSON.stringify(candidate));
}
fs.writeFileSync(path.join(__dirname,'example-rule.json'),JSON.stringify(rule,null,2)+'\n');
const result={schemaDialect:schema.$schema,mode:'strict native 2020-12; formats enabled; no coercion/defaults/removal',positiveCases:valid.length,negativeCases:changes.length,ajvVersion:require('./validator/node_modules/ajv/package.json').version};
fs.writeFileSync(path.join(__dirname,'schema-result.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
