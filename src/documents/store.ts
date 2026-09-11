import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { mkdir, open, link, unlink, lstat, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve, isAbsolute, relative, join } from "node:path";
import type {
  AdapterContext,
  DocumentKey,
  DocumentStoreAdapter,
} from "../adapters/contracts";
import { AppError } from "../platform/errors";
import { isHostedDemo } from "../platform/demo-config";
import { DemoBlobStore } from "./blob-store";
export const digest = (bytes: string | Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
const uuidPattern =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const missing = () =>
  new AppError(
    503,
    "ExactDocumentUnavailable",
    "The exact document version is unavailable. Its original reference is retained; ask the preparation owner to recover it.",
  );
export class LocalSyntheticDocumentStore implements DocumentStoreAdapter {
  constructor(
    private directory = process.env.PPO_DOCUMENT_DIRECTORY ??
      join(homedir(), ".ppo-synthetic-documents"),
  ) {}
  private async folder(context: AdapterContext) {
    if (
      !isAbsolute(this.directory) ||
      !uuidPattern.test(context.workspace_id) ||
      !uuidPattern.test(context.operation_id)
    )
      throw missing();
    const root = resolve(this.directory),
      repo = await realpath(process.cwd());
    await mkdir(root, { recursive: true, mode: 0o700 });
    const stat = await lstat(root),
      actual = await realpath(root),
      rel = relative(repo, actual);
    if (
      stat.isSymbolicLink() ||
      actual !== root ||
      rel === "" ||
      (!rel.startsWith("..") && !isAbsolute(rel)) ||
      (process.platform !== "win32" && (stat.mode & 0o077) !== 0)
    )
      throw missing();
    const folder = join(root, context.workspace_id);
    await mkdir(folder, { recursive: true, mode: 0o700 });
    const child = await lstat(folder);
    if (
      child.isSymbolicLink() ||
      (process.platform !== "win32" && (child.mode & 0o077) !== 0)
    )
      throw missing();
    return folder;
  }
  async locate(
    context: AdapterContext,
  ): Promise<{ key: DocumentKey; bytes: Buffer } | null> {
    const path = join(await this.folder(context), context.operation_id);
    let handle;
    try {
      handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    } catch (e) {
      if ((e as { code?: string }).code === "ENOENT") return null;
      throw missing();
    }
    try {
      const stat = await handle.stat();
      if (!stat.isFile() || stat.size > 20_000_000) throw missing();
      const bytes = await handle.readFile();
      const hash = digest(bytes);
      return {
        key: {
          provider: "Synthetic",
          tenant_id: null,
          site_id: null,
          drive_id: null,
          item_id: context.operation_id,
          version_id: hash,
          sha256: hash,
        },
        bytes,
      };
    } finally {
      await handle.close();
    }
  }
  async read(context: AdapterContext, key: DocumentKey): Promise<Uint8Array> {
    if (
      key.provider !== "Synthetic" ||
      key.tenant_id ||
      key.site_id ||
      key.drive_id ||
      !uuidPattern.test(key.item_id) ||
      key.version_id !== key.sha256
    )
      throw missing();
    const value = await this.locate({ ...context, operation_id: key.item_id });
    if (!value || value.key.sha256 !== key.sha256) throw missing();
    return value.bytes;
  }
  async store(
    context: AdapterContext,
    content: Uint8Array,
    sha256: string,
  ): Promise<DocumentKey> {
    if (
      digest(content) !== sha256 ||
      content.byteLength < 1 ||
      content.byteLength > 20_000_000
    )
      throw missing();
    const folder = await this.folder(context),
      target = join(folder, context.operation_id),
      temp = join(folder, `${context.operation_id}.${randomUUID()}.tmp`);
    const existing = await this.locate(context);
    if (existing) {
      if (existing.key.sha256 !== sha256)
        throw new AppError(
          409,
          "StoredOperationConflict",
          "This storage operation already retains different exact bytes.",
        );
      return existing.key;
    }
    const handle = await open(temp, "wx", 0o600);
    try {
      await handle.writeFile(content);
      await handle.sync();
    } finally {
      await handle.close();
    }
    try {
      await link(temp, target);
    } catch (e) {
      if ((e as { code?: string }).code !== "EEXIST") throw e;
    } finally {
      await unlink(temp);
    }
    if (process.platform !== "win32") {
      const dir = await open(folder, "r");
      try {
        await dir.sync();
      } finally {
        await dir.close();
      }
    }
    const saved = await this.locate(context);
    if (!saved || saved.key.sha256 !== sha256)
      throw new AppError(
        409,
        "StoredOperationConflict",
        "An earlier storage result was retained. Recover the original operation.",
      );
    return saved.key;
  }
}
export const documentStore = () => isHostedDemo() ? new DemoBlobStore() : new LocalSyntheticDocumentStore();
