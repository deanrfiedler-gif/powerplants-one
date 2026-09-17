/* CR-03 Sales-to-Delivery Handover — synthetic model.
   Rules, guards and evidence only. No rendering, no network, no storage.
   Every identity, person, amount and external key below is fictional. */
(function (global) {
  'use strict';
  const SCHEMA = 'ppo-cr03-handover-r01';
  const TODAY = '2026-09-16';
  const NOW = '2026-09-16T01:00:00.000Z';
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const need = assert;
    /* Strip control characters without embedding a literal control byte in the
     source: any code point below space, plus DEL, becomes a space. */
  const clean = (v) => typeof v !== 'string' ? '' :
    Array.from(v, (c) => (c.codePointAt(0) < 32 || c.codePointAt(0) === 127) ? ' ' : c).join('').trim();
  const money = (cents) => (cents / 100).toLocaleString('en-AU', {style: 'currency', currency: 'AUD'});
  const isDate = (v) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '')) return false;
    const d = new Date(v + 'T00:00:00Z');
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  };

  /* ---------------------------------------------------------------- roles */
  /* Presentation roles only. A later application must enforce equivalent
     capabilities and record scope on the server; this is not a security
     boundary and grants nothing. */
  const ROLES = {
    sales: {
      label: 'Sales owner · Priya Raman', person: 'Priya Raman',
      capabilities: ['handover.read', 'handover.prepare', 'handover.submit', 'handover.withdraw', 'commercial.read', 'action.create'],
    },
    project: {
      label: 'Project delivery owner · Dana Brooks', person: 'Dana Brooks', receivesFor: 'Project',
      capabilities: ['handover.read', 'handover.review', 'handover.decide', 'obligation.manage', 'commercial.read', 'action.create'],
    },
    service: {
      label: 'Service delivery owner · Morgan Hale', person: 'Morgan Hale', receivesFor: 'Service',
      capabilities: ['handover.read', 'handover.review', 'handover.decide', 'obligation.manage', 'commercial.read', 'action.create'],
    },
    fulfilment: {
      label: 'Fulfilment owner · Sam Whitcombe', person: 'Sam Whitcombe', receivesFor: 'Parts order',
      capabilities: ['handover.read', 'handover.review', 'handover.decide', 'obligation.manage', 'commercial.read', 'action.create'],
    },
    viewer: {
      label: 'Delivery viewer (restricted) · Lee Tran', person: 'Lee Tran',
      capabilities: ['handover.read'],
    },
  };
  const can = (role, capability) => Boolean(ROLES[role]?.capabilities.includes(capability));
  const receivesFor = (role) => ROLES[role]?.receivesFor || null;

  /* ------------------------------------------------- proposed state labels */
  /* No verified contract exists for a delivery-handover state. The only
     implemented fact is ppo.opportunity_handovers_due.status = 'Due', which is
     immutable (migration 0023). These six labels are therefore PROPOSED. */
  const STATES = [
    'Awaiting preparation',
    'Awaiting receiving review',
    'Returned for clarification',
    'Accepted — follow-through outstanding',
    'Accepted — complete',
    'Renewed acceptance required',
  ];
  const DESTINATIONS = ['Project', 'Service', 'Parts order'];
  /* ES-07 vocabulary, reproduced exactly from its retained model. */
  const CONVERSION_STATES = ['Not prepared', 'Prepared', 'Confirmed', 'Partially confirmed', 'Outcome unknown', 'Failed — no effect'];
  const REQUIREMENT_STATES = ['Not received', 'Received — reviewed', 'Received — insufficient', 'Not applicable', 'Restricted to this viewer'];
  const DECISIONS = ['Accept responsibility', 'Accept with outstanding obligations', 'Return for clarification'];

  /* ------------------------------------------------------- source snapshot */
  /* The receiving decision binds to this fingerprint. Anything that changes it
     invalidates the current applicability of an acceptance without deleting
     the historical decision. */
  function fingerprint(h) {
    return JSON.stringify({
      quotation: h.commercial.quotation.ref,
      revision: h.commercial.quotation.revision,
      documentHash: h.commercial.quotation.documentHash,
      acceptance: h.commercial.acceptance.state + '|' + (h.commercial.acceptance.at || ''),
      totals: h.commercial.totals,
      documents: h.commercial.documents.map((d) => d.ref + '@' + d.revision + '/' + d.state).join(','),
      conversion: h.conversion.status + '|' + (h.conversion.orderKey || ''),
      destination: (h.destination.type || 'unrouted') + '|' + (h.destination.record.ref || 'proposed') + '|v' + h.destination.record.version,
      allocation: h.destination.allocation.lineIds.join('+'),
      opportunityVersion: h.opportunity.opportunityVersion,
    });
  }

  /* ------------------------------------------------------------- blockers */
  function informationGaps(h) {
    /* Sender-owned. These prevent submission, not merely acceptance. */
    const gaps = [];
    if (h.commercial.acceptance.state !== 'Recorded')
      gaps.push({owner: h.opportunity.ownerAtWon, text: 'Customer acceptance evidence is ' + h.commercial.acceptance.state.toLowerCase() + ' for ' + h.commercial.quotation.ref + ' R' + String(h.commercial.quotation.revision).padStart(2, '0') + '.'});
    if (h.destination.decision !== 'Routed')
      gaps.push({owner: h.destination.routingOwner, text: 'Routing decision required: no approved source routes this accepted scope to a delivery destination.'});
    if (h.destination.allocation.unallocated.length)
      gaps.push({owner: h.opportunity.ownerAtWon, text: h.destination.allocation.unallocated.length + ' accepted line(s) are not allocated to a destination. Split routing across destinations is not defined (OQ-03).'});
    for (const d of h.commercial.documents.filter((d) => d.state === 'Missing'))
      gaps.push({owner: d.owner, text: 'Supporting document ' + d.ref + ' (' + d.title + ') is not available.'});
    return gaps;
  }

  function acceptanceBlockers(h) {
    /* Everything that must be true before a receiving owner may accept
       responsibility for the reviewed scope. */
    const reasons = informationGaps(h).map((g) => g.text);
    const submitted = currentSubmission(h);
    if (!submitted) reasons.push('No handover revision has been submitted for review.');
    else if (submitted.fingerprint !== fingerprint(h)) reasons.push('The submitted revision no longer matches its source. A corrected successor revision is required.');
    for (const r of h.requirements.filter((r) => r.class === 'Acceptance' && r.applicable))
      if (!['Received — reviewed', 'Not applicable'].includes(r.status))
        reasons.push('Acceptance evidence outstanding: ' + r.title + ' — ' + r.status.toLowerCase() + '.');
    if (h.destination.type === 'Parts order' && !['Confirmed'].includes(h.conversion.status))
      reasons.push('Conversion outcome is “' + h.conversion.status + '”. Every allocated line needs a confirmed or reconciled ERP effect before fulfilment responsibility is accepted (CR3-RULE-01, hypothetical).');
    if (h.destination.available === false)
      reasons.push('The proposed receiving record is unavailable: ' + h.destination.unavailableReason);
    return reasons;
  }

  function releasePrerequisites(h) {
    /* Permitted to remain open at acceptance. They must be satisfied before
       work is authorised or released — a separate decision in a separate
       workspace. Accepting a handover never satisfies one of these. */
    const items = [];
    for (const r of h.requirements.filter((r) => r.class === 'Release' && r.applicable))
      if (!['Received — reviewed', 'Not applicable'].includes(r.status))
        items.push({id: r.id, title: r.title, owner: r.owner, due: r.due, why: r.status});
    for (const o of h.obligations.filter((o) => o.status !== 'Closed' && o.blocksRelease))
      items.push({id: o.id, title: o.title, owner: o.owner, due: o.due, why: 'Outstanding obligation'});
    return items;
  }

  const currentSubmission = (h) => h.revisions.filter((r) => r.state === 'Submitted').at(-1) || null;
  const latestRevision = (h) => h.revisions.at(-1) || null;
  const acceptance = (h) => h.reviews.filter((r) => r.decision !== 'Return for clarification').at(-1) || null;
  const latestReview = (h) => h.reviews.at(-1) || null;
  const openObligations = (h) => h.obligations.filter((o) => o.status !== 'Closed');

  function status(h) {
    const accepted = acceptance(h);
    if (accepted) {
      if (accepted.fingerprint !== fingerprint(h)) return 'Renewed acceptance required';
      /* Acceptance never clears an unresolved prerequisite. A handover is
         complete only when both its named obligations and its release
         prerequisites are satisfied. */
      return openObligations(h).length || releasePrerequisites(h).length
        ? 'Accepted — follow-through outstanding' : 'Accepted — complete';
    }
    if (currentSubmission(h)) return 'Awaiting receiving review';
    const last = latestReview(h);
    if (last && last.decision === 'Return for clarification') return 'Returned for clarification';
    return 'Awaiting preparation';
  }

  function nextAction(h) {
    const s = status(h);
    if (s === 'Awaiting preparation') {
      const gap = informationGaps(h)[0];
      return gap ? {text: gap.text, owner: gap.owner} : {text: 'Prepare and submit handover revision ' + nextRevisionLabel(h) + '.', owner: h.opportunity.ownerAtWon};
    }
    if (s === 'Awaiting receiving review') return {text: 'Review submitted revision ' + currentSubmission(h).rev + ' and record a receiving decision.', owner: h.destination.receivingOwner};
    if (s === 'Returned for clarification') return {text: 'Respond to ' + latestReview(h).findings.length + ' returned finding(s) and resubmit as ' + nextRevisionLabel(h) + '.', owner: latestReview(h).responseOwner};
    if (s === 'Renewed acceptance required') return {text: 'A bound source changed after acceptance. Prepare a successor revision for renewed acceptance.', owner: h.opportunity.ownerAtWon};
    if (s === 'Accepted — follow-through outstanding') {
      const o = openObligations(h)[0];
      if (o) return {text: 'Complete outstanding obligation: ' + o.title + '.', owner: o.owner};
      const r = releasePrerequisites(h)[0];
      return {text: 'Satisfy the release prerequisite before work is authorised: ' + r.title + '.', owner: r.owner};
    }
    return {text: 'No outstanding handover action. Delivery, attendance and Finance remain with their own workspaces.', owner: h.destination.receivingOwner};
  }

  const nextRevisionLabel = (h) => 'r' + String(h.revisions.length + 1).padStart(2, '0');

  /* ------------------------------------------------------------- payload */
  function payload(h) {
    /* Exactly what a revision carries. Preparation notes and receiving
       findings are deliberately excluded: they are not part of the handover. */
    return clone({
      handover: h.ref,
      opportunity: {ref: h.opportunity.ref, version: h.opportunity.opportunityVersion, wonAt: h.opportunity.wonAt, outcomeEvent: h.opportunity.outcomeEventId},
      customer: {name: h.customer.name, ref: h.customer.ref, account: h.customer.erpAccount, entity: h.destination.entity},
      site: {ref: h.site.ref, name: h.site.name, timezone: h.site.timezone},
      areas: h.areas.map((a) => a.ref + ' ' + a.name),
      equipment: h.equipment.map((e) => e.ref + ' · ' + e.name),
      commercial: {
        quotation: h.commercial.quotation.ref, revision: h.commercial.quotation.revision, documentHash: h.commercial.quotation.documentHash,
        acceptedAt: h.commercial.acceptance.at, acceptedBy: h.commercial.acceptance.by,
        customerPo: h.commercial.customerPo ? h.commercial.customerPo.ref : null,
        totals: h.commercial.totals, currency: h.commercial.currency, taxBasis: h.commercial.taxBasis,
        documents: h.commercial.documents.map((d) => d.ref + ' ' + d.revision + ' · ' + d.state + (d.hash ? ' · ' + d.hash : '')),
      },
      conversion: {operation: h.conversion.operationId, order: h.conversion.orderKey, status: h.conversion.status},
      destination: {
        type: h.destination.type, record: h.destination.record.ref, proposed: h.destination.record.proposed,
        version: h.destination.record.version, receivingOwner: h.destination.receivingOwner,
        allocation: h.destination.allocation.lineIds, allocatedExGstCents: allocatedTotal(h),
      },
      requirements: h.requirements.map((r) => r.title + ' · ' + r.class + ' · ' + (r.applicable ? r.status : 'Not applicable') + ' · ' + r.owner),
      preparedBy: h.opportunity.ownerAtWon,
    });
  }

  /* A destination's allocated subtotal is the sum of its allocated accepted
     lines and selected options. The accepted discount is a basis-level amount:
     it is applied only when every accepted line is allocated to this one
     destination. Apportioning a discount across destinations would require a
     rule that no approved source supplies (OQ-03), so none is invented. */
  const fullyAllocated = (h) => h.destination.allocation.unallocated.length === 0
    && h.commercial.lines.every((l) => h.destination.allocation.lineIds.includes(l.id))
    && h.commercial.selections.filter((s) => s.included).every((s) => h.destination.allocation.lineIds.includes(s.id));
  const allocatedTotal = (h) => h.commercial.lines.filter((l) => h.destination.allocation.lineIds.includes(l.id)).reduce((n, l) => n + l.amountCents, 0)
    + h.commercial.selections.filter((s) => s.included && h.destination.allocation.lineIds.includes(s.id)).reduce((n, s) => n + s.deltaCents, 0)
    - (fullyAllocated(h) ? h.commercial.discount.amountCents : 0);

  /* Readable comparison between two revisions. */
  function compare(h, fromRev, toRev) {
    const a = h.revisions.find((r) => r.rev === fromRev), b = h.revisions.find((r) => r.rev === toRev);
    assert(a && b, 'Both revisions must exist to compare.');
    /* Every scalar, array entry and nested field becomes its own comparison
       row, so a change inside a document or requirement list is visible rather
       than hidden inside a joined string. */
    const flatten = (p, prefix, out) => {
      const entries = Array.isArray(p) ? p.map((v, i) => [String(i + 1), v]) : Object.entries(p);
      for (const [k, v] of entries) {
        const key = prefix ? prefix + (Array.isArray(p) ? ' #' + k : '.' + k) : k;
        if (v && typeof v === 'object') flatten(v, key, out);
        else out[key] = v === null ? '—' : String(v);
      }
      return out;
    };
    const x = flatten(a.payload, '', {}), y = flatten(b.payload, '', {});
    const keys = [...new Set([...Object.keys(x), ...Object.keys(y)])];
    return keys.map((k) => ({
      field: k, from: k in x ? x[k] : '—', to: k in y ? y[k] : '—',
      change: !(k in x) ? 'added' : !(k in y) ? 'removed' : x[k] === y[k] ? 'same' : 'changed',
    }));
  }
  const changedFields = (h, a, b) => compare(h, a, b).filter((r) => r.change !== 'same');

  /* ------------------------------------------------------------- history */
  const pretty = (iso) => iso ? new Date(iso.length === 10 ? iso + 'T00:00:00+10:00' : iso)
    .toLocaleDateString('en-AU', {day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Australia/Melbourne'}) : 'not recorded';

  function record(s, h, kind, text, actor, at) {
    h.history.push({at: at || NOW, seq: ++s.sequence, kind, text, actor});
  }

  /* ------------------------------------------------------------ commands */
  function findHandover(s, id) {
    const h = s.handovers.find((x) => x.id === id);
    need(h, 'This handover is not available in the current context.');
    return h;
  }

  function command(state, cmd, role) {
    need(cmd && typeof cmd.op === 'string' && cmd.op, 'An operation identity is required.');
    need(typeof cmd.type === 'string', 'A command type is required.');
    /* Original-operation recovery. The key is (actor role, operation id) plus
       the exact bound handover — a late response cannot surface under another
       handover, customer or identity. */
    const prior = state.receipts.find((r) => r.op === cmd.op);
    if (prior) {
      need(prior.role === role, 'This operation belongs to another identity. No original result is disclosed.');
      need(prior.handoverId === cmd.handoverId, 'This operation belongs to another handover. No original result is disclosed.');
      need(prior.signature === JSON.stringify({type: cmd.type, payload: cmd.payload ?? null}), 'The same operation identity was reused with different content.');
      return {state, recovered: true, receipt: prior};
    }
    const next = clone(state);
    next.sequence = state.sequence;
    const h = findHandover(next, cmd.handoverId);
    if (cmd.expectedVersion !== undefined && cmd.expectedVersion !== null)
      need(cmd.expectedVersion === state.version, 'This handover changed while you were working on it. Reload and compare before deciding.');
    const handler = COMMANDS[cmd.type];
    need(handler, 'Unknown command.');
    handler(next, h, cmd.payload || {}, role);
    next.version = state.version + 1;
    next.receipts.push({op: cmd.op, role, handoverId: cmd.handoverId, at: NOW, version: next.version,
      signature: JSON.stringify({type: cmd.type, payload: cmd.payload ?? null}),
      result: {type: cmd.type, handover: h.ref, state: status(h)}});
    validate(next);
    return {state: next, recovered: false, receipt: next.receipts.at(-1)};
  }

  const COMMANDS = {
    /* ---- sender ---- */
    prepare(s, h, p, role) {
      need(can(role, 'handover.prepare'), 'This action requires the sending owner.');
      need(!currentSubmission(h), 'Withdraw the submitted revision before preparing another.');
      const note = clean(p.note);
      need(note.length >= 10, 'Record what this preparation adds or corrects.');
      h.draft = {rev: nextRevisionLabel(h), note, startedAt: NOW, respondsTo: latestReview(h) && latestReview(h).decision === 'Return for clarification' ? latestReview(h).id : null};
      record(s, h, 'Preparation', 'Draft ' + h.draft.rev + ' started: ' + note, ROLES[role].person);
    },
    requirement(s, h, p, role) {
      const r = h.requirements.find((x) => x.id === p.id);
      need(r, 'Unknown readiness requirement.');
      const receiving = ['Received — reviewed', 'Received — insufficient'].includes(p.status);
      need(receiving ? can(role, 'handover.review') : can(role, 'handover.prepare') || can(role, 'handover.review'),
        'This requirement outcome requires the receiving reviewer.');
      if (receiving) need(receivesFor(role) === h.destination.type, 'This handover is routed to ' + (h.destination.type || 'no destination') + '. Another receiving team cannot review it.');
      need(REQUIREMENT_STATES.includes(p.status), 'Choose a recorded requirement outcome.');
      const finding = clean(p.finding);
      need(finding.length >= 10, 'Record the source, evidence or reason for this outcome.');
      if (p.status === 'Not applicable') need(clean(p.reason).length >= 10, 'A not-applicable requirement needs its reason.');
      r.history.push(clone({status: r.status, finding: r.finding, reviewedAt: r.reviewedAt, reviewedBy: r.reviewedBy}));
      Object.assign(r, {status: p.status, finding, reason: p.status === 'Not applicable' ? clean(p.reason) : '', reviewedAt: TODAY, reviewedBy: ROLES[role].person,
        sourceRef: clean(p.sourceRef) || r.sourceRef});
      record(s, h, 'Readiness', r.title + ' recorded as ' + p.status + '.', ROLES[role].person);
    },
    /* Records that a missing supporting document is now available at an exact
       revision in its owning workspace. It is a source record with provenance,
       not a checklist acknowledgement: the workspace never marks a document
       available without a stated revision and source, and it never claims to
       hold the bytes. */
    attach(s, h, p, role) {
      need(can(role, 'handover.prepare'), 'This action requires the sending owner.');
      const d = h.commercial.documents.find((x) => x.ref === p.ref);
      need(d, 'Unknown supporting document.');
      need(d.state === 'Missing', 'Only a missing supporting document can be recorded as supplied. A superseded document needs a fresh revision from its owning workspace.');
      const revision = clean(p.revision), source = clean(p.source);
      need(/^[Rr]\d{2}$/.test(revision), 'Record the exact issued revision, for example r02.');
      need(source.length >= 10, 'Record the owning workspace and record this document came from.');
      d.revision = revision;
      d.state = 'Available';
      d.hash = 'syn-' + d.ref.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + revision.toLowerCase();
      d.suppliedFrom = source;
      record(s, h, 'Supporting document', d.ref + ' recorded as available at ' + revision + ', referenced from ' + source + '. The bytes remain with the owning workspace.', ROLES[role].person);
    },
    route(s, h, p, role) {
      need(can(role, 'handover.prepare'), 'This action requires the sending owner.');
      need(h.destination.routable, 'No approved source routes this accepted scope. Record the routing decision in its owning workspace first.');
      need(DESTINATIONS.includes(p.type), 'Choose an existing destination type.');
      need(clean(p.basis).length >= 10, 'Record the approved source of this routing decision.');
      h.destination.type = p.type;
      h.destination.decision = 'Routed';
      h.destination.routingBasis = clean(p.basis);
      record(s, h, 'Destination', 'Routed to ' + p.type + ': ' + h.destination.routingBasis, ROLES[role].person);
    },
    submit(s, h, p, role) {
      need(can(role, 'handover.submit'), 'This action requires the sending owner.');
      need(h.draft, 'Prepare a revision before submitting it.');
      need(p.confirm === true, 'Confirm that this revision is the scope you are handing over.');
      need(isDate(p.requiredResponseBy), 'A required response date is needed in the site calendar.');
      need(p.requiredResponseBy >= TODAY, 'The required response date cannot precede today.');
      const gaps = informationGaps(h);
      if (gaps.length) throw new Error('Resolve the owned information gaps first: ' + gaps[0].text);
      const rev = {
        rev: h.draft.rev, note: h.draft.note, respondsTo: h.draft.respondsTo,
        submittedAt: NOW, submittedBy: ROLES[role].person, requiredResponseBy: p.requiredResponseBy,
        state: 'Submitted', fingerprint: fingerprint(h), payload: payload(h),
      };
      for (const old of h.revisions) if (old.state === 'Submitted') old.state = 'Superseded';
      h.revisions.push(rev);
      h.draft = null;
      record(s, h, 'Submission', 'Revision ' + rev.rev + ' submitted to ' + h.destination.receivingOwner + '; response required by ' + pretty(p.requiredResponseBy) + '.', ROLES[role].person);
    },
    withdraw(s, h, p, role) {
      need(can(role, 'handover.withdraw'), 'This action requires the sending owner.');
      const rev = currentSubmission(h);
      need(rev, 'No submitted revision is awaiting review.');
      need(clean(p.reason).length >= 10, 'Record why the submission is withdrawn.');
      rev.state = 'Withdrawn';
      rev.withdrawnReason = clean(p.reason);
      record(s, h, 'Submission', 'Revision ' + rev.rev + ' withdrawn: ' + rev.withdrawnReason, ROLES[role].person);
    },
    /* ---- receiving ---- */
    review(s, h, p, role) {
      need(can(role, 'handover.decide'), 'This action requires a receiving owner.');
      need(receivesFor(role) === h.destination.type, 'This handover is routed to ' + (h.destination.type || 'no destination') + '. Another receiving team cannot decide it.');
      const rev = currentSubmission(h);
      need(rev, 'No submitted revision is awaiting a decision.');
      need(p.rev === rev.rev, 'Revision ' + p.rev + ' is no longer the submitted revision. Reload the current revision before deciding.');
      need(rev.fingerprint === fingerprint(h), 'A bound source changed while this revision was under review. A corrected successor revision is required.');
      need(DECISIONS.includes(p.decision), 'Choose a receiving decision.');
      const reason = clean(p.reason);
      need(reason.length >= 20, 'Record the basis of this decision against the reviewed revision.');
      need(p.confirm === true, 'Confirm this decision. It records who is responsible for delivering the reviewed scope.');
      const blockers = acceptanceBlockers(h);
      if (p.decision !== 'Return for clarification' && blockers.length)
        throw new Error('Responsibility cannot be accepted: ' + blockers[0]);
      const findings = (p.findings || []).map((f) => ({
        requirement: clean(f.requirement), detail: clean(f.detail), owner: clean(f.owner), due: f.due,
      }));
      if (p.decision === 'Return for clarification') {
        need(findings.length, 'A return must identify exactly what is missing or unacceptable.');
        for (const f of findings) {
          need(f.detail.length >= 10 && f.owner, 'Each returned finding needs its detail and a responding owner.');
          need(isDate(f.due) && f.due >= TODAY, 'Each returned finding needs a response date in the site calendar.');
        }
        rev.state = 'Returned';
      } else {
        rev.state = 'Accepted';
      }
      const obligations = [];
      if (p.decision === 'Accept with outstanding obligations') {
        need((p.obligations || []).length, 'Name each obligation that remains outstanding at acceptance.');
        for (const o of p.obligations) {
          const title = clean(o.title);
          need(title.length >= 10 && clean(o.owner), 'Each outstanding obligation needs a title and an owner.');
          need(isDate(o.due) && o.due >= TODAY, 'Each outstanding obligation needs a date in the site calendar.');
          const id = 'OBL-' + h.ref.slice(-6) + '-' + String(h.obligations.length + obligations.length + 1).padStart(2, '0');
          obligations.push({id, title, owner: clean(o.owner), due: o.due, status: 'Open', blocksRelease: o.blocksRelease !== false,
            source: 'Receiving acceptance ' + rev.rev, closedBy: null});
        }
      }
      h.obligations.push(...obligations);
      const review = {
        id: 'DEC-' + h.ref.slice(-6) + '-' + String(h.reviews.length + 1).padStart(2, '0'),
        rev: rev.rev, revisionFingerprint: rev.fingerprint, fingerprint: fingerprint(h),
        decision: p.decision, reason, by: ROLES[role].person, role, at: NOW,
        findings, responseOwner: findings[0] ? findings[0].owner : h.opportunity.ownerAtWon,
        obligations: obligations.map((o) => o.id),
        boundSources: {
          quotation: h.commercial.quotation.ref + ' R' + String(h.commercial.quotation.revision).padStart(2, '0'),
          documentHash: h.commercial.quotation.documentHash,
          conversion: h.conversion.operationId + ' · ' + h.conversion.status,
          destination: (h.destination.record.ref || 'Proposed receiving record') + ' v' + h.destination.record.version,
          opportunityVersion: h.opportunity.opportunityVersion,
        },
        releaseAtAcceptance: p.decision === 'Return for clarification' ? [] : releasePrerequisites(h).map((x) => x.title),
      };
      h.reviews.push(review);
      record(s, h, 'Receiving decision', p.decision + ' recorded against revision ' + rev.rev + ' by ' + review.by + '.', review.by);
      if (p.decision !== 'Return for clarification' && review.releaseAtAcceptance.length)
        record(s, h, 'Work release', 'Responsibility accepted with ' + review.releaseAtAcceptance.length + ' release prerequisite(s) still open. Work is not authorised or released by this acceptance.', review.by);
    },
    obligation(s, h, p, role) {
      need(can(role, 'obligation.manage'), 'This action requires a receiving owner.');
      need(receivesFor(role) === h.destination.type, 'Another receiving team cannot change these obligations.');
      const o = h.obligations.find((x) => x.id === p.id);
      need(o && o.status !== 'Closed', 'Only an open obligation can be completed.');
      need(clean(p.evidence).length >= 10, 'Record the completion evidence for this obligation.');
      o.status = 'Closed';
      o.closedBy = {at: NOW, by: ROLES[role].person, evidence: clean(p.evidence)};
      record(s, h, 'Obligation', o.title + ' completed: ' + o.closedBy.evidence, o.closedBy.by);
    },
    /* ---- shared follow-up, reusing the My Work / Activities pattern ---- */
    action(s, h, p, role) {
      need(can(role, 'action.create'), 'This action requires an owned working identity.');
      const title = clean(p.title);
      need(title.length >= 10, 'Record what this follow-up requires.');
      need(clean(p.owner), 'An owned follow-up needs its owner.');
      need(isDate(p.due) && p.due >= TODAY, 'An owned follow-up needs a date in the site calendar.');
      need(!h.actions.some((a) => a.status !== 'Closed' && a.title === title), 'An open action with this title already exists. It is one obligation, not two.');
      const id = 'DEMO-ACT-' + h.ref.slice(-6) + '-' + String(h.actions.length + 1).padStart(2, '0');
      h.actions.push({id, title, owner: clean(p.owner), due: p.due, status: 'Open', source: clean(p.source) || 'Sales-to-Delivery Handover ' + h.ref, at: NOW});
      record(s, h, 'Action', 'Owned follow-up created for ' + clean(p.owner) + ': ' + title, ROLES[role].person);
    },
    link(s, h, p, role) {
      need(can(role, 'handover.review') || can(role, 'handover.prepare'), 'This action requires a working identity.');
      need(acceptance(h), 'Prepare a receiving link only after responsibility is accepted.');
      need(!h.links.some((l) => l.target === p.target), 'This receiving link has already been prepared. It creates no second record.');
      need(['Project', 'Service', 'Parts order', 'Finance', 'My Work'].includes(p.target), 'Choose an existing receiving workspace.');
      h.links.push({target: p.target, at: NOW, by: ROLES[role].person, state: 'Prepared locally', note: clean(p.note)});
      record(s, h, 'Receiving link', p.target + ' link prepared locally. No application record, booking or notification is created.', ROLES[role].person);
    },
    /* ---- demonstration controls: source and environment changes ---- */
    sourceChange(s, h, p) {
      const kind = p.kind;
      if (kind === 'quotation') {
        need(h.commercial.quotation.state === 'Accepted', 'Only an accepted quotation can be superseded in this demonstration.');
        h.commercial.supersededBy = {ref: h.commercial.quotation.ref, revision: h.commercial.quotation.revision + 1, at: NOW};
        h.commercial.quotation.revision += 1;
        h.commercial.quotation.documentHash = 'syn-' + h.commercial.quotation.ref.slice(-6) + '-r' + h.commercial.quotation.revision;
        h.commercial.acceptance.state = 'Superseded';
        h.commercial.acceptance.supersededNote = 'A later quotation revision was issued. The earlier acceptance remains recorded against R' + String(h.commercial.quotation.revision - 1).padStart(2, '0') + '.';
        record(s, h, 'Source change', 'Quotation superseded by R' + String(h.commercial.quotation.revision).padStart(2, '0') + '. The earlier acceptance is retained and does not transfer.', 'Quotation lifecycle (ES-05/ES-06)');
      } else if (kind === 'technical') {
        const doc = h.commercial.documents.find((d) => d.state !== 'Missing');
        need(doc, 'No available supporting document to revise.');
        doc.revision = 'r' + String(Number(String(doc.revision).replace('r', '')) + 1).padStart(2, '0');
        doc.state = 'Superseded';
        record(s, h, 'Source change', doc.ref + ' advanced to ' + doc.revision + '. The revision bound to any acceptance is unchanged.', 'Engineering & Design Control');
      } else if (kind === 'destination') {
        h.destination.available = false;
        h.destination.unavailableReason = clean(p.reason) || 'The proposed receiving record was closed in its owning workspace.';
        record(s, h, 'Destination change', 'Receiving record unavailable: ' + h.destination.unavailableReason, 'Receiving workspace');
      } else {
        throw new Error('Unknown demonstration source change.');
      }
    },
  };

  /* ------------------------------------------------------------ validate */
  function validate(s) {
    assert(s && s.schema === SCHEMA, 'This saved session is not a supported Sales-to-Delivery Handover record.');
    assert(Number.isSafeInteger(s.version) && s.version >= 0, 'Invalid session version.');
    assert(Array.isArray(s.handovers) && s.handovers.length, 'A session must contain its handover records.');
    assert(Array.isArray(s.receipts), 'Operation receipts are missing.');
    const refs = new Set();
    for (const h of s.handovers) {
      assert(typeof h.ref === 'string' && !refs.has(h.ref), 'Duplicate handover reference.');
      refs.add(h.ref);
      assert(h.customer && h.customer.ref && h.site && h.site.ref, 'Handover context is incomplete.');
      assert(CONVERSION_STATES.includes(h.conversion.status), 'Unknown conversion outcome.');
      assert(h.destination.type === null || DESTINATIONS.includes(h.destination.type), 'Unknown delivery destination.');
      assert(STATES.includes(status(h)), 'Unknown handover state.');
      const ids = new Set(h.commercial.lines.map((l) => l.id));
      for (const l of h.destination.allocation.lineIds)
        assert(ids.has(l) || h.commercial.selections.some((x) => x.id === l), 'Allocation references a line outside the accepted basis.');
      assert(h.destination.allocation.unallocated.every((l) => !h.destination.allocation.lineIds.includes(l)), 'A line cannot be both allocated and unallocated.');
      const t = h.commercial.totals;
      assert(t.exGstCents + t.gstCents === t.inclGstCents, 'Accepted totals do not reconcile.');
      for (const r of h.revisions) {
        assert(r.payload && r.fingerprint, 'A revision must retain its exact payload and source fingerprint.');
        assert(['Submitted', 'Superseded', 'Returned', 'Accepted', 'Withdrawn'].includes(r.state), 'Unknown revision state.');
      }
      assert(h.revisions.filter((r) => r.state === 'Submitted').length <= 1, 'Only one revision can await review.');
      for (const d of h.reviews) {
        const rev = h.revisions.find((r) => r.rev === d.rev);
        assert(rev && d.revisionFingerprint === rev.fingerprint, 'A decision must remain bound to the exact revision it reviewed.');
      }
      assert(h.obligations.every((o) => ['Open', 'Closed'].includes(o.status)), 'Unknown obligation state.');
    }
    return s;
  }

  /* ---------------------------------------------------------- fixtures */
  const doc = (ref, revision, title, state, owner) => ({ref, revision, title, state, owner: owner || 'Daniel Moss · Estimating', hash: state === 'Missing' ? null : 'syn-' + ref.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + revision});

  function base(o) {
    return {
      id: o.id, ref: o.ref,
      opportunity: {
        ref: o.opportunity, title: o.title, ownerAtWon: o.salesOwner, wonAt: o.wonAt,
        opportunityVersion: o.opportunityVersion, outcomeEventId: o.outcomeEvent,
        acceptanceEvidenceNote: o.acceptanceNote,
        handoverDue: {status: 'Due', createdAt: o.wonAt, owner: o.salesOwner, source: 'ppo.opportunity_handovers_due (migration 0023); immutable, status is exactly “Due”'},
        ownershipTransfers: o.transfers || [],
      },
      customer: o.customer, site: o.site, areas: o.areas || [], equipment: o.equipment || [],
      commercial: o.commercial,
      conversion: o.conversion,
      destination: o.destination,
      requirements: o.requirements,
      revisions: [], draft: null, reviews: [], obligations: o.obligations || [], actions: o.actions || [],
      links: [], history: [],
    };
  }

  /* Accepted commercial basis for the Riverbend upgrade is reproduced from the
     retained customer quotation r03 document, SHA-256
     7ee657ef0f78d905486e9227a0821d88f86beddc9e13b872202b4095e2b6fe9a, using its
     declared default selections. Amounts are in cents and are not recomputed. */
  const RIVERBEND_LINES = [
    {id: 'L1', section: 'Climate control', description: 'Controller cabinet and core hardware', detail: 'Main control cabinet, power supply, field wiring termination and enclosure.', quantity: 1, unit: 'lot', amountCents: 3333333},
    {id: 'L2', section: 'Climate control', description: 'Environmental sensing package', detail: 'Temperature, relative humidity and CO₂ sensing across four measurement points.', quantity: 4, unit: 'point', amountCents: 640000},
    {id: 'L3', section: 'Fertigation', description: 'Fertigation unit — four dosing channels', detail: 'Dosing skid, injection assembly, EC and pH monitoring, mixing vessel.', quantity: 1, unit: 'lot', amountCents: 4800000},
    {id: 'L4', section: 'Fertigation', description: 'Irrigation valve control', detail: 'Valve interface and field cabling to eight irrigation zones.', quantity: 8, unit: 'zone', amountCents: 186667},
    {id: 'L5', section: 'Installation & commissioning', description: 'Installation', detail: 'Mechanical and electrical installation, on site.', quantity: 1, unit: 'lot', amountCents: 1760000},
    {id: 'L6', section: 'Installation & commissioning', description: 'Commissioning and handover training', detail: 'System commissioning, verification against the design basis, and operator handover.', quantity: 1, unit: 'lot', amountCents: 1000000},
    {id: 'L7', section: 'Project', description: 'Engineering and documentation', detail: 'Design, drawings, configuration and as-built documentation.', quantity: 1, unit: 'lot', amountCents: 2666667},
    {id: 'L8', section: 'Project', description: 'Delivery to site', detail: 'Local delivery to Cobram VIC.', quantity: 1, unit: 'lot', amountCents: 266667},
  ];

  function requirement(id, title, cls, source, owner, status, finding, extra) {
    return Object.assign({
      id, title, class: cls, applicable: true, reason: '', source, owner, due: '2026-09-22',
      status: status || 'Not received', finding: finding || '', reviewedAt: status && status !== 'Not received' ? '2026-09-15' : null,
      reviewedBy: status && status !== 'Not received' ? 'Dana Brooks' : null, sourceRef: '', history: [],
    }, extra || {});
  }

  function seed() {
    /* H1 — Riverbend Produce, Project destination, confirmed conversion. */
    const h1 = base({
      id: 'ho-1', ref: 'DEMO-HDV-030001', opportunity: 'SYN-PPO-OPP-000142',
      title: 'Glasshouse 3 climate and fertigation upgrade',
      salesOwner: 'Priya Raman', wonAt: '2026-09-12T23:40:00.000Z', opportunityVersion: 7,
      outcomeEvent: 'SYN-PPO-OP-000142-WON',
      acceptanceNote: 'Signed acceptance of SYN-PPO-QUO-000142 R02 received through the customer response workspace.',
      transfers: [{from: 'Alex Morgan', to: 'Priya Raman', at: '2026-08-28', reason: 'Territory realignment during Negotiation.', note: 'Opportunity ownership transfer (#161/#166). It changes who pursues the sale. It does not name a receiving delivery owner and does not complete the handover obligation.'}],
      customer: {name: 'SYN Riverbend Produce Pty Ltd', ref: 'SYN-PPO-ORG-000142', abn: 'ABN 00 000 000 000', contact: 'Alison Reid', position: 'Operations Manager', email: 'a.reid@syn-riverbend.example', erpAccount: 'SYN-CUST-RIVERBEND-AU', operator: 'SYN Riverbend Produce Pty Ltd', owner: 'SYN Riverbend Produce Pty Ltd', billTo: 'SYN Riverbend Produce Pty Ltd'},
      site: {ref: 'SYN-PPO-SIT-000142', name: 'SYN Riverbend — Glasshouse 3', address: 'Lot 14 Murray Valley Highway, Cobram VIC 3644', timezone: 'Australia/Melbourne'},
      areas: [{ref: 'SYN-PPO-FAC-000142', name: 'Glasshouse 3'}, {ref: 'SYN-PPO-FAC-000143', name: 'Irrigation plant room'}],
      equipment: [],
      commercial: {
        quotation: {ref: 'SYN-PPO-QUO-000142', revision: 2, issuedAt: '2026-09-11T09:40:00+10:00', validUntil: '2026-10-11T23:59:59+10:00', supersedes: 'SYN-PPO-QUO-000142 R01', state: 'Accepted', documentHash: '7ee657ef0f78d905486e9227a0821d88f86beddc9e13b872202b4095e2b6fe9a', granularity: 'package'},
        acceptance: {state: 'Recorded', at: '2026-09-12', by: 'Alison Reid', position: 'Operations Manager', channel: 'Customer quotation response workspace (ES-06)', evidenceRef: 'SYN-PPO-OP-000142-ACC'},
        customerPo: {ref: 'SYN-PO-RB-4471', receivedAt: '2026-09-13', amountNote: 'Customer order references the accepted total including GST.'},
        currency: 'AUD', taxBasis: 'GST at 10%, shown separately',
        lines: RIVERBEND_LINES,
        selections: [
          {id: 'OF1', offer: 'Weather station', label: 'Include weather station', included: false, deltaCents: 866666, note: 'Offered option; not selected by the customer.'},
          {id: 'OF2', offer: 'Extended monitoring — root zone', label: 'Include root zone monitoring', included: true, deltaCents: 1253333, note: 'Four sensing positions, interface and configuration.'},
          {id: 'OF3', offer: 'Irrigation pump set', label: 'Retain existing pump set', included: true, deltaCents: 0, note: 'Customer-supplied pump retained. Compatibility confirmation remains a customer responsibility.'},
        ],
        discount: {label: 'Project discount', amountCents: 450000},
        totals: {exGstCents: 15456667, gstCents: 1545667, inclGstCents: 17002334},
        scope: {
          inclusions: ['Supply, delivery, installation and commissioning of the controller and fertigation core', 'Environmental sensing at four measurement points', 'Root zone monitoring at four sensing positions', 'Integration to the existing wireless network', 'As-built documentation and operator handover training'],
          exclusions: ['Replacement irrigation pump set (customer retained the existing pump)', 'External weather sensing (option not selected)', 'Civil works, structural modification and three-phase supply upgrades', 'Crop management or agronomy services'],
          deliverables: ['Commissioning verification against the design basis', 'As-built drawings and configuration record', 'Operator handover training session'],
        },
        commitments: [
          {kind: 'Customer-requested date', text: 'Customer asked for commissioning before the spring planting window.', date: '2026-10-19'},
          {kind: 'Quoted assumption', text: 'Quotation assumes continuous site access across a five working-day installation window.', date: null},
          {kind: 'Quoted assumption', text: 'Existing pump set is assumed compatible; compatibility confirmation was recorded as a customer responsibility.', date: null},
          {kind: 'Confirmed commitment', text: 'Quotation validity confirmed to the customer in writing.', date: '2026-10-11'},
        ],
        documents: [
          doc('SYN-PPO-QUO-000142', 'R02', 'Accepted quotation issue', 'Available'),
          doc('SYN-PPO-BRF-000142', 'r02', 'Technical brief — control strategy and integration', 'Available', 'Casey Reed · Engineering'),
          doc('SYN-PPO-DWG-000142', 'r01', 'Single-line and field wiring schedule', 'Missing', 'Casey Reed · Engineering'),
          doc('SYN-PPO-SUP-000142', 'r01', 'Controller supplier lead-time confirmation', 'Available', 'Sam Whitcombe · Fulfilment'),
        ],
        clarifications: [
          {text: 'Customer confirmed that the existing pump set is retained; compatibility evidence has not been supplied.', owner: 'Priya Raman', status: 'Open'},
          {text: 'Wireless coverage at the far end of Glasshouse 3 was raised during negotiation and remains unmeasured.', owner: 'Casey Reed', status: 'Open'},
        ],
      },
      conversion: {
        operationId: 'SYN-PPO-COP-0001', orderKey: 'SYN-SO-00001', status: 'Confirmed', preparedAt: '2026-09-13',
        entity: 'SYN-PPA-AU',
        targets: [
          {id: 'ORDER', label: 'Sales order header', status: 'Confirmed', externalKey: 'SYN-SO-00001'},
          {id: 'L1', label: 'Controller cabinet and core hardware', status: 'Confirmed', externalKey: 'SYN-SO-00001/LINE-01'},
          {id: 'L3', label: 'Fertigation unit — four dosing channels', status: 'Confirmed', externalKey: 'SYN-SO-00001/LINE-02'},
          {id: 'L7', label: 'Engineering and documentation', status: 'Confirmed', externalKey: 'SYN-SO-00001/LINE-03'},
        ],
      },
      destination: {
        type: 'Project', decision: 'Routed', routable: true, available: true, unavailableReason: '',
        routingBasis: 'Accepted scope includes engineering, installation and commissioning. Routed under the approved estimating source for this opportunity.',
        routingOwner: 'Priya Raman',
        receivingOwner: 'Dana Brooks', receivingTeam: 'Projects & Commercial Delivery',
        record: {kind: 'Project', ref: null, proposed: true, version: 0, label: 'Proposed receiving project — reference allocated on acceptance'},
        entity: 'SYN-PPA-AU', erpAccount: 'SYN-CUST-RIVERBEND-AU', deliveryLocation: 'SYN Riverbend — Glasshouse 3, Cobram VIC 3644',
        dependencies: [
          {title: 'Engineering design release', detail: 'Single-line and field wiring schedule required before installation planning.', owner: 'Casey Reed · Engineering', state: 'Outstanding'},
          {title: 'Controller supplier lead time', detail: 'Supplier confirmation recorded; delivery promise not yet bound to a project date.', owner: 'Sam Whitcombe · Fulfilment', state: 'Recorded'},
        ],
        allocation: {lineIds: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'OF2', 'OF3'], unallocated: []},
      },
      requirements: [
        requirement('req-basis', 'Accepted commercial basis and acceptance evidence', 'Acceptance', 'Quotation lifecycle ES-05/ES-06', 'Priya Raman', 'Received — reviewed', 'Accepted issue R02 and its customer response record were inspected against the issued bytes.'),
        requirement('req-brief', 'Technical brief, survey and design information', 'Acceptance', 'Engineering & Design Control', 'Casey Reed', 'Not received', ''),
        requirement('req-scope', 'Site and exact facility scope', 'Acceptance', 'Customers, Sites & Growing Areas (CS-04/CS-05)', 'Priya Raman', 'Received — reviewed', 'Glasshouse 3 and the irrigation plant room are the only areas in the accepted scope.'),
        requirement('req-equipment', 'Equipment identity and relevant configuration', 'Acceptance', 'Equipment & Installed Base', 'Dana Brooks', 'Not applicable', 'No existing installed equipment is being modified; all controller and fertigation hardware is new supply.', {reason: 'New supply only; no installed-base record is affected by the accepted scope.'}),
        requirement('req-materials', 'Materials, supplier assumptions and lead-time evidence', 'Release', 'Supply Chain readiness contract (SCM-02/SCM-04)', 'Sam Whitcombe', 'Received — insufficient', 'Supplier confirmation is an estimate, not a confirmed promise. Supply readiness remains “Evidence needed”.'),
        requirement('req-access', 'Site access, biosecurity, induction and shutdown constraints', 'Release', 'Visit requirements (CS-06)', 'Priya Raman', 'Not received', ''),
        requirement('req-customer', 'Customer responsibilities and contact arrangements', 'Acceptance', 'Accepted quotation clarifications', 'Priya Raman', 'Received — insufficient', 'Pump compatibility remains a customer responsibility with no supplied evidence.'),
        requirement('req-docs', 'Documents, drawings, training and commissioning obligations', 'Release', 'Document issue and distribution contract', 'Casey Reed', 'Not received', ''),
      ],
    });

    /* H2 — Northbank Nursery, parts order, confirmed conversion, reviewable in one pass. */
    const h2 = base({
      id: 'ho-2', ref: 'DEMO-HDV-030002', opportunity: 'SYN-PPO-OPP-000148',
      title: 'Fertigation dosing spares — Irrigation room',
      salesOwner: 'Priya Raman', wonAt: '2026-09-15T02:10:00.000Z', opportunityVersion: 4,
      outcomeEvent: 'SYN-PPO-OP-000148-WON',
      acceptanceNote: 'Customer purchase order received against the issued quotation.',
      customer: {name: 'Northbank Nursery', ref: 'SYN-PPO-ORG-000148', abn: 'ABN 00 000 000 001', contact: 'Robin Ellis', position: 'Production Manager', email: 'r.ellis@syn-northbank.example', erpAccount: 'SYN-CUST-NORTHBANK-AU', operator: 'Northbank Nursery', owner: 'Northbank Nursery', billTo: 'Northbank Nursery'},
      site: {ref: 'SYN-PPO-SIT-000148', name: 'Northbank Nursery — Propagation site', address: '88 Kalinda Road, Silvan VIC 3795', timezone: 'Australia/Melbourne'},
      areas: [{ref: 'SYN-PPO-FAC-000102', name: 'Irrigation room'}, {ref: 'SYN-PPO-FAC-000103', name: 'Glasshouse 02 (served)'}],
      equipment: [{uuid: '11111111-1111-4111-8111-111111111101', ref: 'SYN-PPO-AST-000101', name: 'Fertigation unit 01', location: 'Irrigation room', serves: ['Glasshouse 02']}],
      commercial: {
        quotation: {ref: 'SYN-PPO-QUO-000148', revision: 1, issuedAt: '2026-09-14T10:15:00+10:00', validUntil: '2026-10-14T23:59:59+10:00', supersedes: null, state: 'Accepted', documentHash: 'syn-quo-000148-r01', granularity: 'line'},
        acceptance: {state: 'Recorded', at: '2026-09-15', by: 'Robin Ellis', position: 'Production Manager', channel: 'Customer purchase order attached to the issued quotation', evidenceRef: 'SYN-PPO-OP-000148-ACC'},
        customerPo: {ref: 'SYN-PO-NB-2210', receivedAt: '2026-09-15', amountNote: 'Purchase order total matches the accepted quotation including GST.'},
        currency: 'AUD', taxBasis: 'GST at 10%, shown separately',
        lines: [
          {id: 'L1', section: 'Dosing', description: 'Dosing pump head kit', detail: 'Replacement head kit for channels 1 and 2.', quantity: 2, unit: 'ea', amountCents: 248000},
          {id: 'L2', section: 'Monitoring', description: 'EC probe', detail: 'Inline conductivity probe with fitting.', quantity: 1, unit: 'ea', amountCents: 86000},
          {id: 'L3', section: 'Dosing', description: 'Injector seal kit', detail: 'Seal and diaphragm set.', quantity: 4, unit: 'ea', amountCents: 84000},
        ],
        selections: [], discount: {label: null, amountCents: 0},
        totals: {exGstCents: 418000, gstCents: 41800, inclGstCents: 459800},
        scope: {
          inclusions: ['Supply of the listed spares', 'Delivery to the Propagation site store'],
          exclusions: ['Installation, commissioning and calibration', 'Removal or disposal of replaced parts'],
          deliverables: ['Packing list and delivery confirmation'],
        },
        commitments: [
          {kind: 'Customer-requested date', text: 'Customer asked for delivery before the next dosing service visit.', date: '2026-09-24'},
          {kind: 'Quoted assumption', text: 'Lead time quoted from supplier stock at the time of quotation.', date: null},
        ],
        documents: [
          doc('SYN-PPO-QUO-000148', 'R01', 'Accepted quotation issue', 'Available'),
          doc('SYN-PPO-SUP-000148', 'r01', 'Supplier stock and lead-time observation', 'Available', 'Sam Whitcombe · Fulfilment'),
        ],
        clarifications: [],
      },
      conversion: {
        operationId: 'SYN-PPO-COP-0002', orderKey: 'SYN-SO-00002', status: 'Confirmed', preparedAt: '2026-09-15', entity: 'SYN-PPA-AU',
        targets: [
          {id: 'ORDER', label: 'Sales order header', status: 'Confirmed', externalKey: 'SYN-SO-00002'},
          {id: 'L1', label: 'Dosing pump head kit', status: 'Confirmed', externalKey: 'SYN-SO-00002/LINE-01'},
          {id: 'L2', label: 'EC probe', status: 'Confirmed', externalKey: 'SYN-SO-00002/LINE-02'},
          {id: 'L3', label: 'Injector seal kit', status: 'Confirmed', externalKey: 'SYN-SO-00002/LINE-03'},
        ],
      },
      destination: {
        type: 'Parts order', decision: 'Routed', routable: true, available: true, unavailableReason: '',
        routingBasis: 'Accepted scope is supply only, with no installation or commissioning line. Routed to fulfilment under the approved estimating source.',
        routingOwner: 'Priya Raman',
        receivingOwner: 'Sam Whitcombe', receivingTeam: 'Supply Chain Management',
        record: {kind: 'Sales order', ref: 'SYN-SO-00002', proposed: false, version: 1, label: 'Confirmed ERP sales order (synthetic)'},
        entity: 'SYN-PPA-AU', erpAccount: 'SYN-CUST-NORTHBANK-AU', deliveryLocation: 'Northbank Nursery — Propagation site store, Silvan VIC 3795',
        dependencies: [
          {title: 'Stock observation', detail: 'Warehouse observation is Partial: the EC probe quantity is unresolved (SCM-02).', owner: 'Sam Whitcombe · Fulfilment', state: 'Outstanding'},
        ],
        allocation: {lineIds: ['L1', 'L2', 'L3'], unallocated: []},
      },
      requirements: [
        requirement('req-basis', 'Accepted commercial basis and acceptance evidence', 'Acceptance', 'Quotation lifecycle ES-05/ES-06', 'Priya Raman', 'Received — reviewed', 'Purchase order SYN-PO-NB-2210 matches the accepted issue R01 line for line.', {reviewedBy: 'Sam Whitcombe'}),
        requirement('req-scope', 'Site, delivery location and receiving contact', 'Acceptance', 'Customers, Sites & Growing Areas (CS-04)', 'Priya Raman', 'Received — reviewed', 'Delivery is to the Propagation site store; Robin Ellis is the receiving contact.', {reviewedBy: 'Sam Whitcombe'}),
        requirement('req-equipment', 'Equipment identity for the supplied parts', 'Acceptance', 'Equipment & Installed Base', 'Sam Whitcombe', 'Received — reviewed', 'Parts are for Fertigation unit 01, asset 11111111-1111-4111-8111-111111111101.', {reviewedBy: 'Sam Whitcombe'}),
        requirement('req-materials', 'Stock, supplier assumptions and lead-time evidence', 'Release', 'Supply Chain readiness contract (SCM-02/SCM-04)', 'Sam Whitcombe', 'Received — insufficient', 'Warehouse observation is Partial; the EC probe quantity is unresolved. Partial availability is not zero stock.'),
        requirement('req-access', 'Delivery access and receiving hours', 'Release', 'Visit requirements (CS-06)', 'Robin Ellis', 'Received — reviewed', 'Store receiving hours and access route confirmed by the site contact on 15 September 2026.', {reviewedBy: 'Sam Whitcombe'}),
        requirement('req-customer', 'Customer responsibilities and contact arrangements', 'Acceptance', 'Accepted quotation clarifications', 'Priya Raman', 'Received — reviewed', 'Installation is excluded and the customer has accepted that the parts are supply only.', {reviewedBy: 'Sam Whitcombe'}),
      ],
    });

    /* H3 — Greenhaven Berries, Service destination, already accepted with an
       outstanding site prerequisite that prevents work release. */
    const h3 = base({
      id: 'ho-3', ref: 'DEMO-HDV-030003', opportunity: 'SYN-PPO-OPP-000151',
      title: 'Tunnel 06 vent drive replacement',
      salesOwner: 'Priya Raman', wonAt: '2026-09-15T04:05:00.000Z', opportunityVersion: 6,
      outcomeEvent: 'SYN-PPO-OP-000151-WON',
      acceptanceNote: 'Written acceptance received by email and recorded against the issued quotation.',
      customer: {name: 'Greenhaven Berries', ref: 'SYN-PPO-ORG-000151', abn: 'ABN 00 000 000 002', contact: 'Casey Reed', position: 'Site Manager', email: 'c.reed@syn-greenhaven.example', erpAccount: 'SYN-CUST-GREENHAVEN-AU', operator: 'Greenhaven Berries', owner: 'Greenhaven Land Holdings Pty Ltd', billTo: 'Greenhaven Berries'},
      site: {ref: 'SYN-PPO-SIT-000151', name: 'Greenhaven Berries — Berry tunnels', address: '1204 Warburton Highway, Wandin East VIC 3139', timezone: 'Australia/Melbourne'},
      areas: [{ref: 'SYN-PPO-FAC-000112', name: 'Tunnel 06'}],
      equipment: [{uuid: '11111111-1111-4111-8111-111111111105', ref: 'SYN-PPO-AST-000105', name: 'Vent drive 05', location: 'Tunnel 06', serves: ['Tunnel 06']}],
      commercial: {
        quotation: {ref: 'SYN-PPO-QUO-000151', revision: 2, issuedAt: '2026-09-13T08:30:00+10:00', validUntil: '2026-10-13T23:59:59+10:00', supersedes: 'SYN-PPO-QUO-000151 R01', state: 'Accepted', documentHash: 'syn-quo-000151-r02', granularity: 'package'},
        acceptance: {state: 'Recorded', at: '2026-09-15', by: 'Casey Reed', position: 'Site Manager', channel: 'Written acceptance recorded against the issued quotation', evidenceRef: 'SYN-PPO-OP-000151-ACC'},
        customerPo: null,
        currency: 'AUD', taxBasis: 'GST at 10%, shown separately',
        lines: [
          {id: 'L1', section: 'Ventilation', description: 'Vent drive unit and gearbox', detail: 'Replacement drive for Tunnel 06 including gearbox and limit assembly.', quantity: 1, unit: 'ea', amountCents: 862000},
          {id: 'L2', section: 'Installation', description: 'Removal, installation and travel verification', detail: 'On-site replacement and travel-time verification against the inspection criterion.', quantity: 1, unit: 'lot', amountCents: 432000},
        ],
        selections: [], discount: {label: null, amountCents: 0},
        totals: {exGstCents: 1294000, gstCents: 129400, inclGstCents: 1423400},
        scope: {
          inclusions: ['Supply and installation of the replacement vent drive', 'Travel-time verification against the recorded inspection criterion', 'Removal of the failed drive'],
          exclusions: ['Structural repair to the tunnel frame', 'Control strategy changes'],
          deliverables: ['Service report with the verified travel time'],
        },
        commitments: [
          {kind: 'Customer-requested date', text: 'Customer asked for attendance before the picking window opens.', date: '2026-09-25'},
          {kind: 'Quoted assumption', text: 'Quotation assumes the tunnel can be taken out of service for half a day.', date: null},
        ],
        documents: [
          doc('SYN-PPO-QUO-000151', 'R02', 'Accepted quotation issue', 'Available'),
          doc('SYN-PPO-RPT-000151', 'r01', 'Vent-drive inspection evidence (SYN-QA-SUB-000501)', 'Available', 'Alex Morgan · Quality'),
        ],
        clarifications: [
          {text: 'No customer purchase order was supplied; acceptance is the written response only.', owner: 'Priya Raman', status: 'Open'},
        ],
      },
      conversion: {
        operationId: 'SYN-PPO-COP-0003', orderKey: 'SYN-SO-00003', status: 'Confirmed', preparedAt: '2026-09-15', entity: 'SYN-PPA-AU',
        targets: [
          {id: 'ORDER', label: 'Sales order header', status: 'Confirmed', externalKey: 'SYN-SO-00003'},
          {id: 'L1', label: 'Vent drive unit and gearbox', status: 'Confirmed', externalKey: 'SYN-SO-00003/LINE-01'},
          {id: 'L2', label: 'Removal, installation and travel verification', status: 'Confirmed', externalKey: 'SYN-SO-00003/LINE-02'},
        ],
      },
      destination: {
        type: 'Service', decision: 'Routed', routable: true, available: true, unavailableReason: '',
        routingBasis: 'Accepted scope is corrective work on an existing installed asset with an open work order.',
        routingOwner: 'Priya Raman',
        receivingOwner: 'Morgan Hale', receivingTeam: 'Service Operations',
        record: {kind: 'Work order', ref: 'SYN-PPO-WO-000245', proposed: false, version: 3, label: 'Existing work order · Draft (not authorised)'},
        entity: 'SYN-PPA-AU', erpAccount: 'SYN-CUST-GREENHAVEN-AU', deliveryLocation: 'Greenhaven Berries — Berry tunnels, Tunnel 06',
        dependencies: [
          {title: 'Work order authorisation', detail: 'SYN-PPO-WO-000245 is Draft. Authorisation binds an exact scope revision, scope version and policy version.', owner: 'Morgan Hale · Service', state: 'Outstanding'},
          {title: 'Open site incident', detail: 'SYN-QA-EVT-000501 (visitor route conflict) is open and blocking for this work scope.', owner: 'Robin Ellis · Quality', state: 'Outstanding'},
        ],
        allocation: {lineIds: ['L1', 'L2'], unallocated: []},
      },
      requirements: [
        requirement('req-basis', 'Accepted commercial basis and acceptance evidence', 'Acceptance', 'Quotation lifecycle ES-05/ES-06', 'Priya Raman', 'Received — reviewed', 'Written acceptance of issue R02 was inspected. No customer purchase order was supplied.', {reviewedBy: 'Morgan Hale'}),
        requirement('req-equipment', 'Equipment identity and relevant configuration', 'Acceptance', 'Equipment & Installed Base', 'Morgan Hale', 'Received — reviewed', 'Vent drive 05, asset 11111111-1111-4111-8111-111111111105, installed in Tunnel 06 and serving Tunnel 06 only.', {reviewedBy: 'Morgan Hale'}),
        requirement('req-scope', 'Site and exact facility scope', 'Acceptance', 'Customers, Sites & Growing Areas (CS-04/CS-05)', 'Priya Raman', 'Received — reviewed', 'Tunnel 06 is the only area in scope. Adjacent tunnels are excluded.', {reviewedBy: 'Morgan Hale'}),
        requirement('req-customer', 'Customer responsibilities and contact arrangements', 'Acceptance', 'Accepted quotation clarifications', 'Priya Raman', 'Received — reviewed', 'Casey Reed is the site contact and has accepted the half-day out-of-service assumption.', {reviewedBy: 'Morgan Hale'}),
        requirement('req-access', 'Site access, biosecurity, induction and shutdown constraints', 'Release', 'Visit requirements (CS-06)', 'Robin Ellis', 'Received — insufficient', 'The segregated visitor route recorded against incident SYN-QA-EVT-000501 has not been confirmed by the site owner. Current source information is not induction completion or site permission.'),
        requirement('req-materials', 'Materials and lead-time evidence', 'Release', 'Supply Chain readiness contract (SCM-04)', 'Sam Whitcombe', 'Received — reviewed', 'Drive unit confirmed against order SYN-SO-00003 with a supplier-confirmed date of 22 September 2026.', {reviewedBy: 'Morgan Hale'}),
        requirement('req-docs', 'Documents, training and commissioning obligations', 'Release', 'Document issue and distribution contract', 'Morgan Hale', 'Not received', ''),
      ],
      obligations: [
        {id: 'OBL-030003-01', title: 'Confirm the segregated visitor route with the site owner', owner: 'Robin Ellis', due: '2026-09-18', status: 'Open', blocksRelease: true, source: 'Receiving acceptance r01', closedBy: null},
        {id: 'OBL-030003-02', title: 'Issue the service scope document for the replacement visit', owner: 'Morgan Hale', due: '2026-09-19', status: 'Open', blocksRelease: true, source: 'Receiving acceptance r01', closedBy: null},
      ],
    });

    /* H4 — Cedar Vale Growers. Won, but with no bound customer acceptance and
       no approved routing source. */
    const h4 = base({
      id: 'ho-4', ref: 'DEMO-HDV-030004', opportunity: 'SYN-PPO-OPP-000156',
      title: 'Bay 03 lighting upgrade',
      salesOwner: 'Alex Morgan', wonAt: '2026-09-15T06:20:00.000Z', opportunityVersion: 5,
      outcomeEvent: 'SYN-PPO-OP-000156-WON',
      acceptanceNote: 'Verbal confirmation at the site meeting on 15 September 2026.',
      customer: {name: 'Cedar Vale Growers', ref: 'SYN-PPO-ORG-000156', abn: 'ABN 00 000 000 003', contact: 'Robin Ellis', position: 'Nursery Manager', email: 'r.ellis@syn-cedarvale.example', erpAccount: 'SYN-CUST-CEDARVALE-AU', operator: 'Cedar Vale Growers', owner: 'Cedar Vale Growers', billTo: 'Cedar Vale Growers'},
      site: {ref: 'SYN-PPO-SIT-000156', name: 'Cedar Vale — Young plant facility', address: '31 Ridge Road, Monbulk VIC 3793', timezone: 'Australia/Melbourne'},
      areas: [{ref: 'SYN-PPO-FAC-000113', name: 'Bay 03'}],
      equipment: [{uuid: '11111111-1111-4111-8111-111111111106', ref: 'SYN-PPO-AST-000106', name: 'Lighting circuit 06', location: 'Bay 03', serves: ['Bay 03']}],
      commercial: {
        quotation: {ref: 'SYN-PPO-QUO-000156', revision: 2, issuedAt: '2026-09-14T15:00:00+10:00', validUntil: '2026-10-14T23:59:59+10:00', supersedes: 'SYN-PPO-QUO-000156 R01', state: 'Issued — awaiting customer response', documentHash: 'syn-quo-000156-r02', granularity: 'package'},
        acceptance: {state: 'Missing', at: null, by: null, position: null, channel: 'No customer response is recorded against issue R02.', evidenceRef: null,
          note: 'The Won outcome carries a narrative acceptance note. A narrative note is not a customer response bound to a quotation issue.'},
        customerPo: null,
        currency: 'AUD', taxBasis: 'GST at 10%, shown separately',
        lines: [
          {id: 'L1', section: 'Lighting', description: 'Bay 03 lighting circuit upgrade', detail: 'Luminaire replacement and circuit protection for Bay 03.', quantity: 1, unit: 'lot', amountCents: 2140000},
          {id: 'L2', section: 'Installation', description: 'Installation and verification', detail: 'Electrical installation and operating-current verification.', quantity: 1, unit: 'lot', amountCents: 680000},
        ],
        selections: [], discount: {label: null, amountCents: 0},
        totals: {exGstCents: 2820000, gstCents: 282000, inclGstCents: 3102000},
        scope: {
          inclusions: ['Luminaire replacement in Bay 03', 'Operating-current verification'],
          exclusions: ['Switchboard upgrade', 'Other bays'],
          deliverables: ['Verification record against the approved lighting criterion'],
        },
        commitments: [
          {kind: 'Customer-requested date', text: 'Customer asked for completion before the propagation cycle starts.', date: '2026-10-05'},
        ],
        documents: [
          doc('SYN-PPO-QUO-000156', 'R02', 'Issued quotation — awaiting customer response', 'Available'),
          doc('SYN-PPO-BRF-000156', 'r01', 'Approved lighting criterion', 'Missing', 'Casey Reed · Engineering'),
        ],
        clarifications: [
          {text: 'Approved lighting criterion is still requested from Engineering; the inspection template has no minimum or maximum.', owner: 'Casey Reed', status: 'Open'},
        ],
      },
      conversion: {operationId: null, orderKey: null, status: 'Not prepared', preparedAt: null, entity: 'SYN-PPA-AU', targets: []},
      destination: {
        type: null, decision: 'Routing decision required', routable: false, available: true, unavailableReason: '',
        routingBasis: '', routingOwner: 'Alex Morgan',
        receivingOwner: 'Not assigned', receivingTeam: 'Not assigned',
        record: {kind: null, ref: null, proposed: false, version: 0, label: 'No receiving record — routing decision required'},
        entity: 'SYN-PPA-AU', erpAccount: 'SYN-CUST-CEDARVALE-AU', deliveryLocation: 'Cedar Vale — Young plant facility, Bay 03',
        dependencies: [],
        allocation: {lineIds: [], unallocated: ['L1', 'L2']},
      },
      requirements: [
        requirement('req-basis', 'Accepted commercial basis and acceptance evidence', 'Acceptance', 'Quotation lifecycle ES-05/ES-06', 'Alex Morgan', 'Not received', ''),
        requirement('req-brief', 'Technical brief and approved criterion', 'Acceptance', 'Engineering & Design Control', 'Casey Reed', 'Not received', ''),
        requirement('req-scope', 'Site and exact facility scope', 'Acceptance', 'Customers, Sites & Growing Areas (CS-04/CS-05)', 'Alex Morgan', 'Received — reviewed', 'Bay 03 in the Young plant facility is the only area named in the issued quotation.', {reviewedBy: 'Alex Morgan'}),
        requirement('req-access', 'Site access and shutdown constraints', 'Release', 'Visit requirements (CS-06)', 'Robin Ellis', 'Not received', ''),
      ],
      actions: [
        {id: 'DEMO-ACT-030004-01', title: 'Obtain the customer response to quotation SYN-PPO-QUO-000156 R02', owner: 'Alex Morgan', due: '2026-09-18', status: 'Open', source: 'Quotation lifecycle ES-06', at: '2026-09-15T06:25:00.000Z'},
        {id: 'DEMO-ACT-030004-02', title: 'Record the routing decision for the accepted lighting scope', owner: 'Alex Morgan', due: '2026-09-19', status: 'Open', source: 'Sales-to-Delivery Handover DEMO-HDV-030004', at: '2026-09-15T06:25:00.000Z'},
      ],
    });

    /* H5 — Willowbank Horticulture, parts order, partially confirmed conversion
       requiring reconciliation in ES-07. */
    const h5 = base({
      id: 'ho-5', ref: 'DEMO-HDV-030005', opportunity: 'SYN-PPO-OPP-000159',
      title: 'Irrigation Shed 01 pump replacement parts',
      salesOwner: 'Priya Raman', wonAt: '2026-09-14T22:15:00.000Z', opportunityVersion: 3,
      outcomeEvent: 'SYN-PPO-OP-000159-WON',
      acceptanceNote: 'Customer response recorded through the quotation response workspace.',
      customer: {name: 'Willowbank Horticulture', ref: 'SYN-PPO-ORG-000159', abn: 'ABN 00 000 000 004', contact: 'Morgan Hale', position: 'Property Manager', email: 'm.hale@syn-willowbank.example', erpAccount: 'SYN-CUST-WILLOWBANK-AU', operator: 'Willowbank Horticulture', owner: 'Willowbank Land Trust', billTo: 'Willowbank Horticulture'},
      site: {ref: 'SYN-PPO-SIT-000159', name: 'Willowbank Horticulture — Nursery & propagation', address: '76 Kallista Road, Kallista VIC 3791', timezone: 'Australia/Melbourne'},
      areas: [{ref: 'SYN-PPO-FAC-000406', name: 'Irrigation Shed 01'}, {ref: 'SYN-PPO-FAC-000401', name: 'Greenhouse 01 (served)'}, {ref: 'SYN-PPO-FAC-000402', name: 'Tunnel 01 (served)'}, {ref: 'SYN-PPO-FAC-000403', name: 'Propagation House 01 (served)'}],
      equipment: [{uuid: '33000000-0000-4000-8000-000000000501', ref: 'SYN-PPO-AST-000501', name: 'Irrigation pump 01', location: 'Irrigation Shed 01', serves: ['Greenhouse 01', 'Tunnel 01', 'Propagation House 01']}],
      commercial: {
        quotation: {ref: 'SYN-PPO-QUO-000159', revision: 1, issuedAt: '2026-09-13T11:00:00+10:00', validUntil: '2026-10-13T23:59:59+10:00', supersedes: null, state: 'Accepted', documentHash: 'syn-quo-000159-r01', granularity: 'line'},
        acceptance: {state: 'Recorded', at: '2026-09-14', by: 'Morgan Hale', position: 'Property Manager', channel: 'Customer quotation response workspace (ES-06)', evidenceRef: 'SYN-PPO-OP-000159-ACC'},
        customerPo: {ref: 'SYN-PO-WB-0907', receivedAt: '2026-09-14', amountNote: 'Purchase order references the accepted total including GST.'},
        currency: 'AUD', taxBasis: 'GST at 10%, shown separately',
        lines: [
          {id: 'L1', section: 'Pump', description: 'Replacement pump end', detail: 'Pump end assembly matched to the installed unit.', quantity: 1, unit: 'ea', amountCents: 584000},
          {id: 'L2', section: 'Control', description: 'Pressure transducer', detail: 'Replacement transducer and cable gland.', quantity: 1, unit: 'ea', amountCents: 196000},
          {id: 'L3', section: 'Pump', description: 'Mechanical seal set', detail: 'Seal set and gasket kit.', quantity: 2, unit: 'ea', amountCents: 185000},
        ],
        selections: [], discount: {label: null, amountCents: 0},
        totals: {exGstCents: 965000, gstCents: 96500, inclGstCents: 1061500},
        scope: {
          inclusions: ['Supply of the listed pump parts', 'Delivery to Irrigation Shed 01'],
          exclusions: ['Installation and commissioning', 'Hydraulic assessment of the served areas'],
          deliverables: ['Packing list and delivery confirmation'],
        },
        commitments: [
          {kind: 'Quoted assumption', text: 'Parts are matched to the installed pump identity recorded in the installed base.', date: null},
          {kind: 'Customer-requested date', text: 'Customer asked for delivery before the next irrigation service.', date: '2026-09-29'},
        ],
        documents: [
          doc('SYN-PPO-QUO-000159', 'R01', 'Accepted quotation issue', 'Available'),
          doc('SYN-PPO-SUP-000159', 'r01', 'Supplier confirmation', 'Available', 'Sam Whitcombe · Fulfilment'),
        ],
        clarifications: [],
      },
      conversion: {
        operationId: 'SYN-PPO-COP-0004', orderKey: 'SYN-SO-00005', status: 'Partially confirmed', preparedAt: '2026-09-15', entity: 'SYN-PPA-AU',
        targets: [
          {id: 'ORDER', label: 'Sales order header', status: 'Confirmed', externalKey: 'SYN-SO-00005'},
          {id: 'L1', label: 'Replacement pump end', status: 'Confirmed', externalKey: 'SYN-SO-00005/LINE-01'},
          {id: 'L2', label: 'Pressure transducer', status: 'OutcomeUnknown', externalKey: null},
          {id: 'L3', label: 'Mechanical seal set', status: 'FailedNoEffect', externalKey: null},
        ],
      },
      destination: {
        type: 'Parts order', decision: 'Routed', routable: true, available: true, unavailableReason: '',
        routingBasis: 'Accepted scope is supply only. Routed to fulfilment under the approved estimating source.',
        routingOwner: 'Priya Raman',
        receivingOwner: 'Sam Whitcombe', receivingTeam: 'Supply Chain Management',
        record: {kind: 'Sales order', ref: 'SYN-SO-00005', proposed: false, version: 1, label: 'Partially confirmed ERP sales order (synthetic)'},
        entity: 'SYN-PPA-AU', erpAccount: 'SYN-CUST-WILLOWBANK-AU', deliveryLocation: 'Willowbank Horticulture — Irrigation Shed 01, Kallista VIC 3791',
        dependencies: [
          {title: 'Conversion reconciliation', detail: 'One line outcome is unknown and one is a confirmed no-effect. Reconciliation belongs to ES-07.', owner: 'Jordan · Conversion coordinator', state: 'Outstanding'},
        ],
        allocation: {lineIds: ['L1', 'L2', 'L3'], unallocated: []},
      },
      requirements: [
        requirement('req-basis', 'Accepted commercial basis and acceptance evidence', 'Acceptance', 'Quotation lifecycle ES-05/ES-06', 'Priya Raman', 'Received — reviewed', 'Accepted issue R01 and purchase order SYN-PO-WB-0907 were inspected.', {reviewedBy: 'Sam Whitcombe'}),
        requirement('req-equipment', 'Equipment identity for the supplied parts', 'Acceptance', 'Equipment & Installed Base / Customer 360', 'Sam Whitcombe', 'Received — reviewed', 'Irrigation pump 01, asset 33000000-0000-4000-8000-000000000501, installed in Irrigation Shed 01 and serving Greenhouse 01, Tunnel 01 and Propagation House 01.', {reviewedBy: 'Sam Whitcombe'}),
        requirement('req-scope', 'Site, delivery location and receiving contact', 'Acceptance', 'Customers, Sites & Growing Areas (CS-04)', 'Priya Raman', 'Received — reviewed', 'Delivery is to Irrigation Shed 01 on the Nursery & propagation site.', {reviewedBy: 'Sam Whitcombe'}),
        requirement('req-materials', 'Stock, supplier assumptions and lead-time evidence', 'Release', 'Supply Chain readiness contract (SCM-02/SCM-04)', 'Sam Whitcombe', 'Received — reviewed', 'Supplier confirmation SYN-PPO-SUP-000159 r01 names a confirmed date of 25 September 2026.', {reviewedBy: 'Sam Whitcombe'}),
        requirement('req-customer', 'Customer responsibilities and contact arrangements', 'Acceptance', 'Accepted quotation clarifications', 'Priya Raman', 'Received — reviewed', 'Installation is excluded; the customer arranges its own fitting.', {reviewedBy: 'Sam Whitcombe'}),
      ],
    });

    const s = {schema: SCHEMA, version: 0, sequence: 0, today: TODAY, handovers: [h1, h2, h3, h4, h5], receipts: []};

    /* Seeded evidence: H1 has a submitted r01 awaiting review; H3 was already
       accepted with outstanding obligations. Both are recorded as retained
       history, not as live commands. */
    seedRevision(s, h1, 'r01', 'Initial delivery handover for the accepted Glasshouse 3 upgrade.', '2026-09-14T03:30:00.000Z', 'Priya Raman', '2026-09-18');
    seedRevision(s, h2, 'r01', 'Delivery handover for the accepted dosing spares order.', '2026-09-15T05:00:00.000Z', 'Priya Raman', '2026-09-17');
    seedRevision(s, h5, 'r01', 'Delivery handover for the accepted pump parts order.', '2026-09-15T06:00:00.000Z', 'Priya Raman', '2026-09-17');
    seedRevision(s, h3, 'r01', 'Delivery handover for the accepted vent drive replacement.', '2026-09-15T05:30:00.000Z', 'Priya Raman', '2026-09-17');
    seedAcceptance(s, h3, 'r01', 'Accept with outstanding obligations',
      'The accepted scope, asset identity and site scope are complete. Responsibility for delivering the vent drive replacement is accepted. The segregated visitor route and the service scope document remain outstanding and must be satisfied before work is authorised.',
      'Morgan Hale', 'service');
    record(s, h4, 'Outcome', 'Opportunity recorded as Won with a narrative acceptance note. No customer response is bound to quotation issue R02.', 'Alex Morgan', h4.opportunity.wonAt);
    record(s, h4, 'Destination', 'Routing decision required: no approved source routes this accepted scope to a delivery destination.', 'Alex Morgan', '2026-09-15T06:25:00.000Z');
    record(s, h5, 'Conversion', 'Conversion SYN-PPO-COP-0004 returned a partially confirmed result. One target outcome is unknown and one is a confirmed no-effect. Reconciliation belongs to ES-07.', 'Jordan · Conversion coordinator', '2026-09-15T06:40:00.000Z');
    return validate(s);
  }

  function seedRevision(s, h, rev, note, at, by, requiredResponseBy) {
    for (const old of h.revisions) if (old.state === 'Submitted') old.state = 'Superseded';
    h.revisions.push({rev, note, respondsTo: null, submittedAt: at, submittedBy: by, requiredResponseBy, state: 'Submitted', fingerprint: fingerprint(h), payload: payload(h)});
    record(s, h, 'Submission', 'Revision ' + rev + ' submitted to ' + h.destination.receivingOwner + '; response required by ' + pretty(requiredResponseBy) + '.', by, at);
  }

  function seedAcceptance(s, h, rev, decision, reason, by, role) {
    const revision = h.revisions.find((r) => r.rev === rev);
    revision.state = 'Accepted';
    h.reviews.push({
      id: 'DEC-' + h.ref.slice(-6) + '-01', rev, revisionFingerprint: revision.fingerprint, fingerprint: fingerprint(h),
      decision, reason, by, role, at: '2026-09-15T07:10:00.000Z', findings: [], responseOwner: h.opportunity.ownerAtWon,
      obligations: h.obligations.map((o) => o.id),
      boundSources: {
        quotation: h.commercial.quotation.ref + ' R' + String(h.commercial.quotation.revision).padStart(2, '0'),
        documentHash: h.commercial.quotation.documentHash,
        conversion: h.conversion.operationId + ' · ' + h.conversion.status,
        destination: (h.destination.record.ref || 'Proposed receiving record') + ' v' + h.destination.record.version,
        opportunityVersion: h.opportunity.opportunityVersion,
      },
      releaseAtAcceptance: releasePrerequisites(h).map((x) => x.title),
    });
    record(s, h, 'Receiving decision', decision + ' recorded against revision ' + rev + ' by ' + by + '.', by, '2026-09-15T07:10:00.000Z');
    record(s, h, 'Work release', 'Responsibility accepted with ' + releasePrerequisites(h).length + ' release prerequisite(s) still open. Work is not authorised or released by this acceptance.', by, '2026-09-15T07:11:00.000Z');
  }

  /* The nine separate events the workspace must never merge. */
  function chain(h) {
    const accepted = acceptance(h);
    const release = releasePrerequisites(h);
    return [
      {n: 1, label: 'Customer acceptance', owner: 'Customer', state: h.commercial.acceptance.state === 'Recorded' ? 'done' : 'blocked',
        detail: h.commercial.acceptance.state === 'Recorded' ? h.commercial.quotation.ref + ' R' + String(h.commercial.quotation.revision).padStart(2, '0') + ' accepted ' + pretty(h.commercial.acceptance.at) : 'Not recorded against an issue', source: 'ES-06'},
      {n: 2, label: 'Opportunity Won', owner: h.opportunity.ownerAtWon, state: 'done',
        detail: 'Recorded ' + pretty(h.opportunity.wonAt) + ' · opportunity v' + h.opportunity.opportunityVersion, source: 'CRM'},
      {n: 3, label: 'Item resolution and ERP conversion', owner: 'Jordan · Conversion coordinator',
        state: h.conversion.status === 'Confirmed' ? 'done' : h.conversion.status === 'Not prepared' ? 'blocked' : 'blocked',
        detail: h.conversion.status + (h.conversion.orderKey ? ' · ' + h.conversion.orderKey : ''), source: 'ES-07'},
      {n: 4, label: 'Delivery handover submitted', owner: h.opportunity.ownerAtWon,
        state: h.revisions.length ? 'done' : 'blocked',
        detail: h.revisions.length ? latestRevision(h).rev + ' · ' + latestRevision(h).state.toLowerCase() : 'No revision submitted', source: 'CR-03'},
      {n: 5, label: 'Receiving responsibility accepted', owner: h.destination.receivingOwner,
        state: accepted ? 'done' : 'blocked',
        detail: accepted ? accepted.decision + ' · ' + accepted.by + ' · ' + pretty(accepted.at) : 'Not accepted', source: 'CR-03'},
      {n: 6, label: 'Work authorised or released', owner: h.destination.receivingOwner, state: 'outside',
        detail: release.length ? release.length + ' prerequisite(s) open' : accepted ? 'No prerequisite recorded here' : 'Not assessed', source: h.destination.type === 'Service' ? 'Service work order authorisation' : 'Receiving workspace'},
      {n: 7, label: 'Attendance scheduled', owner: h.destination.receivingOwner, state: 'outside', detail: 'Outside this increment', source: 'Scheduling & Appointments'},
      {n: 8, label: 'Delivery completed', owner: h.destination.receivingOwner, state: 'outside', detail: 'Outside this increment', source: 'Projects / Service / Supply Chain'},
      {n: 9, label: 'Financial processing and reconciliation', owner: 'Finance', state: 'outside', detail: 'Outside this increment', source: 'Finance & Commercial Controls'},
    ];
  }

  global.HANDOVER_MODEL = {
    SCHEMA, TODAY, NOW, ROLES, STATES, DESTINATIONS, CONVERSION_STATES, REQUIREMENT_STATES, DECISIONS,
    clone, money, isDate, clean, can, receivesFor,
    seed, validate, command, status, nextAction, nextRevisionLabel,
    fingerprint, informationGaps, acceptanceBlockers, releasePrerequisites,
    currentSubmission, latestRevision, acceptance, latestReview, openObligations,
    payload, allocatedTotal, fullyAllocated, compare, changedFields, chain, pretty,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
