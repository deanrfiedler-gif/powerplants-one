-- Field readiness gate, first increment (PPO-SVC-FIELD-READINESS-GATE-PROP P1 to P3, accepted in
-- PPO-UXB-DEC-01 decision 4). Adds the technician Return with reason, the preparer's "No change
-- needed" answer, owned return and check tasks, and the guards behind the Dispatch-stage
-- PartsReadiness criterion of SYN-PPO-P04 v2 (the policy row itself is seeded).
-- No identity type, capability or Activity kind is added, so ppo.business_identities is not altered.
-- snapshot(), PackSnapshot, OUT-09 and every issued pack's bytes are unchanged.

DO $$ DECLARE d text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT d FROM pg_constraint WHERE conrelid='ppo.outbox_jobs'::regclass AND conname='ck_outbox_kind';
 ALTER TABLE ppo.outbox_jobs DROP CONSTRAINT ck_outbox_kind;
 EXECUTE format('ALTER TABLE ppo.outbox_jobs ADD CONSTRAINT ck_outbox_kind CHECK ((%s) OR kind = ANY(%L::text[]))',substring(d from 8 for length(d)-8),ARRAY['PackIssueReturned','PackReturnAnswered']);
 -- The two P04 criterion checks are unnamed in 0004. Replace them only at their exact known definitions.
 SELECT pg_get_constraintdef(oid) INTO STRICT d FROM pg_constraint WHERE conrelid='ppo.policy_criteria'::regclass AND conname='policy_criteria_check';
 IF d<>'CHECK (((NOT exception_allowed) OR (criterion_code = ''ToolPreparation''::text)))' THEN RAISE EXCEPTION 'Inspect changed policy criterion exception check'; END IF;
 SELECT pg_get_constraintdef(oid) INTO STRICT d FROM pg_constraint WHERE conrelid='ppo.policy_criteria'::regclass AND conname='policy_criteria_check1';
 IF d<>'CHECK (((NOT not_applicable_allowed) OR (applicability = ''Intervention''::text)))' THEN RAISE EXCEPTION 'Inspect changed policy criterion applicability check'; END IF;
END $$;
-- Parts may take a permitted exception (Q1) and the preparer's "No parts needed for this visit" (R1).
ALTER TABLE ppo.policy_criteria DROP CONSTRAINT policy_criteria_check, DROP CONSTRAINT policy_criteria_check1,
 ADD CONSTRAINT ck_policy_criteria_exception CHECK(NOT exception_allowed OR criterion_code IN ('ToolPreparation','PartsReadiness')),
 ADD CONSTRAINT ck_policy_criteria_not_applicable CHECK(NOT not_applicable_allowed OR applicability='Intervention' OR criterion_code='PartsReadiness');
ALTER TABLE ppo.pack_issue_events DROP CONSTRAINT pack_issue_events_kind_check,
 ADD CONSTRAINT pack_issue_events_kind_check CHECK(kind IN ('Issued','ReviewRequired','Superseded','Withdrawn','Returned'));

