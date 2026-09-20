-- EN-06 Released Materials & Substitutions (parent ENG-05; decisions in docs/decisions/engineering-materials-substitutions-design.md).
-- Additive only: no existing row, trigger, grant or issued migration byte changes. Four shared CHECK
-- constraints are widened by the 0020 idiom, so every value they accepted before remains accepted.
--
-- A material line is a stable identity with a current row. Its technical content carries a content
-- revision and hash; coordination fields (next action, owner, due date) do not. Reviews, substitution
-- decisions and releases bind to an exact (line, content revision, hash), so a later change cannot be
-- authorised by an earlier decision. Every accepted command also appends an immutable event with a
-- snapshot, and an issued release keeps its own frozen manifest. A technical release is never
-- permission to spend, order, reserve, install or commission: nothing here records those facts.
--
-- The runner applies every pending migration in one transaction. 0026 backfills identities for existing
-- estimates, which queues deferred identity_target events on ppo.business_identities, and PostgreSQL refuses to
-- ALTER a table that has pending trigger events. This is the first migration since 0026 to alter that table, so
-- it settles those checks first, exactly as a commit between the two migrations would, and restores deferral
-- straight afterwards: every later insert still registers an identity before its typed row exists.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$
DECLARE item record; definition text;
BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('business_identities','ck_identities_type','object_type','MaterialSet,MaterialSource,MaterialLine,MaterialSubstitution,MaterialRelease,MaterialHandover,MaterialImpact'),
 ('audit_events','ck_audit_object_type','object_type','MaterialSet,MaterialSource,MaterialLine,MaterialSubstitution,MaterialRelease,MaterialHandover,MaterialImpact'),
 ('outbox_jobs','ck_outbox_kind','kind','MaterialRecordSaved,MaterialDecisionRecorded,MaterialReleaseIssued,MaterialHandoverDecided,MaterialSourceObserved'),
 ('permission_grants','ck_grants_capability','capability','engineering.material.review,engineering.material.release,engineering.material.receive,engineering.material.source')
 ) AS v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,string_to_array(item.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed typed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''MaterialSet'' THEN ''material_sets'' WHEN ''MaterialSource'' THEN ''material_sources'' WHEN ''MaterialLine'' THEN ''material_lines'' WHEN ''MaterialSubstitution'' THEN ''material_substitutions'' WHEN ''MaterialRelease'' THEN ''material_releases'' WHEN ''MaterialHandover'' THEN ''material_handovers'' WHEN ''MaterialImpact'' THEN ''material_impacts''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

-- One material set per Engineering package and code. The package already fixes company, customer,
-- site and the immutable Project or Opportunity link; the set never restates them.
CREATE TABLE ppo.material_sets (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, package_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CONSTRAINT ck_material_sets_version CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 set_code text NOT NULL CONSTRAINT ck_material_sets_code CHECK(set_code ~ '^[A-Z]{1,2}$'),
 revision integer NOT NULL CONSTRAINT ck_material_sets_revision CHECK(revision BETWEEN 1 AND 999),
 title text NOT NULL CONSTRAINT ck_material_sets_title CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 owner_id uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), CONSTRAINT uq_material_sets_code UNIQUE(workspace_id,package_id,set_code),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,package_id) REFERENCES ppo.engineering_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.material_sets FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('MaterialSet','');
CREATE TRIGGER set_retained BEFORE DELETE ON ppo.material_sets FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

-- Retained exact source snapshots observed through the local synthetic upstream adapter. The permitted
-- purpose belongs to the source owner's issue and is never a field of a material or release command.
-- A snapshot is immutable; supersession and withdrawal are separate appended facts.
CREATE TABLE ppo.material_sources (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, package_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version=1), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 kind text NOT NULL CONSTRAINT ck_material_sources_kind CHECK(kind IN ('DesignBasis','DrawingIssue','CompatibilityEvidence','DemandAuthority','CommercialDecision')),
 reference text NOT NULL CONSTRAINT ck_material_sources_reference CHECK(length(btrim(reference)) BETWEEN 1 AND 80),
 title text NOT NULL CONSTRAINT ck_material_sources_title CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 revision text NOT NULL CONSTRAINT ck_material_sources_revision CHECK(revision ~ '^[A-Za-z0-9.]{1,12}$'),
 file_version text NOT NULL CONSTRAINT ck_material_sources_file_version CHECK(length(btrim(file_version)) BETWEEN 1 AND 40),
 permitted_purpose text NOT NULL CONSTRAINT ck_material_sources_purpose CHECK(permitted_purpose IN ('Procurement','DesignCoordination','InformationOnly')),
 completeness text NOT NULL CONSTRAINT ck_material_sources_completeness CHECK(completeness IN ('Complete','Unavailable')),
 content text CONSTRAINT ck_material_sources_content CHECK(length(content) BETWEEN 1 AND 20000),
 content_hash text CONSTRAINT ck_material_sources_hash CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 restricted boolean NOT NULL DEFAULT false, observed_at timestamptz NOT NULL, predecessor_id uuid,
 adapter text NOT NULL CONSTRAINT ck_material_sources_adapter CHECK(adapter='SyntheticUpstreamFixture'),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), CONSTRAINT uq_material_sources_issue UNIQUE(workspace_id,package_id,kind,reference,revision),
 CONSTRAINT ck_material_sources_bytes CHECK((completeness='Complete')=(content IS NOT NULL AND content_hash IS NOT NULL)),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,package_id) REFERENCES ppo.engineering_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,predecessor_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.material_sources FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('MaterialSource','');
