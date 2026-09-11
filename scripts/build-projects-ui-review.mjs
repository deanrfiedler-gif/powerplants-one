import { build } from "esbuild";
import { mkdir, readFile, writeFile, cp } from "node:fs/promises";
import { resolve } from "node:path";
const out = resolve("verification-evidence/projects-ui");
await mkdir(out, { recursive: true });
await build({
  entryPoints: ["tests/projects-ui/gantt-fixture.tsx"],
  outfile: out + "/review.js",
  bundle: true,
  platform: "browser",
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  plugins: [
    {
      name: "framework-fixture",
      setup(b) {
        b.onResolve({ filter: /^next\/(link|image|navigation)$/ }, (args) => ({
          path: args.path,
          namespace: "fixture",
        }));
        b.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
          loader: "jsx",
          resolveDir: process.cwd(),
          contents:
            args.path === "next/navigation"
              ? 'export const usePathname=()=>"/projects/f1000000-0000-4000-8000-000000000001"; export const useRouter=()=>({push:()=>{},refresh:()=>{}});'
              : args.path === "next/link"
                ? 'import React from "react"; export default function Link({href,children,...props}){return <a href={href} {...props}>{children}</a>}'
                : 'import React from "react"; export default function Image({unoptimized,src,...props}){return <img src={src.replace("/brand/","brand/")} {...props}/>}',
        }));
      },
    },
  ],
});
const styles = await Promise.all(
  [
    "globals.css",
    "shared-layout.css",
    "mobile-layout.css",
    "crm-refinements.css",
    "crm-board-polish.css",
    "desktop-shell.css",
    "projects-gantt.css",
  ].map((f) => readFile("src/app/" + f, "utf8")),
);
await writeFile(
  out + "/review.css",
  styles.join("\n").replaceAll("/brand/", "brand/"),
);
await cp("public/brand", out + "/brand", { recursive: true });
await writeFile(
  out + "/index.html",
  '<!doctype html><html lang="en-AU"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Projects React component review — synthetic API fixture</title><link rel="stylesheet" href="review.css"><div id="root"></div><script src="review.js"></script></html>',
);
console.log(out);
