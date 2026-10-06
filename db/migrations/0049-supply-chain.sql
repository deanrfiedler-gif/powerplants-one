-- ADR-0049. Closed coordination aggregates and immutable evidence; no inventory or Finance ledger.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE r record; d text; BEGIN
 FOR r IN SELECT * FROM (VALUES
 ('business_identities','ck_identities_type','object_type','SupplyRecord'),
 ('audit_events','ck_audit_object_type','object_type','SupplyRecord'),
 ('outbox_jobs','ck_outbox_kind','kind','SupplyRecorded'),
 ('permission_grants','ck_grants_capability','capability','supply.read,supply.coordinate,supply.inspect,supply.fulfil,supply.return,supply.custody')) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT d FROM pg_constraint WHERE conrelid=('ppo.'||r.tab)::regclass AND conname=r.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',r.tab,r.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I=ANY(%L::text[]))',r.tab,r.con,substring(d from 8 for length(d)-8),r.col,string_to_array(r.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO d;
 IF position('CASE NEW.object_type' in d)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(d,'CASE NEW.object_type','CASE NEW.object_type WHEN ''SupplyRecord'' THEN ''supply_records''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

CREATE TABLE ppo.supply_records (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,site_id uuid,
 kind text NOT NULL CHECK(kind IN ('Demand','Supply','Return','Custody')),
 reference text NOT NULL CHECK(reference ~ '^SYN-PPO-SC-[A-Za-z0-9-]{1,64}$'),title text NOT NULL,
 item text NOT NULL CHECK(length(item)>0),unit text NOT NULL CHECK(length(unit)>0),quantity numeric NOT NULL CHECK(quantity>0 AND quantity<1000000000000 AND scale(quantity)<=6),
 owner_id uuid NOT NULL,next_action text NOT NULL CHECK(length(next_action)>0),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),data jsonb NOT NULL CHECK(jsonb_typeof(data)='object'),
 parent_id uuid,completeness text NOT NULL CHECK(completeness IN ('Complete','Partial','Unavailable')),
 observed_at timestamptz NOT NULL CHECK(isfinite(observed_at)),source_reference text NOT NULL CHECK(length(source_reference)>0),external_key jsonb,
 last_reason text NOT NULL,synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_by uuid NOT NULL,updated_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,id),UNIQUE(workspace_id,company_id,reference),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,parent_id) REFERENCES ppo.supply_records(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((kind IN ('Return','Custody'))=(parent_id IS NOT NULL)),
 CHECK(kind='Supply' OR site_id IS NOT NULL),
 CHECK(external_key IS NULL OR (jsonb_typeof(external_key)='object' AND external_key ?& ARRAY['provider','configuration','company','entity','key'] AND external_key->>'provider' IN ('Synthetic','Manual')))
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.supply_records FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('SupplyRecord','');
CREATE TRIGGER retain_record BEFORE DELETE ON ppo.supply_records FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX supply_scope ON ppo.supply_records(workspace_id,company_id,site_id,kind);
CREATE UNIQUE INDEX supply_source_key ON ppo.supply_records(workspace_id,company_id,(external_key->>'provider'),(external_key->>'configuration'),(external_key->>'company'),(external_key->>'entity'),(external_key->>'key')) WHERE external_key IS NOT NULL;

CREATE TABLE ppo.supply_revisions (
 workspace_id uuid NOT NULL,record_id uuid NOT NULL,version integer NOT NULL,snapshot jsonb NOT NULL,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,record_id,version),FOREIGN KEY(workspace_id,record_id) REFERENCES ppo.supply_records(workspace_id,id)
);
CREATE TRIGGER immutable_revision BEFORE UPDATE OR DELETE ON ppo.supply_revisions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.supply_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 INSERT INTO ppo.supply_revisions(workspace_id,record_id,version,snapshot) VALUES(NEW.workspace_id,NEW.id,NEW.version,to_jsonb(NEW)); RETURN NEW; END $$;
CREATE TRIGGER supply_snapshot AFTER INSERT OR UPDATE ON ppo.supply_records FOR EACH ROW EXECUTE FUNCTION ppo.supply_snapshot();

