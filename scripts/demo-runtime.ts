import pg from "pg";

// Shared definitions must not import the operator CLI: it awaits upgrade loading.
export const demoWorkspace = "10000000-0000-4000-8000-000000000001";
export const demoCompany = "20000000-0000-4000-8000-000000000001";

export async function grantRuntimePrivileges(db: pg.PoolClient, databaseName: string, role: string) {
  const name = pg.escapeIdentifier(role);
  await db.query(`REVOKE ALL ON DATABASE ${pg.escapeIdentifier(databaseName)} FROM PUBLIC`);
  await db.query(`GRANT CONNECT ON DATABASE ${pg.escapeIdentifier(databaseName)} TO ${name}`);
  await db.query(`GRANT USAGE ON SCHEMA ppo TO ${name}`);
  await db.query(`GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA ppo TO ${name}`);
  await db.query(`GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA ppo TO ${name}`);
  await db.query(`REVOKE INSERT,UPDATE,DELETE ON ppo.users,ppo.permission_grants,ppo.demo_testers,ppo.seed_receipts FROM ${name}`);
  const roleProfiles = await db.query("SELECT to_regclass('ppo.demo_tester_roles') AS relation");
  if (roleProfiles.rows[0]?.relation)
    await db.query(`REVOKE INSERT,UPDATE,DELETE ON ppo.demo_tester_roles FROM ${name}`);
  const specialist = await db.query("SELECT to_regclass('ppo.specialist_policies') AS relation");
  if (specialist.rows[0]?.relation) await db.query(`REVOKE INSERT,UPDATE,DELETE ON ppo.specialist_definitions,ppo.specialist_policies FROM ${name}`);
  await db.query(`REVOKE CREATE ON SCHEMA public FROM PUBLIC`);
}
