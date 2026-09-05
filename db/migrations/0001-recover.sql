-- Only run through db:reset with both explicit disposal flags. Disposable synthetic data only.
DROP SCHEMA IF EXISTS ppo_proof CASCADE;
DROP SCHEMA IF EXISTS ppo CASCADE;
-- Leave btree_gist installed: it may have other database dependants.
