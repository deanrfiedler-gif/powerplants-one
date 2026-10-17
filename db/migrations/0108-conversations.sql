-- Conversations T1b (PPO-CONV-T1-SCOPE; rules T1-1 to T1-9, answers U1 to U4): people-only threads on deals and
-- projects, with immutable messages, participants and last-read, mentions (person and record), tracked asks and the
-- Mentions notice source. No UI, route, Carl or AI. Every existing row, hash, grant and receipt is preserved: this
-- migration adds tables and widens CHECKs only; seed 108 grants the two new capabilities.
-- Reads the live schema: audit_events and operation_receipts require a registered identity for the record a command
-- returns, so threads, messages and asks are business identities (type only, no display number).
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES ('business_identities','ck_identities_type'),('audit_events','ck_audit_object_type')) v(tab,con) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR object_type = ANY (ARRAY[''ConversationThread'',''ConversationMessage'',''ConversationAsk'']::text[]))',spec.tab,spec.con,substring(definition from 8 for length(definition)-8));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''ConversationThread'' THEN ''conversation_threads'' WHEN ''ConversationMessage'' THEN ''conversation_messages'' WHEN ''ConversationAsk'' THEN ''conversation_asks''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

DO $$ DECLARE d text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT d FROM pg_constraint WHERE conrelid='ppo.permission_grants'::regclass AND conname='ck_grants_capability';
 ALTER TABLE ppo.permission_grants DROP CONSTRAINT ck_grants_capability;
 EXECUTE format('ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_grants_capability CHECK ((%s) OR capability = ANY (ARRAY[''conversation.read'',''conversation.post'']::text[]))',substring(d from 8 for length(d)-8));
 SELECT pg_get_constraintdef(oid) INTO STRICT d FROM pg_constraint WHERE conrelid='ppo.outbox_jobs'::regclass AND conname='ck_outbox_kind';
 ALTER TABLE ppo.outbox_jobs DROP CONSTRAINT ck_outbox_kind;
 EXECUTE format('ALTER TABLE ppo.outbox_jobs ADD CONSTRAINT ck_outbox_kind CHECK ((%s) OR kind = ''ConversationChanged'')',substring(d from 8 for length(d)-8));
END $$;

-- T1-1: one thread is about one record. Only deals and projects can hold threads in T1 (Q3).
CREATE TABLE ppo.conversation_threads (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 anchor_type text NOT NULL CHECK(anchor_type IN ('Opportunity','Project')), anchor_id uuid NOT NULL,
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 is_main boolean NOT NULL,
 state text NOT NULL DEFAULT 'Open' CHECK(state IN ('Open','Resolved')),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 resolved_by uuid, resolved_at timestamptz,
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,resolved_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((state='Open' AND resolved_by IS NULL AND resolved_at IS NULL) OR (state='Resolved' AND resolved_by IS NOT NULL AND resolved_at IS NOT NULL)),
 CHECK(isfinite(created_at))
);
-- A record has one main thread; a person who may post can start more (U1).
CREATE UNIQUE INDEX uq_conversation_main_thread ON ppo.conversation_threads(workspace_id,anchor_type,anchor_id) WHERE is_main;
CREATE INDEX ix_conversation_thread_anchor ON ppo.conversation_threads(workspace_id,anchor_type,anchor_id,created_at);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.conversation_threads FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('ConversationThread','');
CREATE TRIGGER thread_retained BEFORE DELETE ON ppo.conversation_threads FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.guard_conversation_thread() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE anchor_company uuid;
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.anchor_type='Opportunity' THEN SELECT company_id INTO anchor_company FROM ppo.opportunities WHERE workspace_id=NEW.workspace_id AND id=NEW.anchor_id;
  ELSE SELECT company_id INTO anchor_company FROM ppo.projects WHERE workspace_id=NEW.workspace_id AND id=NEW.anchor_id; END IF;
  IF anchor_company IS DISTINCT FROM NEW.company_id THEN RAISE EXCEPTION 'A thread belongs to the company of its anchor record' USING ERRCODE='23514'; END IF;
  IF NEW.is_main IS DISTINCT FROM NOT EXISTS(SELECT 1 FROM ppo.conversation_threads t WHERE t.workspace_id=NEW.workspace_id AND t.anchor_type=NEW.anchor_type AND t.anchor_id=NEW.anchor_id)
   THEN RAISE EXCEPTION 'The first thread on a record is its main thread' USING ERRCODE='23514'; END IF;
  IF NEW.state<>'Open' OR NEW.version<>1 THEN RAISE EXCEPTION 'A thread starts open at version 1' USING ERRCODE='23514'; END IF;
  RETURN NEW;
 END IF;
 IF (NEW.id,NEW.workspace_id,NEW.company_id,NEW.anchor_type,NEW.anchor_id,NEW.title,NEW.is_main,NEW.created_by,NEW.created_at,NEW.synthetic)
  IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.company_id,OLD.anchor_type,OLD.anchor_id,OLD.title,OLD.is_main,OLD.created_by,OLD.created_at,OLD.synthetic)
  OR NEW.version<>OLD.version+1 OR NEW.state=OLD.state THEN RAISE EXCEPTION 'Only a state change may update a thread, and it advances the version' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard BEFORE INSERT OR UPDATE ON ppo.conversation_threads FOR EACH ROW EXECUTE FUNCTION ppo.guard_conversation_thread();

