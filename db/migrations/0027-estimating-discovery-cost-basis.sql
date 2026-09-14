-- ADR-0027: exact Discovery basis for new option estimates. No E1 backfill.
CREATE TABLE ppo.estimate_discovery_roots (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, estimate_id uuid NOT NULL,
 estimating_workspace_id uuid NOT NULL, option_id uuid NOT NULL, initial_revision_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,estimate_id), UNIQUE(workspace_id,option_id),
 FOREIGN KEY(workspace_id,company_id,estimate_id) REFERENCES ppo.estimates(workspace_id,company_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(workspace_id,company_id,estimating_workspace_id) REFERENCES ppo.estimating_workspaces(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimating_workspace_id,option_id) REFERENCES ppo.estimating_options(workspace_id,estimating_workspace_id,id),
 FOREIGN KEY(workspace_id,option_id,initial_revision_id) REFERENCES ppo.estimation_revisions(workspace_id,option_id,id)
);
CREATE TABLE ppo.estimate_discovery_bases (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, estimate_id uuid NOT NULL,
 estimate_version_id uuid NOT NULL, revision_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,estimate_version_id),
 FOREIGN KEY(workspace_id,estimate_id) REFERENCES ppo.estimate_discovery_roots(workspace_id,estimate_id),
 FOREIGN KEY(workspace_id,company_id,estimate_version_id) REFERENCES ppo.estimate_versions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimate_id,estimate_version_id) REFERENCES ppo.estimate_versions(workspace_id,estimate_id,id),
 FOREIGN KEY(workspace_id,revision_id) REFERENCES ppo.estimation_revisions(workspace_id,id)
);
CREATE TRIGGER retain_discovery_root BEFORE UPDATE OR DELETE ON ppo.estimate_discovery_roots FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER retain_cost_basis BEFORE UPDATE OR DELETE ON ppo.estimate_discovery_bases FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX ix_estimate_discovery_bases ON ppo.estimate_discovery_bases(workspace_id,estimate_id,revision_id);

-- Keep one estimate per option. A legacy estimate remains the exact A identity.
ALTER TABLE ppo.estimates DROP CONSTRAINT estimates_workspace_id_opportunity_id_key;
CREATE INDEX ix_estimate_opportunity ON ppo.estimates(workspace_id,opportunity_id,created_at,id);

CREATE FUNCTION ppo.check_estimate_discovery_graph() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.estimates; root ppo.estimate_discovery_roots; g ppo.estimating_workspaces; initial ppo.estimation_revisions; target uuid;
BEGIN
 IF TG_TABLE_NAME='estimates' THEN target:=NEW.id; ELSE target:=NEW.estimate_id; END IF;
 SELECT * INTO root FROM ppo.estimate_discovery_roots WHERE workspace_id=NEW.workspace_id AND estimate_id=target;
 IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT * INTO STRICT e FROM ppo.estimates WHERE workspace_id=root.workspace_id AND id=root.estimate_id;
 SELECT * INTO STRICT g FROM ppo.estimating_workspaces WHERE workspace_id=root.workspace_id AND id=root.estimating_workspace_id;
 SELECT * INTO STRICT initial FROM ppo.estimation_revisions WHERE workspace_id=root.workspace_id AND id=root.initial_revision_id;
 IF TG_TABLE_NAME='estimate_discovery_bases' THEN
 IF NOT EXISTS(
   SELECT 1 FROM ppo.estimate_versions v JOIN ppo.estimate_discovery_bases old
     ON (old.workspace_id,old.estimate_version_id)=(v.workspace_id,v.predecessor_id)
     WHERE v.workspace_id=NEW.workspace_id AND v.id=NEW.estimate_version_id AND old.revision_id=NEW.revision_id)
   AND NOT EXISTS(SELECT 1 FROM ppo.estimating_options o WHERE o.workspace_id=g.workspace_id AND o.id=root.option_id
     AND o.id=g.selected_option_id AND o.current_revision_id=NEW.revision_id AND o.state='Active') THEN
   RAISE EXCEPTION 'New discovery adoption requires the exact current selected option' USING ERRCODE='23514';
 END IF;
 END IF;
 IF (e.company_id,e.opportunity_id,e.owner_id,e.option_id,e.estimation_revision_id,e.site_id)
   IS DISTINCT FROM (g.company_id,g.opportunity_id,g.owner_id,root.option_id,root.initial_revision_id,initial.site_id)
   OR initial.kind<>'Discovery' OR initial.scope_readiness<>'Complete' OR g.legacy_estimate_id=e.id
   OR e.version<>(SELECT count(*) FROM ppo.estimate_versions WHERE workspace_id=e.workspace_id AND estimate_id=e.id)
   OR e.version<>(SELECT max(version) FROM ppo.estimate_versions WHERE workspace_id=e.workspace_id AND estimate_id=e.id)
   OR NOT EXISTS(SELECT 1 FROM ppo.estimate_versions v JOIN ppo.estimate_discovery_bases b
     ON (b.workspace_id,b.estimate_version_id)=(v.workspace_id,v.id)
     WHERE v.workspace_id=e.workspace_id AND v.estimate_id=e.id AND v.version=1 AND b.revision_id=root.initial_revision_id)
   OR EXISTS(SELECT 1 FROM ppo.estimate_versions v
     LEFT JOIN ppo.estimate_discovery_bases b ON (b.workspace_id,b.estimate_version_id)=(v.workspace_id,v.id)
     LEFT JOIN ppo.estimation_revisions r ON (r.workspace_id,r.id)=(b.workspace_id,b.revision_id)
     WHERE v.workspace_id=e.workspace_id AND v.estimate_id=e.id AND
       (b.estimate_version_id IS NULL OR r.kind<>'Discovery' OR r.scope_readiness<>'Complete'
        OR (r.company_id,r.estimating_workspace_id,r.option_id) IS DISTINCT FROM (e.company_id,g.id,e.option_id))) THEN
   RAISE EXCEPTION 'Retain an exact complete Discovery basis for every bound cost version' USING ERRCODE='23514';
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER exact_discovery_basis AFTER INSERT ON ppo.estimate_discovery_roots DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_estimate_discovery_graph();
CREATE CONSTRAINT TRIGGER exact_discovery_basis AFTER INSERT ON ppo.estimate_discovery_bases DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_estimate_discovery_graph();
CREATE CONSTRAINT TRIGGER exact_discovery_basis AFTER INSERT ON ppo.estimate_versions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_estimate_discovery_graph();
CREATE CONSTRAINT TRIGGER exact_discovery_basis AFTER INSERT OR UPDATE ON ppo.estimates DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_estimate_discovery_graph();

