-- Live schema inspected for PT-02; fully migrated synthetic database.
-- ppo.erp_account_mappings / erp_account_mappings_mapping_status_check
-- CHECK ((mapping_status = ANY (ARRAY['Proposed'::text, 'Verified'::text, 'Disputed'::text, 'Inactive'::text])))
-- ppo.erp_account_mappings / erp_account_mappings_mapping_status_check1
-- CHECK ((mapping_status <> 'Verified'::text))
-- ppo.erp_account_mappings / erp_account_mappings_workspace_id_company_id_erp_connectio_fkey
-- FOREIGN KEY (workspace_id, company_id, erp_connection_id, erp_company_id) REFERENCES ppo.companies(workspace_id, id, erp_connection_id, erp_company_id)
-- ppo.erp_account_mappings / erp_account_mappings_workspace_id_company_id_fkey
-- FOREIGN KEY (workspace_id, company_id) REFERENCES ppo.companies(workspace_id, id)
-- ppo.erp_account_mappings / erp_account_mappings_workspace_id_company_id_organisation__fkey
-- FOREIGN KEY (workspace_id, company_id, organisation_id) REFERENCES ppo.organisations(workspace_id, company_id, id)
-- ppo.erp_account_mappings / erp_account_mappings_workspace_id_created_by_fkey
-- FOREIGN KEY (workspace_id, created_by) REFERENCES ppo.users(workspace_id, id)
-- ppo.erp_account_mappings / erp_account_mappings_workspace_id_fkey
-- FOREIGN KEY (workspace_id) REFERENCES ppo.workspaces(id)
-- ppo.erp_account_mappings / erp_account_mappings_workspace_id_id_fkey
-- FOREIGN KEY (workspace_id, id) REFERENCES ppo.business_identities(workspace_id, id)
-- ppo.erp_account_mappings / erp_account_mappings_workspace_id_updated_by_fkey
-- FOREIGN KEY (workspace_id, updated_by) REFERENCES ppo.users(workspace_id, id)
-- ppo.finance_accounts / finance_accounts_status_check
-- CHECK ((status = 'SyntheticVerified'::text))
-- ppo.finance_accounts / finance_accounts_workspace_id_company_id_mapping_id_fkey
-- FOREIGN KEY (workspace_id, company_id, mapping_id) REFERENCES ppo.erp_account_mappings(workspace_id, company_id, id)
-- ppo.finance_accounts / finance_accounts_workspace_id_company_id_organisation_id_fkey
-- FOREIGN KEY (workspace_id, company_id, organisation_id) REFERENCES ppo.organisations(workspace_id, company_id, id)
-- ppo.finance_accounts / finance_accounts_workspace_id_created_by_fkey
-- FOREIGN KEY (workspace_id, created_by) REFERENCES ppo.users(workspace_id, id)
-- ppo.finance_accounts / finance_accounts_workspace_id_id_current_run_id_fkey
-- FOREIGN KEY (workspace_id, id, current_run_id) REFERENCES ppo.finance_account_runs(workspace_id, account_id, id)
-- ppo.finance_accounts / finance_accounts_workspace_id_updated_by_fkey
-- FOREIGN KEY (workspace_id, updated_by) REFERENCES ppo.users(workspace_id, id)
-- ppo.finance_simulator_targets / finance_simulator_targets_status_check
-- CHECK ((status = ANY (ARRAY['Accepted'::text, 'Partial'::text])))
-- ppo.finance_simulator_targets / finance_simulator_targets_workspace_id_company_id_customer_fkey
-- FOREIGN KEY (workspace_id, company_id, customer_id, account_id) REFERENCES ppo.finance_accounts(workspace_id, company_id, organisation_id, id)
-- ppo.finance_simulator_targets / finance_simulator_targets_workspace_id_handoff_id_attempt__fkey
-- FOREIGN KEY (workspace_id, handoff_id, attempt_id) REFERENCES ppo.finance_processing_attempts(workspace_id, handoff_id, id)
CREATE OR REPLACE FUNCTION ppo.protect_finance_account()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$ BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-ARRAY['version','current_run_id','updated_by','updated_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['version','current_run_id','updated_by','updated_at']) OR NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Synthetic account context is immutable' USING ERRCODE='55000'; END IF;RETURN NEW;END $function$

CREATE OR REPLACE FUNCTION ppo.immutable_evidence()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN RAISE EXCEPTION 'Accepted evidence is append-only' USING ERRCODE='55000'; END $function$