-- U4: a person is a participant when they start, are tagged, or post. Last-read only moves forward.
CREATE TABLE ppo.conversation_participants (
 workspace_id uuid NOT NULL, thread_id uuid NOT NULL, user_id uuid NOT NULL,
 role text NOT NULL CHECK(role IN ('Creator','Tagged','Participant')),
 added_by uuid NOT NULL, added_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 last_read_sequence integer NOT NULL DEFAULT 0 CHECK(last_read_sequence>=0), last_read_at timestamptz,
 PRIMARY KEY(workspace_id,thread_id,user_id),
 FOREIGN KEY(workspace_id,thread_id) REFERENCES ppo.conversation_threads(workspace_id,id),
 FOREIGN KEY(workspace_id,user_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,added_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE INDEX ix_conversation_participant_user ON ppo.conversation_participants(workspace_id,user_id,thread_id);
CREATE TRIGGER participant_retained BEFORE DELETE ON ppo.conversation_participants FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.guard_conversation_participant() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE newest integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.users WHERE workspace_id=NEW.workspace_id AND id=NEW.user_id AND active) THEN RAISE EXCEPTION 'An active person is required' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.last_read_sequence<>0 OR NEW.last_read_at IS NOT NULL THEN RAISE EXCEPTION 'A new participant has read nothing' USING ERRCODE='23514'; END IF;
  RETURN NEW;
 END IF;
 IF (NEW.workspace_id,NEW.thread_id,NEW.user_id,NEW.added_by,NEW.added_at) IS DISTINCT FROM (OLD.workspace_id,OLD.thread_id,OLD.user_id,OLD.added_by,OLD.added_at)
  OR NEW.role<>OLD.role AND NOT (OLD.role='Tagged' AND NEW.role='Participant')
  OR NEW.last_read_sequence<OLD.last_read_sequence THEN RAISE EXCEPTION 'Participant identity is permanent and last-read only advances' USING ERRCODE='55000'; END IF;
 SELECT coalesce(max(sequence),0) INTO newest FROM ppo.conversation_messages WHERE workspace_id=NEW.workspace_id AND thread_id=NEW.thread_id;
 IF NEW.last_read_sequence>newest THEN RAISE EXCEPTION 'Last-read cannot pass the latest message' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;

-- T1-5: plain text. @{n} and #{n} are placeholders for mention n, so a record's title is never stored in a message
-- and each reader is shown the target from that reader's own access (T1-4).
CREATE TABLE ppo.conversation_messages (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, thread_id uuid NOT NULL,
 sequence integer NOT NULL CHECK(sequence>0), author_id uuid NOT NULL,
 body text NOT NULL CHECK(length(btrim(body)) BETWEEN 1 AND 4000),
 operation_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,thread_id,sequence), UNIQUE(workspace_id,thread_id,id), UNIQUE(workspace_id,author_id,operation_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,thread_id) REFERENCES ppo.conversation_threads(workspace_id,id),
 FOREIGN KEY(workspace_id,author_id) REFERENCES ppo.users(workspace_id,id),
 CHECK(isfinite(created_at))
);
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.conversation_messages FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('ConversationMessage','');
-- U2: a message is never edited or deleted. A correction is a new message.
CREATE TRIGGER message_immutable BEFORE UPDATE OR DELETE ON ppo.conversation_messages FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.guard_conversation_message() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE t ppo.conversation_threads;
BEGIN
 SELECT * INTO STRICT t FROM ppo.conversation_threads WHERE workspace_id=NEW.workspace_id AND id=NEW.thread_id;
 IF t.state<>'Open' THEN RAISE EXCEPTION 'Reopen a resolved thread before posting' USING ERRCODE='23514'; END IF;
 IF NEW.sequence<>coalesce((SELECT max(sequence) FROM ppo.conversation_messages WHERE workspace_id=NEW.workspace_id AND thread_id=NEW.thread_id),0)+1
  THEN RAISE EXCEPTION 'The next message sequence is required' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.conversation_participants WHERE workspace_id=NEW.workspace_id AND thread_id=NEW.thread_id AND user_id=NEW.author_id)
  THEN RAISE EXCEPTION 'The author is a participant of the thread' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.permission_grants g WHERE g.workspace_id=NEW.workspace_id AND g.user_id=NEW.author_id AND g.capability='conversation.post'
   AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp()))
  THEN RAISE EXCEPTION 'The author holds the post capability' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard BEFORE INSERT ON ppo.conversation_messages FOR EACH ROW EXECUTE FUNCTION ppo.guard_conversation_message();
