import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { invalid, uuid } from "../shared/validation";

// Process-local signing follows the existing shared register cursor contract.
// A restart expires continuations; it never changes document or review evidence.
const secret = randomBytes(32);
export type LibraryPosition = { id: string; key: string };
const sign = (body: string) => createHmac("sha256", secret).update(body).digest("base64url");
export function libraryCursor(binding: unknown) {
  const basis = JSON.stringify(binding);
  return {
    encode(position: LibraryPosition) {
      const body = Buffer.from(JSON.stringify({ basis, position })).toString("base64url");
      return `${body}.${sign(body)}`;
    },
    decode(value: string | undefined): LibraryPosition | null {
      if (value === undefined) return null;
      try {
        if (value.length > 6000) throw Error();
        const [body, signature, extra] = value.split(".");
        const expected = sign(body);
        if (extra || !signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw Error();
        const decoded = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
        if (decoded.basis !== basis || typeof decoded.position?.key !== "string") throw Error();
        return { id: uuid(decoded.position.id, "cursor"), key: decoded.position.key };
      } catch {
        return invalid("cursor", "This continuation expired or its scope, filters or sorting changed. Refresh the register.");
      }
    },
  };
}
