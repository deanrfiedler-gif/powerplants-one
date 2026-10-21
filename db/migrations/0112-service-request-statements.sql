-- SV-01/SV-02: authorised customer statements; no ADR-0043 lifecycle changes.
CREATE TABLE ppo.ticket_statements (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, ticket_id uuid NOT NULL,
 ticket_version integer NOT NULL CHECK(ticket_version>1),
 body text NOT NULL CHECK(length(btrim(body)) BETWEEN 1 AND 10000),
 source_label text NOT NULL CHECK(length(btrim(source_label)) BETWEEN 1 AND 200),
 occurred_at timestamptz NOT NULL CHECK(isfinite(occurred_at)),
 channel text NOT NULL CHECK(channel IN ('Phone','Email','Manual','PlannedMaintenance','Other')),
 basis text NOT NULL DEFAULT 'ReportedSymptom' CHECK(basis='ReportedSymptom'),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(), recorded_by uuid NOT NULL, operation_id uuid NOT NULL,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,ticket_id,ticket_version), UNIQUE(workspace_id,recorded_by,operation_id),
 FOREIGN KEY(workspace_id,company_id,ticket_id) REFERENCES ppo.tickets(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,recorded_by,operation_id) REFERENCES ppo.operation_receipts(workspace_id,actor_id,operation_id) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX ticket_statements_record ON ppo.ticket_statements(workspace_id,ticket_id,ticket_version DESC);
CREATE TRIGGER ticket_statement_retained BEFORE UPDATE OR DELETE ON ppo.ticket_statements FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid='ppo.outbox_jobs'::regclass AND conname='ck_outbox_kind';
 ALTER TABLE ppo.outbox_jobs DROP CONSTRAINT ck_outbox_kind;
 EXECUTE 'ALTER TABLE ppo.outbox_jobs ADD CONSTRAINT ck_outbox_kind CHECK ((' || substring(definition from 8 for length(definition)-8) || ') OR kind = ''TicketStatementRecorded'')';
END $$;
