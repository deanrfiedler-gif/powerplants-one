-- Increment A stage catalogue, once under seed receipt 21. Issue #143.
-- A new immutable definition row; the I1 definition and its two stage rows are untouched.
-- No opportunity, Activity or grant is invented here. The application read path still
-- binds to the I1 definition until the separate code cutover.
INSERT INTO ppo.crm_pipeline_definitions(id,workspace_id,created_by,updated_by,label,definition_key)
VALUES('c1000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','Fictional sales pipeline','SyntheticFiveStage');
INSERT INTO ppo.crm_stage_definitions(workspace_id,pipeline_definition_id,stage_id,ordinal) VALUES
('10000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000002','Discovery',1),
('10000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000002','Scoping',2),
('10000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000002','Quoting',3),
('10000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000002','Negotiation',4),
('10000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000002','Closing',5);
