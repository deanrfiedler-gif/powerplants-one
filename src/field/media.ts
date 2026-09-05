import { inflateSync } from "node:zlib";
import { AppError } from "../platform/errors";
const rejected = (): never => {
  throw new AppError(
    422,
    "UnsupportedImage",
    "Choose a valid non-interlaced 8-bit RGB or RGBA PNG, up to 4 MiB, 4096 pixels per side and 12 million pixels. Embedded metadata and animation are not supported.",
  );
};
function crc(bytes: Uint8Array) {
  let value = 0xffffffff;
  for (const b of bytes) {
    value ^= b;
    for (let i = 0; i < 8; i++)
      value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  }
  return (value ^ 0xffffffff) >>> 0;
}
export function inspectPng(bytes: Buffer) {
  if (
    bytes.length < 45 ||
    bytes.length > 4194304 ||
    !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    rejected();
  let offset = 8,
    width = 0,
    height = 0,
    channels = 0,
    seenHeader = false,
    seenData = false,
    ended = false;
  const chunks: Buffer[] = [];
  const ancillary = new Set<string>();
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) rejected();
    const n = bytes.readUInt32BE(offset),
      end = offset + 12 + n;
    if (end > bytes.length) rejected();
    const type = bytes.toString("latin1", offset + 4, offset + 8),
      data = bytes.subarray(offset + 8, offset + 8 + n);
    if (
      crc(bytes.subarray(offset + 4, offset + 8 + n)) !==
      bytes.readUInt32BE(offset + 8 + n)
    )
      rejected();
    if (type === "IHDR") {
      if (seenHeader || offset !== 8 || n !== 13) rejected();
      seenHeader = true;
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      channels = data[9] === 2 ? 3 : data[9] === 6 ? 4 : 0;
      if (
        !width ||
        !height ||
        width > 4096 ||
        height > 4096 ||
        width * height > 12000000 ||
        data[8] !== 8 ||
        !channels ||
        data[10] !== 0 ||
        data[11] !== 0 ||
        data[12] !== 0
      )
        rejected();
    } else if (type === "IDAT") {
      if (!seenHeader || !n) rejected();
      seenData = true;
      chunks.push(data);
    } else if (type === "IEND") {
      if (!seenData || n !== 0 || end !== bytes.length) rejected();
      ended = true;
    } else {
      if (!seenHeader || seenData || ancillary.has(type) || !["sRGB", "gAMA", "cHRM", "pHYs"].includes(type))
        rejected();
      ancillary.add(type);
      const lengths: Record<string, number> = {
        sRGB: 1,
        gAMA: 4,
        cHRM: 32,
        pHYs: 9,
      };
      if (n !== lengths[type]) rejected();
      if ((type === "sRGB" && data[0] > 3) || (type === "gAMA" && data.readUInt32BE(0) === 0) || (type === "pHYs" && data[8] > 1)) rejected();
    }
    offset = end;
  }
  if (!ended) rejected();
  const stride = width * channels + 1;
  let scan: Buffer;
  try {
    scan = inflateSync(Buffer.concat(chunks), {
      maxOutputLength: stride * height,
    });
  } catch {
    rejected();
  }
  if (scan!.length !== stride * height) rejected();
  for (let y = 0; y < height; y++) if (scan![y * stride] > 4) rejected();
  return { width, height, media_type: "image/png" as const };
}
