// Server/CLI only. Git tracks saved commits; the workspace may contain later edits.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { FileHistory } from "./model";

const execute = promisify(execFile);
const repository = "https://github.com/deanrfiedler-gif/powerplants-one";
export const repositoryLink = (path: string, ref: string, history = false) =>
  `${repository}/${history ? "commits" : "blob"}/${encodeURIComponent(ref)}/${path.split("/").map(encodeURIComponent).join("/")}`;

export async function fileHistories(root: string, paths: string[]) {
  const unique = [...new Set(paths)];
  const fallback = (path: string): FileHistory => ({
    path,
    checkout_commit: null,
    last_changed_at: null,
    last_commit: null,
    state: "History unavailable",
    history_url: null,
    source_url: null,
  });
  const result = new Map(unique.map((path) => [path, fallback(path)]));
  const git = async (args: string[]) =>
    (
      await execute("git", args, {
        cwd: root,
        encoding: "utf8",
        timeout: 15000,
        maxBuffer: 16 * 1024 * 1024,
        windowsHide: true,
      })
    ).stdout;
  try {
    // One traversal for the library, rather than a Git process for every page.
    const results = await Promise.allSettled([
      git(["rev-parse", "HEAD"]),
      git([
        "-c",
        "core.quotepath=false",
        "log",
        "--format=%x1e%H%x09%cI",
        "--name-only",
        "--",
        "docs",
        "reference",
        "src",
        "public",
      ]),
      git([
        "diff",
        "--name-only",
        "-z",
        "HEAD",
        "--",
        "docs",
        "reference",
        "src",
        "public",
      ]),
      git([
        "ls-files",
        "--others",
        "--exclude-standard",
        "-z",
        "--",
        "docs",
        "reference",
        "src",
        "public",
      ]),
    ]);
    const failure = results.find((result) => result.status === "rejected");
    if (failure) throw failure.reason;
    const [head, log, changed, untracked] = results.map(
      (result) => (result as PromiseFulfilledResult<string>).value,
    );
    const edits = new Set((changed + untracked).split("\0").filter(Boolean));
    const commits = new Map<string, { commit: string; date: string }>();
    for (const record of log.split("\x1e").slice(1)) {
      const [header, ...files] = record.trim().split("\n");
      const [commit, date] = header.split("\t");
      for (const path of files.map((line) => line.trim()).filter(Boolean))
        if (!commits.has(path)) commits.set(path, { commit, date });
    }
    for (const path of unique) {
      const last = commits.get(path);
      result.set(path, {
        path,
        checkout_commit: head.trim(),
        last_changed_at: last?.date || null,
        last_commit: last?.commit || null,
        state: edits.has(path)
          ? "Uncommitted changes"
          : last
            ? "Committed"
            : "History unavailable",
        history_url: last ? repositoryLink(path, head.trim(), true) : null,
        source_url: last ? repositoryLink(path, head.trim()) : null,
      });
    }
  } catch {
    // Source archives may have no .git directory. Never substitute an edit time or approval.
  }
  return result;
}