CREATE TRIGGER source_immutable BEFORE UPDATE OR DELETE ON ppo.material_sources FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.material_source_changes (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, source_id uuid NOT NULL,
 change text NOT NULL CONSTRAINT ck_material_source_changes_change CHECK(change IN ('Superseded','Withdrawn')),
 successor_id uuid, reason text NOT NULL CONSTRAINT ck_material_source_changes_reason CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 operation_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 CONSTRAINT pk_material_source_changes PRIMARY KEY(workspace_id,source_id),
 CONSTRAINT ck_material_source_changes_successor CHECK((change='Superseded')=(successor_id IS NOT NULL) AND successor_id IS DISTINCT FROM source_id),
 FOREIGN KEY(workspace_id,company_id,source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,successor_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER source_change_immutable BEFORE UPDATE OR DELETE ON ppo.material_source_changes FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

-- Material requirement lines. Physical location and areas served are different facts: a pump in one
-- shed that serves three growing areas is one requirement. Quantities are exact numerics with six
-- fractional places. The item/unit binding lives on the line because a changed binding is changed
-- technical content; a missing conversion is NULL, never 1.
CREATE TABLE ppo.material_lines (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, set_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CONSTRAINT ck_material_lines_version CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 line_number text NOT NULL CONSTRAINT ck_material_lines_number CHECK(line_number ~ '^[0-9]{3,4}$'),
 content_revision integer NOT NULL DEFAULT 1 CONSTRAINT ck_material_lines_content_revision CHECK(content_revision>0),
 content_hash text NOT NULL CONSTRAINT ck_material_lines_content_hash CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 description text NOT NULL CONSTRAINT ck_material_lines_description CHECK(length(btrim(description)) BETWEEN 1 AND 200),
 category text NOT NULL CONSTRAINT ck_material_lines_category CHECK(length(btrim(category)) BETWEEN 1 AND 80),
 specification text NOT NULL CONSTRAINT ck_material_lines_specification CHECK(length(btrim(specification)) BETWEEN 1 AND 2000),
 discipline text NOT NULL CONSTRAINT ck_material_lines_discipline CHECK(discipline IN ('Mechanical','Layout','Hydraulics','Electrical','Automation','Controls')),
 system_name text NOT NULL CONSTRAINT ck_material_lines_system CHECK(length(btrim(system_name)) BETWEEN 1 AND 120),
 location text NOT NULL CONSTRAINT ck_material_lines_location CHECK(length(btrim(location)) BETWEEN 1 AND 120),
 served_areas jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_material_lines_served CHECK(jsonb_typeof(served_areas)='array' AND jsonb_array_length(served_areas)<=20),
 quantity numeric(18,6) NOT NULL CONSTRAINT ck_material_lines_quantity CHECK(quantity>0),
 unit text NOT NULL CONSTRAINT ck_material_lines_unit CHECK(unit IN ('EA','PACK','M','L','KG')),
 quantity_basis text NOT NULL CONSTRAINT ck_material_lines_basis CHECK(length(btrim(quantity_basis)) BETWEEN 1 AND 400),
 required_by date CONSTRAINT ck_material_lines_required_by CHECK(required_by BETWEEN DATE '0001-01-01' AND DATE '9998-12-31'),
 purpose text NOT NULL CONSTRAINT ck_material_lines_purpose CHECK(purpose IN ('TechnicalReleaseForProcurement','InformationOnly')),
 manufacturer text CONSTRAINT ck_material_lines_manufacturer CHECK(length(btrim(manufacturer)) BETWEEN 1 AND 120),
 model text CONSTRAINT ck_material_lines_model CHECK(length(btrim(model)) BETWEEN 1 AND 120),
 supplier_part text CONSTRAINT ck_material_lines_supplier_part CHECK(length(btrim(supplier_part)) BETWEEN 1 AND 120),
 product_ref text CONSTRAINT ck_material_lines_product_ref CHECK(length(btrim(product_ref)) BETWEEN 1 AND 120),
 kit_role text NOT NULL DEFAULT 'Independent' CONSTRAINT ck_material_lines_kit_role CHECK(kit_role IN ('Independent','KitParent','KitChild')),
 parent_line_id uuid, dependency_group text CONSTRAINT ck_material_lines_group CHECK(length(btrim(dependency_group)) BETWEEN 1 AND 80),
 drawing_source_id uuid, basis_source_id uuid,
 scope_decision_needed boolean NOT NULL DEFAULT false, scope_decision_owner_id uuid,
 mapping text NOT NULL DEFAULT 'Missing' CONSTRAINT ck_material_lines_mapping CHECK(mapping IN ('Verified','Proposed','Ambiguous','Missing','Unavailable','Restricted','Changed','NotRequired')),
 mapping_provider text CONSTRAINT ck_material_lines_provider CHECK(mapping_provider='Synthetic'),
 mapping_configuration text CONSTRAINT ck_material_lines_configuration CHECK(length(btrim(mapping_configuration)) BETWEEN 1 AND 80),
 mapping_entity text CONSTRAINT ck_material_lines_entity CHECK(length(btrim(mapping_entity)) BETWEEN 1 AND 80),
 mapping_item_key text CONSTRAINT ck_material_lines_item_key CHECK(length(btrim(mapping_item_key)) BETWEEN 1 AND 80),
 mapping_item_description text CONSTRAINT ck_material_lines_item_description CHECK(length(btrim(mapping_item_description)) BETWEEN 1 AND 200),
 mapping_version integer NOT NULL DEFAULT 0 CONSTRAINT ck_material_lines_mapping_version CHECK(mapping_version>=0),
 mapping_observed_at timestamptz, mapping_verified_by uuid, mapping_owner_id uuid,
 mapping_candidates jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_material_lines_candidates CHECK(jsonb_typeof(mapping_candidates)='array' AND jsonb_array_length(mapping_candidates)<=8),
 mapping_rationale text CONSTRAINT ck_material_lines_rationale CHECK(length(btrim(mapping_rationale)) BETWEEN 1 AND 1000),
 target_unit text CONSTRAINT ck_material_lines_target_unit CHECK(target_unit IN ('EA','PACK','M','L','KG')),
 conversion_numerator integer CONSTRAINT ck_material_lines_numerator CHECK(conversion_numerator>0),
 conversion_denominator integer CONSTRAINT ck_material_lines_denominator CHECK(conversion_denominator>0),
 whole_units_only boolean NOT NULL DEFAULT false,
 target_precision integer NOT NULL DEFAULT 6 CONSTRAINT ck_material_lines_precision CHECK(target_precision BETWEEN 0 AND 6),
 conversion_evidence text CONSTRAINT ck_material_lines_conversion_evidence CHECK(length(btrim(conversion_evidence)) BETWEEN 1 AND 1000),
 overage_basis text CONSTRAINT ck_material_lines_overage CHECK(length(btrim(overage_basis)) BETWEEN 1 AND 1000),
 author_id uuid NOT NULL, next_owner_id uuid NOT NULL,
 next_action text NOT NULL CONSTRAINT ck_material_lines_next_action CHECK(length(btrim(next_action)) BETWEEN 1 AND 300),
 action_due date CONSTRAINT ck_material_lines_action_due CHECK(action_due BETWEEN DATE '0001-01-01' AND DATE '9998-12-31'),
 removed_at timestamptz, removed_reason text CONSTRAINT ck_material_lines_removed_reason CHECK(length(btrim(removed_reason)) BETWEEN 1 AND 1000),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), CONSTRAINT uq_material_lines_number UNIQUE(workspace_id,set_id,line_number),
 CONSTRAINT ck_material_lines_kit CHECK((kit_role='KitChild')=(parent_line_id IS NOT NULL) AND parent_line_id IS DISTINCT FROM id),
 CONSTRAINT ck_material_lines_conversion CHECK(num_nonnulls(conversion_numerator,conversion_denominator) IN (0,2)),
 CONSTRAINT ck_material_lines_binding CHECK(mapping NOT IN ('Verified','Proposed','Changed') OR (mapping_provider IS NOT NULL AND mapping_configuration IS NOT NULL AND mapping_entity IS NOT NULL AND mapping_item_key IS NOT NULL AND target_unit IS NOT NULL)),
 CONSTRAINT ck_material_lines_not_required CHECK(mapping<>'NotRequired' OR (mapping_rationale IS NOT NULL AND purpose='InformationOnly')),
 CONSTRAINT ck_material_lines_removed CHECK((removed_at IS NULL)=(removed_reason IS NULL)),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,set_id) REFERENCES ppo.material_sets(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,parent_line_id) REFERENCES ppo.material_lines(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,drawing_source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,basis_source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,scope_decision_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,mapping_verified_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,mapping_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,author_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,next_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.material_lines FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('MaterialLine','');
CREATE TRIGGER line_retained BEFORE DELETE ON ppo.material_lines FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX ix_material_lines_set ON ppo.material_lines(workspace_id,set_id,line_number);

-- A substitution is a proposal against one exact original requirement and one exact candidate. Its
-- decision binds the hash that was submitted; approving it here creates no catalogue-wide compatibility.
-- Commercial applicability is a separate fact with a separate owner.
CREATE TABLE ppo.material_substitutions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, set_id uuid NOT NULL, line_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CONSTRAINT ck_material_substitutions_version CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 line_content_revision integer NOT NULL CHECK(line_content_revision>0), line_content_hash text NOT NULL CHECK(line_content_hash ~ '^[a-f0-9]{64}$'),
 original_code text NOT NULL CONSTRAINT ck_material_substitutions_original_code CHECK(length(btrim(original_code)) BETWEEN 1 AND 80),
 original_description text NOT NULL CONSTRAINT ck_material_substitutions_original_description CHECK(length(btrim(original_description)) BETWEEN 1 AND 200),
 candidate_code text NOT NULL CONSTRAINT ck_material_substitutions_code CHECK(length(btrim(candidate_code)) BETWEEN 1 AND 80),
 candidate_description text NOT NULL CONSTRAINT ck_material_substitutions_description CHECK(length(btrim(candidate_description)) BETWEEN 1 AND 200),
 candidate_manufacturer text NOT NULL CONSTRAINT ck_material_substitutions_manufacturer CHECK(length(btrim(candidate_manufacturer)) BETWEEN 1 AND 120),
 candidate_revision text NOT NULL CONSTRAINT ck_material_substitutions_revision CHECK(length(btrim(candidate_revision)) BETWEEN 1 AND 40),
 candidate_item_key text CONSTRAINT ck_material_substitutions_item_key CHECK(length(btrim(candidate_item_key)) BETWEEN 1 AND 80),
 reason text NOT NULL CONSTRAINT ck_material_substitutions_reason CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 scope_quantity numeric(18,6) NOT NULL CONSTRAINT ck_material_substitutions_quantity CHECK(scope_quantity>0),
 criteria jsonb NOT NULL CONSTRAINT ck_material_substitutions_criteria CHECK(jsonb_typeof(criteria)='array' AND jsonb_array_length(criteria) BETWEEN 1 AND 20),
 impacts jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_material_substitutions_impacts CHECK(jsonb_typeof(impacts)='array' AND jsonb_array_length(impacts)<=12),
 state text NOT NULL DEFAULT 'Draft' CONSTRAINT ck_material_substitutions_state CHECK(state IN ('Draft','Submitted','Returned','Held','Rejected','Accepted')),
 proposer_id uuid NOT NULL, submitted_hash text CHECK(submitted_hash ~ '^[a-f0-9]{64}$'), submitted_at timestamptz,
 decided_by uuid, decided_at timestamptz, decision_rationale text CONSTRAINT ck_material_substitutions_rationale CHECK(length(btrim(decision_rationale)) BETWEEN 1 AND 2000),
 decision_owner_id uuid, decision_due date, policy_id uuid, policy_version integer,
 commercial_state text NOT NULL DEFAULT 'NotAssessed' CONSTRAINT ck_material_substitutions_commercial CHECK(commercial_state IN ('NotAssessed','DecisionNeeded','Decided','NoEffectConfirmed')),
 commercial_note text CONSTRAINT ck_material_substitutions_commercial_note CHECK(length(btrim(commercial_note)) BETWEEN 1 AND 1000),
 commercial_owner_id uuid, commercial_decided_by uuid, commercial_decided_at timestamptz, commercial_source_id uuid,
 predecessor_id uuid, adopted_at timestamptz, adopted_by uuid, adopted_content_revision integer,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id),
 CONSTRAINT ck_material_substitutions_submitted CHECK((state='Draft')=(submitted_hash IS NULL) AND (submitted_hash IS NULL)=(submitted_at IS NULL)),
 CONSTRAINT ck_material_substitutions_decided CHECK((state IN ('Returned','Held','Rejected','Accepted'))=(decided_by IS NOT NULL) AND num_nonnulls(decided_by,decided_at,decision_rationale,policy_id,policy_version) IN (0,5)),
 -- Independence is also a database fact: nobody decides their own proposal.
 CONSTRAINT ck_material_substitutions_independent CHECK(decided_by IS DISTINCT FROM proposer_id),
 CONSTRAINT ck_material_substitutions_adopted CHECK(adopted_at IS NULL OR (state='Accepted' AND adopted_by IS NOT NULL AND adopted_content_revision IS NOT NULL)),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,set_id) REFERENCES ppo.material_sets(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,line_id) REFERENCES ppo.material_lines(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,predecessor_id) REFERENCES ppo.material_substitutions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,commercial_source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,proposer_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,decided_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,decision_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,commercial_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,commercial_decided_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,adopted_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.material_substitutions FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('MaterialSubstitution','');
