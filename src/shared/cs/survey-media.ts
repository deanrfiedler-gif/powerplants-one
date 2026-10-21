import { AppError } from "../../platform/errors";
import { inspectPng } from "../../field/media";
const reject = (): never => {
  throw new AppError(
    422,
    "UnsupportedImage",
    "Choose a still JPG, PNG or WebP image up to 1 MiB. Images are limited to 4096 pixels per side and 12 million pixels.",
  );
};
function dimensions(width: number, height: number) {
  if (
    !width ||
    !height ||
    width > 4096 ||
    height > 4096 ||
    width * height > 12000000
  )
    reject();
}
/** Inspect bounded original containers; never re-encode or strip original bytes. */
export function inspectSurveyImage(
  bytes: Buffer,
  legacy = false,
): "image/png" | "image/jpeg" | "image/webp" {
  if (!bytes.length || bytes.length > (legacy ? 4194304 : 1048576)) reject();
  if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    inspectPng(bytes);
    return "image/png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2,
      frame = false,
      scan = false,
      ended = false;
    while (offset < bytes.length) {
      if (bytes[offset++] !== 0xff) reject();
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === 0xd9) {
        ended = offset === bytes.length;
        break;
      }
      if (
        marker === 0x00 ||
        marker === 0xd8 ||
        marker === undefined ||
        (marker >= 0xd0 && marker <= 0xd7)
      )
        reject();
      if (offset + 2 > bytes.length) reject();
      const length = bytes.readUInt16BE(offset);
      if (length < 2 || offset + length > bytes.length) reject();
      if ([0xc0, 0xc1, 0xc2].includes(marker)) {
        if (length < 8 || frame || bytes[offset + 2] !== 8) reject();
        dimensions(
          bytes.readUInt16BE(offset + 5),
          bytes.readUInt16BE(offset + 3),
        );
        frame = true;
      }
      offset += length;
      if (marker === 0xda) {
        if (!frame) reject();
        scan = true;
        while (offset < bytes.length) {
          if (bytes[offset] !== 0xff) {
            offset++;
            continue;
          }
          if (
            bytes[offset + 1] === 0 ||
            (bytes[offset + 1] >= 0xd0 && bytes[offset + 1] <= 0xd7)
          ) {
            offset += 2;
            continue;
          }
          break;
        }
      }
    }
    if (!frame || !scan || !ended) reject();
    return "image/jpeg";
  }
  if (
    bytes.length >= 20 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    if (bytes.readUInt32LE(4) + 8 !== bytes.length) reject();
    let offset = 12,
      frame = false;
    while (offset < bytes.length) {
      if (offset + 8 > bytes.length) reject();
      const type = bytes.toString("ascii", offset, offset + 4),
        size = bytes.readUInt32LE(offset + 4),
        start = offset + 8;
      if (start + size > bytes.length || ["ANIM", "ANMF"].includes(type))
        reject();
      if (type === "VP8X") {
        if (size !== 10 || bytes[start] & 2) reject();
        dimensions(
          1 + bytes.readUIntLE(start + 4, 3),
          1 + bytes.readUIntLE(start + 7, 3),
        );
      }
      if (type === "VP8 ") {
        if (
          frame ||
          size < 10 ||
          bytes[start] & 1 ||
          !bytes
            .subarray(start + 3, start + 6)
            .equals(Buffer.from([0x9d, 0x01, 0x2a]))
        )
          reject();
        dimensions(
          bytes.readUInt16LE(start + 6) & 0x3fff,
          bytes.readUInt16LE(start + 8) & 0x3fff,
        );
        frame = true;
      }
      if (type === "VP8L") {
        if (frame || size < 5 || bytes[start] !== 0x2f) reject();
        const bits = bytes.readUInt32LE(start + 1);
        if (bits >>> 29) reject();
        dimensions(1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff));
        frame = true;
      }
      offset = start + size + (size % 2);
    }
    if (!frame || offset !== bytes.length) reject();
    return "image/webp";
  }
  return reject();
}