-- Nobody records a Parts pass: it is derived from Supply Chain readiness. The intervention rule that
-- keeps isolation and shutdown controls from being waived does not apply to a parts statement.
CREATE OR REPLACE FUNCTION ppo.validate_readiness_policy() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE pc ppo.policy_criteria; sr ppo.scope_revisions; d ppo.document_references; ap ppo.appointments;
BEGIN
 SELECT * INTO sr FROM ppo.scope_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.scope_revision_id;
 SELECT * INTO pc FROM ppo.policy_criteria WHERE workspace_id=NEW.workspace_id AND policy_version_id=NEW.policy_version_id AND criterion_code=NEW.criterion_code;
 IF sr.policy_version_id IS DISTINCT FROM NEW.policy_version_id OR pc.blocking_stage IS DISTINCT FROM NEW.blocking_stage OR pc.exception_allowed IS DISTINCT FROM NEW.exception_allowed OR
 (NEW.appointment_id IS NULL AND NEW.blocking_stage<>'Authorisation') OR (NEW.appointment_id IS NOT NULL AND NEW.blocking_stage='Authorisation') THEN RAISE EXCEPTION 'Readiness facts must match controlled policy' USING ERRCODE='23514'; END IF;
 IF NEW.evidence_ref IS NOT NULL THEN
  SELECT * INTO d FROM ppo.document_references WHERE workspace_id=NEW.workspace_id AND id=NEW.evidence_ref;
  IF d.work_order_id IS DISTINCT FROM sr.work_order_id THEN RAISE EXCEPTION 'Readiness evidence belongs to another order' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.outcome='NotApplicable' AND (NOT pc.not_applicable_allowed OR (NEW.criterion_code<>'PartsReadiness' AND EXISTS(SELECT 1 FROM ppo.scope_items WHERE workspace_id=NEW.workspace_id AND scope_revision_id=NEW.scope_revision_id AND (task_kind='Intervention' OR nullif(btrim(shutdown_condition),'') IS NOT NULL)))) THEN RAISE EXCEPTION 'Applicable mandatory control cannot be waived' USING ERRCODE='23514'; END IF;
 IF NEW.appointment_id IS NOT NULL THEN
  SELECT * INTO ap FROM ppo.appointments WHERE workspace_id=NEW.workspace_id AND id=NEW.appointment_id;
  IF ap.policy_version_id IS DISTINCT FROM NEW.policy_version_id OR ap.scope_version<>NEW.scope_version THEN RAISE EXCEPTION 'Proposal scope/policy evidence changed' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.criterion_code IN ('CrewCompetency','DispatchControls') AND NEW.outcome IN ('Pass','PermittedException','NotApplicable') THEN RAISE EXCEPTION 'P04 cannot clear later crew/dispatch controls' USING ERRCODE='23514'; END IF;
 IF NEW.criterion_code='PartsReadiness' AND NEW.outcome='Pass' THEN RAISE EXCEPTION 'Parts readiness is derived from Supply Chain and is never recorded as a pass' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;

-- Database backstop for the derived criterion. The service evaluates the full Supply Chain readiness
-- (source validity, receipts, promises); this refuses clearing a hold while a linked demand is short
-- of usable allocation, incomplete or unapproved, while a demand sits on the work order without a
-- visit (Q7), or while nothing is linked and no "No parts needed" statement is current.
CREATE FUNCTION ppo.parts_dispatch_blocked(a ppo.appointments) RETURNS boolean LANGUAGE sql STABLE AS $$
 WITH statement AS (
  SELECT CASE WHEN x.scope_version=a.scope_version AND (x.valid_until IS NULL OR x.valid_until>clock_timestamp()) THEN x.outcome ELSE 'Unknown' END AS outcome
  FROM ppo.readiness_assessments x WHERE x.workspace_id=a.workspace_id AND x.scope_revision_id=a.scope_revision_id AND x.appointment_id=a.id AND x.criterion_code='PartsReadiness'
  ORDER BY x.assessment_version DESC LIMIT 1),
 linked AS (SELECT d.* FROM ppo.supply_records d WHERE d.workspace_id=a.workspace_id AND d.kind='Demand' AND d.data->>'appointment_id'=a.id::text)
 SELECT EXISTS(SELECT 1 FROM ppo.policy_criteria pc WHERE pc.workspace_id=a.workspace_id AND pc.policy_version_id=a.policy_version_id AND pc.criterion_code='PartsReadiness')
 AND NOT (
  coalesce((SELECT outcome FROM statement),'Unknown')='PermittedException'
  OR (NOT EXISTS(SELECT 1 FROM ppo.supply_records d WHERE d.workspace_id=a.workspace_id AND d.kind='Demand' AND d.data->>'origin_kind'='WorkOrder' AND d.data->>'origin_id'=a.work_order_id::text AND nullif(d.data->>'appointment_id','') IS NULL)
   AND ((NOT EXISTS(SELECT 1 FROM linked) AND coalesce((SELECT outcome FROM statement),'Unknown')='NotApplicable')
    OR (EXISTS(SELECT 1 FROM linked) AND NOT EXISTS(SELECT 1 FROM linked d WHERE d.completeness<>'Complete' OR d.data->>'demand_class' IS DISTINCT FROM 'Approved' OR nullif(d.data->>'required_on','') IS NULL
     OR d.quantity>(SELECT coalesce(sum(s.quantity),0) FROM ppo.supply_allocations s WHERE s.workspace_id=d.workspace_id AND s.demand_id=d.id AND s.basis='Usable')))))
 )