CREATE INDEX ix_conversation_message_thread ON ppo.conversation_messages(workspace_id,thread_id,sequence);

CREATE TABLE ppo.conversation_mentions (
 workspace_id uuid NOT NULL, message_id uuid NOT NULL, ordinal integer NOT NULL CHECK(ordinal BETWEEN 1 AND 20),
 kind text NOT NULL CHECK(kind IN ('Person','Record')),
 person_id uuid, record_type text CHECK(record_type IN ('Opportunity','Project')), record_id uuid,
 PRIMARY KEY(workspace_id,message_id,ordinal),
 FOREIGN KEY(workspace_id,message_id) REFERENCES ppo.conversation_messages(workspace_id,id),
 FOREIGN KEY(workspace_id,person_id) REFERENCES ppo.users(workspace_id,id),
 CHECK((kind='Person' AND person_id IS NOT NULL AND record_type IS NULL AND record_id IS NULL)
  OR (kind='Record' AND person_id IS NULL AND record_type IS NOT NULL AND record_id IS NOT NULL))
);
CREATE INDEX ix_conversation_mention_person ON ppo.conversation_mentions(workspace_id,person_id) WHERE kind='Person';
CREATE INDEX ix_conversation_mention_record ON ppo.conversation_mentions(workspace_id,record_type,record_id) WHERE kind='Record';
CREATE TRIGGER mention_immutable BEFORE UPDATE OR DELETE ON ppo.conversation_mentions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.guard_conversation_mention() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE present boolean;
BEGIN
 IF NEW.kind='Person' AND NOT EXISTS(SELECT 1 FROM ppo.users u WHERE u.workspace_id=NEW.workspace_id AND u.id=NEW.person_id AND u.active
   AND EXISTS(SELECT 1 FROM ppo.permission_grants g WHERE g.workspace_id=u.workspace_id AND g.user_id=u.id AND g.capability='conversation.read'
    AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())))
  THEN RAISE EXCEPTION 'A tagged person is active and holds the read capability' USING ERRCODE='23514'; END IF;
 IF NEW.kind='Record' THEN
  IF NEW.record_type='Opportunity' THEN present:=EXISTS(SELECT 1 FROM ppo.opportunities WHERE workspace_id=NEW.workspace_id AND id=NEW.record_id);
  ELSE present:=EXISTS(SELECT 1 FROM ppo.projects WHERE workspace_id=NEW.workspace_id AND id=NEW.record_id); END IF;
  IF NOT present THEN RAISE EXCEPTION 'A linked record exists' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard BEFORE INSERT ON ppo.conversation_mentions FOR EACH ROW EXECUTE FUNCTION ppo.guard_conversation_mention();
-- Every @{n} or #{n} token in a body has exactly one matching mention, and every mention has exactly one token.
CREATE FUNCTION ppo.check_conversation_tokens() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE tokens integer; m record;
BEGIN
 SELECT count(*) INTO tokens FROM regexp_matches(NEW.body,'[@#]\{[0-9]+\}','g');
 IF tokens<>(SELECT count(*) FROM ppo.conversation_mentions WHERE workspace_id=NEW.workspace_id AND message_id=NEW.id) THEN
  RAISE EXCEPTION 'Every token in a message has one mention' USING ERRCODE='23514'; END IF;
 FOR m IN SELECT ordinal,CASE kind WHEN 'Person' THEN '@' ELSE '#' END||'{'||ordinal||'}' AS token FROM ppo.conversation_mentions WHERE workspace_id=NEW.workspace_id AND message_id=NEW.id LOOP
  IF (length(NEW.body)-length(replace(NEW.body,m.token,'')))<>length(m.token) THEN RAISE EXCEPTION 'Each mention appears once in the message' USING ERRCODE='23514'; END IF;
 END LOOP;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER message_tokens AFTER INSERT ON ppo.conversation_messages DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_conversation_tokens();
