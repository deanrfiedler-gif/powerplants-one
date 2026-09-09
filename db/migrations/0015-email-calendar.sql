-- Additive synthetic Email & Calendar slice; preserve all prior migrations.
DO $$ DECLARE item record; definition text; BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('business_identities','ck_identities_type','object_type','EmailMessage'),
 ('audit_events','ck_audit_object_type','object_type','EmailMessage'),
 ('outbox_jobs','ck_outbox_kind','kind','EmailLinked,EmailFollowUpCreated'),
 ('permission_grants','ck_grants_capability','capability','email.read,email.edit')
 ) AS v(tab,con,col,added) LOOP
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
 EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
 EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,string_to_array(item.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect typed dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''EmailMessage'' THEN ''email_messages''');
END $$;
CREATE TABLE ppo.email_messages (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 owner_id uuid NOT NULL, provider text NOT NULL CHECK(provider='Synthetic'), provider_id text NOT NULL,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), version integer NOT NULL DEFAULT 1 CHECK(version>0),
 created_by uuid NOT NULL, updated_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 sender_name text NOT NULL, sender_address text NOT NULL CHECK(sender_address LIKE '%.example'),
 subject text NOT NULL, body_text text NOT NULL, received_at timestamptz NOT NULL,
 opportunity_id uuid, followup_id uuid,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,owner_id,provider,provider_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,opportunity_id) REFERENCES ppo.opportunities(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,followup_id) REFERENCES ppo.activities(workspace_id,company_id,id),
 CHECK(followup_id IS NULL OR opportunity_id IS NOT NULL)
);
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.email_messages FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('EmailMessage','');
CREATE FUNCTION ppo.protect_email_source() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF (NEW.id,NEW.workspace_id,NEW.company_id,NEW.owner_id,NEW.provider,NEW.provider_id,NEW.sender_name,NEW.sender_address,NEW.subject,NEW.body_text,NEW.received_at,NEW.created_by,NEW.created_at) IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.company_id,OLD.owner_id,OLD.provider,OLD.provider_id,OLD.sender_name,OLD.sender_address,OLD.subject,OLD.body_text,OLD.received_at,OLD.created_by,OLD.created_at) OR NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Email source is immutable' USING ERRCODE='55000'; END IF;
 IF OLD.followup_id IS NOT NULL AND (NEW.followup_id,NEW.opportunity_id) IS DISTINCT FROM (OLD.followup_id,OLD.opportunity_id) THEN RAISE EXCEPTION 'Retain existing follow-up context' USING ERRCODE='55000'; END IF;
 IF NEW.followup_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.activity_links l WHERE l.workspace_id=NEW.workspace_id AND l.activity_id=NEW.followup_id AND l.object_type='Opportunity' AND l.object_id=NEW.opportunity_id) THEN RAISE EXCEPTION 'Follow-up must link exact opportunity' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER email_source_guard BEFORE UPDATE ON ppo.email_messages FOR EACH ROW EXECUTE FUNCTION ppo.protect_email_source();
CREATE TABLE ppo.email_calendar_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, owner_id uuid NOT NULL,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), provider text NOT NULL CHECK(provider='Synthetic'),
 title text NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at>starts_at), private boolean NOT NULL DEFAULT false,
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER event_source_immutable BEFORE UPDATE OR DELETE ON ppo.email_calendar_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX email_owner_inbox ON ppo.email_messages(workspace_id,owner_id,received_at,id);