CREATE OR REPLACE FUNCTION ppo.check_estimate_graph() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE v ppo.estimate_versions; BEGIN
 SELECT * INTO STRICT v FROM ppo.estimate_versions WHERE workspace_id=NEW.workspace_id AND id=NEW.current_version_id;
 IF v.version<>NEW.version OR v.created_by<>NEW.updated_by OR
  (NOT EXISTS(SELECT 1 FROM ppo.estimate_discovery_roots WHERE workspace_id=NEW.workspace_id AND estimate_id=NEW.id)
   AND NOT EXISTS(SELECT 1 FROM ppo.opportunities o WHERE o.workspace_id=NEW.workspace_id AND o.id=NEW.opportunity_id AND o.site_id IS NOT DISTINCT FROM NEW.site_id)) THEN
 RAISE EXCEPTION 'Exact estimate version/context required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE OR REPLACE FUNCTION ppo.materialise_new_legacy_estimate() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.estimate_discovery_roots WHERE workspace_id=NEW.workspace_id AND estimate_id=NEW.id) THEN
  PERFORM ppo.materialise_legacy_estimate(NEW);
 END IF;
 RETURN NULL;
END $$;
CREATE OR REPLACE FUNCTION ppo.guard_e1_discovery_state() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.estimates; g ppo.estimating_workspaces;
BEGIN
 IF TG_TABLE_NAME='estimates' THEN e:=NEW;
 ELSE SELECT * INTO STRICT e FROM ppo.estimates WHERE workspace_id=NEW.workspace_id AND id=NEW.estimate_id; END IF;
 SELECT * INTO g FROM ppo.estimating_workspaces WHERE workspace_id=e.workspace_id AND opportunity_id=e.opportunity_id;
 IF NOT FOUND THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='estimates' AND TG_OP='INSERT' AND NOT EXISTS(
  SELECT 1 FROM ppo.estimate_discovery_roots WHERE workspace_id=e.workspace_id AND estimate_id=e.id
   AND estimating_workspace_id=g.id AND option_id=e.option_id AND initial_revision_id=e.estimation_revision_id) THEN
  RAISE EXCEPTION 'An estimating workspace already exists for this opportunity' USING ERRCODE='23505'; END IF;
 PERFORM ppo.assert_estimating_group_draft(g.id);
 IF NOT EXISTS(SELECT 1 FROM ppo.estimating_options WHERE workspace_id=e.workspace_id AND estimating_workspace_id=g.id AND id=e.option_id AND state='Active') THEN
  RAISE EXCEPTION 'Only an active option can author new commercial content' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
