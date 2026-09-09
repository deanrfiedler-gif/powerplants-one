// Synthetic design model only. No real product, rate, compatibility or ERP rules.
export const defaults = { positions: 4, gateway: 'new', installation: true, training: true, freight: 'allowance' };
export const definition = 'SYN-PPO-SENSOR-PACKAGE-r01';
export const money = cents => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);
export function generate(input) {
  if (!Number.isInteger(input.positions) || input.positions < 1 || input.positions > 16) throw new Error('Enter 1 to 16 sensor positions.');
  if (!['new', 'existing', 'unknown'].includes(input.gateway) || !['allowance', 'unknown'].includes(input.freight)) throw new Error('Choose a supported answer.');
  if (typeof input.installation !== 'boolean' || typeof input.training !== 'boolean') throw new Error('Confirm the service requirements.');
  const lines = [];
  const add = (key, description, quantity, unit, cost, sell, basis, category) => lines.push({key, description, quantity, unit, cost, sell, basis, category, manual: false});
  if (input.gateway === 'new') add('gateway', 'Demonstration gateway', 1, 'each', 60000, 80000, 'One new gateway selected; fictional compatibility assumed.', 'Product');
  add('sensors', 'Demonstration sensor', input.positions, 'each', 12000, 16000, 'One sensor per confirmed position.', 'Product');
  add('mounts', 'Sensor mounting kit', input.positions, 'each', 1500, 2000, 'One mounting kit per sensor.', 'Product');
  if (input.installation) {
    add('installation', 'Installation labour', 2 + input.positions / 2, 'hour', 8000, 12000, 'Fictional allowance: 2 setup hours + 0.5 hour per position.', 'Labour');
    add('commissioning', 'Commissioning', 2, 'hour', 8000, 12000, 'Fictional fixed allowance of 2 hours.', 'Labour');
  }
  if (input.training) add('training', 'Operator handover', 1, 'hour', 8000, 12000, 'One remote handover hour; site travel is excluded.', 'Labour');
  if (input.freight === 'allowance') add('freight', 'Freight allowance', 1, 'lot', 6000, 8000, 'Explicit fictional allowance; actual freight is unconfirmed.', 'Freight');
  const blockers = [];
  if (input.gateway === 'unknown') blockers.push('Confirm whether a compatible existing gateway is available.');
  if (input.freight === 'unknown') blockers.push('Enter a sourced freight cost or explicit allowance.');
  return {definition, input: {...input}, lines, blockers};
}
export function totals(lines) {
  // Model quantities are in half-hour increments, keeping these products exact integers.
  return lines.reduce((sum, line) => ({cost: sum.cost + line.quantity * line.cost, sell: sum.sell + line.quantity * line.sell}), {cost: 0, sell: 0});
}
export function editInstallation(run, hours, reason) {
  if (!Number.isFinite(hours) || hours <= 0 || hours > 40 || !Number.isInteger(hours * 2)) throw new Error('Use 0.5-hour increments, from 0.5 to 40 hours.');
  if (!reason.trim()) throw new Error('Enter a reason for the labour adjustment.');
  if (!run.lines.some(line => line.key === 'installation')) throw new Error('This draft has no installation labour.');
  return {...run, lines: run.lines.map(line => line.key === 'installation' ? {...line, quantity: hours, manual: true, reason: reason.trim()} : {...line})};
}
export function compare(current, proposal) {
  const old = new Map(current.lines.map(line => [line.key, line]));
  const next = new Map(proposal.lines.map(line => [line.key, line]));
  return [...new Set([...old.keys(), ...next.keys()])].map(key => {
    const before = old.get(key), after = next.get(key);
    const status = !before ? 'Added' : !after ? 'Removed' : before.quantity !== after.quantity ? 'Changed' : 'Unchanged';
    return {key, before, after, status, requiresChoice: Boolean(before?.manual)};
  });
}
export function apply(current, proposal, choices = {}) {
  const diff = compare(current, proposal);
  const lines = [];
  for (const row of diff) {
    if (row.requiresChoice && !['keep', 'generated'].includes(choices[row.key])) throw new Error('Resolve every manual adjustment before applying.');
    const line = row.requiresChoice && choices[row.key] === 'keep' ? row.before : row.after;
    if (line) lines.push({...line});
  }
  return {...proposal, lines};
}
export function quote(run) {
  if (run.blockers.length) throw new Error('Resolve missing requirements before preparing a draft quotation.');
  // Explicit projection: internal unit costs, reasons and source notes never enter this object.
  const lines = run.lines.map(({description, quantity, unit, sell}) => ({description, quantity, unit, amount: quantity * sell}));
  const has = key => run.lines.some(line => line.key === key);
  return {
    reference: 'SYN-PPO-QUO-000901', customer: 'Synthetic Example Nursery', date: '9 September 2026',
    status: 'Draft — synthetic example — not for issue', currency: 'AUD', tax_basis: 'Excluding tax; tax not calculated',
    title: has('installation') ? 'Sensor supply and installation' : 'Sensor supply',
    scope: `Supply ${run.input.positions} demonstration sensors and mounting kits${has('gateway') ? ', with one demonstration gateway' : ', using the existing gateway'}. ${has('installation') ? 'Installation labour is included as listed.' : 'Installation labour is excluded.'} ${has('commissioning') ? 'Commissioning is included as listed.' : 'Commissioning is excluded.'} ${has('training') ? 'One hour of remote operator handover is included.' : 'Operator handover is excluded.'}`,
    specifications: 'Fictional equipment for workflow review only. No real model, measurement performance, radio coverage or compatibility is represented.',
    exclusions: 'Electrical alterations, network upgrades, subscriptions, access equipment and travel are excluded. Actual requirements need technical review.',
    assumptions: 'Accessible mounting positions and suitable power/network availability are assumed. Compatibility and survey outcomes require confirmation.',
    freight: 'One freight allowance is included. Actual freight and delivery destination require confirmation.',
    lead_time: 'To be confirmed from supplier availability and technician scheduling.',
    payment_terms: 'To be confirmed under the applicable commercial policy.', validity: 'To be confirmed before issue.',
    lines, total: totals(run.lines).sell
  };
}
