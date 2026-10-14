import { EXCEL_CAPACITY } from "./capacity";
import { crc32 } from "node:zlib";
import { fromBufferPromise } from "yauzl";

export const WORKBOOK_LIMITS = Object.freeze({
  compressed: 5 * 1024 * 1024,
  expanded: 20 * 1024 * 1024,
  entries: 256,
  xmlDepth: 64,
  lines: EXCEL_CAPACITY.lines,
});

export class WorkbookRejected extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkbookRejected";
  }
}
export function refuse(message: string): never {
  throw new WorkbookRejected(message);
}

function directory(bytes: Buffer) {
  if (bytes.length < 22 || bytes.readUInt32LE(0) !== 0x04034b50)
    refuse("Use an unencrypted, macro-free .xlsx workbook.");
  let end = -1;
  for (
    let at = bytes.length - 22;
    at >= Math.max(0, bytes.length - 65557);
    at--
  ) {
    if (
      bytes.readUInt32LE(at) === 0x06054b50 &&
      at + 22 + bytes.readUInt16LE(at + 20) === bytes.length
    ) {
      end = at;
      break;
    }
  }
  if (end < 0) refuse("The workbook archive is truncated or unsupported.");
  const count = bytes.readUInt16LE(end + 10),
    start = bytes.readUInt32LE(end + 16);
  if (
    bytes.readUInt16LE(end + 4) ||
    bytes.readUInt16LE(end + 6) ||
    bytes.readUInt16LE(end + 8) !== count ||
    start + bytes.readUInt32LE(end + 12) !== end
  )
    refuse("Multipart, ZIP64 and damaged workbook archives are unsupported.");
  if (!count || count > WORKBOOK_LIMITS.entries)
    refuse("The workbook must contain at most 256 archive parts.");
  return { count, start };
}

/** No filesystem extraction. All accepted entries are bounded and CRC checked. */
export async function workbookArchive(bytes: Buffer, filename: string) {
  if (!/\.xlsx$/i.test(filename) || /[\x00-\x1f]/.test(filename))
    refuse("Use a macro-free .xlsx workbook filename.");
  if (bytes.length > WORKBOOK_LIMITS.compressed)
    refuse("The workbook exceeds the 5 MiB compressed limit.");
  const index = directory(bytes);
  try {
    const zip = await fromBufferPromise(bytes, {
      lazyEntries: true,
      decodeStrings: true,
      strictFileNames: true,
      validateEntrySizes: true,
    });
    const parts = new Map<string, Buffer>(),
      names = new Set<string>(),
      ranges: [number, number][] = [];
    let total = 0,
      count = 0;
    try {
      if (zip.entryCount !== index.count)
        refuse("The workbook archive index is inconsistent.");
      for await (const entry of zip.eachEntry()) {
        const name = entry.fileName;
        if (++count > WORKBOOK_LIMITS.entries || names.has(name.toLowerCase()))
          refuse("Duplicate or excessive workbook archive parts.");
        names.add(name.toLowerCase());
        if (
          !name ||
          /[\\%:#?\x00-\x1f]/.test(name) ||
          name.startsWith("/") ||
          name
            .split("/")
            .some(
              (p, i, a) =>
                p === "." || p === ".." || (!p && i !== a.length - 1),
            )
        )
          refuse("Unsupported workbook archive path.");
        if (!Buffer.from(name, "utf8").equals(entry.fileNameRaw))
          refuse("Use canonical UTF-8 workbook archive paths.");
        if (
          entry.generalPurposeBitFlag & ~0x080e ||
          ![0, 8].includes(entry.compressionMethod) ||
          entry.extraFields.some(
            (field) => field.id === 1 || field.id === 0x7075,
          )
        )
          refuse("Encrypted, ZIP64 or unsupported workbook archive content.");
        if (
          !Number.isSafeInteger(entry.uncompressedSize) ||
          entry.uncompressedSize < 0 ||
          total + entry.uncompressedSize > WORKBOOK_LIMITS.expanded
        )
          refuse("The workbook exceeds the 20 MiB expanded limit.");
        const local = await zip.readLocalFileHeaderPromise(entry);
        if (
          !local.fileName.equals(entry.fileNameRaw) ||
          local.compressionMethod !== entry.compressionMethod ||
          local.generalPurposeBitFlag !== entry.generalPurposeBitFlag
        )
          refuse("A workbook part disagrees with its archive index.");
        for (const key of [
          "crc32",
          "compressedSize",
          "uncompressedSize",
        ] as const) {
          if (
            local[key] !== entry[key] &&
            (!(entry.generalPurposeBitFlag & 8) || local[key] !== 0)
          )
            refuse(
              "A workbook part has inconsistent size or checksum metadata.",
            );
        }
        let end = local.fileDataStart + entry.compressedSize;
        if (entry.generalPurposeBitFlag & 8) {
          let descriptor = end;
          if (
            descriptor + 4 <= bytes.length &&
            bytes.readUInt32LE(descriptor) === 0x08074b50
          )
            descriptor += 4;
          if (
            descriptor + 12 > index.start ||
            bytes.readUInt32LE(descriptor) !== entry.crc32 ||
            bytes.readUInt32LE(descriptor + 4) !== entry.compressedSize ||
            bytes.readUInt32LE(descriptor + 8) !== entry.uncompressedSize
          )
            refuse("A workbook data descriptor is damaged.");
          end = descriptor + 12;
        }
        const start = entry.relativeOffsetOfLocalHeader;
        if (
          start < 0 ||
          local.fileDataStart < start + 30 ||
          end > index.start ||
          ranges.some(([a, b]) => start < b && end > a)
        )
          refuse("Workbook archive parts overlap or exceed their bounds.");
        ranges.push([start, end]);
        const stream = await zip.openReadStreamPromise(entry),
          chunks: Buffer[] = [];
        let actual = 0,
          checksum = 0;
        try {
          for await (const chunk of stream) {
            const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            actual += data.length;
            total += data.length;
            if (
              actual > entry.uncompressedSize ||
              total > WORKBOOK_LIMITS.expanded
            )
              refuse("Expanded workbook content exceeds its declared limit.");
            checksum = crc32(data, checksum);
            chunks.push(data);
          }
        } finally {
          stream.destroy();
        }
        if (actual !== entry.uncompressedSize || checksum !== entry.crc32)
          refuse("A workbook part failed its size or checksum check.");
        if (name.endsWith("/")) {
          if (actual) refuse("Workbook directory entries must be empty.");
        } else parts.set(name, Buffer.concat(chunks, actual));
      }
      if (count !== index.count)
        refuse("The workbook archive index is incomplete.");
      return parts;
    } finally {
      zip.close();
    }
  } catch (error) {
    if (error instanceof WorkbookRejected) throw error;
    refuse(
      "The workbook archive is corrupt or uses an unsupported archive feature.",
    );
  }
}
