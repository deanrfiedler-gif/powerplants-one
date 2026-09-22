// Audit-only extraction of retained reference calculations; no application import.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';

const source = new URL('../../../reference/ui/specialist/PPO-Greenhouse-Blueprint-and-Screen-Calculator-r10.html', import.meta.url);
const bytes = readFileSync(source);
const sha256 = createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256, '9578be7aca13bbfc81a8f6c2c1b7359228079c88f6bb76a9f801681c8a4cf5c2');
const html = bytes.toString('utf8');
const start = html.indexOf('  const defaultFamilies =');
const end = html.indexOf('  function normaliseProject(');
assert.ok(start > 0 && end > start);
const body = html.slice(start, end);
function evaluate(expression) {
  return runInNewContext(body + '\n' + expression, {}, { timeout: 1000 });
}
const pick = `const m=calculate(); JSON.parse(JSON.stringify({family:state.structureType,geometry:family(),inputs:state,area:m.area,volume:m.volume,peak:m.peak,panels:m.count,net:m.netScheduled,withAllowance:m.scheduledWithWaste,standardBlank:m.standardBlank,opening:m.standardOpening,screenChord:m.screenChord,roofArc:m.roofArc,archLength:m.archLength,gridConforming:m.gridConforming,validOpening:m.validOpening,structureValid:m.structureValid,exportEnabled:m.fabricationAllowed,rollFits:m.rollFits,status:statusModel(m),schedule:m.schedule}));`;
const cases = [];
function sample(name, setup='') {
  const result=evaluate(setup+'\n'+pick);
  cases.push({name,...result});
  return result;
}
const venlo=sample('Venlo default');
assert.equal(venlo.panels,112);
assert.ok(Math.abs(venlo.net-484.8)<1e-9);
assert.ok(Math.abs(venlo.withAllowance-509.04)<1e-9);
assert.ok(Math.abs(venlo.standardBlank-534.492)<1e-9);
assert.equal(venlo.gridConforming,false);
sample('Quonset default',"state.structureType='quonset';");
sample('Gothic default',"state.structureType='gothic';");
sample('Sawtooth default',"state.structureType='sawtooth';");
const whole=sample('Whole-grid rejects default residual',"state.gridMode='whole';");
assert.equal(whole.exportEnabled,false);
const residual=sample('Venlo width and length residuals',"families.venlo.width=33;");
assert.equal(residual.panels,126);
assert.equal(residual.schedule.length,4);
const failed=sample('Known failed roll fit still permits study CSV',"state.rollWidth=3900;");
assert.equal(failed.rollFits,false);
assert.equal(failed.exportEnabled,true);
const equality=sample('Exact roll-width equality',"state.rollWidth=3950;");
assert.equal(equality.rollFits,true);
const invalid=sample('Quonset invalid rise',"state.structureType='quonset';families.quonset.ridge=7;");
assert.equal(invalid.structureValid,false);
assert.equal(invalid.exportEnabled,false);
const ridge=sample('Quonset screen at ridge',"state.structureType='quonset';families.quonset.screenElevation=4.5;");
assert.equal(ridge.validOpening,false);
const vent=sample('Sawtooth excessive vent',"state.structureType='sawtooth';families.sawtooth.ventHeight=3;");
assert.equal(vent.structureValid,false);
const fixed=sample('Fixed screen leaves quantities unchanged',"state.profile='fixed';");
assert.equal(fixed.net,venlo.net);
assert.equal(fixed.panels,venlo.panels);
const maximum=sample('Venlo UI maximum panel count',"families.venlo.width=120;families.venlo.length=200;families.venlo.module=3.2;families.venlo.spacing=4;");
assert.equal(maximum.panels,1900);
let zeroPitchTimeout=false;
try { evaluate('partition(1,0);'); } catch(error) { zeroPitchTimeout=error.code==='ERR_SCRIPT_EXECUTION_TIMEOUT'; }
assert.equal(zeroPitchTimeout,true);
const result={source_sha256:sha256,source_bytes:bytes.length,node:process.version,scope:'Reference calculations only; not native integration, supplier approval or browser acceptance',case_count:cases.length,zero_pitch_times_out:zeroPitchTimeout,cases};
writeFileSync(new URL('./r10-calculation-observations.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({source: fileURLToPath(source),case_count:cases.length,assertions:'passed',zeroPitchTimeout}));
