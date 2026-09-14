import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  copyFile,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import pg from "pg";
import { localConfig } from "../src/platform/config";
import { migrationFiles } from "./migration-registry";

// Private operator tooling. Never expose a backup/profile through an HTTP route.
const execute = promisify(execFile);
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
const fail = (message: string): never => {
  throw Error(message);
};
export type RecoveryBackend = "native" | "docker";
export type FileRecord = { path: string; bytes: number; sha256: string };
export type Fingerprint = {
  tables: { name: string; rows: number; sha256: string }[];
  sequences: { name: string; last_value: string; is_called: boolean }[];
  structure_sha256: string;
  migrations: { version: number; sha256: string }[];
};
export type Checkpoint = {
  format: 1;
  id: string;
  created_at: string;
  completed_at: string;
  source: {
    endpoint: string;
    system_identifier: string;
    server_version: string;
  };
  release: {
    commit: string;
    tree: string;
    node: string;
    tracked_changes: boolean;
  };
  database: Fingerprint;
  dump: FileRecord;
  roots: {
    kind: "documents" | "profile";
    source: string;
    files: FileRecord[];
  }[];
  quiescence: "application-worker-browser-stopped";
};

export function recoveryConnection(url: string) {
  const config = localConfig({ ...process.env, DATABASE_URL: url });
  if (config.database_name !== "ppo_synthetic_test")
    fail("Recovery requires the existing disposable test database name.");
  const u = new URL(config.database_url);
  const port = Number(u.port || "5432");
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    fail("Invalid recovery database port.");
  return {
    url: config.database_url,
    endpoint: `127.0.0.1:${port}/${config.database_name}`,
    env: {
      PGHOST: "127.0.0.1",
      PGPORT: String(port),
      PGDATABASE: config.database_name,
      PGUSER: decodeURIComponent(u.username),
      PGPASSWORD: decodeURIComponent(u.password),
      PGCONNECT_TIMEOUT: "5",
      PGAPPNAME: "PPO-P12-client",
    },
  };
}

export function distinctPaths(paths: string[]) {
  const absolute = paths.map((p) => resolve(p));
  const descendant = (path: string) =>
    path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path);
  for (let a = 0; a < absolute.length; a++)
    for (let b = a + 1; b < absolute.length; b++) {
      const r = relative(absolute[a], absolute[b]),
        back = relative(absolute[b], absolute[a]);
      if (
        !r ||
        descendant(r) ||
        descendant(back)
      )
        fail(
          "Recovery source, checkpoint and destination paths must be separate.",
        );
    }
}

export async function privatePath(path: string, existing: boolean) {
  if (!isAbsolute(path) || resolve(path) === parse(path).root)
    fail("An absolute private directory is required.");
  path = resolve(path);
  // Resolve every existing ancestor; neither symlinks nor any Git checkout are backup locations.
  let at = path;
  while (true) {
    try {
      const st = await lstat(at);
      if (
        !st.isDirectory() ||
        st.isSymbolicLink() ||
        (await realpath(at)) !== at
      )
        fail("Unsafe recovery directory.");
      try {
        await lstat(join(at, ".git"));
        fail("Recovery data must stay outside Git.");
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      }
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
    if (dirname(at) === at) break;
    at = dirname(at);
  }
  if (existing) {
    const st = await lstat(path);
    if ((st.mode & 0o077) !== 0)
      fail("Recovery directories require private owner-only permissions.");
  }
  return path;
}

function safeRelative(path: string) {
  if (
    !path ||
    isAbsolute(path) ||
    path.includes("\\") ||
    path.split("/").some((p) => !p || p === "." || p === "..")
  )
    fail("Unsafe checkpoint member path.");
  return path;
}

export async function fileRecord(
  path: string,
  name: string,
): Promise<FileRecord> {
  const before = await lstat(path);
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1)
    fail("Checkpoint members must be independent regular files.");
  const h = createHash("sha256");
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const opened = await handle.stat();
    if (opened.ino !== before.ino || opened.dev !== before.dev)
      fail("Checkpoint member was replaced.");
    for await (const chunk of handle.createReadStream({ autoClose: false }))
      h.update(chunk);
  } finally {
    await handle.close();
  }
  const after = await lstat(path);
  if (
    before.ino !== after.ino ||
    before.size !== after.size ||
    before.mtimeMs !== after.mtimeMs ||
    before.ctimeMs !== after.ctimeMs
  )
    fail("A checkpoint member changed during inspection.");
  return {
    path: safeRelative(name),
    bytes: before.size,
    sha256: h.digest("hex"),
  };
}

