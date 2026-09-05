import type {
  AdapterContext,
  CommandOutcome,
  DocumentKey,
  DocumentStoreAdapter,
  DistributionAdapter,
  ErpCommandAdapter,
  ErpReadAdapter,
  ExternalKey,
  Observation,
} from "./contracts";
export class SyntheticErpReadAdapter implements ErpReadAdapter {
  async read(_context: AdapterContext, key: ExternalKey): Promise<Observation> {
    if (key.provider !== "Synthetic")
      throw new Error("Only synthetic provider keys are supported.");
    return {
      key,
      observed_at: new Date().toISOString(),
      source_as_at: null,
      completeness: "Unknown",
      synthetic: true,
      data: { availability: "NotImplemented" },
    };
  }
}
export class SyntheticErpCommandAdapter implements ErpCommandAdapter {
  async execute(
    _context: AdapterContext,
    key: ExternalKey,
    _command: Readonly<Record<string, unknown>>,
  ): Promise<CommandOutcome> {
    if (key.provider !== "Synthetic")
      throw new Error("Live ERP commands are disabled.");
    return {
      outcome: "NotProcessed",
      synthetic: true,
      reason: "P01 stub: no external or financial effect.",
    };
  }
}
export class SyntheticDocumentStoreAdapter implements DocumentStoreAdapter {
  async read(_context: AdapterContext, _key: DocumentKey): Promise<Uint8Array> {
    throw new Error(
      "P01 stub: document storage is not implemented; no content available.",
    );
  }
  async store(
    _context: AdapterContext,
    _content: Uint8Array,
    _sha256: string,
  ): Promise<DocumentKey> {
    throw new Error(
      "P01 stub: no durable file storage or issued document outcome.",
    );
  }
}
export class SyntheticDistributionAdapter implements DistributionAdapter {
  async prepare(
    _context: AdapterContext,
    document: DocumentKey,
    _recipient_ref: string,
  ): Promise<{ state: "Prepared"; synthetic: true; delivered: false }> {
    if (document.provider !== "Synthetic")
      throw new Error("Live distribution is disabled.");
    return { state: "Prepared", synthetic: true, delivered: false };
  }
}
