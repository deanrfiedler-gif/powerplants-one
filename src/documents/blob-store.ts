import { createHash } from "node:crypto";
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import type { AdapterContext, DocumentKey, DocumentStoreAdapter } from "../adapters/contracts";
import { demoConfig } from "../platform/demo-config";
import { AppError } from "../platform/errors";

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const unavailable = () => new AppError(503, "ExactDocumentUnavailable", "The exact draft is unavailable. Ask the demo owner to recover it.");

export class DemoBlobStore implements DocumentStoreAdapter {
  private readonly container;
  constructor() {
    const c = demoConfig();
    this.container = new BlobServiceClient(`https://${c.blob_account}.blob.core.windows.net`,
      new StorageSharedKeyCredential(c.blob_account, c.blob_key),
      { retryOptions: { maxTries: 2, tryTimeoutInMs: 10000 } }).getContainerClient(c.blob_container);
  }
  private blob(context: AdapterContext) {
    if (!uuid.test(context.workspace_id) || !uuid.test(context.operation_id)) throw unavailable();
    return this.container.getBlockBlobClient(`${context.workspace_id}/${context.operation_id}`);
  }
  async locate(context: AdapterContext): Promise<{ key: DocumentKey; bytes: Buffer } | null> {
    try {
      const blob = this.blob(context), properties = await blob.getProperties();
      if (!properties.contentLength || properties.contentLength > 20_000_000 || !properties.etag) throw unavailable();
      const bytes = await blob.downloadToBuffer(0, properties.contentLength, { conditions: { ifMatch: properties.etag } });
      const hash = digest(bytes);
      if (properties.metadata?.sha256 !== hash) throw unavailable();
      return { key: { provider: "Synthetic", tenant_id: null, site_id: null, drive_id: null,
        item_id: context.operation_id, version_id: hash, sha256: hash }, bytes };
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) return null;
      throw unavailable();
    }
  }
  async read(context: AdapterContext, key: DocumentKey): Promise<Uint8Array> {
    if (key.provider !== "Synthetic" || key.tenant_id || key.site_id || key.drive_id || key.version_id !== key.sha256) throw unavailable();
    const found = await this.locate({ ...context, operation_id: key.item_id });
    if (!found || found.key.sha256 !== key.sha256) throw unavailable();
    return found.bytes;
  }
  async store(context: AdapterContext, content: Uint8Array, sha256: string): Promise<DocumentKey> {
    if (!content.byteLength || content.byteLength > 20_000_000 || digest(content) !== sha256) throw unavailable();
    try {
      await this.blob(context).uploadData(content, { conditions: { ifNoneMatch: "*" }, metadata: { sha256 },
        blobHTTPHeaders: { blobContentType: "application/octet-stream", blobCacheControl: "private, no-store" } });
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode !== 412 && (error as { statusCode?: number }).statusCode !== 409) throw unavailable();
    }
    const found = await this.locate(context);
    if (!found || found.key.sha256 !== sha256) throw new AppError(409, "StoredOperationConflict", "This storage operation already retains different exact bytes.");
    return found.key;
  }
}