$$;
-- 0007's dispatch guard with one added rule, checked only as a hold clears before attendance begins:
-- re-checking every later update would refuse unrelated appointment changes after a supply change.
CREATE OR REPLACE FUNCTION ppo.guard_pack_dispatch() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p ppo.packs; i ppo.pack_issues; clearing boolean;
BEGIN
 IF NEW.dispatch_hold THEN RETURN NEW; END IF;
 SELECT * INTO p FROM ppo.packs WHERE workspace_id=NEW.workspace_id AND appointment_id=NEW.id;
 SELECT * INTO i FROM ppo.pack_issues WHERE workspace_id=NEW.workspace_id AND id=p.current_issue_id;
 IF p.id IS NULL OR i.id IS NULL OR p.needs_review OR p.status<>'Issued' OR NEW.status NOT IN ('Confirmed','InProgress') OR NEW.customer_commitment<>'Confirmed' OR NEW.pack_requirement<>'Acknowledged' OR NEW.assignment_version<>i.assignment_version OR NEW.schedule_version<>i.schedule_version OR NOT EXISTS(SELECT 1 FROM ppo.work_orders w WHERE w.id=NEW.work_order_id AND w.scope_revision_id=w.authorised_scope_revision_id AND w.authorised_scope_revision_id=NEW.scope_revision_id)
 OR NOT EXISTS(SELECT 1 FROM ppo.assignments x WHERE x.appointment_id=NEW.id AND x.active)
 OR EXISTS(SELECT 1 FROM ppo.assignments x LEFT JOIN ppo.pack_recipients r ON r.assignment_id=x.id AND r.issue_id=i.id LEFT JOIN ppo.pack_acknowledgements a ON a.recipient_id=r.id WHERE x.appointment_id=NEW.id AND x.active AND (r.id IS NULL OR a.id IS NULL OR a.presented_hash<>i.output_hash)) THEN
 RAISE EXCEPTION 'Current issue and every independent crew response are required to clear dispatch hold' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN clearing:=true; ELSE clearing:=OLD.dispatch_hold AND OLD.actual_start_at IS NULL; END IF;
 IF clearing AND ppo.parts_dispatch_blocked(NEW) THEN
 RAISE EXCEPTION 'Parts ready for the stated material scope, a permitted exception or a current "No parts needed" statement is required to clear dispatch hold' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE INDEX ix_supply_demand_appointment ON ppo.supply_records(workspace_id,(data->>'appointment_id')) WHERE kind='Demand';

