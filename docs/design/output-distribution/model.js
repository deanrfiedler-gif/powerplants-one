/* DK-03. Fictional outputs, issues, recipients and evidence; no provider, message or business write. */
(() => {
  const AS_AT = '2026-09-17';
  const PEOPLE = {coordinator:'Alex Morgan', issuer:'Sam Taylor', distributor:'Jordan Lee', technician:'Riley Chen', finance:'Morgan Ellis', viewer:'Casey Brook'};
  const ROLES = {coordinator:'Output coordinator', issuer:'Domain reviewer / issuer', distributor:'Distribution coordinator', technician:'Service technician / recipient', finance:'Finance reviewer', viewer:'Read-only viewer'};
  const clone = value => JSON.parse(JSON.stringify(value));

  /* Content identity. Hashes are computed from the actual encoded bytes this file can produce,
     never from a fixture literal, so a displayed hash can be checked against a real download. */
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const encode = text => new TextEncoder().encode(text);
  function sha256(text) {
    const data = encode(text), bits = data.length * 8, padded = new Uint8Array(Math.ceil((data.length + 9) / 64) * 64);
    padded.set(data); padded[data.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 8, Math.floor(bits / 4294967296)); view.setUint32(padded.length - 4, bits >>> 0);
    const h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19], w = new Uint32Array(64), rot = (x,n) => (x >>> n) | (x << (32 - n));
    for (let i = 0; i < padded.length; i += 64) {
      for (let t = 0; t < 16; t++) w[t] = view.getUint32(i + t * 4);
      for (let t = 16; t < 64; t++) { const a = w[t-15], b = w[t-2]; w[t] = (w[t-16] + (rot(a,7)^rot(a,18)^(a>>>3)) + w[t-7] + (rot(b,17)^rot(b,19)^(b>>>10))) >>> 0; }
      let [a,b,c,d,e,f,g,x] = h;
      for (let t = 0; t < 64; t++) {
        const t1 = (x + (rot(e,6)^rot(e,11)^rot(e,25)) + ((e & f) ^ (~e & g)) + K[t] + w[t]) >>> 0;
        const t2 = ((rot(a,2)^rot(a,13)^rot(a,22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        x = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      const next = [a,b,c,d,e,f,g,x];
      for (let t = 0; t < 8; t++) h[t] = (h[t] + next[t]) >>> 0;
    }
    return h.map(v => v.toString(16).padStart(8, '0')).join('');
  }
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rev = n => `r${String(n).padStart(2, '0')}`;

  /* Authored document bytes. One deterministic function produces every previewed, downloaded and hashed item. */
  function itemContent(output, revision, item, identity) {
    const head = [['Output reference', output.ref], ['Output type', `${output.type} · ${output.typeName}`], ['Document', item.title], ['Content revision', rev(revision)], ['Issue purpose', identity.purpose], ...(item.purpose && item.purpose !== identity.purpose ? [['Document purpose', item.purpose]] : []), ['Customer / site', `${output.customer} · ${output.site}`], ['Location', output.location], ['Classification', output.classification], ['Issue reference', identity.ref], ['Prepared at', identity.preparedAt]];
    return ['<!doctype html>', '<html lang="en-AU"><head><meta charset="utf-8">', `<title>${escapeHtml(output.ref)} ${rev(revision)} — ${escapeHtml(item.title)}</title>`, '</head><body>', `<h1>${escapeHtml(item.title)}</h1>`, '<p class="classification">Synthetic prototype — not for operational use.</p>', '<dl>', ...head.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`), '</dl>', ...item.sections.map(([k, t]) => `<section><h2>${escapeHtml(k)}</h2><p>${escapeHtml(t)}</p></section>`), '<footer>Authored synthetic content. This file is not an approved controlled PDF, an operational instruction or a customer contract.</footer>', '</body></html>', ''].join('\n');
  }
  function itemIdentity(output, revision, item, identity) {
    if (item.availability !== 'Available') return {availability:item.availability, bytes:null, hash:null, filename:null};
    const content = itemContent(output, revision, item, identity);
    return {availability:'Available', bytes:encode(content).length, hash:sha256(content), filename:`${item.id}-${rev(revision)}-synthetic.html`};
  }

  const item = (id, title, purpose, sections, availability = 'Available') => ({id, title, purpose, sections, availability});
  const person = (id, name, organisation, role, destination, channel, capability) => ({id, name, organisation, role, destination, channel, capability});
  /* capability: what the simulated channel can evidence. 'delivery' supports Delivered; 'send-only' cannot. */

  const OUTPUTS = [
    {id:'quotation', ref:'SYN-PPO-QUO-000031', type:'OUT-06', typeName:'Customer quotation', title:'Irrigation upgrade — customer quotation', domain:'Estimating', owner:'Alex Morgan', customer:'Northbank Nursery', site:'North Site', location:'Greenhouse 01 · Compartments A and B', linked:'SYN-PPO-DEAL-000012 · SYN-PPO-PRJ-000021', classification:'Commercial', audienceName:'Named customer recipients', policy:'Commercial quotation release policy v4 (fictional)', template:{id:'TPL-OUT-06', version:3}, sourceRef:'SYN-PPO-EST-000044 r03', sourceState:'Available', sourceReviewed:{ref:'SYN-PPO-EST-000044 r03', decision:'SYN-PPO-DEC-000171', purpose:'Approved commercial basis', actor:'Jordan Lee', at:'2026-09-02'}, evidence:[['Approved scope and terms','Met','Commercial approval SYN-PPO-DEC-000171.'], ['Validity and exclusions','Met','Stated in the issued offer.']], audienceApproved:true, sourceChanged:false, distributable:true, responseKind:'Receipt acknowledgement', responseNote:'Receipt acknowledgement is not quotation acceptance. ES-06 owns customer response and negotiation.',
      issues:[{id:'quotation-r02', ref:'SYN-PPO-ISS-000311', revision:2, purpose:'Approved commercial offer', preparedAt:'2026-09-02T23:41:00Z', issuedAt:'2026-09-03T00:04:00Z', issuer:'Jordan Lee', decision:'SYN-PPO-DEC-000171', basis:[['Business revision','Quotation r02'], ['Estimate source','SYN-PPO-EST-000044 r03'], ['Template','TPL-OUT-06 v3'], ['Selected options','Option B — two-compartment supply']],
        items:[item('SYN-PPO-QUO-000031','Irrigation upgrade quotation','Approved commercial offer',[['Offered scope','Fictional supply and installation of irrigation distribution for Compartments A and B.'], ['Exclusions','Civil works, grower production control and out-of-hours attendance are excluded.'], ['Validity','This synthetic offer is shown as valid for 30 days from its issue date.'], ['Acceptance','Acceptance is a separate customer decision recorded by the owning commercial module.']])],
        recipients:[person('quote-buyer','Priya Raman','Northbank Nursery','Owner · approved signatory','priya.raman@northbank.example','Email · simulated','delivery'), person('quote-ops','Elliot Vance','Northbank Nursery','Operations manager','elliot.vance@northbank.example','Email · simulated','delivery'), person('quote-adviser','Nadia Cole','Fernmoor Advisory','Customer adviser · approved copy','nadia.cole@fernmoor.example','Email · simulated','delivery')],
        attempts:[{id:'a-quote-1', recipient:'quote-buyer', at:'2026-09-03T00:11:00Z', actor:'Jordan Lee', outcome:'Delivered', evidence:'Simulated provider delivery receipt SYN-PPO-EV-000120'}, {id:'a-quote-2', recipient:'quote-ops', at:'2026-09-03T00:11:00Z', actor:'Jordan Lee', outcome:'Delivered', evidence:'Simulated provider delivery receipt SYN-PPO-EV-000121'}, {id:'a-quote-3', recipient:'quote-adviser', at:'2026-09-03T00:11:00Z', actor:'Jordan Lee', outcome:'Outcome unknown', evidence:'No provider result was returned for this original attempt.'}],
        responses:[{id:'rs-quote-1', recipient:'quote-buyer', response:'Receipt acknowledged', at:'2026-09-03T06:20:00Z', respondent:'Priya Raman', capturedBy:'Jordan Lee', strength:'Explicit reply to the exact issued presentation', remarks:'Confirms receipt of the r02 offer. Commercial acceptance is not recorded here.'}]}]},

    {id:'drawings', ref:'SYN-PPO-TRX-000052', type:'OUT-08', typeName:'Design / transmittal package', title:'Irrigation upgrade — drawing transmittal', domain:'Engineering', owner:'Sam Taylor', customer:'Northbank Nursery', site:'North Site', location:'Greenhouse 01 · Compartments A and B', linked:'SYN-PPO-PRJ-000021', classification:'Internal technical', audienceName:'Approved internal and installer recipients', policy:'Engineering transmittal policy v2 (fictional)', template:{id:'TPL-OUT-08', version:2}, sourceRef:'SYN-PPO-DOC-000101 r02 · SYN-PPO-DOC-000104 r01', sourceState:'Available', sourceReviewed:{ref:'SYN-PPO-DOC-000101 r03', decision:'SYN-PPO-DEC-000188', purpose:'Technical installation planning', actor:'Sam Taylor', at:'2026-09-16'}, evidence:[['Technical approval for the stated purpose','Met','Engineering decision SYN-PPO-DEC-000188.'], ['Exact manifest agreed','Met','Three fictional items listed for the successor set.']], audienceApproved:true, sourceChanged:false, distributable:true, responseKind:'Transmittal receipt', responseNote:'Issued for construction and issued for review are different purposes and are never interchangeable.',
      successor:{revision:3, change:'Drawing SYN-PPO-DOC-000101 advances to r03 with separate isolation points. The schedule and the second drawing are unchanged and are reissued in the same set.', purpose:'Issued for construction', basis:[['Business revision','Transmittal r03'], ['Technical source','SYN-PPO-DOC-000101 r03'], ['Unchanged source','SYN-PPO-DOC-000104 r01'], ['Template','TPL-OUT-08 v2']], items:['drawing-101-r03', 'drawing-104-r01', 'schedule-r03'], recipients:['trx-installer','trx-engineer']},
      issues:[{id:'drawings-r01', ref:'SYN-PPO-ISS-000320', revision:1, purpose:'Issued for review', preparedAt:'2026-08-21T01:02:00Z', issuedAt:'2026-08-21T01:15:00Z', issuer:'Sam Taylor', decision:'SYN-PPO-DEC-000150', basis:[['Business revision','Transmittal r01'], ['Technical source','SYN-PPO-DOC-000101 r01'], ['Template','TPL-OUT-08 v2']],
        items:[item('SYN-PPO-DOC-000101','Irrigation layout — Greenhouse 01','Issued for review',[['Historical scope','The original surveyed arrangement for this fictional site.']], 'Missing exact item'), item('SYN-PPO-SCH-000052','Irrigation component schedule','Issued for review',[['Schedule','Fictional component listing at the review issue.']])],
        recipients:[person('trx-engineer','Marc Oyelaran','Powerplants Australia','Design engineer','marc.oyelaran@example','Internal workspace · simulated','delivery')],
        attempts:[{id:'a-trx-0', recipient:'trx-engineer', at:'2026-08-21T01:16:00Z', actor:'Sam Taylor', outcome:'Delivered', evidence:'Simulated workspace delivery receipt SYN-PPO-EV-000090'}], responses:[]},
        {id:'drawings-r02', ref:'SYN-PPO-ISS-000324', revision:2, purpose:'Issued for construction', preparedAt:'2026-09-04T22:50:00Z', issuedAt:'2026-09-04T23:06:00Z', issuer:'Sam Taylor', decision:'SYN-PPO-DEC-000163', basis:[['Business revision','Transmittal r02'], ['Technical source','SYN-PPO-DOC-000101 r02'], ['Unchanged source','SYN-PPO-DOC-000104 r01'], ['Template','TPL-OUT-08 v2']],
        items:[item('SYN-PPO-DOC-000101','Irrigation layout — Greenhouse 01','Issued for construction',[['Scope','Greenhouse 01, Compartments A and B; Irrigation Shed 01 pump supply.'], ['Isolation','One shared isolation point is recorded at Irrigation Shed 01.']]), item('SYN-PPO-DOC-000104','Irrigation shed arrangement','Issued for construction',[['Scope','Fictional shed arrangement for the pump supply.']]), item('SYN-PPO-SCH-000052','Irrigation component schedule','Issued for construction',[['Schedule','Fictional component listing at the construction issue.']])],
        recipients:[person('trx-installer','Hana Brooks','Redgum Installations','Installation supervisor','hana.brooks@redgum.example','Email · simulated','delivery'), person('trx-engineer','Marc Oyelaran','Powerplants Australia','Design engineer','marc.oyelaran@example','Internal workspace · simulated','delivery')],
        attempts:[{id:'a-trx-1', recipient:'trx-installer', at:'2026-09-04T23:12:00Z', actor:'Sam Taylor', outcome:'Delivered', evidence:'Simulated provider delivery receipt SYN-PPO-EV-000101'}, {id:'a-trx-2', recipient:'trx-engineer', at:'2026-09-04T23:12:00Z', actor:'Sam Taylor', outcome:'Delivered', evidence:'Simulated workspace delivery receipt SYN-PPO-EV-000102'}], responses:[]}]},

    {id:'pack', ref:'SYN-PPO-PACK-000081', type:'OUT-09', typeName:'Technician job pack', title:'Irrigation installation — technician job pack', domain:'Service', owner:'Riley Chen', customer:'Northbank Nursery', site:'North Site', location:'Greenhouse 01 · Compartments A and B', linked:'SYN-PPO-WO-000063 · appointment SYN-PPO-APT-000044', classification:'Service', audienceName:'Assigned crew for this appointment', policy:'Service pack issue policy v3 (fictional)', template:{id:'TPL-OUT-09', version:2}, sourceRef:'SYN-PPO-DOC-000101 r02', sourceState:'Available', sourceReviewed:{ref:'SYN-PPO-DOC-000101 r03', decision:'SYN-PPO-DEC-000188', purpose:'Technical installation planning', actor:'Sam Taylor', at:'2026-09-16'}, evidence:[['Appointment and crew assignments','Met','Appointment SYN-PPO-APT-000044 with three fictional assignments.'], ['Site controls and access','Met','Retained from the checked preparation.'], ['Parts and collection','Met','Fictional collection reference SYN-PPO-COL-000018.']], audienceApproved:true, sourceChanged:false, distributable:true, responseKind:'Per-assignment acknowledgement', responseNote:'Acknowledging a pack does not authorise attendance or work. Service retains dispatch authority.',
      successor:{revision:5, change:'Adopts the separate Compartment A and B isolation points from drawing r03, updates the isolation task sequence and adds the revised access position to the site controls.', purpose:'Authorised work preparation', basis:[['Business revision','Pack r05'], ['Technical source','SYN-PPO-DOC-000101 r03'], ['Work order','SYN-PPO-WO-000063'], ['Appointment','SYN-PPO-APT-000044'], ['Template','TPL-OUT-09 v2']], items:['pack-r05'], recipients:['crew-riley','crew-dana','crew-tomas']},
      issues:[{id:'pack-r04', ref:'SYN-PPO-ISS-000401', revision:4, purpose:'Authorised work preparation', preparedAt:'2026-09-10T04:07:00Z', issuedAt:'2026-09-10T04:19:00Z', issuer:'Sam Taylor', decision:'SYN-PPO-DEC-000175', basis:[['Business revision','Pack r04'], ['Technical source','SYN-PPO-DOC-000101 r02'], ['Work order','SYN-PPO-WO-000063'], ['Appointment','SYN-PPO-APT-000044'], ['Template','TPL-OUT-09 v2']],
        items:[item('SYN-PPO-PACK-000081','Irrigation installation job pack','Authorised work preparation',[['Identification','Work order SYN-PPO-WO-000063; appointment SYN-PPO-APT-000044; Northbank Nursery, North Site.'], ['Scope','Install the fictional irrigation distribution for Compartments A and B.'], ['Technical information','Drawing SYN-PPO-DOC-000101 r02 was included at this issue. One shared isolation point is shown at Irrigation Shed 01.'], ['Site controls','Access through the Pack Room receiving point; fictional biosecurity wash-down applies.'], ['Completion','Record labour, parts, findings and photographs in the field record.']])],
        recipients:[person('crew-riley','Riley Chen','Powerplants Australia','Lead technician · assignment SYN-PPO-ASG-000121','Field application · simulated','Field application · simulated','delivery'), person('crew-dana','Dana Whitlock','Powerplants Australia','Technician · assignment SYN-PPO-ASG-000122','Field application · simulated','Field application · simulated','delivery'), person('crew-tomas','Tomas Reyes','Powerplants Australia','Apprentice · assignment SYN-PPO-ASG-000123','Field application · simulated','Field application · simulated','delivery')],
        attempts:[{id:'a-pack-1', recipient:'crew-riley', at:'2026-09-10T04:22:00Z', actor:'Sam Taylor', outcome:'Delivered', evidence:'Simulated field application delivery receipt SYN-PPO-EV-000110'}, {id:'a-pack-2', recipient:'crew-dana', at:'2026-09-10T04:22:00Z', actor:'Sam Taylor', outcome:'Delivered', evidence:'Simulated field application delivery receipt SYN-PPO-EV-000111'}, {id:'a-pack-3', recipient:'crew-tomas', at:'2026-09-10T04:22:00Z', actor:'Sam Taylor', outcome:'Delivered', evidence:'Simulated field application delivery receipt SYN-PPO-EV-000112'}],
        responses:[{id:'rs-pack-1', recipient:'crew-riley', response:'Acknowledged', at:'2026-09-10T05:02:00Z', respondent:'Riley Chen', capturedBy:'Riley Chen', strength:'Explicit response bound to the exact issued pack', remarks:'Acknowledges pack r04 only.'}, {id:'rs-pack-2', recipient:'crew-dana', response:'Acknowledged', at:'2026-09-10T05:31:00Z', respondent:'Dana Whitlock', capturedBy:'Dana Whitlock', strength:'Explicit response bound to the exact issued pack', remarks:'Acknowledges pack r04 only.'}]}]},

    {id:'report', ref:'SYN-PPO-RPT-000062', type:'OUT-10', typeName:'Customer service report', title:'Fertigation controller visit — customer service report', domain:'Service', owner:'Riley Chen', customer:'Bayview Berries', site:'East Farm', location:'Tunnel Block 02', linked:'SYN-PPO-WO-000058 · SYN-PPO-CASE-000031', classification:'Service', audienceName:'Selected customer contact and authorised staff', policy:'Service report release policy v2 (fictional)', template:{id:'TPL-OUT-10', version:2}, sourceRef:'SYN-PPO-REV-000045', sourceState:'Available', sourceReviewed:{ref:'SYN-PPO-REV-000045', decision:'SYN-PPO-DEC-000168', purpose:'Reviewed visit evidence', actor:'Sam Taylor', at:'2026-08-28'}, evidence:[['Reviewed visit evidence','Met','Service review SYN-PPO-REV-000045 accepted.'], ['Customer-safe projection','Met','Internal review comments and cost data are excluded.']], audienceApproved:true, sourceChanged:false, distributable:true, responseKind:'Customer response', responseNote:'A customer response describes the presented content only. Remaining work stays open with Service.',
      issues:[{id:'report-r02', ref:'SYN-PPO-ISS-000352', revision:2, purpose:'Reviewed customer report', preparedAt:'2026-08-28T03:12:00Z', issuedAt:'2026-08-28T03:29:00Z', issuer:'Sam Taylor', decision:'SYN-PPO-DEC-000168', basis:[['Business revision','Report r02'], ['Reviewed evidence','SYN-PPO-REV-000045'], ['Template','TPL-OUT-10 v2'], ['Selected contact','Sasha Delaney']],
        items:[item('SYN-PPO-RPT-000062','Fertigation controller visit report','Reviewed customer report',[['Attendance','Fictional attendance on 25 August 2026, Tunnel Block 02.'], ['Findings','Intermittent communication was reported. The diagnosis remains unconfirmed.'], ['Remaining work','An owned investigation remains open with Service.'], ['Exclusions','No production, crop or compliance conclusion is stated in this synthetic report.']])],
        recipients:[person('report-contact','Sasha Delaney','Bayview Berries','Site manager · selected contact','Customer portal link · simulated','Customer portal · simulated','send-only')],
        attempts:[{id:'a-report-1', recipient:'report-contact', at:'2026-08-28T03:35:00Z', actor:'Riley Chen', outcome:'Sent', evidence:'Simulated portal link created. This channel supplies no delivery evidence.'}],
        responses:[{id:'rs-report-1', recipient:'report-contact', response:'Accepted with reservations', at:'2026-08-29T01:40:00Z', respondent:'Sasha Delaney', capturedBy:'Riley Chen', strength:'Manually captured from a stated verbal response; identity is not independently verified', remarks:'Accepts the recorded attendance and asks for the communication fault to stay open.'}]}]},

    {id:'progress', ref:'SYN-PPO-PRG-000024', type:'OUT-11', typeName:'Project progress update', title:'Irrigation upgrade — project progress update', domain:'Projects', owner:'Jordan Lee', customer:'Northbank Nursery', site:'North Site', location:'Greenhouse 01 · Compartments A and B', linked:'SYN-PPO-PRJ-000021', classification:'Project', audienceName:'Approved project stakeholder group', policy:'Project reporting policy v1 (fictional)', template:{id:'TPL-OUT-11', version:1}, sourceRef:'Programme snapshot as at 12 September 2026', sourceState:'Available', sourceReviewed:{ref:'Programme snapshot 12 September 2026', decision:'SYN-PPO-DEC-000179', purpose:'Approved reporting cutoff', actor:'Jordan Lee', at:'2026-09-12'}, evidence:[['Reporting cutoff stated','Met','Cutoff 12 September 2026 is printed in the issued update.'], ['Commercial commentary agreed','Needs action','The revised commentary has not been agreed for the successor.']], audienceApproved:true, sourceChanged:true, sourceChangeNote:'The programme snapshot advanced to 16 September 2026 after this output was last prepared. A successor cannot be released against the superseded cutoff.', distributable:true, responseKind:'Stakeholder receipt', responseNote:'A stakeholder receipt is not project acceptance or a commercial agreement.',
      successor:{revision:4, change:'Extends the update to the 16 September 2026 programme snapshot.', purpose:'Approved stakeholder update', basis:[['Business revision','Progress update r04'], ['Programme snapshot','As at 16 September 2026'], ['Template','TPL-OUT-11 v1']], items:['progress-r04'], recipients:['prg-sponsor','prg-consultant']},
      issues:[{id:'progress-r03', ref:'SYN-PPO-ISS-000371', revision:3, purpose:'Approved stakeholder update', preparedAt:'2026-09-12T06:02:00Z', issuedAt:'2026-09-12T06:18:00Z', issuer:'Jordan Lee', decision:'SYN-PPO-DEC-000179', basis:[['Business revision','Progress update r03'], ['Programme snapshot','As at 12 September 2026'], ['Template','TPL-OUT-11 v1']],
        items:[item('SYN-PPO-PRG-000024','Irrigation upgrade progress update','Approved stakeholder update',[['Reporting cutoff','Fictional programme information as at 12 September 2026.'], ['Milestones','Two synthetic milestones are shown as in progress.'], ['Risks','One fictional access risk is recorded with an owner.'], ['Commentary','Commercial commentary is limited to agreed synthetic wording.']])],
        recipients:[person('prg-sponsor','Priya Raman','Northbank Nursery','Project sponsor','priya.raman@northbank.example','Email · simulated','delivery'), person('prg-consultant','Wren Ashby','Fernmoor Advisory','Independent consultant · approved copy','wren.ashby@fernmoor.example','Email · simulated','delivery')],
        attempts:[{id:'a-prg-1', recipient:'prg-sponsor', at:'2026-09-12T06:24:00Z', actor:'Jordan Lee', outcome:'Delivered', evidence:'Simulated provider delivery receipt SYN-PPO-EV-000130'}, {id:'a-prg-2', recipient:'prg-consultant', at:'2026-09-12T06:24:00Z', actor:'Jordan Lee', outcome:'Failed', evidence:'Simulated permanent provider rejection for this original attempt.'}], responses:[]}]},

    {id:'commissioning', ref:'SYN-PPO-CMR-000018', type:'OUT-12', typeName:'Commissioning / test record', title:'Compartment B commissioning record', domain:'Engineering', owner:'Sam Taylor', customer:'Northbank Nursery', site:'North Site', location:'Greenhouse 01 · Compartment B', linked:'SYN-PPO-PRJ-000021', classification:'Internal technical', audienceName:'Technical and customer acceptance parties', policy:'Commissioning record policy v1 (fictional)', template:{id:'TPL-OUT-12', version:1}, sourceRef:'SYN-PPO-TST-000027', sourceState:'Available', sourceReviewed:{ref:'SYN-PPO-TST-000027', decision:'SYN-PPO-DEC-000182', purpose:'Competent technical review of retest results', actor:'Sam Taylor', at:'2026-09-15'}, evidence:[['Procedure and criteria version','Met','Fictional procedure SYN-PPO-PRC-000004 v2.'], ['Failed and retested results retained','Met','Both the failed and the retested results are preserved.'], ['Instrument calibration reference','Needs action','The exact calibration certificate version has not been produced.']], audienceApproved:true, sourceChanged:false, distributable:true, responseKind:'Technical receipt', responseNote:'Issuing a commissioning record does not establish complete acceptance of the tested scope.',
      issues:[{id:'commissioning-r01', ref:'SYN-PPO-ISS-000381', revision:1, purpose:'Commissioning evidence', preparedAt:'2026-09-08T00:30:00Z', issuedAt:'2026-09-08T00:44:00Z', issuer:'Sam Taylor', decision:'SYN-PPO-DEC-000173', withdrawn:{at:'2026-09-14T22:10:00Z', actor:'Sam Taylor', reason:'The referenced instrument calibration certificate could not be produced. A retest was required before any acceptance decision.'}, basis:[['Business revision','Commissioning record r01'], ['Test evidence','SYN-PPO-TST-000019'], ['Template','TPL-OUT-12 v1']],
        items:[item('SYN-PPO-CMR-000018','Compartment B commissioning record','Commissioning evidence',[['Result','A fictional first-pass result is recorded for Compartment B.'], ['Limitation','The instrument calibration reference was not supplied with this issue.']])],
        recipients:[person('cmr-quality','Marc Oyelaran','Powerplants Australia','Quality reviewer','marc.oyelaran@example','Internal workspace · simulated','delivery')],
        attempts:[{id:'a-cmr-1', recipient:'cmr-quality', at:'2026-09-08T00:46:00Z', actor:'Sam Taylor', outcome:'Delivered', evidence:'Simulated workspace delivery receipt SYN-PPO-EV-000140'}], responses:[]},
        {id:'commissioning-r02', ref:'SYN-PPO-ISS-000386', revision:2, purpose:'Commissioning evidence — partial scope', preparedAt:'2026-09-15T05:11:00Z', issuedAt:'2026-09-15T05:26:00Z', issuer:'Sam Taylor', decision:'SYN-PPO-DEC-000182', basis:[['Business revision','Commissioning record r02'], ['Test evidence','SYN-PPO-TST-000027 including the retained failed result'], ['Template','TPL-OUT-12 v1']],
        items:[item('SYN-PPO-CMR-000018','Compartment B commissioning record','Commissioning evidence — partial scope',[['Result','One fictional test failed and was retested. Both results are retained.'], ['Partial scope','Flow verification for the second header is outside this record.'], ['Acceptance','No complete technical or customer acceptance is established by this issue.']])],
        recipients:[person('cmr-quality','Marc Oyelaran','Powerplants Australia','Quality reviewer','marc.oyelaran@example','Internal workspace · simulated','delivery')],
        attempts:[{id:'a-cmr-2', recipient:'cmr-quality', at:'2026-09-15T05:28:00Z', actor:'Sam Taylor', outcome:'Delivered', evidence:'Simulated workspace delivery receipt SYN-PPO-EV-000141'}], responses:[]}]},

    {id:'handover', ref:'SYN-PPO-HOV-000009', type:'OUT-13', typeName:'Staged handover pack', title:'Irrigation upgrade — stage 1 handover pack', domain:'Projects', owner:'Jordan Lee', customer:'Northbank Nursery', site:'North Site', location:'Greenhouse 01 · Compartment A', linked:'SYN-PPO-PRJ-000021', classification:'Project', audienceName:'Customer and service operations', policy:'Staged handover policy v1 (fictional)', template:{id:'TPL-OUT-13', version:1}, sourceRef:'Stage 1 accepted scope', sourceState:'Available', sourceReviewed:{ref:'Stage 1 accepted scope', decision:'SYN-PPO-DEC-000177', purpose:'Stage 1 handover', actor:'Jordan Lee', at:'2026-09-11'}, evidence:[['Accepted stage scope','Met','Stage 1 scope accepted by the fictional project decision.'], ['Complete document set','Needs action','The exact as-built drawing version is not available for this set.'], ['Outstanding obligations listed','Met','Three fictional obligations remain open.']], audienceApproved:true, sourceChanged:false, distributable:true, responseKind:'Stage acceptance receipt', responseNote:'A stage receipt does not accept the whole project or close outstanding obligations.',
      issues:[{id:'handover-r01', ref:'SYN-PPO-ISS-000391', revision:1, purpose:'Stage 1 handover', preparedAt:'2026-09-11T02:04:00Z', issuedAt:'2026-09-11T02:22:00Z', issuer:'Jordan Lee', decision:'SYN-PPO-DEC-000177', basis:[['Business revision','Handover pack r01'], ['Stage','Stage 1 of a fictional two-stage handover'], ['Template','TPL-OUT-13 v1']],
        items:[item('SYN-PPO-HOV-000009','Stage 1 handover summary','Stage 1 handover',[['Accepted scope','Fictional Compartment A distribution works.'], ['Outstanding obligations','Three synthetic obligations remain open at this stage.']]), item('SYN-PPO-DOC-000112','Operating and maintenance reference','Stage 1 handover',[['Applicability','Fictional maintenance reference for the installed distribution.']]), item('SYN-PPO-DOC-000118','As-built drawing — Compartment A','Stage 1 handover',[['Coverage','The exact as-built version referenced by this set could not be produced.']], 'Missing exact item'), item('SYN-PPO-WAR-000005','Warranty and maintenance context','Stage 1 handover',[['Context','Synthetic warranty context only; no contractual term is stated.']])],
        recipients:[person('hov-customer','Elliot Vance','Northbank Nursery','Operations manager','elliot.vance@northbank.example','Email · simulated','delivery'), person('hov-service','Riley Chen','Powerplants Australia','Service operations','Internal workspace · simulated','Internal workspace · simulated','delivery')],
        attempts:[{id:'a-hov-1', recipient:'hov-customer', at:'2026-09-11T02:30:00Z', actor:'Jordan Lee', outcome:'Delivered', evidence:'Simulated provider delivery receipt SYN-PPO-EV-000150'}, {id:'a-hov-2', recipient:'hov-service', at:'2026-09-11T02:30:00Z', actor:'Jordan Lee', outcome:'Delivered', evidence:'Simulated workspace delivery receipt SYN-PPO-EV-000151'}],
        responses:[{id:'rs-hov-1', recipient:'hov-service', response:'Received', at:'2026-09-11T22:15:00Z', respondent:'Riley Chen', capturedBy:'Riley Chen', strength:'Explicit response bound to the exact issued set', remarks:'Receives the stage 1 set and records the missing as-built item as outstanding.'}]}]},

    {id:'finance', ref:'SYN-PPO-FH-000037', type:'OUT-14', typeName:'Finance supporting evidence', title:'Northbank visit — Finance supporting evidence', domain:'Finance', owner:'Morgan Ellis', customer:'Northbank Nursery', site:'North Site', location:'Greenhouse 01 · Compartment A', linked:'SYN-PPO-WO-000063 · handoff SYN-PPO-FHO-000019', classification:'Restricted finance', audienceName:'Authorised Finance reviewers only', policy:'Finance evidence release policy v2 (fictional)', template:{id:'TPL-OUT-14', version:2}, sourceRef:'SYN-PPO-FHO-000019 reconciled', sourceState:'Available', sourceReviewed:{ref:'SYN-PPO-FHO-000019', decision:'SYN-PPO-DEC-000180', purpose:'Reconciled Finance handoff', actor:'Morgan Ellis', at:'2026-09-14'}, evidence:[['Reconciled handoff','Met','Handoff SYN-PPO-FHO-000019 is reconciled.'], ['Quantity basis separated','Met','Captured, reviewed and billable quantities are distinguished.']], audienceApproved:true, sourceChanged:false, distributable:false, distributionNote:'OUT-14 has no customer distribution route. Restricted Finance evidence never becomes customer-visible through generic issued-document access.', responseKind:'Not applicable', responseNote:'No recipient response is defined for restricted Finance evidence in this preview.',
      issues:[{id:'finance-r01', ref:'SYN-PPO-ISS-000397', revision:1, purpose:'Reconciled Finance evidence', preparedAt:'2026-09-14T04:40:00Z', issuedAt:'2026-09-14T04:58:00Z', issuer:'Morgan Ellis', decision:'SYN-PPO-DEC-000180', basis:[['Business revision','Finance evidence r01'], ['Handoff','SYN-PPO-FHO-000019 reconciled'], ['Template','TPL-OUT-14 v2']],
        items:[item('SYN-PPO-FH-000037','Finance supporting evidence','Reconciled Finance evidence',[['Quantities','Captured, reviewed, allocated and billable quantities are recorded separately in this fictional evidence.'], ['Disposition','One synthetic no-posting disposition is retained with its reason.'], ['Boundary','No tax, rate, price or ERP reference is stated. MYOB Acumatica remains the intended ERP authority.']])],
        recipients:[person('fin-reviewer','Morgan Ellis','Powerplants Australia','Finance reviewer','Internal Finance workspace · simulated','Internal workspace · simulated','delivery')],
        attempts:[{id:'a-fin-1', recipient:'fin-reviewer', at:'2026-09-14T05:00:00Z', actor:'Morgan Ellis', outcome:'Delivered', evidence:'Simulated workspace delivery receipt SYN-PPO-EV-000160'}], responses:[]}]},

    {id:'estimate', ref:'SYN-PPO-EST-000044', type:'OUT-02', typeName:'Internal cost-estimate output', title:'Irrigation upgrade — internal cost estimate', domain:'Estimating', owner:'Alex Morgan', customer:'Northbank Nursery', site:'North Site', location:'Greenhouse 01 · Compartments A and B', linked:'SYN-PPO-DEAL-000012', classification:'Internal cost', audienceName:'Authorised commercial and technical staff only', policy:'Internal estimate output policy v1 (fictional)', template:{id:'TPL-OUT-02', version:1}, sourceRef:'SYN-PPO-EST-000044 r03', sourceState:'Available', sourceReviewed:{ref:'SYN-PPO-EST-000044 r03', decision:'SYN-PPO-DEC-000166', purpose:'Internal commercial review snapshot', actor:'Alex Morgan', at:'2026-09-01'}, evidence:[['Cost basis stated','Met','Fictional cost lines with a stated basis.'], ['Totals state identified','Met','The snapshot is marked as a review snapshot, not an approved total.']], audienceApproved:true, sourceChanged:false, distributable:true, internalOnly:true, distributionNote:'Internal cost content has no approved external audience. An external destination is refused rather than redacted.', responseKind:'Internal receipt', responseNote:'An internal receipt does not approve the estimate or its totals.',
      issues:[{id:'estimate-r01', ref:'SYN-PPO-ISS-000305', revision:1, purpose:'Internal commercial review snapshot', preparedAt:'2026-09-01T03:20:00Z', issuedAt:'2026-09-01T03:31:00Z', issuer:'Alex Morgan', decision:'SYN-PPO-DEC-000166', basis:[['Business revision','Estimate r03'], ['Template','TPL-OUT-02 v1'], ['Totals state','Review snapshot; not an approved total']],
        items:[item('SYN-PPO-EST-000044','Internal cost estimate snapshot','Internal commercial review snapshot',[['Cost lines','Fictional grouped cost lines with units and a stated pricing basis.'], ['Confidentiality','Internal cost and margin content is excluded from every customer-facing output.']])],
        recipients:[person('est-commercial','Jordan Lee','Powerplants Australia','Commercial reviewer','Internal workspace · simulated','Internal workspace · simulated','delivery'), person('est-external','Nadia Cole','Fernmoor Advisory','Proposed external copy — not approved for internal cost content','nadia.cole@fernmoor.example','Email · simulated','delivery')],
        attempts:[{id:'a-est-1', recipient:'est-commercial', at:'2026-09-01T03:33:00Z', actor:'Alex Morgan', outcome:'Delivered', evidence:'Simulated workspace delivery receipt SYN-PPO-EV-000170'}], responses:[]}]},

    {id:'unconfigured', ref:'SYN-PPO-PRG-000031', type:'OUT-11', typeName:'Project progress update', title:'Bayview expansion — progress update (policy not configured)', domain:'Projects', owner:'Jordan Lee', customer:'Bayview Berries', site:'East Farm', location:'Tunnel Block 02', linked:'SYN-PPO-PRJ-000029', classification:'Project', audienceName:'Approved project stakeholder group', policy:null, template:{id:'TPL-OUT-11', version:1}, sourceRef:'Programme snapshot as at 15 September 2026', sourceState:'Available', sourceReviewed:{ref:'Programme snapshot 15 September 2026', decision:'SYN-PPO-DEC-000184', purpose:'Approved reporting cutoff', actor:'Jordan Lee', at:'2026-09-15'}, evidence:[['Reporting cutoff stated','Met','Cutoff 15 September 2026 is recorded against the draft.']], audienceApproved:true, sourceChanged:false, distributable:true, responseKind:'Stakeholder receipt', responseNote:'No release rule exists for this fictional project, so no issue can be produced.',
      successor:{revision:1, change:'First progress update for this fictional project.', purpose:'Approved stakeholder update', basis:[['Business revision','Progress update r01'], ['Programme snapshot','As at 15 September 2026'], ['Template','TPL-OUT-11 v1']], items:['unconfigured-r01'], recipients:['unc-sponsor']},
      issues:[]}
  ];

  /* Successor manifest content, referenced by id from each output's successor fixture. */
  const SUCCESSOR_ITEMS = {
    'pack-r05': item('SYN-PPO-PACK-000081','Irrigation installation job pack','Authorised work preparation',[['Identification','Work order SYN-PPO-WO-000063; appointment SYN-PPO-APT-000044; Northbank Nursery, North Site.'], ['Scope','Install the fictional irrigation distribution for Compartments A and B.'], ['Technical information','Drawing SYN-PPO-DOC-000101 r03 is included at this issue. Separate isolation points are shown for Compartments A and B.'], ['Site controls','Access through the Pack Room receiving point; the revised isolation access position applies.'], ['Completion','Record labour, parts, findings and photographs in the field record.']]),
    'drawing-101-r03': item('SYN-PPO-DOC-000101','Irrigation layout — Greenhouse 01','Issued for construction',[['Scope','Greenhouse 01, Compartments A and B; Irrigation Shed 01 pump supply.'], ['Isolation','Separate isolation points are shown for Compartments A and B.']]),
    'drawing-104-r01': item('SYN-PPO-DOC-000104','Irrigation shed arrangement','Issued for construction',[['Scope','Fictional shed arrangement for the pump supply.']]),
    'schedule-r03': item('SYN-PPO-SCH-000052','Irrigation component schedule','Issued for construction',[['Schedule','Fictional component listing reissued unchanged in the successor set.']]),
    'progress-r04': item('SYN-PPO-PRG-000024','Irrigation upgrade progress update','Approved stakeholder update',[['Reporting cutoff','Fictional programme information as at 16 September 2026.'], ['Milestones','Two synthetic milestones are shown as in progress.']]),
    'unconfigured-r01': item('SYN-PPO-PRG-000031','Bayview expansion progress update','Approved stakeholder update',[['Reporting cutoff','Fictional programme information as at 15 September 2026.']])
  };
  const SUCCESSOR_RECIPIENTS = {
    'crew-riley': person('crew-riley','Riley Chen','Powerplants Australia','Lead technician · assignment SYN-PPO-ASG-000121','Field application · simulated','Field application · simulated','delivery'),
    'crew-dana': person('crew-dana','Dana Whitlock','Powerplants Australia','Technician · assignment SYN-PPO-ASG-000122','Field application · simulated','Field application · simulated','delivery'),
    'crew-tomas': person('crew-tomas','Tomas Reyes','Powerplants Australia','Apprentice · assignment SYN-PPO-ASG-000123','Field application · simulated','Field application · simulated','delivery'),
    'trx-installer': person('trx-installer','Hana Brooks','Redgum Installations','Installation supervisor','hana.brooks@redgum.example','Email · simulated','delivery'),
    'trx-engineer': person('trx-engineer','Marc Oyelaran','Powerplants Australia','Design engineer','marc.oyelaran@example','Internal workspace · simulated','delivery'),
    'prg-sponsor': person('prg-sponsor','Priya Raman','Northbank Nursery','Project sponsor','priya.raman@northbank.example','Email · simulated','delivery'),
    'prg-consultant': person('prg-consultant','Wren Ashby','Fernmoor Advisory','Independent consultant · approved copy','wren.ashby@fernmoor.example','Email · simulated','delivery'),
    'unc-sponsor': person('unc-sponsor','Sasha Delaney','Bayview Berries','Site manager','sasha.delaney@bayview.example','Email · simulated','delivery')
  };

  /* Illustrative capability model. Client-side scoping demonstrates intent; it is not authentication. */
  const CAPABILITY = {
    coordinator:{classes:['Internal technical','Service','Commercial','Project','Internal cost'], actions:['prepareFollowup','createSuccessor','prepareOutput','recoverPreparation']},
    issuer:{classes:['Internal technical','Service','Commercial','Project'], actions:['reviewDraft','releaseIssue','withdrawIssue']},
    distributor:{classes:['Internal technical','Service','Commercial','Project','Internal cost'], actions:['prepareDistribution','simulateAttempt','reconcileAttempt','recordResponse']},
    technician:{classes:['Service'], sites:['North Site'], outputs:['pack'], actions:['recordResponse']},
    finance:{classes:['Restricted finance','Service'], actions:[]},
    viewer:{classes:['Internal technical','Service','Project'], actions:[]}
  };
  const getOutput = id => OUTPUTS.find(o => o.id === id);
  const allowed = (actor, o) => {
    const rule = CAPABILITY[actor];
    if (!rule || !o) return false;
    if (rule.outputs && !rule.outputs.includes(o.id)) return false;
    if (rule.sites && !rule.sites.includes(o.site)) return false;
    return rule.classes.includes(o.classification);
  };
  const can = (actor, action) => !!CAPABILITY[actor]?.actions.includes(action);

  const initial = () => ({schema:1, version:0, interruptArmed:true, drafts:[], reviews:[], preparations:[], issues:[], attempts:[], reconciliations:[], responses:[], followups:[], withdrawals:[], events:[]});

  /* Issues combine immutable fixtures with locally released issues. */
  const issuesOf = (s, o) => [...o.issues, ...s.issues.filter(i => i.output === o.id).map(i => ({...i, local:true}))];
  const latestRevision = (s, o) => issuesOf(s, o).reduce((max, i) => Math.max(max, i.revision), 0);
  const withdrawalOf = (s, i) => i.withdrawn || s.withdrawals.find(w => w.issue === i.id) || null;
  const issueState = (s, o, i) => withdrawalOf(s, i) ? 'Withdrawn' : i.revision === latestRevision(s, o) ? 'Current' : 'Superseded';
  const getIssue = (s, o, id) => issuesOf(s, o).find(i => i.id === id);
  /* The issued bytes are the generated bytes. Each file prints its reserved issue identity and
     output-preparation time; actual release time is a separate committed fact. */
  const manifestOf = (s, o, i) => i.items.map(x => ({...x, ...itemIdentity(o, i.revision, x, {purpose:i.purpose, ref:i.reservedRef || i.ref, preparedAt:i.preparedAt})}));
  /* A response binds the whole presented set, not one item of it. */
  const presentationHash = (s, o, i) => {
    const available = manifestOf(s, o, i).filter(x => x.availability === 'Available');
    return available.length ? sha256(available.map(x => `${x.id}:${x.hash}`).join('\n')) : null;
  };

  /* Each retained fixture response is bound at load to the exact presented set it belongs to,
     so a displayed binding is a recorded fact rather than a value recomputed at render time. */
  for (const o of OUTPUTS) for (const i of o.issues) for (const r of i.responses) r.presentation = presentationHash(null, o, i);

  /* A Returned decision closes its own draft; the next draft supersedes it and both are retained. */
  const draftOf = (s, o) => s.drafts.findLast(d => d.output === o.id) || null;
  const reviewOf = (s, o) => { const draft = draftOf(s, o); return draft ? s.reviews.findLast(r => r.draft === draft.id) || null : null; };
  const preparationOf = (s, o) => { const draft = draftOf(s, o); return draft ? s.preparations.findLast(p => p.draft === draft.id) || null : null; };
  const draftItems = o => o.successor.items.map(id => SUCCESSOR_ITEMS[id]);
  const draftRecipients = o => o.successor.recipients.map(id => SUCCESSOR_RECIPIENTS[id]);
  const fingerprint = (s, o) => o.successor ? JSON.stringify([o.id, o.successor.revision, o.successor.purpose, o.successor.basis, o.template, o.successor.recipients, o.sourceReviewed, o.sourceChanged, o.policy]) : '';

  /* Readiness is an explanation of the selected output's current evidence, never a completion percentage. */
  function readiness(s, o) {
    const draft = draftOf(s, o), review = reviewOf(s, o);
    const row = (name, status, reason, evidence, owner, action) => ({name, status, reason, evidence, owner, action});
    const rows = [
      o.sourceState === 'Available'
        ? row('Source availability', 'Met', 'The exact source referenced by this output is readable.', o.sourceRef, o.owner, 'No action required.')
        : row('Source availability', 'Needs action', 'The exact source cannot be read. A later version will not be substituted.', o.sourceRef, o.owner, 'Recover the exact source version.'),
      o.sourceReviewed
        ? row('Exact source and review basis', 'Met', `Reviewed for ${o.sourceReviewed.purpose}.`, `${o.sourceReviewed.ref} · ${o.sourceReviewed.decision}`, o.sourceReviewed.actor, 'No action required.')
        : row('Exact source and review basis', 'Unknown', 'No technical review reference is recorded for this basis.', 'Not recorded', o.owner, 'Obtain the exact review reference from the owning domain.'),
      row('Template identity and version', 'Met', 'The pinned fixture template version is bound to this preparation.', `${o.template.id} v${o.template.version}`, o.owner, 'No action required.'),
      o.policy
        ? row('Applicable domain policy', 'Met', 'A fictional release rule applies to this output type.', o.policy, o.owner, 'No action required.')
        : row('Applicable domain policy', 'Needs action', 'Not configured. An unconfigured rule is not a passed check.', 'Not configured', o.owner, 'Confirm the owning domain release rule before any issue.'),
      draft
        ? row('Intended issue purpose', 'Met', review && review.outcome === 'Checked' ? 'The owning domain stated the issue purpose for this decision.' : 'The successor draft proposes this issue purpose; the domain decision states the one that is released.', review && review.outcome === 'Checked' ? review.purpose : draft.purpose, o.owner, 'No action required.')
        : row('Intended issue purpose', 'Unknown', 'No successor draft exists, so no new issue purpose is stated.', 'Not stated', o.owner, 'Create the successor draft to state its purpose.'),
      ...o.evidence.map(([name, status, note]) => row(`Required evidence · ${name}`, status, status === 'Met' ? 'Recorded against this output.' : 'This evidence is outstanding.', note, o.owner, status === 'Met' ? 'No action required.' : 'Obtain the outstanding evidence.')),
      o.audienceApproved
        ? row('Audience and classification', 'Met', `${o.classification} content matches the approved audience.`, o.audienceName, o.owner, 'No action required.')
        : row('Audience and classification', 'Needs action', 'The audience is not approved for this classification.', o.audienceName, o.owner, 'Confirm the approved audience.'),
      o.sourceChanged
        ? row('Unresolved blocking changes', 'Needs action', o.sourceChangeNote, 'Superseded source snapshot', o.owner, 'Refresh the basis and obtain a fresh reviewed snapshot.')
        : row('Unresolved blocking changes', 'Met', 'No blocking source, template or audience change is recorded.', 'None recorded', o.owner, 'No action required.'),
      review && review.outcome === 'Checked'
        ? row('Domain review decision', 'Met', `Checked for ${review.purpose}.`, `${review.actor} · ${review.at.slice(0, 10)}`, review.actor, 'No action required.')
        : review
          ? row('Domain review decision', 'Needs action', 'The domain returned this successor.', review.reason, review.actor, 'Address the return and prepare a fresh successor.')
          : row('Domain review decision', draft ? 'Needs action' : 'Unknown', draft ? 'A domain review decision has not been recorded.' : 'No successor draft exists to review.', 'Not recorded', o.owner, draft ? 'Open the domain review preview.' : 'Create the successor draft first.')
    ];
    return rows;
  }
  const blocking = (s, o) => readiness(s, o).filter(r => r.status !== 'Met' && r.status !== 'Not applicable');
  const releasable = (s, o) => !!draftOf(s, o) && blocking(s, o).length === 0;

  /* One preparation position per output. The queue reports this rather than a single status field. */
  function position(s, o) {
    const draft = draftOf(s, o), review = reviewOf(s, o), preparation = preparationOf(s, o);
    if (!draft) return {stage:o.successor ? 'No successor prepared' : 'Issued record', next:o.successor ? 'Create the successor draft when a change requires one.' : 'Inspect the retained issue and its recipient evidence.'};
    if (!review) return {stage:'Awaiting domain review', next:'Record the owning domain decision for this exact successor.'};
    if (review.outcome === 'Returned') return {stage:'Returned by the domain', next:'Address the return; a changed basis needs a fresh successor.'};
    if (!preparation) return blocking(s, o).length ? {stage:'Blocked', next:`Resolve: ${blocking(s, o).map(r => r.name).join('; ')}.`} : {stage:'Ready to prepare', next:'Prepare the exact output from the checked basis.'};
    if (preparation.state === 'Finalisation outcome unknown') return {stage:'Finalisation outcome unknown', next:'Locate the original retained bundle and continue the same operation.'};
    if (preparation.state === 'Generated') return {stage:'Ready for release', next:'Record the owning domain issue event.'};
    return {stage:'Issued record', next:'Prepare the approved recipient attempts.'};
  }

  /* Distribution facts. Fixture attempts stay immutable; reconciliation is an additive record. */
  const attemptsOf = (s, o, issue) => [...(issue.attempts || []), ...s.attempts.filter(a => a.issue === issue.id)];
  const outcomeOf = (s, a) => s.reconciliations.find(r => r.attempt === a.id)?.finding || a.outcome;
  const responsesOf = (s, o, issue) => [...(issue.responses || []), ...s.responses.filter(r => r.issue === issue.id)];
  const recipientsOf = (s, o, issue) => issue.recipients;
  const deliveryEvidence = (s, a, recipient) => {
    const outcome = outcomeOf(s, a), reconciliation = s.reconciliations.find(r => r.attempt === a.id);
    if (reconciliation) return `Reconciled as ${reconciliation.stated} against original reference ${reconciliation.reference}. The original attempt returned: ${a.evidence}`;
    if (outcome === 'Delivered') return a.evidence;
    if (outcome === 'Outcome unknown') return 'No supported outcome evidence exists for this original attempt.';
    if (outcome === 'Failed') return a.evidence;
    return recipient.capability === 'delivery' ? 'Sent only; no delivery evidence has been returned.' : 'Delivery evidence is not supported by this channel.';
  };
  const openEvidence = recipient => recipient.capability === 'delivery' ? 'Open and download tracking is not supported by this simulated channel.' : 'Not supported by this channel.';

  /* Exceptions combine fixture conditions with live unresolved operations. */
  function exceptions(s, actor) {
    const list = [];
    for (const o of OUTPUTS.filter(x => allowed(actor, x))) {
      for (const i of issuesOf(s, o)) {
        for (const x of manifestOf(s, o, i)) if (x.availability !== 'Available') list.push({id:`missing:${i.id}:${x.id}`, output:o.id, issue:i.id, recipient:null, category:'Missing exact item', known:`${x.title} (${x.id}) is referenced by ${i.ref} but its exact version is not available.`, unknown:'Whether a permitted retained snapshot exists in the owning repository.', next:'Request a permitted retained exact snapshot. Selecting the newest available file is not acceptable recovery.', owner:o.owner, since:i.issuedAt});
        for (const a of attemptsOf(s, o, i)) {
          const outcome = outcomeOf(s, a);
          if (outcome === 'Outcome unknown') list.push({id:`unknown:${a.id}`, output:o.id, issue:i.id, recipient:a.recipient, category:'Distribution outcome unknown', known:'An original distribution attempt was recorded.', unknown:'Whether the recipient received the document. It is not safe to repeat this attempt.', next:'Reconcile the original attempt against its provider reference before any new distribution intent.', owner:PEOPLE.distributor, since:a.at});
          if (outcome === 'Failed') list.push({id:`failed:${a.id}`, output:o.id, issue:i.id, recipient:a.recipient, category:'Distribution failed', known:a.evidence, unknown:'Nothing; the failure evidence is retained.', next:'Prepare a new authorised distribution intent for this recipient, preserving the failed evidence.', owner:PEOPLE.distributor, since:a.at});
        }
      }
      if (o.sourceChanged) list.push({id:`stale:${o.id}`, output:o.id, issue:null, recipient:null, category:'Source changed after preparation', known:o.sourceChangeNote, unknown:'Which parts of the fictional programme changed enough to affect the audience.', next:'Refresh the basis and obtain a fresh reviewed snapshot before releasing a successor.', owner:o.owner, since:'2026-09-16T00:00:00Z'});
      if (!o.policy) list.push({id:`policy:${o.id}`, output:o.id, issue:null, recipient:null, category:'Domain release policy not configured', known:'Inspection and preparation work; release does not.', unknown:'Which fictional project reporting rule applies to this output.', next:'Confirm the owning domain release rule. Not configured is never treated as passed.', owner:o.owner, since:'2026-09-15T00:00:00Z'});
      const p = preparationOf(s, o);
      if (p && p.state === 'Finalisation outcome unknown') list.push({id:`finalisation:${p.id}`, output:o.id, issue:null, recipient:null, category:'Finalisation outcome unknown', known:`The output bundle was retained locally with ${p.bundle.length} verified item(s) under operation ${p.id}.`, unknown:'Whether the finalisation step completed. The document must not be generated again.', next:'Locate the original retained bundle and continue the same operation after revalidating its basis.', owner:PEOPLE.coordinator, since:p.at});
    }
    return list;
  }

  const validDate = v => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
  const need = (condition, message) => { if (!condition) throw Error(message); };
  const text = (value, label, limit = 2000) => { const trimmed = String(value || '').trim(); need(trimmed && trimmed.length <= limit, `${label} of up to ${limit.toLocaleString('en-AU')} characters is required.`); return trimmed; };

  function visibleOutputs(s, actor, filter = {}) {
    return OUTPUTS.filter(o => allowed(actor, o)).filter(o => {
      const fields = [o.title, o.ref, o.customer, o.site, o.location, o.linked, o.type, o.typeName, o.domain, o.owner].join(' ').toLowerCase();
      if (filter.search && !fields.includes(filter.search.toLowerCase())) return false;
      const stage = position(s, o).stage;
      if (filter.state && !issuesOf(s, o).some(i => issueState(s, o, i) === filter.state)) return false;
      if (filter.queue === 'mine' && o.owner !== PEOPLE[actor]) return false;
      if (filter.queue === 'review' && stage !== 'Awaiting domain review') return false;
      if (filter.queue === 'ready' && !['Ready to prepare', 'Ready for release'].includes(stage)) return false;
      if (filter.queue === 'response' && !outstandingResponses(s, actor, o).length) return false;
      if (filter.queue === 'exceptions' && !exceptions(s, actor).some(e => e.output === o.id)) return false;
      if (filter.queue === 'attention' && !exceptions(s, actor).some(e => e.output === o.id) && !outstandingResponses(s, actor, o).length && stage === 'Issued record') return false;
      return ['domain', 'type', 'owner', 'customer', 'site', 'classification'].every(k => !filter[k] || o[k] === filter[k]);
    });
  }
  function outstandingResponses(s, actor, o) {
    if (!allowed(actor, o) || o.responseKind === 'Not applicable') return [];
    const out = [];
    for (const i of issuesOf(s, o)) {
      if (issueState(s, o, i) !== 'Current') continue;
      const responses = responsesOf(s, o, i);
      for (const r of recipientsOf(s, o, i)) if (!responses.some(x => x.recipient === r.id)) out.push({issue:i.id, recipient:r.id, name:r.name});
    }
    return out;
  }

  function command(state, actor, expected, action, p = {}, at = '2026-09-17T02:00:00Z') {
    need(PEOPLE[actor], 'Unknown preview identity.');
    need(state.version === expected, 'Saved work changed. Reload saved work before trying again.');
    need(can(actor, action), `The ${ROLES[actor]} preview profile cannot perform this action.`);
    const s = clone(state), o = getOutput(p.output);
    need(allowed(actor, o), 'This output is not available to the selected preview identity.');
    const draft = draftOf(s, o), review = reviewOf(s, o), preparation = preparationOf(s, o);
    const id = prefix => `${prefix}${s.version + 1}`;

    if (action === 'createSuccessor') {
      need(o.successor, 'No successor definition exists for this output in the preview fixtures.');
      need(!draft || (review && review.outcome === 'Returned'), 'A successor draft already exists. A returned draft can be replaced; an open one must be completed first.');
      const reason = text(p.reason, 'A change reason');
      s.drafts.push({id:id('DR'), output:o.id, revision:o.successor.revision, purpose:o.successor.purpose, change:o.successor.change, reason, basis:clone(o.successor.basis), items:clone(o.successor.items), recipients:clone(o.successor.recipients), template:clone(o.template), fingerprint:fingerprint(s, o), actor:PEOPLE[actor], at});
    } else if (action === 'reviewDraft') {
      need(draft, 'Create the successor draft before recording a domain decision.');
      need(!review, 'A domain decision is already retained for this exact successor. A changed basis needs a fresh successor.');
      need(PEOPLE[actor] !== draft.actor, 'An independent domain reviewer must record this decision.');
      need(['Checked', 'Returned'].includes(p.outcome), 'Choose a valid domain decision.');
      need(p.fingerprint === draft.fingerprint, 'The selected basis changed. Reopen the domain review.');
      const purpose = text(p.purpose, 'A stated issue purpose', 300), reason = text(p.reason, 'A decision rationale');
      if (p.outcome === 'Checked') need(blocking(s, o).filter(r => r.name !== 'Domain review decision').length === 0, `Unresolved readiness checks prevent a Checked decision: ${blocking(s, o).filter(r => r.name !== 'Domain review decision').map(r => r.name).join('; ')}.`);
      s.reviews.push({id:id('RV'), output:o.id, draft:draft.id, revision:draft.revision, outcome:p.outcome, purpose, reason, actor:PEOPLE[actor], at, fingerprint:draft.fingerprint});
    } else if (action === 'prepareOutput') {
      need(draft, 'Create the successor draft before preparing an output.');
      need(review && review.outcome === 'Checked', 'A Checked domain decision is required before an output is prepared.');
      need(!preparation, 'An output preparation already exists for this exact successor. Recover the original operation rather than starting another.');
      need(releasable(s, o), 'Unresolved readiness checks prevent output preparation.');
      need(p.fingerprint === draft.fingerprint, 'The selected basis changed between review and preparation. The original attempt is retained.');
      const bundle = draftItems(o).map(x => ({id:x.id, title:x.title, ...itemIdentity(o, draft.revision, x, {purpose:review.purpose, ref:`RESERVED-${id('ISS')}`, preparedAt:at})}));
      need(bundle.every(x => x.availability !== 'Available' || (x.bytes > 0 && /^[0-9a-f]{64}$/.test(x.hash))), 'Generated bytes could not be verified. The attempt is retained as failed.');
      const interrupted = s.interruptArmed;
      s.interruptArmed = false;
      s.preparations.push({id:id('OP'), output:o.id, draft:draft.id, revision:draft.revision, purpose:review.purpose, reservedRef:`RESERVED-${id('ISS')}`, reservedAt:at, actor:PEOPLE[actor], at, fingerprint:draft.fingerprint, bundle, state:interrupted ? 'Finalisation outcome unknown' : 'Generated'});
    } else if (action === 'recoverPreparation') {
      need(preparation, 'No original preparation operation exists for this output.');
      need(preparation.state === 'Finalisation outcome unknown', 'This operation has no unknown finalisation outcome to reconcile.');
      need(p.operation === preparation.id, 'Select the exact original operation to reconcile.');
      need(preparation.fingerprint === draftOf(s, o).fingerprint, 'The basis changed. The original bytes are retained and a fresh review is required.');
      const reason = text(p.reason, 'A reconciliation note');
      const identity = {purpose:preparation.purpose, ref:preparation.reservedRef, preparedAt:preparation.reservedAt};
      const verified = preparation.bundle.every(x => {
        const source = draftItems(o).find(y => y.id === x.id);
        return !!source && (x.availability !== 'Available' || itemIdentity(o, preparation.revision, source, identity).hash === x.hash);
      });
      need(verified, 'The retained bundle no longer matches its recorded content identity. The affected operation is quarantined rather than regenerated.');
      preparation.state = 'Generated';
      preparation.recovery = {reason, actor:PEOPLE[actor], at, found:`Original bundle located by operation ${preparation.id}; ${preparation.bundle.length} item identity check(s) matched.`};
    } else if (action === 'releaseIssue') {
      need(preparation, 'Prepare the output before recording a domain issue.');
      need(p.operation === preparation.id, 'Select the exact original operation to release.');
      need(!s.issues.some(i => i.operation === preparation.id), 'This original operation is already released. A retry returns the same issue result and never creates a second release event.');
      need(preparation.state === 'Generated', 'Only a verified generated bundle can be released. Reconcile an unknown finalisation outcome against its original operation first.');
      need(releasable(s, o), 'Unresolved readiness checks prevent release.');
      need(p.fingerprint === preparation.fingerprint, 'The basis changed after preparation. The original attempt is retained and release is refused.');
      need(Date.parse(at) > Date.parse(preparation.reservedAt), 'Actual issue time must be later than the reserved output-preparation time.');
      const current = issuesOf(s, o).find(i => issueState(s, o, i) === 'Current');
      s.issues.push({id:id('IS'), output:o.id, operation:preparation.id, ref:`SYN-PPO-ISS-0005${String(s.version + 1).padStart(2, '0')}`, reservedRef:preparation.reservedRef, revision:preparation.revision, purpose:preparation.purpose, preparedAt:preparation.reservedAt, issuedAt:at, issuer:PEOPLE[actor], decision:review.id, basis:clone(draft.basis), items:clone(draftItems(o)), recipients:clone(draftRecipients(o)), attempts:[], responses:[], supersedes:current ? current.id : null});
      preparation.state = 'Issued';
    } else if (action === 'withdrawIssue') {
      const issue = getIssue(s, o, p.issue);
      need(issue, 'Select an exact issue to withdraw.');
      need(!withdrawalOf(s, issue), 'This issue is already withdrawn.');
      need(issueState(s, o, issue) === 'Current', 'Only the current issue can be withdrawn. A superseded issue keeps its own retained status.');
      s.withdrawals.push({id:id('WD'), output:o.id, issue:issue.id, reason:text(p.reason, 'A withdrawal reason'), actor:PEOPLE[actor], at});
    } else if (action === 'prepareDistribution') {
      const issue = getIssue(s, o, p.issue);
      need(issue, 'Select an exact issue.');
      need(o.distributable, o.distributionNote || 'This output has no distribution route.');
      need(issueState(s, o, issue) === 'Current', 'Only a current issue can receive a new distribution intent.');
      const recipient = recipientsOf(s, o, issue).find(r => r.id === p.recipient);
      need(recipient, 'Select an approved recipient from the issue audience.');
      need(!o.internalOnly || !/@/.test(recipient.destination) || recipient.organisation === 'Powerplants Australia', o.distributionNote);
      need(!attemptsOf(s, o, issue).some(a => a.recipient === recipient.id && outcomeOf(s, a) === 'Outcome unknown'), 'Reconcile the unknown original attempt for this recipient before preparing another.');
      s.attempts.push({id:id('AT'), output:o.id, issue:issue.id, recipient:recipient.id, reason:text(p.reason, 'A distribution reason', 600), actor:PEOPLE[actor], at, outcome:'Prepared', evidence:'A distribution intent is recorded. No message, invitation or sharing grant is produced by this preview.'});
    } else if (action === 'simulateAttempt') {
      const issue = getIssue(s, o, p.issue), attempt = s.attempts.find(a => a.id === p.attempt && a.output === o.id);
      need(issue && attempt, 'Select a prepared local attempt.');
      need(attempt.outcome === 'Prepared', 'Only a prepared attempt can record a first simulated outcome.');
      const recipient = recipientsOf(s, o, issue).find(r => r.id === attempt.recipient);
      need(['Sent', 'Delivered', 'Outcome unknown', 'Failed'].includes(p.outcome), 'Choose a supported simulated outcome.');
      need(p.outcome !== 'Delivered' || recipient.capability === 'delivery', 'This simulated channel supplies no delivery evidence. Record Sent instead.');
      attempt.outcome = p.outcome;
      attempt.evidence = {Sent:'Simulated channel action recorded. Sent is not delivered.', Delivered:`Simulated delivery evidence SYN-PPO-EV-${900 + s.version} for this exact attempt.`, 'Outcome unknown':'No provider result was returned for this original attempt.', Failed:'Simulated permanent provider rejection for this original attempt.'}[p.outcome];
      attempt.simulatedAt = at;
    } else if (action === 'reconcileAttempt') {
      const issue = getIssue(s, o, p.issue);
      need(issue, 'Select an exact issue.');
      const attempt = attemptsOf(s, o, issue).find(a => a.id === p.attempt);
      need(attempt, 'Select the exact original attempt.');
      need(outcomeOf(s, attempt) === 'Outcome unknown', 'Only an unknown original outcome is reconciled.');
      need(['Delivered', 'Failed', 'No provider record'].includes(p.finding), 'Record what the original lookup established.');
      const reconciled = recipientsOf(s, o, issue).find(r => r.id === attempt.recipient);
      need(p.finding !== 'Delivered' || reconciled.capability === 'delivery', 'This simulated channel supplies no delivery evidence, so a lookup cannot establish Delivered.');
      s.reconciliations.push({id:id('RC'), output:o.id, issue:issue.id, attempt:attempt.id, finding:p.finding === 'No provider record' ? 'Failed' : p.finding, stated:p.finding, reference:text(p.reference, 'An original provider or operation reference', 200), reason:text(p.reason, 'A reconciliation note'), actor:PEOPLE[actor], at});
    } else if (action === 'recordResponse') {
      const issue = getIssue(s, o, p.issue);
      need(issue, 'Select an exact issue.');
      need(o.responseKind !== 'Not applicable', 'No recipient response is defined for this output.');
      need(issueState(s, o, issue) === 'Current', 'A response belongs to the issue in force. A superseded or withdrawn issue keeps only the responses it already had.');
      const recipient = recipientsOf(s, o, issue).find(r => r.id === p.recipient);
      need(recipient, 'Select a recipient of this exact issue.');
      need(actor !== 'technician' || recipient.name === PEOPLE[actor], 'A technician profile can only record its own assignment response.');
      need(!responsesOf(s, o, issue).some(r => r.recipient === recipient.id), 'A response is already retained for this recipient and issue.');
      need(['Acknowledged', 'Received', 'Accepted with reservations', 'Declined', 'Unavailable'].includes(p.response), 'Choose a supported response.');
      const hash = presentationHash(s, o, issue);
      need(p.presentation === hash, 'The presented content changed. A response cannot be bound to different bytes.');
      const remarks = ['Accepted with reservations', 'Declined', 'Unavailable'].includes(p.response) ? text(p.remarks, 'Supporting detail') : String(p.remarks || '').trim();
      s.responses.push({id:id('RS'), output:o.id, issue:issue.id, recipient:recipient.id, response:p.response, respondent:recipient.name, capturedBy:PEOPLE[actor], strength:actor === 'technician' ? 'Explicit response bound to the exact issued presentation' : 'Manually captured; identity is not independently verified', presentation:hash, remarks, at});
    } else if (action === 'prepareFollowup') {
      const reason = text(p.reason, 'A next action');
      need(Object.values(PEOPLE).includes(p.owner), 'Choose an action owner.');
      need(!p.due || validDate(p.due), 'Enter a valid due date or leave it as Date needed.');
      need(!s.followups.some(f => f.target === p.target), 'An owned follow-up already exists for this item.');
      const targets = [...issuesOf(s, o).map(i => i.id), ...issuesOf(s, o).flatMap(i => recipientsOf(s, o, i).map(r => `${i.id}:${r.id}`)), ...exceptions(s, actor).filter(e => e.output === o.id).map(e => e.id)];
      need(targets.includes(p.target), 'Select an exact issue, recipient or exception.');
      s.followups.push({id:id('FU'), output:o.id, target:p.target, reason, owner:p.owner, due:p.due || null, domain:o.domain, status:'Prepared locally', actor:PEOPLE[actor], at});
    } else throw Error('Unknown output action.');

    s.version++;
    s.events.push({id:`E${s.version}`, action, output:o.id, actor:PEOPLE[actor], at});
    return s;
  }

  function validState(s) {
    if (!s || s.schema !== 1 || !Number.isInteger(s.version) || s.version < 0 || typeof s.interruptArmed !== 'boolean') return false;
    if (!['drafts', 'reviews', 'preparations', 'issues', 'attempts', 'reconciliations', 'responses', 'followups', 'withdrawals', 'events'].every(k => Array.isArray(s[k]))) return false;
    if (s.events.length !== s.version) return false;
    const instant = x => typeof x === 'string' && !Number.isNaN(Date.parse(x));
    const known = x => !!x && !!getOutput(x.output);
    const people = Object.values(PEOPLE);
    if (!s.drafts.every(d => known(d) && instant(d.at) && people.includes(d.actor) && Number.isInteger(d.revision) && typeof d.purpose === 'string' && Array.isArray(d.basis) && d.fingerprint === fingerprint(s, getOutput(d.output)))) return false;
    if (!s.reviews.every(r => known(r) && instant(r.at) && people.includes(r.actor) && ['Checked', 'Returned'].includes(r.outcome) && typeof r.purpose === 'string' && s.drafts.some(d => d.id === r.draft && d.fingerprint === r.fingerprint))) return false;
    if (new Set(s.reviews.map(r => r.draft)).size !== s.reviews.length) return false;
    if (new Set(s.preparations.map(p => p.draft)).size !== s.preparations.length) return false;
    if (!s.preparations.every(p => known(p) && instant(p.at) && instant(p.reservedAt) && people.includes(p.actor) && ['Finalisation outcome unknown', 'Generated', 'Issued'].includes(p.state) && typeof p.purpose === 'string' && p.purpose && Array.isArray(p.bundle) && p.bundle.length > 0 && p.bundle.every(x => x.availability !== 'Available' || (Number.isInteger(x.bytes) && x.bytes > 0 && /^[0-9a-f]{64}$/.test(x.hash))))) return false;
    if (!s.issues.every(i => known(i) && instant(i.at || i.issuedAt) && people.includes(i.issuer) && Number.isInteger(i.revision) && Array.isArray(i.items) && Array.isArray(i.recipients) && i.issuedAt !== i.preparedAt && s.preparations.some(p => p.id === i.operation && p.state === 'Issued'))) return false;
    if (new Set(s.issues.map(i => i.operation)).size !== s.issues.length) return false;
    if (!s.attempts.every(a => known(a) && instant(a.at) && people.includes(a.actor) && ['Prepared', 'Sent', 'Delivered', 'Outcome unknown', 'Failed'].includes(a.outcome) && typeof a.reason === 'string')) return false;
    if (!s.reconciliations.every(r => known(r) && instant(r.at) && people.includes(r.actor) && ['Delivered', 'Failed'].includes(r.finding) && typeof r.reference === 'string' && r.reference)) return false;
    if (new Set(s.reconciliations.map(r => r.attempt)).size !== s.reconciliations.length) return false;
    if (!s.responses.every(r => known(r) && instant(r.at) && people.includes(r.capturedBy) && /^[0-9a-f]{64}$/.test(r.presentation || '') && r.presentation === presentationHash(s, getOutput(r.output), getIssue(s, getOutput(r.output), r.issue)) && ['Acknowledged', 'Received', 'Accepted with reservations', 'Declined', 'Unavailable'].includes(r.response))) return false;
    if (new Set(s.responses.map(r => r.issue + ':' + r.recipient)).size !== s.responses.length) return false;
    if (!s.followups.every(f => known(f) && instant(f.at) && people.includes(f.actor) && people.includes(f.owner) && (f.due === null || validDate(f.due)) && f.status === 'Prepared locally' && typeof f.reason === 'string')) return false;
    if (new Set(s.followups.map(f => f.target)).size !== s.followups.length) return false;
    if (!s.withdrawals.every(w => known(w) && instant(w.at) && people.includes(w.actor) && typeof w.reason === 'string' && w.reason)) return false;
    return s.events.every((e, index) => known(e) && instant(e.at) && e.id === `E${index + 1}` && people.includes(e.actor));
  }

  function exportState(s, actor) {
    const visible = visibleOutputs(s, actor);
    const ids = new Set(visible.map(o => o.id));
    return {synthetic:true, scope:'DK-03 — Output, issue and distribution centre', asAt:AS_AT, previewProfile:`${ROLES[actor]} · ${PEOPLE[actor]}`, outputs:visible.map(o => ({ref:o.ref, type:o.type, title:o.title, domain:o.domain, classification:o.classification, distributable:o.distributable, issues:issuesOf(s, o).map(i => ({ref:i.ref, revision:i.revision, purpose:i.purpose, state:issueState(s, o, i), preparedAt:i.preparedAt, issuedAt:i.issuedAt, manifest:manifestOf(s, o, i).map(x => ({id:x.id, availability:x.availability, bytes:x.bytes, sha256:x.hash})), recipients:recipientsOf(s, o, i).map(r => ({name:r.name, organisation:r.organisation, role:r.role, channel:r.channel})), attempts:attemptsOf(s, o, i).map(a => ({id:a.id, recipient:a.recipient, outcome:outcomeOf(s, a), at:a.at})), responses:responsesOf(s, o, i).map(r => ({recipient:r.recipient, response:r.response, at:r.at, strength:r.strength}))}))})), drafts:s.drafts.filter(d => ids.has(d.output)), reviews:s.reviews.filter(r => ids.has(r.output)), preparations:s.preparations.filter(p => ids.has(p.output)).map(p => ({...p, bundle:p.bundle.map(x => ({id:x.id, availability:x.availability, bytes:x.bytes, sha256:x.hash}))})), reconciliations:s.reconciliations.filter(r => ids.has(r.output)), followups:s.followups.filter(f => ids.has(f.output)), withdrawals:s.withdrawals.filter(w => ids.has(w.output)), events:s.events.filter(e => ids.has(e.output)), note:'Review copy only. No provider credentials, live documents, message delivery or external distribution. This is not an import or restore format.'};
  }

  globalThis.PPOOutputs = {AS_AT, PEOPLE, ROLES, CAPABILITY, OUTPUTS, SUCCESSOR_ITEMS, SUCCESSOR_RECIPIENTS, clone, sha256, initial, getOutput, allowed, can, issuesOf, getIssue, issueState, withdrawalOf, manifestOf, presentationHash, itemContent, itemIdentity, draftOf, reviewOf, preparationOf, draftItems, draftRecipients, fingerprint, readiness, blocking, releasable, position, attemptsOf, outcomeOf, responsesOf, recipientsOf, deliveryEvidence, openEvidence, exceptions, visibleOutputs, outstandingResponses, latestRevision, command, validState, exportState};
})();