CREATE TRIGGER substitution_retained BEFORE DELETE ON ppo.material_substitutions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX ix_material_substitutions_line ON ppo.material_substitutions(workspace_id,line_id,created_at);

-- Versioned fictional review and release policy. It names actors; a role label or a capability alone
-- grants nothing, and no row means "Authority not configured". Rows are immutable: a change is a new version.
CREATE TABLE ppo.material_policies (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid,
 policy_version integer NOT NULL CONSTRAINT ck_material_policies_version CHECK(policy_version>0),
 effective_from timestamptz NOT NULL, allow_reviewer_release_overlap boolean NOT NULL DEFAULT false,
 grants jsonb NOT NULL CONSTRAINT ck_material_policies_grants CHECK(jsonb_typeof(grants)='array' AND jsonb_array_length(grants)<=40),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), CONSTRAINT uq_material_policies_version UNIQUE(workspace_id,company_id,policy_version),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id)
);
CREATE TRIGGER policy_immutable BEFORE UPDATE OR DELETE ON ppo.material_policies FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

-- A release freezes its manifest when it is prepared. Review, authorisation and issue are separate
-- operations by separate people; issue is separate again from any later distribution (DK-03).
CREATE TABLE ppo.material_releases (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, set_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CONSTRAINT ck_material_releases_version CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 release_number integer NOT NULL CONSTRAINT ck_material_releases_number CHECK(release_number>0), set_revision integer NOT NULL CHECK(set_revision>0),
 purpose text NOT NULL CONSTRAINT ck_material_releases_purpose CHECK(purpose IN ('TechnicalReleaseForProcurement','InformationOnly')),
 audience text NOT NULL CONSTRAINT ck_material_releases_audience CHECK(length(btrim(audience)) BETWEEN 1 AND 200),
 manifest jsonb NOT NULL CONSTRAINT ck_material_releases_manifest CHECK(jsonb_typeof(manifest)='object'),
 content_hash text NOT NULL CONSTRAINT ck_material_releases_hash CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 review_state text NOT NULL DEFAULT 'Draft' CONSTRAINT ck_material_releases_review CHECK(review_state IN ('Draft','Submitted','Returned','Held','TechnicallyReviewed','Cancelled')),
 issue_state text NOT NULL DEFAULT 'Prepared' CONSTRAINT ck_material_releases_issue CHECK(issue_state IN ('Prepared','Authorised','Issued')),
 prepared_by uuid NOT NULL, submitted_at timestamptz,
 reviewed_by uuid, reviewed_at timestamptz, review_rationale text CONSTRAINT ck_material_releases_rationale CHECK(length(btrim(review_rationale)) BETWEEN 1 AND 2000),
 review_owner_id uuid, review_due date, policy_id uuid, policy_version integer,
 authorised_by uuid, authorised_at timestamptz, authorised_hash text CHECK(authorised_hash ~ '^[a-f0-9]{64}$'),
 issued_by uuid, issued_at timestamptz, issue_operation_id uuid,
 predecessor_id uuid, superseded_by uuid, withdrawn_at timestamptz, withdrawn_by uuid,
 withdrawn_reason text CONSTRAINT ck_material_releases_withdrawn_reason CHECK(length(btrim(withdrawn_reason)) BETWEEN 1 AND 1000),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), CONSTRAINT uq_material_releases_number UNIQUE(workspace_id,set_id,release_number),
 -- One direction only: a reviewed set that is later cancelled keeps the name of its reviewer.
 CONSTRAINT ck_material_releases_reviewed CHECK((review_state NOT IN ('Returned','Held','TechnicallyReviewed') OR reviewed_by IS NOT NULL) AND num_nonnulls(reviewed_by,reviewed_at,review_rationale,policy_id,policy_version) IN (0,5)),
 CONSTRAINT ck_material_releases_independent CHECK(reviewed_by IS DISTINCT FROM prepared_by),
 CONSTRAINT ck_material_releases_authorised CHECK((issue_state IN ('Authorised','Issued'))=(authorised_by IS NOT NULL) AND (authorised_by IS NULL OR (review_state IN ('TechnicallyReviewed','Cancelled') AND authorised_hash=content_hash AND authorised_at IS NOT NULL AND authorised_by<>prepared_by))),
 CONSTRAINT ck_material_releases_issued CHECK((issue_state='Issued')=(issued_by IS NOT NULL) AND num_nonnulls(issued_by,issued_at,issue_operation_id) IN (0,3)),
 CONSTRAINT ck_material_releases_withdrawn CHECK(num_nonnulls(withdrawn_at,withdrawn_by,withdrawn_reason) IN (0,3) AND (withdrawn_at IS NULL OR issue_state='Issued')),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,set_id) REFERENCES ppo.material_sets(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,predecessor_id) REFERENCES ppo.material_releases(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,superseded_by) REFERENCES ppo.material_releases(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,policy_id) REFERENCES ppo.material_policies(workspace_id,id),
 FOREIGN KEY(workspace_id,prepared_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,reviewed_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,review_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,authorised_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,issued_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,withdrawn_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
ALTER TABLE ppo.material_substitutions ADD CONSTRAINT fk_material_substitutions_policy FOREIGN KEY(workspace_id,policy_id) REFERENCES ppo.material_policies(workspace_id,id);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.material_releases FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('MaterialRelease','');
CREATE TRIGGER release_retained BEFORE DELETE ON ppo.material_releases FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
-- The queryable half of the manifest: which exact line content and quantity a release entitles.
CREATE TABLE ppo.material_release_lines (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, release_id uuid NOT NULL, line_id uuid NOT NULL,
 content_revision integer NOT NULL CHECK(content_revision>0), content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 quantity numeric(18,6) NOT NULL CONSTRAINT ck_material_release_lines_quantity CHECK(quantity>0),
 unit text NOT NULL CONSTRAINT ck_material_release_lines_unit CHECK(unit IN ('EA','PACK','M','L','KG')),
 CONSTRAINT pk_material_release_lines PRIMARY KEY(workspace_id,release_id,line_id),
 FOREIGN KEY(workspace_id,company_id,release_id) REFERENCES ppo.material_releases(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,line_id) REFERENCES ppo.material_lines(workspace_id,company_id,id)
);
CREATE TRIGGER release_line_immutable BEFORE UPDATE OR DELETE ON ppo.material_release_lines FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX ix_material_release_lines_line ON ppo.material_release_lines(workspace_id,line_id);
CREATE FUNCTION ppo.protect_material_release() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Advance the release version' USING ERRCODE='55000'; END IF;
 IF (NEW.company_id,NEW.set_id,NEW.release_number,NEW.set_revision,NEW.purpose,NEW.audience,NEW.manifest,NEW.content_hash,NEW.prepared_by,NEW.predecessor_id)
  IS DISTINCT FROM (OLD.company_id,OLD.set_id,OLD.release_number,OLD.set_revision,OLD.purpose,OLD.audience,OLD.manifest,OLD.content_hash,OLD.prepared_by,OLD.predecessor_id) THEN
  RAISE EXCEPTION 'The frozen release content is permanent' USING ERRCODE='55000'; END IF;
 -- After issue only current use may change, and each of those facts is recorded once.
 IF OLD.issue_state='Issued' AND ((NEW.review_state,NEW.issue_state,NEW.reviewed_by,NEW.authorised_by,NEW.authorised_hash,NEW.issued_by,NEW.issued_at,NEW.issue_operation_id)
  IS DISTINCT FROM (OLD.review_state,OLD.issue_state,OLD.reviewed_by,OLD.authorised_by,OLD.authorised_hash,OLD.issued_by,OLD.issued_at,OLD.issue_operation_id)
  OR (OLD.withdrawn_at IS NOT NULL AND (NEW.withdrawn_at,NEW.withdrawn_by,NEW.withdrawn_reason) IS DISTINCT FROM (OLD.withdrawn_at,OLD.withdrawn_by,OLD.withdrawn_reason))
  OR (OLD.superseded_by IS NOT NULL AND NEW.superseded_by IS DISTINCT FROM OLD.superseded_by)) THEN
  RAISE EXCEPTION 'An issued release is immutable' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER release_guards BEFORE UPDATE ON ppo.material_releases FOR EACH ROW EXECUTE FUNCTION ppo.protect_material_release();
-- Technical-release accounting, not an inventory ledger: the active issued entitlements of a line never
-- exceed its requirement, whatever the application believed when it asked.
CREATE FUNCTION ppo.check_material_allocation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.issue_state='Issued' AND NEW.withdrawn_at IS NULL AND NEW.superseded_by IS NULL AND EXISTS(
  SELECT 1 FROM ppo.material_release_lines mine JOIN ppo.material_lines l ON (l.workspace_id,l.id)=(mine.workspace_id,mine.line_id)
  WHERE (mine.workspace_id,mine.release_id)=(NEW.workspace_id,NEW.id) AND l.quantity<(
   SELECT sum(x.quantity) FROM ppo.material_release_lines x JOIN ppo.material_releases r ON (r.workspace_id,r.id)=(x.workspace_id,x.release_id)
   WHERE (x.workspace_id,x.line_id)=(mine.workspace_id,mine.line_id) AND r.issue_state='Issued' AND r.withdrawn_at IS NULL AND r.superseded_by IS NULL))
 THEN RAISE EXCEPTION 'Active technical releases exceed the material requirement' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER release_allocation AFTER UPDATE ON ppo.material_releases DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_material_allocation();

-- One receiving package per exact release and receiving context. It is not a requisition or a purchase
-- order. The receiver accepts or returns the whole exact payload; a returned payload is retained
-- unchanged and correction is a new revision.
CREATE TABLE ppo.material_handovers (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, set_id uuid NOT NULL, release_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CONSTRAINT ck_material_handovers_version CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 revision integer NOT NULL CONSTRAINT ck_material_handovers_revision CHECK(revision>0), predecessor_id uuid,
 requested_action text NOT NULL CONSTRAINT ck_material_handovers_action CHECK(requested_action IN ('ProcurementReady','ForecastOnly')),
 demand_basis text NOT NULL CONSTRAINT ck_material_handovers_basis CHECK(demand_basis IN ('Forecast','Approved')),
 demand_source_id uuid, receiver_id uuid NOT NULL, coordinator_id uuid NOT NULL,
 required_by date CONSTRAINT ck_material_handovers_required_by CHECK(required_by BETWEEN DATE '0001-01-01' AND DATE '9998-12-31'),
 required_by_timezone text CONSTRAINT ck_material_handovers_timezone CHECK(length(btrim(required_by_timezone)) BETWEEN 1 AND 80),
 receiving_schema_version integer NOT NULL DEFAULT 1 CHECK(receiving_schema_version=1),
 payload jsonb NOT NULL CONSTRAINT ck_material_handovers_payload CHECK(jsonb_typeof(payload)='object'),
 payload_hash text NOT NULL CONSTRAINT ck_material_handovers_hash CHECK(payload_hash ~ '^[a-f0-9]{64}$'),
 state text NOT NULL DEFAULT 'Prepared' CONSTRAINT ck_material_handovers_state CHECK(state IN ('Prepared','AwaitingReceiver','Accepted','Returned')),
 sent_at timestamptz, decided_by uuid, decided_at timestamptz, outcome_operation_id uuid,
 decision_reasons jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_material_handovers_reasons CHECK(jsonb_typeof(decision_reasons)='array' AND jsonb_array_length(decision_reasons)<=40),
 return_owner_id uuid, return_due date,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), CONSTRAINT uq_material_handovers_revision UNIQUE(workspace_id,release_id,revision),
 -- Approved demand is never inferred from a technical release: it needs its own named evidence.
 CONSTRAINT ck_material_handovers_demand CHECK((demand_basis='Approved')=(demand_source_id IS NOT NULL) AND (requested_action<>'ProcurementReady' OR demand_basis='Approved')),
 CONSTRAINT ck_material_handovers_date CHECK((required_by IS NULL)=(required_by_timezone IS NULL)),
 CONSTRAINT ck_material_handovers_decided CHECK((state IN ('Accepted','Returned'))=(decided_by IS NOT NULL) AND num_nonnulls(decided_by,decided_at,outcome_operation_id) IN (0,3)),
 CONSTRAINT ck_material_handovers_returned CHECK(state<>'Returned' OR (jsonb_array_length(decision_reasons)>0 AND return_owner_id IS NOT NULL AND return_due IS NOT NULL)),
 CONSTRAINT ck_material_handovers_independent CHECK(decided_by IS DISTINCT FROM created_by),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,set_id) REFERENCES ppo.material_sets(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,release_id) REFERENCES ppo.material_releases(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,predecessor_id) REFERENCES ppo.material_handovers(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,demand_source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,receiver_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,coordinator_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,decided_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,return_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.material_handovers FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('MaterialHandover','');
CREATE TRIGGER handover_retained BEFORE DELETE ON ppo.material_handovers FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.protect_material_handover() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Advance the handover version' USING ERRCODE='55000'; END IF;
 IF (NEW.company_id,NEW.set_id,NEW.release_id,NEW.revision,NEW.predecessor_id,NEW.requested_action,NEW.demand_basis,NEW.demand_source_id,NEW.receiver_id,NEW.coordinator_id,NEW.required_by,NEW.required_by_timezone,NEW.payload,NEW.payload_hash)
  IS DISTINCT FROM (OLD.company_id,OLD.set_id,OLD.release_id,OLD.revision,OLD.predecessor_id,OLD.requested_action,OLD.demand_basis,OLD.demand_source_id,OLD.receiver_id,OLD.coordinator_id,OLD.required_by,OLD.required_by_timezone,OLD.payload,OLD.payload_hash)
  OR OLD.state IN ('Accepted','Returned') THEN
  RAISE EXCEPTION 'A receiving payload and its recorded outcome are permanent' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER handover_guards BEFORE UPDATE ON ppo.material_handovers FOR EACH ROW EXECUTE FUNCTION ppo.protect_material_handover();

-- An owned follow-up raised when a source changes, or a release is withdrawn, after something already
-- relied on it. It records who must look and what they found. It never claims a recall, cancellation or
-- reversal happened.
CREATE TABLE ppo.material_impacts (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, set_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CONSTRAINT ck_material_impacts_version CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 source_id uuid, release_id uuid, change text NOT NULL CONSTRAINT ck_material_impacts_change CHECK(change IN ('Superseded','Withdrawn')),
 affected jsonb NOT NULL CONSTRAINT ck_material_impacts_affected CHECK(jsonb_typeof(affected)='object'),
 owner_id uuid NOT NULL, required_action text NOT NULL CONSTRAINT ck_material_impacts_action CHECK(length(btrim(required_action)) BETWEEN 1 AND 1000),
 state text NOT NULL DEFAULT 'Open' CONSTRAINT ck_material_impacts_state CHECK(state IN ('Open','Resolved')),
 resolution text CONSTRAINT ck_material_impacts_resolution CHECK(length(btrim(resolution)) BETWEEN 1 AND 2000), resolved_by uuid, resolved_at timestamptz,
 UNIQUE(workspace_id,id), CONSTRAINT uq_material_impacts_source UNIQUE(workspace_id,set_id,source_id), CONSTRAINT uq_material_impacts_release UNIQUE(workspace_id,set_id,release_id),
 CONSTRAINT ck_material_impacts_cause CHECK(num_nonnulls(source_id,release_id)=1 AND (release_id IS NULL OR change='Withdrawn')),
 CONSTRAINT ck_material_impacts_resolved CHECK((state='Resolved')=(resolved_by IS NOT NULL) AND num_nonnulls(resolution,resolved_by,resolved_at) IN (0,3)),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,set_id) REFERENCES ppo.material_sets(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,release_id) REFERENCES ppo.material_releases(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,resolved_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.material_impacts FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('MaterialImpact','');
CREATE TRIGGER impact_retained BEFORE DELETE ON ppo.material_impacts FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

-- Append-only history for every subject in the module, written in the same transaction as the change.
CREATE TABLE ppo.material_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, package_id uuid NOT NULL, set_id uuid,
 subject_type text NOT NULL CONSTRAINT ck_material_events_subject CHECK(subject_type IN ('MaterialSet','MaterialSource','MaterialLine','MaterialSubstitution','MaterialRelease','MaterialHandover','MaterialImpact')),
 subject_id uuid NOT NULL, subject_version integer NOT NULL CHECK(subject_version>0),
 event_type text NOT NULL CONSTRAINT ck_material_events_type CHECK(event_type ~ '^[A-Z][A-Za-z]{2,59}$'),
 reason text NOT NULL CONSTRAINT ck_material_events_reason CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 note text CONSTRAINT ck_material_events_note CHECK(length(btrim(note)) BETWEEN 1 AND 2000),
 snapshot jsonb NOT NULL, operation_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,package_id) REFERENCES ppo.engineering_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,set_id) REFERENCES ppo.material_sets(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER event_immutable BEFORE UPDATE OR DELETE ON ppo.material_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX ix_material_events_package ON ppo.material_events(workspace_id,package_id,created_at DESC,id);
CREATE INDEX ix_material_events_subject ON ppo.material_events(workspace_id,subject_id,created_at DESC);