-- P2. A technician returns the exact issue with reasons and a note. Acknowledgement stays a single
-- per-person event: a recipient cannot return an issue they acknowledged, and cannot acknowledge while
-- their return is unanswered. After a "No change needed" answer they acknowledge or return again (Q2).
CREATE TABLE ppo.pack_returns (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, recipient_id uuid NOT NULL, issue_event_id uuid NOT NULL,
 actor_id uuid NOT NULL, operation_id uuid NOT NULL,
 presented_hash text NOT NULL CHECK(presented_hash ~ '^[a-f0-9]{64}$'),
 reason_codes text[] NOT NULL CHECK(cardinality(reason_codes) BETWEEN 1 AND 6 AND reason_codes <@ ARRAY['PartsMissing','PartsIncorrect','ScopeUnclear','SiteNotConfirmed','SafetyInformationMissing','Other']::text[]),
 note text NOT NULL CHECK(length(btrim(note)) BETWEEN 1 AND 1000),
 captured_at timestamptz NOT NULL, returned_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,actor_id,operation_id), UNIQUE(workspace_id,issue_event_id),
 FOREIGN KEY(workspace_id,recipient_id) REFERENCES ppo.pack_recipients(workspace_id,id),
 FOREIGN KEY(workspace_id,issue_event_id) REFERENCES ppo.pack_issue_events(workspace_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),
 CHECK(isfinite(captured_at) AND captured_at<=returned_at+interval '5 minutes')
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.pack_returns FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX ix_pack_returns_recipient ON ppo.pack_returns(workspace_id,recipient_id);
CREATE TABLE ppo.pack_return_answers (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, return_id uuid NOT NULL, actor_id uuid NOT NULL, operation_id uuid NOT NULL,
 note text NOT NULL CHECK(length(btrim(note)) BETWEEN 1 AND 1000), answered_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,return_id), UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,return_id) REFERENCES ppo.pack_returns(workspace_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.pack_return_answers FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
-- The preparer's task for a technician return, and for a checker return (P3). The scheduler's at-risk
-- task for a return is the Returned event's own pack_follow_ups row.
CREATE TABLE ppo.pack_return_follow_ups (
 workspace_id uuid NOT NULL, return_id uuid PRIMARY KEY, activity_id uuid NOT NULL UNIQUE,
 FOREIGN KEY(workspace_id,return_id) REFERENCES ppo.pack_returns(workspace_id,id),
 FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.pack_return_follow_ups FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.pack_check_follow_ups (
 workspace_id uuid NOT NULL, check_id uuid PRIMARY KEY, activity_id uuid NOT NULL UNIQUE,
 FOREIGN KEY(workspace_id,check_id) REFERENCES ppo.pack_checks(workspace_id,id),
 FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.pack_check_follow_ups FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE FUNCTION ppo.guard_pack_return() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r ppo.pack_recipients; i ppo.pack_issues; e ppo.pack_issue_events;
BEGIN
 SELECT * INTO r FROM ppo.pack_recipients WHERE workspace_id=NEW.workspace_id AND id=NEW.recipient_id;
 SELECT * INTO i FROM ppo.pack_issues WHERE workspace_id=NEW.workspace_id AND id=r.issue_id;
 SELECT * INTO e FROM ppo.pack_issue_events WHERE workspace_id=NEW.workspace_id AND id=NEW.issue_event_id;
 IF NEW.actor_id IS DISTINCT FROM r.user_id OR NEW.presented_hash IS DISTINCT FROM i.output_hash OR e.issue_id IS DISTINCT FROM i.id OR e.kind IS DISTINCT FROM 'Returned' OR e.actor_id IS DISTINCT FROM NEW.actor_id
 OR NOT EXISTS(SELECT 1 FROM ppo.packs p JOIN ppo.appointments a ON a.id=p.appointment_id JOIN ppo.assignments x ON x.appointment_id=a.id WHERE p.id=i.pack_id AND p.current_issue_id=i.id AND p.status='Issued' AND NOT p.needs_review AND a.status='Confirmed' AND a.schedule_version=i.schedule_version AND a.assignment_version=i.assignment_version AND x.id=r.assignment_id AND x.active) THEN
 RAISE EXCEPTION 'Only current exact recipient may return applicable issue' USING ERRCODE='23514'; END IF;
 IF (SELECT count(DISTINCT code) FROM unnest(NEW.reason_codes) code)<>cardinality(NEW.reason_codes) THEN RAISE EXCEPTION 'Each return reason is recorded once' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM ppo.pack_acknowledgements k WHERE k.workspace_id=NEW.workspace_id AND k.recipient_id=NEW.recipient_id) THEN RAISE EXCEPTION 'An acknowledged issue cannot also be returned' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM ppo.pack_returns t LEFT JOIN ppo.pack_return_answers n ON (n.workspace_id,n.return_id)=(t.workspace_id,t.id) WHERE t.workspace_id=NEW.workspace_id AND t.recipient_id=NEW.recipient_id AND n.id IS NULL) THEN RAISE EXCEPTION 'An unanswered return is already recorded for this recipient' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_return BEFORE INSERT ON ppo.pack_returns FOR EACH ROW EXECUTE FUNCTION ppo.guard_pack_return();
CREATE FUNCTION ppo.guard_pack_return_answer() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.pack_returns t JOIN ppo.pack_recipients r ON (r.workspace_id,r.id)=(t.workspace_id,t.recipient_id) JOIN ppo.pack_issues i ON (i.workspace_id,i.id)=(r.workspace_id,r.issue_id) JOIN ppo.packs p ON (p.workspace_id,p.id)=(i.workspace_id,i.pack_id)
  WHERE t.workspace_id=NEW.workspace_id AND t.id=NEW.return_id AND p.current_issue_id=i.id AND p.status='Issued' AND NOT p.needs_review) THEN
 RAISE EXCEPTION 'Only a return of the current applicable issue can be answered without a revision' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_answer BEFORE INSERT ON ppo.pack_return_answers FOR EACH ROW EXECUTE FUNCTION ppo.guard_pack_return_answer();
