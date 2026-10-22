-- PPO-CALLS-CALLER-ID-PROP stage 1b / ADR-0064: the call core (numbers, call events, call details).
-- No capability, grant, seed, identity type or route change, and no existing row changes. Each
-- non-blank people.phone is copied into one primary Other number that needs checking: SQL cannot
-- read numbers, so the text is kept and read when the numbers are next saved (R6).
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES
  ('audit_events','ck_audit_object_type','object_type','CallEvent'),
  ('outbox_jobs','ck_outbox_kind','kind','CallEventRecorded,CallEventSkipped,CallLogged')
 ) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',spec.tab,spec.con,substring(definition from 8 for length(definition)-8),spec.col,string_to_array(spec.added,','));
 END LOOP;
END $$;

-- Q9: a number written without a country code is read in its company's region. No row means AU.
CREATE TABLE ppo.company_phone_settings (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 default_phone_region text NOT NULL CHECK(default_phone_region ~ '^[A-Z]{2}$'),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 PRIMARY KEY(workspace_id,company_id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);

CREATE TABLE ppo.contact_numbers (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL,
 person_id uuid, organisation_id uuid,
 label text NOT NULL CHECK(label IN ('Mobile','Work','Home','Other')),
 entered text NOT NULL CHECK(length(entered) BETWEEN 1 AND 200 AND entered=btrim(entered)),
 e164 text CHECK(e164 ~ '^\+[1-9][0-9]{3,14}$'),
 region text NOT NULL CHECK(region ~ '^[A-Z]{2}$'),
 needs_checking boolean NOT NULL, is_primary boolean NOT NULL,
 position integer NOT NULL CHECK(position BETWEEN 1 AND 10),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id),
 CHECK(num_nonnulls(person_id,organisation_id)=1),
 CHECK(e164 IS NOT NULL OR needs_checking),
 FOREIGN KEY(workspace_id,person_id) REFERENCES ppo.people(workspace_id,id),
 FOREIGN KEY(workspace_id,organisation_id) REFERENCES ppo.organisations(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE UNIQUE INDEX contact_numbers_one_primary ON ppo.contact_numbers(workspace_id,coalesce(person_id,organisation_id)) WHERE is_primary;
CREATE UNIQUE INDEX contact_numbers_position ON ppo.contact_numbers(workspace_id,coalesce(person_id,organisation_id),position);
CREATE INDEX contact_numbers_lookup ON ppo.contact_numbers(workspace_id,e164) WHERE e164 IS NOT NULL;

INSERT INTO ppo.contact_numbers(id,workspace_id,person_id,label,entered,e164,region,needs_checking,is_primary,position,created_at,created_by,updated_at,updated_by)
SELECT gen_random_uuid(),pe.workspace_id,pe.id,'Other',btrim(pe.phone),NULL,'AU',true,true,1,pe.updated_at,pe.updated_by,pe.updated_at,pe.updated_by
FROM ppo.people pe WHERE length(btrim(coalesce(pe.phone,''))) BETWEEN 1 AND 200;

-- R3/R8: an event exists only for a matched party, once per source reference.
CREATE TABLE ppo.call_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, user_id uuid NOT NULL,
 source text NOT NULL CHECK(source IN ('ClickToCall','PhoneApp','Teams')),
 source_reference text NOT NULL CHECK(length(source_reference) BETWEEN 1 AND 200),
 direction text NOT NULL CHECK(direction IN ('Outgoing','Incoming')),
 number_e164 text NOT NULL CHECK(number_e164 ~ '^\+[1-9][0-9]{3,14}$'),
 person_id uuid, organisation_id uuid,
 started_at timestamptz NOT NULL CHECK(isfinite(started_at)),
 answered boolean, duration_seconds integer CHECK(duration_seconds BETWEEN 0 AND 86400),
 state text NOT NULL DEFAULT 'ToLog' CHECK(state IN ('ToLog','Logged','Skipped')),
 activity_id uuid, skip_reason text CHECK(skip_reason IN ('Personal','NotBusiness','AlreadyLogged')),
 resolved_at timestamptz, resolved_by uuid,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,source,source_reference), UNIQUE(workspace_id,activity_id),
 CHECK(num_nonnulls(person_id,organisation_id)>=1),
 CHECK((state='ToLog' AND activity_id IS NULL AND skip_reason IS NULL AND resolved_at IS NULL AND resolved_by IS NULL)
  OR (state='Logged' AND activity_id IS NOT NULL AND skip_reason IS NULL AND resolved_at IS NOT NULL AND resolved_by IS NOT NULL)
  OR (state='Skipped' AND activity_id IS NULL AND resolved_at IS NOT NULL AND resolved_by IS NOT NULL)),
 FOREIGN KEY(workspace_id,user_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,person_id) REFERENCES ppo.people(workspace_id,id),
 FOREIGN KEY(workspace_id,organisation_id) REFERENCES ppo.organisations(workspace_id,id),
 FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id),
 FOREIGN KEY(workspace_id,resolved_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE INDEX call_events_to_log ON ppo.call_events(workspace_id,user_id,started_at DESC) WHERE state='ToLog';
CREATE INDEX call_events_skipped ON ppo.call_events(workspace_id,resolved_at) WHERE state='Skipped';

-- The call facts of a logged Call activity. Retained with the activity and never edited.
CREATE TABLE ppo.call_details (
 activity_id uuid PRIMARY KEY, workspace_id uuid NOT NULL,
 direction text NOT NULL CHECK(direction IN ('Outgoing','Incoming')),
 result text NOT NULL CHECK(result IN ('Connected','NoAnswer','LeftVoicemail','Busy','WrongNumber')),
 number_entered text CHECK(length(number_entered) BETWEEN 1 AND 200 AND number_entered=btrim(number_entered)),
 number_e164 text CHECK(number_e164 ~ '^\+[1-9][0-9]{3,14}$'),
 person_id uuid, started_at timestamptz NOT NULL CHECK(isfinite(started_at)),
 duration_seconds integer CHECK(duration_seconds BETWEEN 0 AND 86400),
 call_event_id uuid UNIQUE,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 CHECK(number_e164 IS NULL OR number_entered IS NOT NULL),
 FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id),
 FOREIGN KEY(workspace_id,person_id) REFERENCES ppo.people(workspace_id,id),
 FOREIGN KEY(workspace_id,call_event_id) REFERENCES ppo.call_events(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER retain_call_details BEFORE UPDATE OR DELETE ON ppo.call_details
 FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