CREATE TABLE ppo.supply_allocations (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,demand_id uuid NOT NULL,supply_id uuid NOT NULL,
 quantity numeric NOT NULL CHECK(quantity>=0 AND quantity<1000000000000 AND scale(quantity)<=6),unit text NOT NULL,
 basis text NOT NULL CHECK(basis IN ('Incoming','Usable')),version integer NOT NULL DEFAULT 1 CHECK(version>0),
 reason text NOT NULL,updated_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,demand_id,supply_id,basis),
 FOREIGN KEY(workspace_id,company_id,demand_id) REFERENCES ppo.supply_records(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,supply_id) REFERENCES ppo.supply_records(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.supply_allocation_history (
 workspace_id uuid NOT NULL,allocation_id uuid NOT NULL,version integer NOT NULL,snapshot jsonb NOT NULL,
 PRIMARY KEY(workspace_id,allocation_id,version),FOREIGN KEY(workspace_id,allocation_id) REFERENCES ppo.supply_allocations(workspace_id,id)
);
CREATE TRIGGER immutable_allocation_history BEFORE UPDATE OR DELETE ON ppo.supply_allocation_history FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER retain_allocation BEFORE DELETE ON ppo.supply_allocations FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.supply_attachments (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,record_id uuid NOT NULL,company_id uuid NOT NULL,
 storage_key jsonb NOT NULL,sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'),byte_length integer NOT NULL CHECK(byte_length BETWEEN 1 AND 2000000),
 mime_type text NOT NULL CHECK(mime_type='image/png'),caption text NOT NULL,created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,record_id,id),FOREIGN KEY(workspace_id,company_id,record_id) REFERENCES ppo.supply_records(workspace_id,company_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER immutable_attachment BEFORE UPDATE OR DELETE ON ppo.supply_attachments FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.supply_facts (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,record_id uuid NOT NULL,version integer NOT NULL,
 kind text NOT NULL CHECK(kind IN ('Purchase','Promise','Receipt','Reservation','Pick','Stage','Substitution','Dispatch','Delivery','Acknowledgement','ReturnAuthorisation','ReturnReceipt','Disposition','CustomerOutcome','Claim','SupplierMovement','Credit','Custody','ExternalOutcome','Impact','Assessment')),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object'),predecessor_id uuid,evidence text NOT NULL CHECK(length(evidence)>0),
 completeness text NOT NULL CHECK(completeness IN ('Complete','Partial','Unavailable')),observed_at timestamptz NOT NULL CHECK(isfinite(observed_at)),
 attachment_id uuid,activity_id uuid,created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,record_id,id),UNIQUE(workspace_id,predecessor_id),
 FOREIGN KEY(workspace_id,company_id,record_id) REFERENCES ppo.supply_records(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,record_id,predecessor_id) REFERENCES ppo.supply_facts(workspace_id,record_id,id),
 FOREIGN KEY(workspace_id,record_id,attachment_id) REFERENCES ppo.supply_attachments(workspace_id,record_id,id),
 FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE INDEX supply_facts_record ON ppo.supply_facts(workspace_id,record_id,version,created_at);
CREATE TRIGGER immutable_fact BEFORE UPDATE OR DELETE ON ppo.supply_facts FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE VIEW ppo.supply_current_facts AS SELECT f.* FROM ppo.supply_facts f WHERE NOT EXISTS(SELECT 1 FROM ppo.supply_facts n WHERE n.workspace_id=f.workspace_id AND n.predecessor_id=f.id);
CREATE FUNCTION ppo.supply_q(d jsonb,k text) RETURNS numeric LANGUAGE plpgsql IMMUTABLE AS $$ BEGIN
 IF d->>k IS NULL THEN RETURN 0; END IF;
 IF (d->>k) !~ '^(0|[1-9][0-9]{0,11})(\.[0-9]{1,6})?$' THEN RAISE EXCEPTION 'Exact nonnegative quantity required' USING ERRCODE='23514'; END IF;
 RETURN (d->>k)::numeric; END $$;
CREATE FUNCTION ppo.supply_usable(w uuid,r uuid) RETURNS numeric LANGUAGE sql STABLE AS $$
 SELECT CASE WHEN s.completeness<>'Complete' THEN NULL WHEN s.data->>'supply_kind'='Stock' THEN (s.data->>'usable')::numeric
 ELSE COALESCE((SELECT sum(ppo.supply_q(f.data,'usable')) FROM ppo.supply_current_facts f WHERE f.workspace_id=w AND f.record_id=r AND f.kind='Receipt' AND f.completeness='Complete'),0) END FROM ppo.supply_records s WHERE s.workspace_id=w AND s.id=r
$$;
CREATE FUNCTION ppo.supply_allocation_guard() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE d ppo.supply_records; s ppo.supply_records; capacity numeric; BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT d FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=NEW.demand_id;
 SELECT * INTO STRICT s FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=NEW.supply_id;
 IF d.kind<>'Demand' OR s.kind<>'Supply' OR NEW.unit<>d.unit OR NEW.unit<>s.unit OR d.item<>s.item OR d.data->>'demand_class'<>'Approved' THEN RAISE EXCEPTION 'Allocation requires same item/unit and approved demand' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND ((NEW.demand_id,NEW.supply_id,NEW.unit,NEW.basis,NEW.company_id,NEW.workspace_id) IS DISTINCT FROM (OLD.demand_id,OLD.supply_id,OLD.unit,OLD.basis,OLD.company_id,OLD.workspace_id) OR NEW.version<>OLD.version+1) THEN RAISE EXCEPTION 'Stale or changed allocation identity' USING ERRCODE='23514'; END IF;
 capacity:=CASE WHEN NEW.basis='Incoming' THEN s.quantity ELSE ppo.supply_usable(NEW.workspace_id,s.id) END;
 IF NEW.basis='Usable' AND NEW.quantity+COALESCE((SELECT sum(quantity) FROM ppo.supply_allocations WHERE workspace_id=NEW.workspace_id AND demand_id=d.id AND basis='Usable' AND id<>NEW.id),0)<COALESCE((SELECT sum(ppo.supply_q(data,'quantity')) FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND record_id=d.id AND kind='Pick'),0) THEN RAISE EXCEPTION 'Retain allocation for already picked goods' USING ERRCODE='23514'; END IF;
 IF capacity IS NULL OR NEW.quantity+COALESCE((SELECT sum(quantity) FROM ppo.supply_allocations WHERE workspace_id=NEW.workspace_id AND supply_id=s.id AND basis=NEW.basis AND id<>NEW.id),0)>capacity OR
 NEW.quantity+COALESCE((SELECT sum(quantity) FROM ppo.supply_allocations WHERE workspace_id=NEW.workspace_id AND demand_id=d.id AND basis=NEW.basis AND id<>NEW.id),0)>d.quantity THEN RAISE EXCEPTION 'Allocation exceeds evidenced capacity or demand' USING ERRCODE='23514'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER allocation_guard BEFORE INSERT OR UPDATE ON ppo.supply_allocations FOR EACH ROW EXECUTE FUNCTION ppo.supply_allocation_guard();
CREATE FUNCTION ppo.supply_allocation_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 INSERT INTO ppo.supply_allocation_history VALUES(NEW.workspace_id,NEW.id,NEW.version,to_jsonb(NEW)); RETURN NEW; END $$;
CREATE TRIGGER allocation_snapshot AFTER INSERT OR UPDATE ON ppo.supply_allocations FOR EACH ROW EXECUTE FUNCTION ppo.supply_allocation_snapshot();

CREATE FUNCTION ppo.supply_record_guard() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE parent ppo.supply_records; used numeric; BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF TG_OP='UPDATE' AND ((NEW.id,NEW.workspace_id,NEW.company_id,NEW.site_id,NEW.kind,NEW.reference,NEW.parent_id,NEW.unit,NEW.item) IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.company_id,OLD.site_id,OLD.kind,OLD.reference,OLD.parent_id,OLD.unit,OLD.item) OR NEW.version<>OLD.version+1) THEN RAISE EXCEPTION 'Retain scope identity and advance exact version' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (NEW.data->>'origin_kind',NEW.data->>'origin_id',NEW.data->>'supply_kind',NEW.data->>'shipment_id',NEW.data->>'technician_id',NEW.data->>'appointment_id',NEW.data->>'direction') IS DISTINCT FROM (OLD.data->>'origin_kind',OLD.data->>'origin_id',OLD.data->>'supply_kind',OLD.data->>'shipment_id',OLD.data->>'technician_id',OLD.data->>'appointment_id',OLD.data->>'direction') THEN RAISE EXCEPTION 'Retain original source and custody identity; create a separately linked record' USING ERRCODE='23514'; END IF;
 IF NEW.parent_id IS NOT NULL THEN
  SELECT * INTO STRICT parent FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=NEW.parent_id;
  IF parent.kind<>'Demand' OR NEW.site_id<>parent.site_id OR NEW.unit<>parent.unit OR NEW.item<>parent.item OR NEW.data->>'demand_id'<>parent.id::text THEN RAISE EXCEPTION 'Parent demand context mismatch' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.kind='Demand' THEN
  IF NEW.quantity<COALESCE((SELECT sum(quantity) FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND parent_id=NEW.id AND kind='Custody'),0) THEN RAISE EXCEPTION 'Demand cannot fall below retained service-stock issues' USING ERRCODE='23514'; END IF;
  IF NEW.data->>'demand_class' NOT IN ('Forecast','Approved') OR NEW.data->>'origin_kind' NOT IN ('Project','WorkOrder','OtherApproved') OR (NEW.data->>'demand_class'='Approved' AND COALESCE(length(NEW.data->>'authority'),0)=0) THEN RAISE EXCEPTION 'Explicit demand class and authority required' USING ERRCODE='23514'; END IF;
  IF EXISTS(SELECT 1 FROM ppo.supply_allocations WHERE workspace_id=NEW.workspace_id AND demand_id=NEW.id GROUP BY basis HAVING sum(quantity)>NEW.quantity) THEN RAISE EXCEPTION 'Demand cannot drop below allocations' USING ERRCODE='23514'; END IF;
  IF NEW.data->>'demand_class'='Forecast' AND EXISTS(SELECT 1 FROM ppo.supply_allocations WHERE workspace_id=NEW.workspace_id AND demand_id=NEW.id AND quantity>0) THEN RAISE EXCEPTION 'Resolve allocations before withdrawing approved demand' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.kind='Custody' THEN
  SELECT COALESCE(sum(quantity),0) INTO used FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND parent_id=NEW.parent_id AND kind='Custody' AND id<>NEW.id;
  IF NEW.quantity+used>parent.quantity THEN RAISE EXCEPTION 'Issued custody exceeds demand' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND NEW.quantity<>OLD.quantity AND EXISTS(SELECT 1 FROM ppo.supply_facts WHERE workspace_id=NEW.workspace_id AND record_id=NEW.id AND kind='Custody') THEN RAISE EXCEPTION 'Retain issued quantity after custody evidence exists' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.kind='Supply' THEN
  IF NEW.quantity<COALESCE((SELECT sum(ppo.supply_q(data,'received')) FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND record_id=NEW.id AND kind='Receipt'),0) THEN RAISE EXCEPTION 'Supply cannot fall below retained physical receipts' USING ERRCODE='23514'; END IF;
  IF NEW.data->>'supply_kind' NOT IN ('Stock','Shipment') THEN RAISE EXCEPTION 'Supply kind required' USING ERRCODE='23514'; END IF;
  IF EXISTS(SELECT 1 FROM ppo.supply_allocations WHERE workspace_id=NEW.workspace_id AND supply_id=NEW.id AND basis='Incoming' GROUP BY basis HAVING sum(quantity)>NEW.quantity) THEN RAISE EXCEPTION 'Supply cannot drop below incoming allocations' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.kind='Return' THEN
  IF NEW.quantity<COALESCE((SELECT sum(ppo.supply_q(data,'received')) FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND record_id=NEW.id AND kind='ReturnReceipt'),0) OR NEW.quantity<COALESCE((SELECT max(ppo.supply_q(data,'quantity')) FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND record_id=NEW.id AND kind IN ('ReturnAuthorisation','Disposition')),0) THEN RAISE EXCEPTION 'Return cannot fall below retained authorisation, receipt or disposition' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.kind='Return' AND NEW.data->>'identity_status'='Verified' THEN
  SELECT COALESCE(sum(quantity),0) INTO used FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND parent_id=NEW.parent_id AND kind='Return' AND data->>'direction'=NEW.data->>'direction' AND id<>NEW.id;
  IF NEW.data->>'direction'='Customer' THEN
   IF NEW.quantity+used>COALESCE((SELECT sum(ppo.supply_q(data,'quantity')) FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND record_id=parent.id AND kind='Delivery'),0) THEN RAISE EXCEPTION 'Remaining delivered return quantity exceeded' USING ERRCODE='23514'; END IF;
  ELSIF NEW.quantity+used>parent.quantity THEN RAISE EXCEPTION 'Remaining supplier return demand quantity exceeded' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW; END $$;
CREATE TRIGGER supply_record_guard BEFORE INSERT OR UPDATE ON ppo.supply_records FOR EACH ROW EXECUTE FUNCTION ppo.supply_record_guard();

CREATE FUNCTION ppo.supply_fact_guard() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE r ppo.supply_records; oldfact ppo.supply_facts; total numeric; picked numeric; staged numeric; moved numeric; delivered numeric; v record; BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT r FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=NEW.record_id;
 IF NEW.version<>r.version THEN RAISE EXCEPTION 'Evidence version mismatch' USING ERRCODE='23514'; END IF;
 IF NEW.predecessor_id IS NOT NULL THEN
  SELECT * INTO STRICT oldfact FROM ppo.supply_facts WHERE workspace_id=NEW.workspace_id AND id=NEW.predecessor_id;
  IF oldfact.kind<>NEW.kind OR oldfact.record_id<>NEW.record_id THEN RAISE EXCEPTION 'Correction must retain fact identity and kind' USING ERRCODE='23514'; END IF;
 END IF;
 FOR v IN SELECT key FROM jsonb_each(NEW.data) WHERE key=ANY(ARRAY['quantity','received','inspected','damaged','quarantined','usable','short','held','at_job','used','returned','missing','excess','amount']) LOOP PERFORM ppo.supply_q(NEW.data,v.key); END LOOP;
 IF NEW.kind='Receipt' THEN
  IF r.kind<>'Supply' OR ppo.supply_q(NEW.data,'inspected')>ppo.supply_q(NEW.data,'received') OR ppo.supply_q(NEW.data,'damaged')>ppo.supply_q(NEW.data,'quarantined') OR ppo.supply_q(NEW.data,'usable')+ppo.supply_q(NEW.data,'quarantined')>ppo.supply_q(NEW.data,'inspected') THEN RAISE EXCEPTION 'Receipt arithmetic invalid' USING ERRCODE='23514'; END IF;
  SELECT COALESCE(sum(ppo.supply_q(data,'received')),0) INTO total FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND record_id=r.id AND kind='Receipt' AND id IS DISTINCT FROM NEW.predecessor_id;
  IF total+ppo.supply_q(NEW.data,'received')>r.quantity THEN RAISE EXCEPTION 'Receipts exceed stated supply line' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.kind IN ('Pick','Stage','Dispatch','Delivery') THEN
  IF r.kind<>'Demand' OR r.data->>'demand_class'<>'Approved' THEN RAISE EXCEPTION 'Fulfilment requires approved demand' USING ERRCODE='23514'; END IF;
  SELECT COALESCE(sum(ppo.supply_q(data,'quantity')) FILTER(WHERE kind='Pick'),0),COALESCE(sum(ppo.supply_q(data,'quantity')) FILTER(WHERE kind='Stage'),0),COALESCE(sum(ppo.supply_q(data,'quantity')) FILTER(WHERE kind='Dispatch' AND data->>'state'='Moved'),0),COALESCE(sum(ppo.supply_q(data,'quantity')) FILTER(WHERE kind='Delivery'),0) INTO picked,staged,moved,delivered FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND record_id=r.id AND id IS DISTINCT FROM NEW.predecessor_id;
  IF NEW.kind='Pick' THEN picked:=picked+ppo.supply_q(NEW.data,'quantity'); END IF;
  IF NEW.kind='Stage' THEN staged:=staged+ppo.supply_q(NEW.data,'quantity'); END IF;
  IF NEW.kind='Dispatch' AND NEW.data->>'state'='Moved' THEN moved:=moved+ppo.supply_q(NEW.data,'quantity'); END IF;
  IF NEW.kind='Delivery' THEN delivered:=delivered+ppo.supply_q(NEW.data,'quantity'); END IF;
  IF picked>r.quantity OR staged>picked OR moved>staged OR delivered>moved THEN RAISE EXCEPTION 'Pick, stage, movement and delivery conservation failed' USING ERRCODE='23514'; END IF;
  IF delivered<COALESCE((SELECT sum(quantity) FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND parent_id=r.id AND kind='Return' AND data->>'direction'='Customer' AND data->>'identity_status'='Verified'),0) THEN RAISE EXCEPTION 'Delivery correction conflicts with retained returns; review their source first' USING ERRCODE='23514'; END IF;
  IF picked>COALESCE((SELECT sum(quantity) FROM ppo.supply_allocations WHERE workspace_id=NEW.workspace_id AND demand_id=r.id AND basis='Usable'),0) THEN RAISE EXCEPTION 'Picking exceeds evidenced usable allocation' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.kind='Custody' THEN
  IF r.kind<>'Custody' OR (SELECT sum(ppo.supply_q(NEW.data,k)) FROM unnest(ARRAY['held','at_job','used','returned','damaged','quarantined','missing']) k)<>r.quantity THEN RAISE EXCEPTION 'Custody quantities must explain every issued unit once' USING ERRCODE='23514'; END IF;
  IF NEW.data->>'state'='Closed' AND (ppo.supply_q(NEW.data,'held')+ppo.supply_q(NEW.data,'at_job')+ppo.supply_q(NEW.data,'missing')+ppo.supply_q(NEW.data,'quarantined')>0 OR NEW.data->>'inventory_reference' IS NULL OR NEW.data->>'inventory_observed_at' IS NULL) THEN RAISE EXCEPTION 'Unreconciled custody cannot close' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW; END $$;
CREATE TRIGGER supply_fact_guard BEFORE INSERT ON ppo.supply_facts FOR EACH ROW EXECUTE FUNCTION ppo.supply_fact_guard();
