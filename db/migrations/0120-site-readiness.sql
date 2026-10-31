-- P4/P5, PPO-SVC-FIELD-READINESS-GATE-PROP. No identity, capability, grant or user changes.
-- Timing has its own immutable scheduling-preparation family: existing duration publication
-- hashes, booking pins, old contacts and issued pack bytes remain untouched.
CREATE TABLE ppo.scheduling_preparation_policies (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, reference text NOT NULL,
 version integer NOT NULL CHECK(version>0), readiness_policy_id uuid NOT NULL,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 confirmation_opens_hours integer NOT NULL CHECK(confirmation_opens_hours>0),
 confirmation_due_hours integer NOT NULL CHECK(confirmation_due_hours>=0 AND confirmation_due_hours<confirmation_opens_hours),
 issue_due_minute integer NOT NULL CHECK(issue_due_minute BETWEEN 0 AND 1439),
 calendar_basis text NOT NULL CHECK(calendar_basis='PublishedLeadCalendar'),
 evidence text NOT NULL CHECK(length(btrim(evidence))>0),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,reference,version), UNIQUE(workspace_id,readiness_policy_id),
 FOREIGN KEY(workspace_id,readiness_policy_id) REFERENCES ppo.policy_versions(workspace_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.scheduling_preparation_policies FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

ALTER TABLE ppo.contact_outcomes ADD COLUMN purpose text NOT NULL DEFAULT 'DateAgreement', ADD COLUMN site_checks jsonb;
CREATE FUNCTION ppo.valid_site_checks(checks jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
 SELECT jsonb_typeof(checks)='object' AND checks ?& ARRAY['access','power_water','equipment','isolation']
 AND checks - ARRAY['access','power_water','equipment','isolation'] = '{}'::jsonb
 AND NOT EXISTS(SELECT 1 FROM jsonb_each(checks) c WHERE jsonb_typeof(c.value)<>'object'
  OR NOT c.value ?& ARRAY['status','note'] OR c.value - ARRAY['status','note'] <> '{}'::jsonb
  OR coalesce(c.value->>'status','') NOT IN ('Confirmed','NotReady','NotApplicable')
  OR jsonb_typeof(c.value->'note') IS DISTINCT FROM 'string' OR length(c.value->>'note')>1000)
$$;
ALTER TABLE ppo.contact_outcomes ADD CONSTRAINT ck_contact_purpose CHECK(
 (purpose='DateAgreement' AND site_checks IS NULL) OR (purpose='SiteReadiness' AND ppo.valid_site_checks(site_checks) IS TRUE));
CREATE INDEX ix_contact_purpose_schedule ON ppo.contact_outcomes(workspace_id,appointment_id,schedule_version,purpose,created_at DESC,id DESC);

-- No caller can manufacture a readiness pass with evidence from another schedule or visit.
CREATE FUNCTION ppo.guard_site_contact() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a ppo.appointments;
BEGIN
 IF NEW.purpose<>'SiteReadiness' THEN RETURN NEW; END IF;
 SELECT * INTO STRICT a FROM ppo.appointments WHERE workspace_id=NEW.workspace_id AND id=NEW.appointment_id FOR UPDATE;
 IF (a.company_id,a.site_id,a.schedule_version,a.start_at,a.end_at) IS DISTINCT FROM
    (NEW.company_id,NEW.site_id,NEW.schedule_version,NEW.start_at,NEW.end_at)
 OR a.status NOT IN ('Proposed','Confirmed') OR a.actual_start_at IS NOT NULL
 OR NEW.occurred_at<a.updated_at OR NEW.occurred_at>clock_timestamp()
 OR NOT EXISTS(SELECT 1 FROM ppo.sites s JOIN ppo.people p ON (p.workspace_id,p.id)=(s.workspace_id,s.primary_contact_id)
   WHERE s.workspace_id=a.workspace_id AND s.id=a.site_id AND p.id=NEW.recipient_id AND p.active)
 OR NOT EXISTS(SELECT 1 FROM ppo.scheduling_preparation_policies p WHERE p.workspace_id=a.workspace_id AND p.readiness_policy_id=a.policy_version_id)
 THEN RAISE EXCEPTION 'Current visit and current primary contact required for site readiness' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_site_contact BEFORE INSERT ON ppo.contact_outcomes FOR EACH ROW EXECUTE FUNCTION ppo.guard_site_contact();

CREATE FUNCTION ppo.customer_site_outcome(a ppo.appointments) RETURNS text LANGUAGE sql STABLE AS $$
 SELECT CASE WHEN x.id IS NULL OR p.id IS NULL OR x.occurred_at<a.start_at-make_interval(hours=>p.confirmation_opens_hours) THEN 'Unknown'
 WHEN EXISTS(SELECT 1 FROM jsonb_each(x.site_checks) c WHERE c.value->>'status'='NotReady') THEN 'Blocked'
 WHEN x.outcome='Confirmed' THEN 'Pass' ELSE 'Unknown' END
 FROM (SELECT 1) dummy LEFT JOIN ppo.scheduling_preparation_policies p ON p.workspace_id=a.workspace_id AND p.readiness_policy_id=a.policy_version_id
 LEFT JOIN LATERAL(SELECT c.* FROM ppo.contact_outcomes c WHERE c.workspace_id=a.workspace_id AND c.appointment_id=a.id
  AND c.schedule_version=a.schedule_version AND c.start_at=a.start_at AND c.end_at=a.end_at AND c.purpose='SiteReadiness'
  ORDER BY c.created_at DESC,c.id DESC LIMIT 1) x ON true
$$;

CREATE FUNCTION ppo.guard_customer_site_dispatch() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.dispatch_hold THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND (OLD.actual_start_at IS NOT NULL OR NOT OLD.dispatch_hold) THEN RETURN NEW; END IF;
 IF EXISTS(SELECT 1 FROM ppo.policy_criteria c WHERE c.workspace_id=NEW.workspace_id AND c.policy_version_id=NEW.policy_version_id AND c.criterion_code='CustomerSiteReadiness')
 AND ppo.customer_site_outcome(NEW)<>'Pass' THEN
 RAISE EXCEPTION 'Current customer site readiness is required to clear dispatch hold' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_customer_site_dispatch BEFORE INSERT OR UPDATE ON ppo.appointments FOR EACH ROW EXECUTE FUNCTION ppo.guard_customer_site_dispatch();
CREATE FUNCTION ppo.guard_derived_customer_site() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.criterion_code='CustomerSiteReadiness' AND NEW.outcome IN ('Pass','NotApplicable','PermittedException') THEN
 RAISE EXCEPTION 'Customer site readiness is derived only from typed contact evidence' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_derived_customer_site BEFORE INSERT OR UPDATE ON ppo.readiness_assessments FOR EACH ROW EXECUTE FUNCTION ppo.guard_derived_customer_site();
CREATE FUNCTION ppo.rehold_customer_site() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.purpose='SiteReadiness' THEN
  UPDATE ppo.appointments a SET dispatch_hold=a.dispatch_hold OR ppo.customer_site_outcome(a)<>'Pass',
   version=a.version+1,updated_by=NEW.created_by,updated_at=clock_timestamp()
   WHERE a.workspace_id=NEW.workspace_id AND a.id=NEW.appointment_id AND a.actual_start_at IS NULL;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER rehold_customer_site AFTER INSERT ON ppo.contact_outcomes FOR EACH ROW EXECUTE FUNCTION ppo.rehold_customer_site();

CREATE TABLE ppo.preparation_deadline_follow_ups (
 workspace_id uuid NOT NULL, appointment_id uuid NOT NULL, schedule_version integer NOT NULL CHECK(schedule_version>0),
 kind text NOT NULL CHECK(kind IN ('SiteReadinessDue','PackIssueDue')),
 owner_id uuid NOT NULL, activity_id uuid NOT NULL UNIQUE, policy_id uuid NOT NULL, due_at timestamptz NOT NULL CHECK(isfinite(due_at)),
 PRIMARY KEY(workspace_id,appointment_id,schedule_version,kind,owner_id),
 FOREIGN KEY(workspace_id,appointment_id) REFERENCES ppo.appointments(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id),
 FOREIGN KEY(workspace_id,policy_id) REFERENCES ppo.scheduling_preparation_policies(workspace_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.preparation_deadline_follow_ups FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