-- T1-6: no message without the audit event of the command that wrote it.
CREATE FUNCTION ppo.check_conversation_audit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.audit_events a JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
   WHERE a.workspace_id=NEW.workspace_id AND a.actor_id=NEW.author_id AND a.operation_id=NEW.operation_id AND a.outcome='Accepted'
   AND a.object_type IN ('ConversationThread','ConversationMessage') AND a.details->>'thread_id'=NEW.thread_id::text)
  THEN RAISE EXCEPTION 'A message needs its accepted audit event and receipt' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER message_audit AFTER INSERT ON ppo.conversation_messages DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_conversation_audit();

-- Tracked asks. N7: reply-by is optional; one reminder, then the asker is told. Closed by the asked person's reply
-- in the thread or by "No answer needed"; reading closes nothing.
CREATE TABLE ppo.conversation_asks (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, thread_id uuid NOT NULL, message_id uuid NOT NULL, ordinal integer NOT NULL,
 asker_id uuid NOT NULL, asked_id uuid NOT NULL,
 question text NOT NULL CHECK(length(btrim(question)) BETWEEN 1 AND 500),
 reply_by date CHECK(reply_by BETWEEN DATE '2000-01-01' AND DATE '9998-12-31'),
 state text NOT NULL DEFAULT 'Open' CHECK(state IN ('Open','Answered','NoAnswerNeeded')),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 closed_by uuid, closed_at timestamptz, closing_message_id uuid,
 reminded_at timestamptz, asker_told_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,message_id,ordinal),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,thread_id) REFERENCES ppo.conversation_threads(workspace_id,id),
 FOREIGN KEY(workspace_id,thread_id,message_id) REFERENCES ppo.conversation_messages(workspace_id,thread_id,id),
 FOREIGN KEY(workspace_id,message_id,ordinal) REFERENCES ppo.conversation_mentions(workspace_id,message_id,ordinal),
 FOREIGN KEY(workspace_id,asker_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,asked_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,closed_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,thread_id,closing_message_id) REFERENCES ppo.conversation_messages(workspace_id,thread_id,id),
 CHECK(asker_id<>asked_id),
 CHECK((state='Open' AND closed_by IS NULL AND closed_at IS NULL AND closing_message_id IS NULL)
  OR (state='Answered' AND closed_by=asked_id AND closed_at IS NOT NULL AND closing_message_id IS NOT NULL)
  OR (state='NoAnswerNeeded' AND closed_by=asked_id AND closed_at IS NOT NULL AND closing_message_id IS NULL)),
 CHECK(reminded_at IS NULL OR reply_by IS NOT NULL),
 CHECK(asker_told_at IS NULL OR reminded_at IS NOT NULL)
);
CREATE INDEX ix_conversation_ask_asked ON ppo.conversation_asks(workspace_id,asked_id,state);
CREATE INDEX ix_conversation_ask_thread ON ppo.conversation_asks(workspace_id,thread_id,state);
CREATE TRIGGER ask_retained BEFORE DELETE ON ppo.conversation_asks FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.conversation_asks FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('ConversationAsk','');
CREATE FUNCTION ppo.guard_conversation_ask() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE msg ppo.conversation_messages; asked_message ppo.conversation_messages; today date:=(clock_timestamp() AT TIME ZONE 'Australia/Brisbane')::date;
BEGIN
 IF TG_OP='INSERT' THEN
  SELECT * INTO STRICT msg FROM ppo.conversation_messages WHERE workspace_id=NEW.workspace_id AND id=NEW.message_id;
  IF msg.author_id<>NEW.asker_id OR NOT EXISTS(SELECT 1 FROM ppo.conversation_mentions m WHERE m.workspace_id=NEW.workspace_id AND m.message_id=NEW.message_id AND m.ordinal=NEW.ordinal AND m.kind='Person' AND m.person_id=NEW.asked_id)
   THEN RAISE EXCEPTION 'An ask is made by the author of the message that tags the asked person' USING ERRCODE='23514'; END IF;
  IF NEW.state<>'Open' OR NEW.version<>1 OR NEW.reminded_at IS NOT NULL OR NEW.asker_told_at IS NOT NULL THEN RAISE EXCEPTION 'An ask starts open' USING ERRCODE='23514'; END IF;
  IF NEW.reply_by IS NOT NULL AND NEW.reply_by<today THEN RAISE EXCEPTION 'The reply-by date cannot be in the past' USING ERRCODE='23514'; END IF;
  RETURN NEW;
 END IF;
 IF (NEW.id,NEW.workspace_id,NEW.thread_id,NEW.message_id,NEW.ordinal,NEW.asker_id,NEW.asked_id,NEW.question,NEW.reply_by,NEW.created_at,NEW.synthetic)
  IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.thread_id,OLD.message_id,OLD.ordinal,OLD.asker_id,OLD.asked_id,OLD.question,OLD.reply_by,OLD.created_at,OLD.synthetic)
  OR NEW.version<>OLD.version+1 OR OLD.state<>'Open' THEN RAISE EXCEPTION 'A closed ask is permanent; an open ask only closes or records its reminder steps' USING ERRCODE='55000'; END IF;
 IF NEW.state<>'Open' THEN
  IF NEW.state='Answered' THEN
   SELECT * INTO STRICT msg FROM ppo.conversation_messages WHERE workspace_id=NEW.workspace_id AND id=NEW.closing_message_id;
   SELECT * INTO STRICT asked_message FROM ppo.conversation_messages WHERE workspace_id=NEW.workspace_id AND id=NEW.message_id;
   IF msg.author_id<>NEW.asked_id OR msg.sequence<=asked_message.sequence THEN RAISE EXCEPTION 'The asked person answers by replying after the ask' USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.reminded_at IS DISTINCT FROM OLD.reminded_at OR NEW.asker_told_at IS DISTINCT FROM OLD.asker_told_at THEN RAISE EXCEPTION 'A closing change does not also record a reminder' USING ERRCODE='23514'; END IF;
  RETURN NEW;
 END IF;
 -- N7 steps, each at most once and only on an open ask with a reply-by date.
 IF NEW.reminded_at IS DISTINCT FROM OLD.reminded_at THEN
  IF OLD.reminded_at IS NOT NULL OR NEW.asker_told_at IS DISTINCT FROM OLD.asker_told_at OR OLD.reply_by IS NULL OR today<OLD.reply_by THEN RAISE EXCEPTION 'The single reminder falls due on the reply-by date' USING ERRCODE='23514'; END IF;
 ELSIF NEW.asker_told_at IS DISTINCT FROM OLD.asker_told_at THEN
  IF OLD.asker_told_at IS NOT NULL OR OLD.reminded_at IS NULL OR today<=OLD.reply_by THEN RAISE EXCEPTION 'The asker is told once, after the reminder and the reply-by date' USING ERRCODE='23514'; END IF;
 ELSE RAISE EXCEPTION 'An ask update closes it or records a reminder step' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard BEFORE INSERT OR UPDATE ON ppo.conversation_asks FOR EACH ROW EXECUTE FUNCTION ppo.guard_conversation_ask();

