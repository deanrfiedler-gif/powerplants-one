import { build } from "esbuild";
import { mkdir, readFile, writeFile, cp } from "node:fs/promises";
import { resolve } from "node:path";
// A development-only rendering of actual components with explicit synthetic API
// fixtures. This output is not a deployment or a persistence/authentication test.
const out = resolve(process.argv[2] ?? "verification-evidence/crm-ui");
await mkdir(out, { recursive: true });
await build({
  entryPoints: ["tests/ui/crm-board-fixture.tsx"],
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
              ? 'export const usePathname=()=>"/crm/opportunities"; export const useRouter=()=>({push:()=>{},refresh:()=>{}});'
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
  ].map((f) => readFile("src/app/" + f, "utf8")),
);
await writeFile(
  out + "/review.css",
  styles.join("\n").replaceAll("/brand/", "brand/"),
);
await cp("public/brand", out + "/brand", { recursive: true });
await writeFile(
  out + "/index.html",
  '<!doctype html><html lang="en-AU"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CRM component review — synthetic API fixture</title><link rel="stylesheet" href="review.css"><div id="root"></div><script src="review.js"></script></html>',
);
await writeFile(
  out + "/compare.html",
  '<!doctype html><html><meta charset="utf-8"><title>CRM component review</title><style>body{margin:16px;font:16px sans-serif;background:#e8ebef}iframe{border:1px solid #9ba6b5;display:block;margin-bottom:20px}h1{font-size:20px}</style><h1>Actual CRM components · synthetic API fixture · no database or Microsoft sign-in</h1><h2>Desktop · 1440px</h2><iframe title="Desktop CRM" src="index.html" width="1440" height="1000"></iframe><h2>Phone · 390px</h2><iframe title="Phone CRM" src="index.html" width="390" height="844"></iframe><h2>Narrow phone · 320px</h2><iframe title="Narrow CRM" src="index.html" width="320" height="844"></iframe><h2>Local identity · 1440px</h2><iframe title="Local CRM" src="index.html?mode=local" width="1440" height="1000"></iframe></html>',
);
console.log(out);
