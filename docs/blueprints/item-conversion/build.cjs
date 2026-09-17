/* Deterministic ES-07 assembly; existing standalone HTML/JS technology retained. */
const fs=process.getBuiltinModule('fs'),path=process.getBuiltinModule('path'),vm=process.getBuiltinModule('vm'),crypto=process.getBuiltinModule('crypto');
const root=path.resolve(__dirname,'../../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('docs/reference/ui/quoting/PPO-Quotation-Response-and-Negotiation-r01.html');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
if(digest(source)!=='f7f6388c90d3d9fc38c58ddf74633db1e7614d8dea9588405ebd57777c2bb879')throw Error('ES-06 source changed; review the receiving contract before rebuilding.');
const script=source.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const end=script.indexOf("'use strict';\nconst KEY='ppo-es06-response-r01'");
if(end<0)throw Error('ES-06 source boundary absent');
class FixtureDate extends Date{constructor(...args){super(...(args.length?args:['2026-09-16T01:00:00Z']))}static now(){return Date.parse('2026-09-16T01:00:00Z')}}
const context={Date:FixtureDate};vm.createContext(context);vm.runInContext(script.slice(0,end),context);
const doc=vm.runInContext('SOURCE_DOCUMENT',context),issue=vm.runInContext('ISSUED_HTML',context),issueHash=digest(issue);
context.issueHash=issueHash;
vm.runInContext(`const fixtureState=ResponseModel.seed(issueHash);const fixtureSelection=ResponseModel.defaults(SOURCE_DOCUMENT);const fixturePayload={quotation:fixtureState.quotation,revision:2,name:SOURCE_DOCUMENT.customer.contact,position:SOURCE_DOCUMENT.customer.position,email:SOURCE_DOCUMENT.customer.email,actingFor:SOURCE_DOCUMENT.customer.name,signature:SOURCE_DOCUMENT.customer.contact,consent:true,consentText:SOURCE_DOCUMENT.consentText,selection:fixtureSelection,...ResponseModel.totals(SOURCE_DOCUMENT,fixtureSelection)};const fixtureOperation=ResponseModel.submit(fixtureState,'accept',fixturePayload,issueHash,2);ResponseModel.finish(fixtureState,fixtureOperation.id,'Recorded');ResponseModel.handover(fixtureState,'Jordan · Conversion coordinator','2026-09-18','Confirm source completeness, authority and accepted-item resolution.');`,context);
const incoming={scope:'ES-06',design:'r01',synthetic:true,state:vm.runInContext('fixtureState',context),sourceProjection:doc,attachmentFilesSupplied:false,handover:vm.runInContext('fixtureState.handover',context)};
const safe=v=>JSON.stringify(v).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
const css=read('docs/reference/ui/quoting/PPO-Quotation-Approval-Issue-and-Distribution-r02.html').match(/<style>([\s\S]*?)<\/style>/)[1];
const code=`const SOURCE_DOCUMENT=${safe(doc)};\nconst EXPECTED_ISSUE_HASH=${safe(issueHash)};\nconst FIXTURE_HANDOVER=${safe(incoming)};\n`+read('docs/blueprints/quotation-lifecycle/response-model.js')+'\n'+read('docs/blueprints/item-conversion/model.js')+'\n'+read('docs/blueprints/item-conversion/ui.js');
const html=read('docs/blueprints/item-conversion/shell.html').replace('/* SHARED_STYLE */',css).replace('/* CONVERSION_STYLE */',read('docs/blueprints/item-conversion/style.css')).replace('/* CONVERSION_SCRIPT */',code);
const target='docs/reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-r01.html';fs.writeFileSync(path.join(root,target),html);
console.log(JSON.stringify({target,sha256:digest(html),sourceEs06:digest(source),issuedOutput:issueHash,fixture:'Explicit generated acceptance example; not an actual customer decision'},null,2));