export async function inventory(root: string): Promise<FileRecord[]> {
  const result: FileRecord[] = [];
  async function visit(path: string, prefix: string) {
    const st = await lstat(path);
    if (!st.isDirectory() || st.isSymbolicLink())
      fail("Unsafe checkpoint directory.");
    for (const name of (await readdir(path)).sort()) {
      const child = join(path, name),
        key = prefix ? `${prefix}/${name}` : name;
      const s = await lstat(child);
      if (s.isSymbolicLink())
        fail(
          "Close the browser and remove no originals: a symlink or browser lock prevents checkpointing.",
        );
      if (s.isDirectory()) await visit(child, key);
      else result.push(await fileRecord(child, key));
    }
  }
  await visit(root, "");
  return result;
}

async function copyMembers(
  source: string,
  target: string,
  files: FileRecord[],
) {
  await mkdir(target, { mode: 0o700 });
  for (const f of files) {
    const src = join(source, safeRelative(f.path)),
      dest = join(target, f.path);
    if (!same(await fileRecord(src, f.path), f))
      fail("Checkpoint source bytes changed or are missing.");
    await mkdir(dirname(dest), { recursive: true, mode: 0o700 });
    await copyFile(src, dest, constants.COPYFILE_EXCL);
    const handle = await open(dest, "r+");
    try {
      await handle.chmod(0o600);
      await handle.sync();
    } finally {
      await handle.close();
    }
    if (!same(await fileRecord(dest, f.path), f))
      fail("Copied checkpoint bytes do not match.");
  }
  if (
    !same(await inventory(source), files) ||
    !same(await inventory(target), files)
  )
    fail("Checkpoint membership changed.");
}

async function clientFor(url: string) {
  const c = new pg.Client({
    connectionString: recoveryConnection(url).url,
    application_name: "PPO-P12-control",
    connectionTimeoutMillis: 5000,
  });
  await c.connect();
  await c.query("SET timezone='UTC'");
  await c.query("SET datestyle='ISO, YMD'");
  return c;
}

async function syncDirectoryTree(path: string) {
  for (const child of await readdir(path, { withFileTypes: true }))
    if (child.isDirectory()) await syncDirectoryTree(join(path, child.name));
  const handle = await open(path, "r");
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}
async function identity(c: pg.Client) {
  const r = (
    await c.query("SELECT system_identifier::text FROM pg_control_system()")
  ).rows[0];
  const v = (await c.query("SHOW server_version")).rows[0]
    .server_version as string;
  if (!/^16\./.test(v)) fail("P12 requires the selected PostgreSQL 16 engine.");
  return {
    system_identifier: r.system_identifier as string,
    server_version: v,
  };
}
async function noOtherClients(c: pg.Client) {
  // Do not reuse a statistics snapshot from an earlier check in this transaction.
  await c.query("SELECT pg_stat_clear_snapshot()");
  const r = await c.query(
    "SELECT count(*)::int n FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid() AND backend_type='client backend'",
  );
  if (r.rows[0].n !== 0)
    fail(
      "Stop the source application, worker and other database clients before recovery.",
    );
}
const relationQuery =
  "SELECT n.nspname schema,c.relname name,c.relkind kind FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname !~ '^pg_' AND n.nspname<>'information_schema' AND c.relkind IN ('r','p','S') ORDER BY n.nspname,c.relname";
