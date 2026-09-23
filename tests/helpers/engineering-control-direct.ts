import { AppError } from "../../src/platform/errors";
import { controlCommand } from "../../src/engineering/control/commands";
import { controlRead } from "../../src/engineering/control/reads";
import {
  directSignIn as materialsSignIn,
  principalOf,
} from "./engineering-materials-direct";
import type { SignIn } from "./engineering-materials";
export { principalOf };
export const directSignIn: SignIn = async (profile) => {
  const p = await principalOf(profile),
    base = await materialsSignIn(profile);
  return async (target, body) => {
    const [path, search = ""] = target.split("?"),
      m = /^engineering\/([^/]+)\/control$/.exec(path);
    if (!m) return base(target, body);
    try {
      if (body === undefined)
        return {
          status: 200,
          body: await controlRead(
            p,
            m[1],
            Object.fromEntries(new URLSearchParams(search)),
          ),
        };
      const result = await controlCommand(p, m[1], body);
      return { status: result.replayed ? 200 : 201, body: result.receipt };
    } catch (e) {
      if (e instanceof AppError)
        return {
          status: e.status,
          body: {
            code: e.code,
            message: e.message,
            field_errors: e.field_errors,
          },
        };
      throw e;
    }
  };
};
