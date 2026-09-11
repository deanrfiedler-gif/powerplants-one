const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function demoConfig(env: Record<string, string | undefined> = process.env) {
  if (env.PPO_ENV !== "azure-demo" || env.PPO_EXPOSURE !== "https" ||
      env.PPO_IDENTITY !== "entra" || env.NODE_ENV !== "production")
    throw Error("Hosted demo requires explicit HTTPS, Entra identity and a compiled production runtime.");
  const origin = new URL(env.PPO_DEMO_ORIGIN ?? "");
  if (origin.protocol !== "https:" || !origin.hostname.endsWith(".azurecontainerapps.io") ||
      origin.port || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash)
    throw Error("Set the exact HTTPS Container Apps demo origin.");
  const db = new URL(env.DATABASE_URL ?? "");
  if (!["postgres:", "postgresql:"].includes(db.protocol) ||
      !/^[a-z0-9][a-z0-9-]+\.postgres\.database\.azure\.com$/.test(db.hostname) ||
      (db.port && db.port !== "5432") || !/^\/ppo_demo_[a-z0-9]{8,20}$/.test(db.pathname) ||
      !db.username || !db.password || db.search || db.hash)
    throw Error("Set an epoch-specific Azure PostgreSQL demo database without URL options.");
  if (!guid.test(env.PPO_ENTRA_TENANT_ID ?? "") || !guid.test(env.PPO_ENTRA_CLIENT_ID ?? "") ||
      (env.PPO_ENTRA_CLIENT_SECRET?.length ?? 0) < 16)
    throw Error("Configure the demo application Entra registration.");
  if (!/^[a-z][a-z0-9]{2,23}$/.test(env.PPO_BLOB_ACCOUNT ?? "") ||
      !/^ppo-demo-[a-z0-9]{8,20}$/.test(env.PPO_BLOB_CONTAINER ?? "") ||
      !env.PPO_BLOB_KEY || env.PPO_BLOB_CONTAINER!.slice(9) !== db.pathname.slice(10))
    throw Error("Configure private Blob storage for the same demo epoch as the database.");
  const port = Number(env.PPO_PORT ?? "3000");
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error("Invalid demo port.");
  return {
    port, origin: origin.origin, database_url: db.toString(), database_name: db.pathname.slice(1),
    tenant_id: env.PPO_ENTRA_TENANT_ID!.toLowerCase(), client_id: env.PPO_ENTRA_CLIENT_ID!,
    client_secret: env.PPO_ENTRA_CLIENT_SECRET!,
    blob_account: env.PPO_BLOB_ACCOUNT!, blob_container: env.PPO_BLOB_CONTAINER!, blob_key: env.PPO_BLOB_KEY!,
  };
}

export const isHostedDemo = () => process.env.PPO_ENV === "azure-demo";