async function compatible(migrations: Fingerprint["migrations"]) {
  const expected = await Promise.all(
    migrationFiles.map(async (f) => ({
      version: Number(f.slice(0, 4)),
      sha256: digest(
        await readFile(
          new URL(`../db/migrations/${f}`, import.meta.url),
          "utf8",
        ),
      ),
    })),
  );
  if (
    !migrations.length ||
    !same(migrations, expected.slice(0, migrations.length))
  )
    fail(
      "Checkpoint migration ledger is incompatible with this code; retain originals and select a compatible release.",
    );
}
export async function fingerprint(c: pg.Client): Promise<Fingerprint> {
  const tables: Fingerprint["tables"] = [],
    sequences: Fingerprint["sequences"] = [];
  const relations = (await c.query(relationQuery)).rows;
  for (const r of relations) {
    const name = `${quote(r.schema)}.${quote(r.name)}`;
    if (r.kind === "S") {
      const s = (
        await c.query(`SELECT last_value::text,is_called FROM ${name}`)
      ).rows[0];
      sequences.push({
        name,
        last_value: s.last_value,
        is_called: s.is_called,
      });
    } else {
      const h = createHash("sha256");
      let rows = 0;
      await c.query(
        `DECLARE p12_rows NO SCROLL CURSOR FOR SELECT to_jsonb(t)::text value FROM ONLY ${name} t ORDER BY to_jsonb(t)::text COLLATE "C"`,
      );
      try {
        while (true) {
          const batch = await c.query("FETCH 1000 FROM p12_rows");
          if (!batch.rowCount) break;
          for (const row of batch.rows) {
            const value = row.value as string;
            h.update(`${Buffer.byteLength(value)}:`);
            h.update(value);
            rows++;
          }
        }
      } finally {
        await c.query("CLOSE p12_rows");
      }
      tables.push({ name, rows, sha256: h.digest("hex") });
    }
  }
  const structure: unknown[] = [];
  // Definition-only comparisons deliberately omit cluster OIDs and restore ownership.
  for (const query of [
    "SELECT table_schema,table_name,column_name,ordinal_position,column_default,is_nullable,data_type,udt_schema,udt_name,is_identity,identity_generation,is_generated,generation_expression FROM information_schema.columns WHERE table_schema !~ '^pg_' AND table_schema<>'information_schema' ORDER BY table_schema,table_name,ordinal_position",
    "SELECT n.nspname,c.relname,k.conname,pg_get_constraintdef(k.oid,true) definition,k.convalidated FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname !~ '^pg_' ORDER BY 1,2,3",
    "SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes WHERE schemaname !~ '^pg_' ORDER BY 1,2,3",
    "SELECT n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) arguments,pg_get_functiondef(p.oid) definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname !~ '^pg_' AND n.nspname<>'information_schema' AND p.prokind IN ('f','p') ORDER BY 1,2,3",
    "SELECT n.nspname,c.relname,t.tgname,t.tgenabled,pg_get_triggerdef(t.oid,true) definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE NOT t.tgisinternal AND n.nspname !~ '^pg_' ORDER BY 1,2,3",
    "SELECT schemaname,viewname,definition FROM pg_views WHERE schemaname !~ '^pg_' AND schemaname<>'information_schema' ORDER BY 1,2",
    "SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname !~ '^pg_' ORDER BY 1,2,3",
  ])
    structure.push((await c.query(query)).rows);
  const migrations = (
    await c.query(
      "SELECT version,sha256 FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  await compatible(migrations);
  return {
    tables,
    sequences,
    structure_sha256: digest(JSON.stringify(structure)),
    migrations,
  };
}

async function pgTool(
  tool: "pg_dump" | "pg_restore",
  args: string[],
  url: string,
  directory: string,
  backend: RecoveryBackend,
) {
  const connection = recoveryConnection(url);
  const env = { ...process.env, ...connection.env };
  let command: string = tool,
    prefix: string[] = [];
  if (backend === "docker") {
    if (/[:,\n\r]/.test(directory))
      fail("Unsupported container checkpoint path.");
    command = "docker";
    prefix = [
      "run",
      "--rm",
      "--network",
      "host",
      "--user",
      `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`,
      ...Object.keys(connection.env).flatMap((key) => ["--env", key]),
      "--mount",
      `type=bind,source=${directory},target=/checkpoint`,
      "postgres:16.15",
      tool,
    ];
  }
  try {
    const version = await execute(command, [...prefix, "--version"], {
      env,
      timeout: 120000,
    });
    if (!/\(PostgreSQL\) 16\./.test(version.stdout))
      fail("Matching PostgreSQL 16 client tools are required.");
    await execute(command, [...prefix, ...args], {
      env,
      timeout: 600000,
      maxBuffer: 1024 * 1024,
    });
  } catch {
    fail(
      `PostgreSQL ${tool} failed; source and checkpoint are retained. No raw connection or SQL details are logged.`,
    );
  }
}

export async function createCheckpoint(options: {
  sourceUrl: string;
  directory: string;
  documents: string;
  profile?: string;
  stopped: boolean;
  backend?: RecoveryBackend;
}): Promise<Checkpoint> {
  if (!options.stopped)
    fail(
      "Explicit stopped application, worker and closed browser acknowledgement is required.",
    );
  const endpoint = recoveryConnection(options.sourceUrl).endpoint;
  const roots: Checkpoint["roots"] = [
    { kind: "documents", source: options.documents, files: [] },
  ];
  if (options.profile)
    roots.push({ kind: "profile", source: options.profile, files: [] });
  distinctPaths([options.directory, ...roots.map((r) => r.source)]);
  const directory = await privatePath(options.directory, false);
  for (const r of roots) {
    r.source = await privatePath(r.source, true);
    r.files = await inventory(r.source);
  }
  const c = await clientFor(options.sourceUrl);
  try {
    await noOtherClients(c);
    const source = { endpoint, ...(await identity(c)) };
    await c.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
    await c.query("SET LOCAL lock_timeout='5s'");
    await c.query("SELECT pg_advisory_xact_lock(10001)");
    const relations = (await c.query(relationQuery)).rows.filter(
      (r) => r.kind !== "S",
    );
    for (const r of relations)
      await c.query(
        `LOCK TABLE ${quote(r.schema)}.${quote(r.name)} IN SHARE MODE`,
      );
    await noOtherClients(c);
    const snapshotPoint = (
      await c.query(
        "SELECT pg_export_snapshot() snapshot,clock_timestamp() captured_at",
      )
    ).rows[0];
    const snapshot = snapshotPoint.snapshot as string;
    const database = await fingerprint(c);
    await mkdir(directory, { mode: 0o700 }); // Exclusive: never replace a prior checkpoint.
    const created_at = (snapshotPoint.captured_at as Date).toISOString();
    await pgTool(
      "pg_dump",
      [
        "--format=custom",
        "--no-owner",
        "--no-acl",
        `--snapshot=${snapshot}`,
        "--file",
        options.backend === "docker"
          ? "/checkpoint/database.dump"
          : join(directory, "database.dump"),
      ],
      options.sourceUrl,
      directory,
      options.backend ?? "native",
    );
    const dumpHandle = await open(join(directory, "database.dump"), "r+");
    try {
      await dumpHandle.chmod(0o600);
      await dumpHandle.sync();
    } finally {
      await dumpHandle.close();
    }
    for (const r of roots)
      await copyMembers(r.source, join(directory, r.kind), r.files);
    await noOtherClients(c);
    if (!same(await fingerprint(c), database))
      fail("Source database changed during checkpoint.");
    const release = {
      commit: (await execute("git", ["rev-parse", "HEAD"])).stdout.trim(),
      tree: (await execute("git", ["rev-parse", "HEAD^{tree}"])).stdout.trim(),
      node: process.version,
      tracked_changes: Boolean(
        (
          await execute("git", [
            "status",
            "--porcelain",
            "--untracked-files=no",
          ])
        ).stdout.trim(),
      ),
    };
    const manifest: Checkpoint = {
      format: 1,
      id: randomUUID(),
      created_at,
      completed_at: new Date().toISOString(),
      source,
      release,
      database,
      dump: await fileRecord(join(directory, "database.dump"), "database.dump"),
      roots,
      quiescence: "application-worker-browser-stopped",
    };
    await writeFile(
      join(directory, "checkpoint.json"),
      JSON.stringify(manifest, null, 2) + "\n",
      { flag: "wx", mode: 0o600 },
    );
    const handle = await open(join(directory, "checkpoint.json"), "r+");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
    await syncDirectoryTree(directory);
    const parentHandle = await open(dirname(directory), "r");
    try {
      await parentHandle.sync();
    } finally {
      await parentHandle.close();
    }
    await c.query("COMMIT");
    return manifest;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    await c.end();
  }
}

export async function inspectCheckpoint(
  directory: string,
): Promise<Checkpoint> {
  await privatePath(directory, true);
  await fileRecord(join(directory, "checkpoint.json"), "checkpoint.json");
  const m = JSON.parse(
    await readFile(join(directory, "checkpoint.json"), "utf8"),
  ) as Checkpoint;
  if (
    m.format !== 1 ||
    m.quiescence !== "application-worker-browser-stopped" ||
    !Array.isArray(m.roots) ||
    !m.roots.some((r) => r.kind === "documents") ||
    new Set(m.roots.map((r) => r.kind)).size !== m.roots.length ||
    m.roots.some((r) => !["documents", "profile"].includes(r.kind)) ||
    m.dump.path !== "database.dump"
  )
    fail("Unsupported or incomplete checkpoint manifest.");
  await compatible(m.database.migrations);
  if (
    !same(
      await fileRecord(join(directory, "database.dump"), "database.dump"),
      m.dump,
    )
  )
    fail("Database archive hash or size mismatch.");
  for (const r of m.roots)
    if (!same(await inventory(join(directory, r.kind)), r.files))
      fail("Original file/profile membership, hash or size mismatch.");
  return m;
}

export async function restoreCheckpoint(options: {
  directory: string;
  targetUrl: string;
  documents: string;
  profile?: string;
  stopped: boolean;
  backend?: RecoveryBackend;
}) {
  if (!options.stopped)
    fail(
      "The destination application, worker and browser must remain stopped.",
    );
  const started = Date.now(),
    m = await inspectCheckpoint(options.directory);
  const target = recoveryConnection(options.targetUrl);
  if (target.endpoint === m.source.endpoint)
    fail("Restore cannot target the original endpoint.");
  if (Boolean(options.profile) !== m.roots.some((r) => r.kind === "profile"))
    fail("Restore must include exactly the checkpoint's selected profile.");
  const destinations = [
    options.documents,
    ...(options.profile ? [options.profile] : []),
  ];
  distinctPaths([
    options.directory,
    ...m.roots.map((r) => r.source),
    ...destinations,
  ]);
  for (const d of destinations) {
    await privatePath(d, false);
    try {
      await lstat(d);
      fail("Restore file destinations must be fresh and absent.");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
  }
  const c = await clientFor(options.targetUrl);
  try {
    const id = await identity(c);
    if (id.system_identifier === m.source.system_identifier)
      fail("Restore requires a different PostgreSQL instance.");
    await noOtherClients(c);
    const objects = (
      await c.query(
        "SELECT count(*)::int n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname !~ '^pg_' AND n.nspname<>'information_schema'",
      )
    ).rows[0].n;
    const schemas = (
      await c.query(
        "SELECT count(*)::int n FROM pg_namespace WHERE nspname !~ '^pg_' AND nspname NOT IN ('information_schema','public')",
      )
    ).rows[0].n;
    const routines = (
      await c.query(
        "SELECT count(*)::int n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname !~ '^pg_' AND n.nspname<>'information_schema'",
      )
    ).rows[0].n;
    const types = (
      await c.query(
        "SELECT count(*)::int n FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname !~ '^pg_' AND n.nspname<>'information_schema'",
      )
    ).rows[0].n;
    if (objects || schemas || routines || types)
      fail("Restore destination is not empty; no objects were removed.");
    await pgTool(
      "pg_restore",
      [
        "--exit-on-error",
        "--single-transaction",
        "--no-owner",
        "--no-acl",
        "--dbname",
        "ppo_synthetic_test",
        options.backend === "docker"
          ? "/checkpoint/database.dump"
          : join(options.directory, "database.dump"),
      ],
      options.targetUrl,
      options.directory,
      options.backend ?? "native",
    );
    await noOtherClients(c);
    await c.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const restored = await fingerprint(c);
    if (!same(restored, m.database))
      fail(
        "Restored database fingerprint differs; keep all workers stopped and retain both instances.",
      );
    for (const r of m.roots)
      await copyMembers(
        join(options.directory, r.kind),
        r.kind === "documents" ? options.documents : options.profile!,
        r.files,
      );
    for (const path of destinations) {
      await syncDirectoryTree(path);
      const parent = await open(dirname(path), "r");
      try {
        await parent.sync();
      } finally {
        await parent.close();
      }
    }
    await c.query("COMMIT");
    return {
      checkpoint_id: m.id,
      restored_at: new Date().toISOString(),
      restore_duration_ms: Date.now() - started,
      checkpoint_age_at_restore_ms: started - Date.parse(m.created_at),
      target: { endpoint: target.endpoint, ...id },
      tables: restored.tables.length,
      rows: restored.tables.reduce((n, t) => n + t.rows, 0),
      files: m.roots.reduce((n, r) => n + r.files.length, 0),
      exact_database_and_file_comparison: true,
      workers_started: false,
      outbound_enabled: false,
    };
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    await c.end();
  }
}
