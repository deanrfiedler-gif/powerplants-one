-- AU-02 / NR-18: the company a person has chosen to work in. No row means every company their
-- grants reach. Access checks narrow to the chosen company and never widen: a grant is still required.
CREATE TABLE ppo.working_companies (
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  chosen_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (workspace_id, user_id),
  FOREIGN KEY (workspace_id, user_id) REFERENCES ppo.users(workspace_id, id),
  FOREIGN KEY (workspace_id, company_id) REFERENCES ppo.companies(workspace_id, id)
);