CREATE FUNCTION ppo.guard_acknowledgement_after_return() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM ppo.pack_returns t LEFT JOIN ppo.pack_return_answers n ON (n.workspace_id,n.return_id)=(t.workspace_id,t.id) WHERE t.workspace_id=NEW.workspace_id AND t.recipient_id=NEW.recipient_id AND n.id IS NULL) THEN
 RAISE EXCEPTION 'A returned issue is acknowledged only after the preparer answers the return' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_ack_return BEFORE INSERT ON ppo.pack_acknowledgements FOR EACH ROW EXECUTE FUNCTION ppo.guard_acknowledgement_after_return();

-- 0006's owned follow-up with the scheduler's at-risk task for a Returned event (Q3: the work order's
-- service owner). Return tasks are due by 09:00 site time on the visit day, or two hours before the
-- start if that is earlier (synthetic Q4 values; Service sets real ones under D-015).
CREATE OR REPLACE FUNCTION ppo.pack_owned_follow_up() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p record; task uuid;
BEGIN
 IF NEW.kind NOT IN ('ReviewRequired','Withdrawn','Returned') THEN RETURN NEW; END IF;
 SELECT pk.*,w.service_owner_id,a.display_number AS appointment_number,a.start_at,a.site_timezone INTO p FROM ppo.pack_issues i JOIN ppo.packs pk ON pk.id=i.pack_id JOIN ppo.appointments a ON a.id=pk.appointment_id JOIN ppo.work_orders w ON w.id=a.work_order_id WHERE i.id=NEW.issue_id;
 task:=gen_random_uuid();
 IF NEW.kind='Returned' THEN
  INSERT INTO ppo.activities(id,workspace_id,company_id,site_id,created_by,updated_by,kind,owner_id,summary,due_at,due_needed,access_class)
  VALUES(task,NEW.workspace_id,p.company_id,p.site_id,NEW.actor_id,NEW.actor_id,'CustomerContact',p.service_owner_id,p.display_number||' · returned by the crew: appointment '||p.appointment_number||' is at risk. Dispatch stays held until the whole crew acknowledges a revised issue, or the preparer answers the return. The booking is unchanged and no message has been sent.',
   least(((p.start_at AT TIME ZONE p.site_timezone)::date+time '09:00') AT TIME ZONE p.site_timezone,p.start_at-interval '2 hours'),false,'RestrictedService');
 ELSE
  INSERT INTO ppo.activities(id,workspace_id,company_id,site_id,created_by,updated_by,kind,owner_id,summary,due_at,due_needed,access_class)
  VALUES(task,NEW.workspace_id,p.company_id,p.site_id,NEW.actor_id,NEW.actor_id,'CustomerContact',p.service_owner_id,p.display_number||' · '||NEW.kind||': urgently review crew/customer contact and record the outcome; no message has been sent.',NULL,true,'RestrictedService');
 END IF;
 INSERT INTO ppo.activity_links(workspace_id,company_id,activity_id,object_type,object_id) VALUES(NEW.workspace_id,p.company_id,task,'Site',p.site_id);
 INSERT INTO ppo.pack_follow_ups VALUES(NEW.workspace_id,NEW.id,task);
 RETURN NEW;
END $$;
