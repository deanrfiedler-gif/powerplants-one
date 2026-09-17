/* SH-03 synthetic reference model. No source-business command is exposed. */
globalThis.PPOInbox = (() => {
  'use strict';
  const today = '2026-09-16';
  const roles = {
    coordinator: {name:'Alex Morgan', modules:['Projects','Supply Chain','Service','Estimating','CRM','Documents','Warranty']},
    technician: {name:'Riley Chen', modules:['Service','Documents']}
  };
  const sources = {
    material: {id:'material',ref:'SYN-PPO-IN-000015',module:'Supply Chain',customer:'Northbank Nursery',site:'Propagation site · Glasshouse 02',title:'Review the gateway delivery impact',owner:'Alex Morgan',due:'2026-09-15',status:'Open',version:3,noticeVersion:3,required:true,next:'Confirm the supplier date and review the installation impact with the project coordinator.',reason:'A delivery promise changed after materials were needed.',route:'Material readiness → Inbound logistics → SYN-PPO-IN-000015',design:'supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html',detail:'Needed 15 Sep; revised supplier promise 18 Sep 2026. The affected visit remains unchanged.'},
    report: {id:'report',ref:'SYN-PPO-WO-000241',module:'Service',customer:'Northbank Nursery',site:'Propagation site · Irrigation room',title:'Review the technician submission',owner:'Alex Morgan',due:'2026-09-16',status:'Awaiting review',version:2,noticeVersion:2,required:true,next:'Check findings, labour, parts and remaining work in Service Review.',reason:'The assigned technician submitted the visit for review.',route:'Service Review → SYN-PPO-WO-000241 → Submission r02',design:'service-review/PPO-Service-Review-and-Reports-Workspace-r02.html',detail:'Visit completion is a technician submission. Report approval, customer acknowledgement and Finance handoff remain separate.'},
    warranty: {id:'warranty',ref:'SYN-PPO-WAR-000031',module:'Warranty',customer:'Willowbank Growers',site:'Production site · Irrigation shed',title:'Follow up the outstanding supplier response',owner:'Alex Morgan',due:null,status:'Waiting',version:1,noticeVersion:1,required:true,next:'Confirm the supplier contact and agree a follow-up date in Warranty.',reason:'Customer resolution is recorded; supplier recovery still needs an owner follow-up.',route:'Warranty → SYN-PPO-WAR-000031 → Supplier recovery',design:'warranty/PPO-Warranty-and-Customer-Resolution-Workspace-r01.html',detail:'The supplier has not confirmed recovery. Customer resolution does not close the supplier obligation.'},
    project: {id:'project',ref:'SYN-PPO-PRJ-000084',module:'Projects',customer:'Coastal Berry Co.',site:'East farm · Tunnel block 03',title:'Access arrangements updated',owner:'Casey Reed',due:'2026-09-18',status:'Open',version:4,noticeVersion:4,required:false,next:'Review the revised access notes before preparing the visit.',reason:'You follow this project.',route:'Project delivery → SYN-PPO-PRJ-000084 → Readiness',design:'projects/PPO-Project-Delivery-Readiness-and-Change-Control-r02.html',detail:'The gate contact and visitor briefing have changed. The proposed access window still requires confirmation.'},
    estimate: {id:'estimate',ref:'SYN-PPO-EST-000062',module:'Estimating',customer:'Highfield Horticulture',site:'Main site · Screen bay 01',title:'Estimate option has a newer revision',owner:'Casey Reed',due:'2026-09-17',status:'Review needed',version:3,noticeVersion:2,required:false,next:'Refresh the target and review option r03. The old notice remains in history.',reason:'You were mentioned on estimate option r02.',route:'Estimating → SYN-PPO-EST-000062 → Option r03',design:'estimation-wizard/PPO-Wizard-Data-Review-r02.html',detail:'The notice refers to r02; the current reference snapshot is r03. No old review decision carries forward.'},
    crm: {id:'crm',ref:'SYN-PPO-OP-000108',module:'CRM',customer:'Fern Valley Nursery',site:'Main site',title:'Customer discussion recorded',owner:'Casey Reed',due:null,status:'Open',version:1,noticeVersion:1,required:false,next:'Read the opportunity activity before the next customer conversation.',reason:'You follow this opportunity.',route:'CRM → SYN-PPO-OP-000108 → Activities',design:'crm/ppo-deal-pipeline_r35.html',detail:'A discussion note was added. No stage, value or close-date decision is implied.'},
    document: {id:'document',ref:'SYN-PPO-PACK-000042',module:'Documents',customer:'Northbank Nursery',site:'Propagation site',title:'Job pack r02 is available',owner:'Riley Chen',due:'2026-09-17',status:'Acknowledgement required',version:2,noticeVersion:2,required:true,next:'Open the exact issued pack and acknowledge it in Job Packs.',reason:'You are on the pack distribution list.',route:'Job Packs → SYN-PPO-PACK-000042 → Issued r02',design:'job-pack/powerplants-one-job-pack-r03.html',detail:'Reading this notice is not pack acknowledgement. Issued bytes and acknowledgement belong to the exact document revision.'},
    removed: {id:'removed',ref:'SYN-PPO-NOT-000010',module:'CRM',title:'Source is no longer available',owner:null,due:null,status:'Unavailable',version:1,noticeVersion:1,required:false,unavailable:true,reason:'A previously visible reference is unavailable. No source details are shown.'}
  };
  const event = (id,source,title,body,time,category='Changes',before='',after='') => ({id,source,title,body,time,category,before,after});
  const initialEvents = [
    event('n01','material','Gateway delivery moved beyond the required date','An impact review is assigned to you.','2026-09-16T01:42:00Z','Owned work','Supplier promise · 15 Sep','Supplier promise · 18 Sep'),
    event('n02','report','Technician submission r02 is ready for review','Review findings and remaining work for Northbank.','2026-09-16T01:25:00Z','Owned work'),
    event('n03','project','Visitor briefing added','The project access notes now include a briefing.','2026-09-16T00:50:00Z','Changes','Briefing · Not recorded','Briefing · Required on arrival'),
    event('n04','project','Gate contact changed','Check the access contact before the visit.','2026-09-16T00:35:00Z','Changes','Gate contact · Site office','Gate contact · Duty supervisor'),
    event('n05','estimate','You were mentioned on estimate option r02','A newer option is available; check the revision before reviewing.','2026-09-16T00:05:00Z','Mentions'),
    event('n06','warranty','Supplier recovery still needs a follow-up date','Customer resolution is recorded. Recovery remains outstanding.','2026-09-15T23:30:00Z','Owned work'),
    event('n07','material','Supplier advice received','A revised delivery promise was captured.','2026-09-15T22:45:00Z','Owned work'),
    event('n08','document','A new job pack revision is available','Open the issued pack to review and acknowledge r02.','2026-09-15T05:30:00Z','Documents'),
    event('n09','crm','Customer discussion added','An activity note is available on the opportunity.','2026-09-15T03:10:00Z','Changes'),
    event('n10','removed','Source is no longer available','This notice cannot open its original source.','2026-09-14T02:20:00Z','Changes')
  ];
  const defaultPrefs = () => ({channels:{'Owned work':'Immediate','Changes':'Digest','Mentions':'Immediate','Documents':'Digest'},cadence:'Daily',time:'08:00',day:'Monday',zone:'Australia/Brisbane',quiet:true,start:'18:00',end:'08:00',group:true});
  const initial = () => ({schema:1,revision:0,events:structuredClone(initialEvents),people:{coordinator:{read:['n07','n08','n09'],archive:['n09'],prefs:defaultPrefs()},technician:{read:[],archive:[],prefs:defaultPrefs()}},history:[]});
  const available = (state,role,scenario='live') => {
    if (['failed','empty'].includes(scenario)) return [];
    return state.events.filter(e=>roles[role].modules.includes(sources[e.source].module) && !(scenario==='partial' && sources[e.source].module==='Service'));
  };
  const activeRequired = e => sources[e.source].required && !['Completed','Closed'].includes(sources[e.source].status);
  const groups = events => Array.from(new Set(events.map(e=>e.source))).map(id=>({source:sources[id],events:events.filter(e=>e.source===id)}));
  const escalations = (state,role,scenario) => groups(available(state,role,scenario)).filter(g=>g.source.required && g.source.owner===roles[role].name && !['Completed','Closed'].includes(g.source.status));
  const dueLabel = s => !s.due ? 'Date needed' : s.due < today ? 'Overdue' : s.due === today ? 'Due today' : 'Upcoming';
  function apply(state,role,command) {
    const next=structuredClone(state), person=next.people[role];
    if (!person) throw Error('Unknown preview identity.');
    const permitted=available(state,role), ids=command.ids||[];
    if (ids.some(id=>!permitted.some(e=>e.id===id))) throw Error('This selection is no longer available.');
    if (command.type==='read') person.read=[...new Set([...person.read,...ids])];
    else if (command.type==='unread') person.read=person.read.filter(id=>!ids.includes(id));
    else if (command.type==='archive') {
      if (ids.some(id=>activeRequired(permitted.find(e=>e.id===id)))) throw Error('An active required notice stays in your inbox. Open its source to progress the work.');
      person.archive=[...new Set([...person.archive,...ids])];
    } else if(command.type==='restore') person.archive=person.archive.filter(id=>!ids.includes(id));
    else if(command.type==='prefs') {validatePrefs(command.prefs);person.prefs=structuredClone(command.prefs);}
    else if(command.type==='new-event') {
      if(!next.events.some(e=>e.id==='n11')) next.events.unshift(event('n11','project','Access window still awaiting confirmation','The latest change remains unread even after earlier changes were read.','2026-09-16T02:00:00Z','Changes','Window · Proposed','Window · Awaiting customer confirmation'));
    } else throw Error('Unsupported notification command.');
    if (JSON.stringify(next)===JSON.stringify(state)) return next;
    next.revision++;next.history.push({type:command.type,actor:roles[role].name,ids:[...ids],revision:next.revision});
    return next;
  }
  function validatePrefs(p) {
    if (!p || !p.channels || Object.keys(defaultPrefs().channels).some(k=>!['Immediate','Digest','Off'].includes(p.channels[k]))) throw Error('Choose a valid email option for each category.');
    if (!['Daily','Weekly'].includes(p.cadence)||!['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].includes(p.day)||!['Australia/Brisbane','Australia/Perth'].includes(p.zone)) throw Error('Choose a valid digest schedule and time zone.');
    for(const k of ['time','start','end']) if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(p[k])) throw Error('Enter valid times.');
    if(typeof p.quiet!=='boolean'||typeof p.group!=='boolean') throw Error('Invalid preference switches.');
    if(p.quiet && p.start===p.end) throw Error('Quiet hours need different start and end times.');
  }
  function validateState(s) {
    if(!s||s.schema!==1||!Number.isInteger(s.revision)||s.revision<0||!Array.isArray(s.events)||s.events.length>11||!Array.isArray(s.history)) throw Error('Unsupported saved preview.');
    const allowed=apply(initial(),'coordinator',{type:'new-event'}).events;
    if(s.events.length<10||new Set(s.events.map(e=>e.id)).size!==s.events.length||s.events.some(e=>JSON.stringify(e)!==JSON.stringify(allowed.find(x=>x.id===e.id)))) throw Error('Saved preview records could not be verified.');
    for(const role of Object.keys(roles)) {
      const p=s.people?.[role];if(!p||!Array.isArray(p.read)||!Array.isArray(p.archive)) throw Error('Saved personal state is incomplete.');
      if([...p.read,...p.archive].some(id=>!s.events.some(e=>e.id===id))) throw Error('Saved notice references are invalid.');
      if(p.archive.some(id=>activeRequired(s.events.find(e=>e.id===id)))) throw Error('Saved required notices cannot be archived.');
      validatePrefs(p.prefs);
    }
    return s;
  }
  const quietAt=(p,time)=>p.quiet && (p.start<p.end ? time>=p.start && time<p.end : time>=p.start || time<p.end);
  function delivery(state,role,clock='19:30',scenario='live') {
    const p=state.people[role],pref=p.prefs;
    return available(state,role,scenario).filter(e=>!p.read.includes(e.id)&&!p.archive.includes(e.id)&&!sources[e.source].unavailable).map(e=>({event:e,source:sources[e.source],result:pref.channels[e.category]==='Off'?'Email off':pref.channels[e.category]==='Digest'?'Next digest':quietAt(pref,clock)?'After quiet hours':'Immediate email preview'}));
  }
  return {today,roles,sources,initial,available,groups,escalations,dueLabel,activeRequired,apply,validatePrefs,validateState,quietAt,delivery};
})();