-- T1-7: the Mentions notice source. Notices are rows keyed to the audit event, with no message prose, so the inbox
-- reads the thread again under the reader's current access. The Activity foreign key becomes a per-source existence
-- guard because a Conversation notice has no Activity.
ALTER TABLE ppo.notification_events ADD COLUMN reason text;
ALTER TABLE ppo.notification_events DROP CONSTRAINT notification_events_source_type_check,
 DROP CONSTRAINT notification_events_category_check,
 DROP CONSTRAINT notification_events_workspace_id_source_id_fkey,
 ADD CONSTRAINT ck_notification_source CHECK((source_type='Activity' AND category='OwnedWork' AND reason IS NULL)
  OR (source_type='Conversation' AND category='Mentions' AND reason IN ('Mention','Ask','Reminder','AskOverdue')));
CREATE FUNCTION ppo.guard_notification_source() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE present boolean;
BEGIN
 IF NEW.source_type='Activity' THEN present:=EXISTS(SELECT 1 FROM ppo.activities WHERE workspace_id=NEW.workspace_id AND id=NEW.source_id);
 ELSE present:=EXISTS(SELECT 1 FROM ppo.conversation_threads WHERE workspace_id=NEW.workspace_id AND id=NEW.source_id); END IF;
 IF NOT present THEN RAISE EXCEPTION 'A notice names an existing source' USING ERRCODE='23503'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER source_exists BEFORE INSERT ON ppo.notification_events FOR EACH ROW EXECUTE FUNCTION ppo.guard_notification_source();
