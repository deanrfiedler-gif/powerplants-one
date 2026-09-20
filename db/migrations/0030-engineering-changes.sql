-- EN-07 Engineering Change-Impact Review (parent ENG-06; decisions in docs/decisions/engineering-change-impact-review-design.md).
-- Additive only: no existing row, trigger, grant or issued migration byte changes. Five shared CHECK
-- constraints are widened by the 0020 idiom, so every value they accepted before remains accepted.
--
-- One change is one stable identity. Its proposal lives in numbered revisions: the working revision is
-- an optimistic draft, and submitting it freezes the exact content, affected objects, source snapshots
-- and retest definitions under one hash. Reviews, the technical decision, every handover payload and the
-- closure bind to that hash, so later content can never be authorised by an earlier decision. Sources are
-- the retained upstream snapshots of 0029 (ppo.material_sources); this module never copies or edits them.
-- A technical acceptance is not a drawing issue, a material release, a commercial approval, a purchase
-- amendment, a site instruction, a booking or a commissioning acceptance: nothing here records those facts.
DO $$
DECLARE item record; definition text;
BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('business_identities','ck_identities_type','object_type','EngineeringChange'),
 ('audit_events','ck_audit_object_type','object_type','EngineeringChange'),
 ('outbox_jobs','ck_outbox_kind','kind','ChangeRecordSaved,ChangeDecisionRecorded,ChangeRequestsSubmitted,ChangeReceivingDecided,ChangeVerificationRecorded,ChangeClosed'),
 ('permission_grants','ck_grants_capability','capability','engineering.change.review,engineering.change.decide,engineering.change.receive,engineering.change.verify,engineering.change.close'),
 -- Three more kinds of retained upstream snapshot. No material line can name them: 0029's commands accept only a drawing issue or a design basis there.
 ('material_sources','ck_material_sources_kind','kind','TestProcedure,TestEvidence,InstalledConfiguration')
 ) AS v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,string_to_array(item.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed typed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''EngineeringChange'' THEN ''engineering_changes''');
END $$;

-- The change. Its reference is a package-local synthetic alias; PPO-STD-001 catalogues no reference type
-- for an engineering change, so none is invented and no SYN-PPO counter is consumed. Stage is the concise
-- work stage only: the technical decision, review applicability, implementation progress, receiving
-- outcomes and verification are separate facts read from their own rows.
CREATE TABLE ppo.engineering_changes (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, package_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CONSTRAINT ck_engineering_changes_version CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 change_number integer NOT NULL CONSTRAINT ck_engineering_changes_number CHECK(change_number BETWEEN 1 AND 99999),
 reference text NOT NULL CONSTRAINT ck_engineering_changes_reference CHECK(reference ~ '^SYN-EN07-[0-9]{3,5}$'),
 title text NOT NULL CONSTRAINT ck_engineering_changes_title CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 category text NOT NULL CONSTRAINT ck_engineering_changes_category CHECK(category IN ('DesignCorrection','RequirementChange','SupplierProductChange','SiteDiscrepancy','InterfaceConflict','FieldRedline')),
 discipline text NOT NULL CONSTRAINT ck_engineering_changes_discipline CHECK(discipline IN ('Mechanical','Layout','Hydraulics','Electrical','Automation','Controls')),
 location text NOT NULL CONSTRAINT ck_engineering_changes_location CHECK(length(btrim(location)) BETWEEN 1 AND 120),
 system_name text NOT NULL CONSTRAINT ck_engineering_changes_system CHECK(length(btrim(system_name)) BETWEEN 1 AND 120),
 author_id uuid NOT NULL, next_owner_id uuid,
 due date CONSTRAINT ck_engineering_changes_due CHECK(due BETWEEN DATE '0001-01-01' AND DATE '9998-12-31'),
 priority text CONSTRAINT ck_engineering_changes_priority CHECK(priority IN ('Low','Normal','High','Urgent')),
 priority_reason text CONSTRAINT ck_engineering_changes_priority_reason CHECK(length(btrim(priority_reason)) BETWEEN 1 AND 600),
 stage text NOT NULL DEFAULT 'Draft' CONSTRAINT ck_engineering_changes_stage CHECK(stage IN ('Draft','Assessing','InReview','Returned','DecisionRecorded','Closed','Withdrawn')),
 current_revision integer NOT NULL DEFAULT 1 CONSTRAINT ck_engineering_changes_revision CHECK(current_revision>0),
 stage_before_withdrawal text, withdrawn_at timestamptz, withdrawn_by uuid,
 withdrawn_reason text CONSTRAINT ck_engineering_changes_withdrawn_reason CHECK(length(btrim(withdrawn_reason)) BETWEEN 1 AND 1000),
 as_built_required boolean NOT NULL DEFAULT false,
 as_built_reference text CONSTRAINT ck_engineering_changes_as_built CHECK(length(btrim(as_built_reference)) BETWEEN 1 AND 300),
 predecessor_change_id uuid,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id),
 CONSTRAINT uq_engineering_changes_number UNIQUE(workspace_id,package_id,change_number), CONSTRAINT uq_engineering_changes_reference UNIQUE(workspace_id,package_id,reference),
 CONSTRAINT ck_engineering_changes_priority_pair CHECK((priority IS NULL)=(priority_reason IS NULL)),
 CONSTRAINT ck_engineering_changes_withdrawn CHECK(num_nonnulls(stage_before_withdrawal,withdrawn_at,withdrawn_by,withdrawn_reason) IN (0,4) AND (stage<>'Withdrawn' OR withdrawn_at IS NOT NULL)),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,package_id) REFERENCES ppo.engineering_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,predecessor_change_id) REFERENCES ppo.engineering_changes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,author_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,next_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,withdrawn_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.engineering_changes FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('EngineeringChange','');
CREATE TRIGGER change_retained BEFORE DELETE ON ppo.engineering_changes FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX ix_engineering_changes_package ON ppo.engineering_changes(workspace_id,package_id,stage,due);
CREATE FUNCTION ppo.protect_engineering_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Advance the change version' USING ERRCODE='55000'; END IF;
 IF (NEW.company_id,NEW.package_id,NEW.change_number,NEW.reference,NEW.author_id,NEW.predecessor_change_id) IS DISTINCT FROM (OLD.company_id,OLD.package_id,OLD.change_number,OLD.reference,OLD.author_id,OLD.predecessor_change_id) THEN
  RAISE EXCEPTION 'The identity and authorship of a change are permanent' USING ERRCODE='55000'; END IF;
 -- Closed is terminal. Later evidence is a linked successor change, never a silent reopening.
 IF OLD.stage='Closed' THEN RAISE EXCEPTION 'A closed change is immutable' USING ERRCODE='55000'; END IF;
 IF OLD.withdrawn_at IS NOT NULL AND (NEW.withdrawn_at,NEW.withdrawn_by,NEW.withdrawn_reason,NEW.stage_before_withdrawal) IS DISTINCT FROM (OLD.withdrawn_at,OLD.withdrawn_by,OLD.withdrawn_reason,OLD.stage_before_withdrawal) THEN
  RAISE EXCEPTION 'A withdrawal is recorded once' USING ERRCODE='55000'; END IF;
 IF OLD.stage='Withdrawn' AND NEW.stage NOT IN ('Withdrawn','Closed') THEN RAISE EXCEPTION 'A withdrawn change only closes' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER change_guards BEFORE UPDATE ON ppo.engineering_changes FOR EACH ROW EXECUTE FUNCTION ppo.protect_engineering_change();

-- A proposal revision. While Working it is an ordinary optimistic draft. Submitting freezes every column
-- of content below together with its objects, source links and retest definitions; correction after a
-- return is a successor revision that names its predecessor. The structured documents are validated by
-- the application's strict parsers; the database holds their shape and their immutability.
CREATE TABLE ppo.change_revisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, change_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CONSTRAINT ck_change_revisions_version CHECK(version>0),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 revision_number integer NOT NULL CONSTRAINT ck_change_revisions_number CHECK(revision_number>0), predecessor_id uuid,
 state text NOT NULL DEFAULT 'Working' CONSTRAINT ck_change_revisions_state CHECK(state IN ('Working','Submitted','Returned','Decided')),
 rationale text CONSTRAINT ck_change_revisions_rationale CHECK(length(btrim(rationale)) BETWEEN 1 AND 4000),
 proposed_reference text CONSTRAINT ck_change_revisions_proposed_reference CHECK(length(btrim(proposed_reference)) BETWEEN 1 AND 80),
 proposed_revision text CONSTRAINT ck_change_revisions_proposed_revision CHECK(proposed_revision ~ '^[A-Za-z0-9.]{1,12}$'),
 scope_statement text CONSTRAINT ck_change_revisions_scope CHECK(length(btrim(scope_statement)) BETWEEN 1 AND 2000),
 requires_revised_release boolean NOT NULL DEFAULT true,
 comparison jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_change_revisions_comparison CHECK(jsonb_typeof(comparison)='array' AND jsonb_array_length(comparison)<=40),
 options jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_change_revisions_options CHECK(jsonb_typeof(options)='array' AND jsonb_array_length(options)<=6),
 selected_option text CONSTRAINT ck_change_revisions_selected CHECK(length(btrim(selected_option)) BETWEEN 1 AND 40),
 categories jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_change_revisions_categories CHECK(jsonb_typeof(categories)='array' AND jsonb_array_length(categories)<=9),
 costs jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_change_revisions_costs CHECK(jsonb_typeof(costs)='array' AND jsonb_array_length(costs)<=20),
 dates jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_change_revisions_dates CHECK(jsonb_typeof(dates)='array' AND jsonb_array_length(dates)<=20),
 content_hash text NOT NULL CONSTRAINT ck_change_revisions_hash CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 submitted_hash text CHECK(submitted_hash ~ '^[a-f0-9]{64}$'), submitted_at timestamptz, submitted_by uuid,
 return_kind text CONSTRAINT ck_change_revisions_return_kind CHECK(return_kind IN ('ScopeClarification','EvidenceNeeded','Correction')),
 return_reason text CONSTRAINT ck_change_revisions_return_reason CHECK(length(btrim(return_reason)) BETWEEN 1 AND 2000),
 returned_by uuid, returned_at timestamptz, return_owner_id uuid, return_due date,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), CONSTRAINT uq_change_revisions_number UNIQUE(workspace_id,change_id,revision_number),
 CONSTRAINT ck_change_revisions_submitted CHECK((state='Working')=(submitted_hash IS NULL) AND num_nonnulls(submitted_hash,submitted_at,submitted_by) IN (0,3) AND (submitted_hash IS NULL OR submitted_hash=content_hash)),
 CONSTRAINT ck_change_revisions_returned CHECK((state='Returned')=(returned_by IS NOT NULL) AND num_nonnulls(return_kind,return_reason,returned_by,returned_at,return_owner_id,return_due) IN (0,6)),
 -- Independence is also a database fact: nobody returns, and so nobody reviews, their own submission.
 CONSTRAINT ck_change_revisions_independent CHECK(returned_by IS NULL OR returned_by IS DISTINCT FROM submitted_by),
 FOREIGN KEY(workspace_id,company_id,change_id) REFERENCES ppo.engineering_changes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,predecessor_id) REFERENCES ppo.change_revisions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,submitted_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,returned_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,return_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER revision_retained BEFORE DELETE ON ppo.change_revisions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.protect_change_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Advance the revision version' USING ERRCODE='55000'; END IF;
 IF (NEW.company_id,NEW.change_id,NEW.revision_number,NEW.predecessor_id) IS DISTINCT FROM (OLD.company_id,OLD.change_id,OLD.revision_number,OLD.predecessor_id) THEN
  RAISE EXCEPTION 'The lineage of a revision is permanent' USING ERRCODE='55000'; END IF;
 IF OLD.state<>'Working' AND (NEW.rationale,NEW.proposed_reference,NEW.proposed_revision,NEW.scope_statement,NEW.requires_revised_release,NEW.comparison,NEW.options,NEW.selected_option,NEW.categories,NEW.costs,NEW.dates,NEW.content_hash,NEW.submitted_hash,NEW.submitted_at,NEW.submitted_by)
  IS DISTINCT FROM (OLD.rationale,OLD.proposed_reference,OLD.proposed_revision,OLD.scope_statement,OLD.requires_revised_release,OLD.comparison,OLD.options,OLD.selected_option,OLD.categories,OLD.costs,OLD.dates,OLD.content_hash,OLD.submitted_hash,OLD.submitted_at,OLD.submitted_by) THEN
  RAISE EXCEPTION 'A submitted proposal is frozen; correct it through a successor revision' USING ERRCODE='55000'; END IF;
 IF OLD.state IN ('Returned','Decided') THEN RAISE EXCEPTION 'A returned or decided revision is permanent' USING ERRCODE='55000'; END IF;
 IF OLD.state='Submitted' AND NEW.state NOT IN ('Returned','Decided') THEN RAISE EXCEPTION 'A submitted revision is returned or decided' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER revision_guards BEFORE UPDATE ON ppo.change_revisions FOR EACH ROW EXECUTE FUNCTION ppo.protect_change_revision();
-- Children of a revision move only while it is Working. After that they are its frozen evidence.
CREATE FUNCTION ppo.change_revision_is_working() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ws uuid; rev uuid;
BEGIN
 IF TG_OP='DELETE' THEN ws:=OLD.workspace_id; rev:=OLD.revision_id; ELSE ws:=NEW.workspace_id; rev:=NEW.revision_id; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.change_revisions r WHERE r.workspace_id=ws AND r.id=rev AND r.state='Working') THEN
  RAISE EXCEPTION 'The content of a submitted revision is frozen' USING ERRCODE='55000'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;

-- The exact source set of a revision: which retained upstream snapshot, in which role, and what was
-- observed of it at capture. The snapshot column is what "As reviewed" shows for ever; the present
-- condition is derived from ppo.material_sources and ppo.material_source_changes at read time.
CREATE TABLE ppo.change_revision_sources (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, revision_id uuid NOT NULL, source_id uuid NOT NULL,
 role text NOT NULL CONSTRAINT ck_change_revision_sources_role CHECK(role IN ('Baseline','Evidence','TestProcedure','Commercial','Configuration')),
 required boolean NOT NULL DEFAULT true, snapshot jsonb NOT NULL CONSTRAINT ck_change_revision_sources_snapshot CHECK(jsonb_typeof(snapshot)='object'),
 CONSTRAINT pk_change_revision_sources PRIMARY KEY(workspace_id,revision_id,source_id),
 FOREIGN KEY(workspace_id,company_id,revision_id) REFERENCES ppo.change_revisions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id)
);
CREATE UNIQUE INDEX uq_change_revision_sources_baseline ON ppo.change_revision_sources(workspace_id,revision_id) WHERE role='Baseline';
CREATE INDEX ix_change_revision_sources_source ON ppo.change_revision_sources(workspace_id,source_id);
CREATE TRIGGER source_link_frozen BEFORE INSERT OR UPDATE OR DELETE ON ppo.change_revision_sources FOR EACH ROW EXECUTE FUNCTION ppo.change_revision_is_working();

-- Affected objects. object_key is the typed identity two changes are compared by: a local UUID where
-- this application owns the record (a material line, a retained source, an asset), otherwise the exact
-- typed external reference. An installed asset keeps its physical location apart from the areas it
-- serves: one pump serving three areas is one row.
CREATE TABLE ppo.change_objects (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, revision_id uuid NOT NULL,
 object_type text NOT NULL CONSTRAINT ck_change_objects_type CHECK(object_type IN ('Requirement','Interface','DrawingIssue','MaterialLine','MaterialRelease','Product','SupplyObservation','InstalledAsset','Milestone','JobPack','Test')),
 object_id uuid, object_key text NOT NULL CONSTRAINT ck_change_objects_key CHECK(length(btrim(object_key)) BETWEEN 1 AND 200),
 reference text NOT NULL CONSTRAINT ck_change_objects_reference CHECK(length(btrim(reference)) BETWEEN 1 AND 120),
 title text NOT NULL CONSTRAINT ck_change_objects_title CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 current_state text CONSTRAINT ck_change_objects_current CHECK(length(btrim(current_state)) BETWEEN 1 AND 300),
 proposed_effect text CONSTRAINT ck_change_objects_effect CHECK(length(btrim(proposed_effect)) BETWEEN 1 AND 600),
 relation text NOT NULL CONSTRAINT ck_change_objects_relation CHECK(length(btrim(relation)) BETWEEN 1 AND 400),
 disposition text NOT NULL DEFAULT 'Candidate' CONSTRAINT ck_change_objects_disposition CHECK(disposition IN ('Candidate','Included','Excluded')),
 exclusion_reason text CONSTRAINT ck_change_objects_exclusion CHECK(length(btrim(exclusion_reason)) BETWEEN 1 AND 600),
 finding text CONSTRAINT ck_change_objects_finding CHECK(length(btrim(finding)) BETWEEN 1 AND 1000),
 evidence text CONSTRAINT ck_change_objects_evidence CHECK(length(btrim(evidence)) BETWEEN 1 AND 400),
 owner_id uuid, next_action text CONSTRAINT ck_change_objects_action CHECK(length(btrim(next_action)) BETWEEN 1 AND 300),
 location text CONSTRAINT ck_change_objects_location CHECK(length(btrim(location)) BETWEEN 1 AND 120),
 served_areas jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_change_objects_served CHECK(jsonb_typeof(served_areas)='array' AND jsonb_array_length(served_areas)<=20),
 supply_state text CONSTRAINT ck_change_objects_supply CHECK(supply_state IN ('Ordered','Shipped','Arrived','Received','Inspected','Usable','Quarantined','Returned')),
 sort_order integer NOT NULL DEFAULT 0,
 UNIQUE(workspace_id,id), CONSTRAINT uq_change_objects_key UNIQUE(workspace_id,revision_id,object_key),
 CONSTRAINT ck_change_objects_excluded CHECK(disposition<>'Excluded' OR exclusion_reason IS NOT NULL),
 CONSTRAINT ck_change_objects_supply_type CHECK(supply_state IS NULL OR object_type='SupplyObservation'),
 FOREIGN KEY(workspace_id,company_id,revision_id) REFERENCES ppo.change_revisions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE INDEX ix_change_objects_key ON ppo.change_objects(workspace_id,object_key);
CREATE TRIGGER object_frozen BEFORE INSERT OR UPDATE OR DELETE ON ppo.change_objects FOR EACH ROW EXECUTE FUNCTION ppo.change_revision_is_working();

-- Retest obligations are defined with the proposal and frozen with it. They are obligations, not a test
-- engine: the criterion and procedure come from the exact approved technical basis, and a missing
-- procedure is "Test basis needed", which blocks a positive result.
CREATE TABLE ppo.change_retests (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, revision_id uuid NOT NULL,
 criterion text NOT NULL CONSTRAINT ck_change_retests_criterion CHECK(length(btrim(criterion)) BETWEEN 1 AND 600),
 requirement_ref text CONSTRAINT ck_change_retests_requirement CHECK(length(btrim(requirement_ref)) BETWEEN 1 AND 120),
 asset_or_system text NOT NULL CONSTRAINT ck_change_retests_asset CHECK(length(btrim(asset_or_system)) BETWEEN 1 AND 200),
 configuration text NOT NULL CONSTRAINT ck_change_retests_configuration CHECK(length(btrim(configuration)) BETWEEN 1 AND 400),
 procedure_source_id uuid, reason text NOT NULL CONSTRAINT ck_change_retests_reason CHECK(length(btrim(reason)) BETWEEN 1 AND 600),
 verifier_id uuid, due date CONSTRAINT ck_change_retests_due CHECK(due BETWEEN DATE '0001-01-01' AND DATE '9998-12-31'), sort_order integer NOT NULL DEFAULT 0,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,revision_id) REFERENCES ppo.change_revisions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,procedure_source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,verifier_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER retest_frozen BEFORE INSERT OR UPDATE OR DELETE ON ppo.change_retests FOR EACH ROW EXECUTE FUNCTION ppo.change_revision_is_working();

-- Versioned fictional change-review policy. It names actors per duty; a role label or a capability alone
-- grants nothing, and no row means "Authority not configured". Rows are immutable: a change is a new version.
CREATE TABLE ppo.change_policies (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid,
 policy_version integer NOT NULL CONSTRAINT ck_change_policies_version CHECK(policy_version>0), effective_from timestamptz NOT NULL,
 grants jsonb NOT NULL CONSTRAINT ck_change_policies_grants CHECK(jsonb_typeof(grants)='array' AND jsonb_array_length(grants)<=60),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), CONSTRAINT uq_change_policies_version UNIQUE(workspace_id,company_id,policy_version),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id)
);
CREATE TRIGGER policy_immutable BEFORE UPDATE OR DELETE ON ppo.change_policies FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

-- One discipline review per assigned reviewer of one exact submitted revision. The response binds the
-- hash and the source condition it was given on, and is never edited: a corrected proposal earns new reviews.
CREATE TABLE ppo.change_reviews (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, change_id uuid NOT NULL, revision_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CONSTRAINT ck_change_reviews_version CHECK(version>0), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 discipline text NOT NULL CONSTRAINT ck_change_reviews_discipline CHECK(discipline IN ('Mechanical','Layout','Hydraulics','Electrical','Automation','Controls')),
 reviewer_id uuid NOT NULL, required boolean NOT NULL DEFAULT true,
 result text CONSTRAINT ck_change_reviews_result CHECK(result IN ('NoBlockingFinding','BlockingFinding','ReturnForClarification')),
 findings text CONSTRAINT ck_change_reviews_findings CHECK(length(btrim(findings)) BETWEEN 1 AND 4000),
 revision_hash text CHECK(revision_hash ~ '^[a-f0-9]{64}$'), source_state jsonb, policy_id uuid, policy_version integer, responded_at timestamptz,
 UNIQUE(workspace_id,id), CONSTRAINT uq_change_reviews_reviewer UNIQUE(workspace_id,revision_id,discipline,reviewer_id),
 CONSTRAINT ck_change_reviews_responded CHECK(num_nonnulls(result,findings,revision_hash,source_state,policy_id,policy_version,responded_at) IN (0,7)),
 FOREIGN KEY(workspace_id,company_id,change_id) REFERENCES ppo.engineering_changes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,revision_id) REFERENCES ppo.change_revisions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,policy_id) REFERENCES ppo.change_policies(workspace_id,id),
 FOREIGN KEY(workspace_id,reviewer_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER review_retained BEFORE DELETE ON ppo.change_reviews FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.protect_change_review() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF EXISTS(SELECT 1 FROM ppo.engineering_changes c WHERE (c.workspace_id,c.id)=(NEW.workspace_id,NEW.change_id) AND c.author_id=NEW.reviewer_id)
   OR EXISTS(SELECT 1 FROM ppo.change_revisions r WHERE (r.workspace_id,r.id)=(NEW.workspace_id,NEW.revision_id) AND NEW.reviewer_id IN (r.created_by,r.submitted_by)) THEN
   RAISE EXCEPTION 'A change is never reviewed by its own author' USING ERRCODE='23514'; END IF;
  RETURN NEW;
 END IF;
 IF OLD.result IS NOT NULL OR NEW.version<>OLD.version+1 OR (NEW.change_id,NEW.revision_id,NEW.discipline,NEW.reviewer_id,NEW.required) IS DISTINCT FROM (OLD.change_id,OLD.revision_id,OLD.discipline,OLD.reviewer_id,OLD.required) THEN
  RAISE EXCEPTION 'A review response is given once, on the revision it was assigned to' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER review_guards BEFORE INSERT OR UPDATE ON ppo.change_reviews FOR EACH ROW EXECUTE FUNCTION ppo.protect_change_review();

-- The technical decision on one exact submitted revision. It is a bounded engineering decision and is
-- immutable: a later source change makes it ineligible for new use without ever rewriting it.
CREATE TABLE ppo.change_decisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, change_id uuid NOT NULL, revision_id uuid NOT NULL,
 revision_hash text NOT NULL CHECK(revision_hash ~ '^[a-f0-9]{64}$'), option_key text NOT NULL,
 result text NOT NULL CONSTRAINT ck_change_decisions_result CHECK(result IN ('Accepted','Rejected')),
 purpose text NOT NULL CONSTRAINT ck_change_decisions_purpose CHECK(purpose IN ('DesignCoordination','Procurement','Installation')),
 reason text NOT NULL CONSTRAINT ck_change_decisions_reason CHECK(length(btrim(reason)) BETWEEN 1 AND 4000),
 source_state jsonb NOT NULL, policy_id uuid NOT NULL, policy_version integer NOT NULL, operation_id uuid NOT NULL,
 decided_by uuid NOT NULL, decided_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), CONSTRAINT uq_change_decisions_revision UNIQUE(workspace_id,revision_id),
 FOREIGN KEY(workspace_id,company_id,change_id) REFERENCES ppo.engineering_changes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,revision_id) REFERENCES ppo.change_revisions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,policy_id) REFERENCES ppo.change_policies(workspace_id,id),
 FOREIGN KEY(workspace_id,decided_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE FUNCTION ppo.protect_change_decision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'A technical decision is permanent' USING ERRCODE='55000'; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.change_revisions r WHERE (r.workspace_id,r.id,r.change_id)=(NEW.workspace_id,NEW.revision_id,NEW.change_id) AND r.state='Submitted' AND r.submitted_hash=NEW.revision_hash) THEN
  RAISE EXCEPTION 'A decision binds the exact submitted revision' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM ppo.engineering_changes c WHERE (c.workspace_id,c.id)=(NEW.workspace_id,NEW.change_id) AND c.author_id=NEW.decided_by)
  OR EXISTS(SELECT 1 FROM ppo.change_revisions r WHERE (r.workspace_id,r.change_id)=(NEW.workspace_id,NEW.change_id) AND NEW.decided_by IN (r.created_by,r.submitted_by)) THEN
  RAISE EXCEPTION 'A change is never decided by someone who authored it' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER decision_guards BEFORE INSERT OR UPDATE OR DELETE ON ppo.change_decisions FOR EACH ROW EXECUTE FUNCTION ppo.protect_change_decision();

-- A nontechnical prerequisite of implementation, raised when a change is accepted. No commercial or
-- scheduling runtime exists here, so the record is an in-module synthetic prerequisite: its outcome is
-- never an actual Project, Finance or booking approval, and its authority label says so for ever.
CREATE TABLE ppo.change_prerequisites (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, change_id uuid NOT NULL, decision_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CONSTRAINT ck_change_prerequisites_version CHECK(version>0),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL, updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 kind text NOT NULL CONSTRAINT ck_change_prerequisites_kind CHECK(kind IN ('Commercial','Scheduling')),
 applicability text NOT NULL CONSTRAINT ck_change_prerequisites_applicability CHECK(applicability IN ('Required','NotApplicable','Unknown')),
 applicability_reason text NOT NULL CONSTRAINT ck_change_prerequisites_reason CHECK(length(btrim(applicability_reason)) BETWEEN 1 AND 1000),
 owner_id uuid, due date, state text NOT NULL DEFAULT 'Open' CONSTRAINT ck_change_prerequisites_state CHECK(state IN ('Open','Confirmed','Declined')),
 outcome_note text CONSTRAINT ck_change_prerequisites_note CHECK(length(btrim(outcome_note)) BETWEEN 1 AND 2000), evidence_source_id uuid,
 resolved_by uuid, resolved_at timestamptz, outcome_operation_id uuid,
 authority text NOT NULL DEFAULT 'SyntheticPrerequisiteFixture' CONSTRAINT ck_change_prerequisites_authority CHECK(authority='SyntheticPrerequisiteFixture'),
 UNIQUE(workspace_id,id), CONSTRAINT uq_change_prerequisites_kind UNIQUE(workspace_id,decision_id,kind),
 CONSTRAINT ck_change_prerequisites_resolved CHECK((state='Open')=(resolved_by IS NULL) AND num_nonnulls(outcome_note,resolved_by,resolved_at,outcome_operation_id) IN (0,4)),
 CONSTRAINT ck_change_prerequisites_owned CHECK(applicability<>'Required' OR owner_id IS NOT NULL),
 FOREIGN KEY(workspace_id,company_id,change_id) REFERENCES ppo.engineering_changes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,decision_id) REFERENCES ppo.change_decisions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,evidence_source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,resolved_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER prerequisite_retained BEFORE DELETE ON ppo.change_prerequisites FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.protect_change_prerequisite() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.version<>OLD.version+1 OR OLD.state<>'Open' OR (NEW.change_id,NEW.decision_id,NEW.kind,NEW.authority) IS DISTINCT FROM (OLD.change_id,OLD.decision_id,OLD.kind,OLD.authority) THEN
  RAISE EXCEPTION 'A prerequisite outcome is recorded once' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER prerequisite_guards BEFORE UPDATE ON ppo.change_prerequisites FOR EACH ROW EXECUTE FUNCTION ppo.protect_change_prerequisite();

-- A request to a source owner: one stable identity per destination and purpose. Investigation, release
-- preparation and implementation are different purposes and one can never be relabelled as another.
-- The state is the outcome of its latest submission; correction after a return is a new submission of
-- the same request, and an amendment after acceptance is a new request that names the one it amends.
CREATE TABLE ppo.change_handovers (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, change_id uuid NOT NULL, revision_id uuid NOT NULL, decision_id uuid,
 version integer NOT NULL DEFAULT 1 CONSTRAINT ck_change_handovers_version CHECK(version>0),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL, updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 purpose text NOT NULL CONSTRAINT ck_change_handovers_purpose CHECK(purpose IN ('InformationRequired','ImpactReview','PrepareRevisedRelease','Implementation','Amendment')),
 destination text NOT NULL CONSTRAINT ck_change_handovers_destination CHECK(destination IN ('TechnicalRelease','Materials','SupplyChain','Projects','Service','Commissioning','DocumentControl')),
 owner_id uuid NOT NULL, requested_action text NOT NULL CONSTRAINT ck_change_handovers_action CHECK(length(btrim(requested_action)) BETWEEN 1 AND 600),
 due date CONSTRAINT ck_change_handovers_due CHECK(due BETWEEN DATE '0001-01-01' AND DATE '9998-12-31'),
 state text NOT NULL DEFAULT 'Pending' CONSTRAINT ck_change_handovers_state CHECK(state IN ('Pending','Accepted','Returned','Declined','Cancelled')),
 amends_id uuid, acknowledgement_required boolean NOT NULL DEFAULT false, acknowledged_by uuid, acknowledged_at timestamptz,
 cancelled_by uuid, cancelled_at timestamptz, cancelled_reason text CONSTRAINT ck_change_handovers_cancelled_reason CHECK(length(btrim(cancelled_reason)) BETWEEN 1 AND 1000),
 created_operation_id uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id),
 CONSTRAINT ck_change_handovers_decision CHECK(purpose IN ('InformationRequired','ImpactReview') OR decision_id IS NOT NULL),
 CONSTRAINT ck_change_handovers_amends CHECK((purpose='Amendment')=(amends_id IS NOT NULL)),
 CONSTRAINT ck_change_handovers_cancelled CHECK((state='Cancelled')=(cancelled_by IS NOT NULL) AND num_nonnulls(cancelled_by,cancelled_at,cancelled_reason) IN (0,3)),
 CONSTRAINT ck_change_handovers_acknowledged CHECK(num_nonnulls(acknowledged_by,acknowledged_at) IN (0,2)),
 FOREIGN KEY(workspace_id,company_id,change_id) REFERENCES ppo.engineering_changes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,revision_id) REFERENCES ppo.change_revisions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,decision_id) REFERENCES ppo.change_decisions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,amends_id) REFERENCES ppo.change_handovers(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,acknowledged_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,cancelled_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER handover_retained BEFORE DELETE ON ppo.change_handovers FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX ix_change_handovers_change ON ppo.change_handovers(workspace_id,change_id,created_at);
CREATE INDEX ix_change_handovers_owner ON ppo.change_handovers(workspace_id,owner_id,state);
CREATE FUNCTION ppo.protect_change_handover() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Advance the request version' USING ERRCODE='55000'; END IF;
 IF (NEW.company_id,NEW.change_id,NEW.revision_id,NEW.decision_id,NEW.purpose,NEW.destination,NEW.owner_id,NEW.requested_action,NEW.amends_id,NEW.created_operation_id)
  IS DISTINCT FROM (OLD.company_id,OLD.change_id,OLD.revision_id,OLD.decision_id,OLD.purpose,OLD.destination,OLD.owner_id,OLD.requested_action,OLD.amends_id,OLD.created_operation_id) THEN
  RAISE EXCEPTION 'The purpose, destination and owner of a request are permanent; a changed recipient is a cancellation and a successor' USING ERRCODE='55000'; END IF;
 IF OLD.state IN ('Declined','Cancelled') AND NEW.state<>OLD.state THEN RAISE EXCEPTION 'A declined or cancelled request is final' USING ERRCODE='55000'; END IF;
 -- An accepted request stays accepted: later change is an explicit amendment request, never an overwrite.
 IF OLD.state='Accepted' AND NEW.state<>'Accepted' THEN RAISE EXCEPTION 'An accepted request is never reopened' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER handover_guards BEFORE UPDATE ON ppo.change_handovers FOR EACH ROW EXECUTE FUNCTION ppo.protect_change_handover();

-- Each exact payload sent to a receiver, and the one outcome recorded against it. The payload and its
-- outcome are permanent. Accepting records that this exact payload was received; it does not prove that
-- any physical work occurred, and it rewrites nothing upstream.
CREATE TABLE ppo.change_submissions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, handover_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CONSTRAINT ck_change_submissions_version CHECK(version>0),
 submission_number integer NOT NULL CONSTRAINT ck_change_submissions_number CHECK(submission_number>0),
 payload jsonb NOT NULL CONSTRAINT ck_change_submissions_payload CHECK(jsonb_typeof(payload)='object'),
 payload_hash text NOT NULL CONSTRAINT ck_change_submissions_hash CHECK(payload_hash ~ '^[a-f0-9]{64}$'),
 submitted_by uuid NOT NULL, submitted_at timestamptz NOT NULL DEFAULT clock_timestamp(), operation_id uuid NOT NULL,
 outcome text CONSTRAINT ck_change_submissions_outcome CHECK(outcome IN ('Accepted','Returned','Declined')),
 outcome_reason text CONSTRAINT ck_change_submissions_reason CHECK(length(btrim(outcome_reason)) BETWEEN 1 AND 2000),
 outcome_evidence text CONSTRAINT ck_change_submissions_evidence CHECK(length(btrim(outcome_evidence)) BETWEEN 1 AND 600),
 outcome_by uuid, outcome_at timestamptz, outcome_operation_id uuid, return_owner_id uuid, return_due date,
 UNIQUE(workspace_id,id), CONSTRAINT uq_change_submissions_number UNIQUE(workspace_id,handover_id,submission_number),
 CONSTRAINT ck_change_submissions_decided CHECK(num_nonnulls(outcome,outcome_reason,outcome_by,outcome_at,outcome_operation_id) IN (0,5)),
 CONSTRAINT ck_change_submissions_returned CHECK(outcome IS DISTINCT FROM 'Returned' OR (return_owner_id IS NOT NULL AND return_due IS NOT NULL)),
 -- A payload is decided by its receiver, never by whoever sent it.
 CONSTRAINT ck_change_submissions_independent CHECK(outcome_by IS DISTINCT FROM submitted_by),
 FOREIGN KEY(workspace_id,company_id,handover_id) REFERENCES ppo.change_handovers(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,submitted_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,outcome_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,return_owner_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER submission_retained BEFORE DELETE ON ppo.change_submissions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.protect_change_submission() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.outcome IS NOT NULL OR NEW.version<>OLD.version+1 OR (NEW.handover_id,NEW.submission_number,NEW.payload,NEW.payload_hash,NEW.submitted_by,NEW.submitted_at,NEW.operation_id)
  IS DISTINCT FROM (OLD.handover_id,OLD.submission_number,OLD.payload,OLD.payload_hash,OLD.submitted_by,OLD.submitted_at,OLD.operation_id) THEN
  RAISE EXCEPTION 'A submitted payload and its recorded outcome are permanent' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER submission_guards BEFORE UPDATE ON ppo.change_submissions FOR EACH ROW EXECUTE FUNCTION ppo.protect_change_submission();

-- Test attempts against one frozen obligation. Every attempt is retained: a later pass never edits an
-- earlier fail. The result comes from a named source of competence; a finished task or a photograph is
-- neither. A failed attempt names the owned corrective work it leaves behind.
CREATE TABLE ppo.change_retest_attempts (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, change_id uuid NOT NULL, retest_id uuid NOT NULL,
 attempt_number integer NOT NULL CONSTRAINT ck_change_retest_attempts_number CHECK(attempt_number>0),
 result text NOT NULL CONSTRAINT ck_change_retest_attempts_result CHECK(result IN ('Passed','Failed')),
 tested_at timestamptz NOT NULL, configuration_present text NOT NULL CONSTRAINT ck_change_retest_attempts_configuration CHECK(length(btrim(configuration_present)) BETWEEN 1 AND 400),
 evidence_reference text NOT NULL CONSTRAINT ck_change_retest_attempts_evidence CHECK(length(btrim(evidence_reference)) BETWEEN 1 AND 400), evidence_source_id uuid,
 result_source text NOT NULL CONSTRAINT ck_change_retest_attempts_source CHECK(result_source='SyntheticInspectionFixture'),
 note text CONSTRAINT ck_change_retest_attempts_note CHECK(length(btrim(note)) BETWEEN 1 AND 2000),
 corrective_action text CONSTRAINT ck_change_retest_attempts_corrective CHECK(length(btrim(corrective_action)) BETWEEN 1 AND 1000), corrective_owner_id uuid, corrective_due date,
 procedure_source_id uuid NOT NULL, recorded_by uuid NOT NULL, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(), operation_id uuid NOT NULL,
 UNIQUE(workspace_id,id), CONSTRAINT uq_change_retest_attempts_number UNIQUE(workspace_id,retest_id,attempt_number),
 CONSTRAINT ck_change_retest_attempts_failed CHECK((result='Failed')=(corrective_action IS NOT NULL) AND num_nonnulls(corrective_action,corrective_owner_id,corrective_due) IN (0,3)),
 FOREIGN KEY(workspace_id,company_id,change_id) REFERENCES ppo.engineering_changes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,retest_id) REFERENCES ppo.change_retests(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,evidence_source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,procedure_source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,corrective_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER attempt_immutable BEFORE UPDATE OR DELETE ON ppo.change_retest_attempts FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

-- A recorded source check: who asked the upstream adapter, when, and what it answered. The time shown
-- beside "Sources current" is this row's time and never the time a screen happened to load.
CREATE TABLE ppo.change_source_checks (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, change_id uuid NOT NULL, revision_id uuid NOT NULL,
 result text NOT NULL CONSTRAINT ck_change_source_checks_result CHECK(result IN ('Current','Changed','Withdrawn','Unavailable','Restricted','NotCaptured')),
 details jsonb NOT NULL, adapter text NOT NULL CONSTRAINT ck_change_source_checks_adapter CHECK(adapter='SyntheticUpstreamFixture'),
 operation_id uuid NOT NULL, checked_by uuid NOT NULL, checked_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,change_id) REFERENCES ppo.engineering_changes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,revision_id) REFERENCES ppo.change_revisions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,checked_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER source_check_immutable BEFORE UPDATE OR DELETE ON ppo.change_source_checks FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX ix_change_source_checks_change ON ppo.change_source_checks(workspace_id,change_id,checked_at DESC);

-- A compatibility or sequence decision between two overlapping changes, recorded by the technical
-- authority. Nothing is merged or rebased; this only records that both may proceed, and in what order.
CREATE TABLE ppo.change_overlap_decisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, change_id uuid NOT NULL, other_change_id uuid NOT NULL,
 decision text NOT NULL CONSTRAINT ck_change_overlap_decisions_text CHECK(length(btrim(decision)) BETWEEN 1 AND 2000),
 policy_id uuid NOT NULL, policy_version integer NOT NULL, operation_id uuid NOT NULL, decided_by uuid NOT NULL, decided_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), CONSTRAINT uq_change_overlap_decisions_pair UNIQUE(workspace_id,change_id,other_change_id), CONSTRAINT ck_change_overlap_decisions_pair CHECK(change_id<>other_change_id),
 FOREIGN KEY(workspace_id,company_id,change_id) REFERENCES ppo.engineering_changes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,other_change_id) REFERENCES ppo.engineering_changes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,policy_id) REFERENCES ppo.change_policies(workspace_id,id),
 FOREIGN KEY(workspace_id,decided_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER overlap_decision_immutable BEFORE UPDATE OR DELETE ON ppo.change_overlap_decisions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

-- The closure snapshot: what the change meant when it closed and exactly what that rested on.
CREATE TABLE ppo.change_closures (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, change_id uuid NOT NULL,
 meaning text NOT NULL CONSTRAINT ck_change_closures_meaning CHECK(meaning IN ('Implemented','NoImplementation')),
 basis jsonb NOT NULL CONSTRAINT ck_change_closures_basis CHECK(jsonb_typeof(basis)='object'), basis_hash text NOT NULL CHECK(basis_hash ~ '^[a-f0-9]{64}$'),
 reason text NOT NULL CONSTRAINT ck_change_closures_reason CHECK(length(btrim(reason)) BETWEEN 1 AND 2000),
 policy_id uuid NOT NULL, policy_version integer NOT NULL, operation_id uuid NOT NULL, closed_by uuid NOT NULL, closed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), CONSTRAINT uq_change_closures_change UNIQUE(workspace_id,change_id),
 FOREIGN KEY(workspace_id,company_id,change_id) REFERENCES ppo.engineering_changes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,policy_id) REFERENCES ppo.change_policies(workspace_id,id),
 FOREIGN KEY(workspace_id,closed_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE FUNCTION ppo.protect_change_closure() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'A closure is permanent' USING ERRCODE='55000'; END IF;
 IF EXISTS(SELECT 1 FROM ppo.engineering_changes c WHERE (c.workspace_id,c.id)=(NEW.workspace_id,NEW.change_id) AND c.author_id=NEW.closed_by) THEN
  RAISE EXCEPTION 'A change is never closed by its own author' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER closure_guards BEFORE INSERT OR UPDATE OR DELETE ON ppo.change_closures FOR EACH ROW EXECUTE FUNCTION ppo.protect_change_closure();

-- Append-only history for every subject in the module, written in the same transaction as the change.
CREATE TABLE ppo.change_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, package_id uuid NOT NULL, change_id uuid NOT NULL,
 subject_type text NOT NULL CONSTRAINT ck_change_events_subject CHECK(subject_type IN ('Change','Revision','Review','Decision','Prerequisite','Handover','Submission','RetestAttempt','SourceCheck','OverlapDecision','Closure')),
 subject_id uuid NOT NULL, change_version integer NOT NULL CHECK(change_version>0),
 event_type text NOT NULL CONSTRAINT ck_change_events_type CHECK(event_type ~ '^[A-Z][A-Za-z]{2,59}$'),
 reason text NOT NULL CONSTRAINT ck_change_events_reason CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 note text CONSTRAINT ck_change_events_note CHECK(length(btrim(note)) BETWEEN 1 AND 2000),
 snapshot jsonb NOT NULL, operation_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,package_id) REFERENCES ppo.engineering_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,change_id) REFERENCES ppo.engineering_changes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER event_immutable BEFORE UPDATE OR DELETE ON ppo.change_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX ix_change_events_package ON ppo.change_events(workspace_id,package_id,created_at DESC,id);
CREATE INDEX ix_change_events_change ON ppo.change_events(workspace_id,change_id,created_at DESC);
