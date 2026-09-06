import { readFile,mkdir,writeFile } from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {dirname} from "node:path";
import prettier from "prettier";
const paths=execFileSync("git",["ls-files","src/offline","src/platform/sync-context.ts","src/app/api/v1/sync","src/app/offline","tests/database/offline.test.ts","tests/helpers/offline.ts","tests/browser/offline.spec.ts","tests/http/offline.test.ts","scripts/build-offline.ts","scripts/format-review.ts","public/offline"],{encoding:"utf8"}).trim().split("\n");
for(const path of paths){if(!/\.(ts|tsx|js|css|html)$/.test(path))continue;const source=await readFile(path,"utf8"),formatted=await prettier.format(source,{filepath:path});const out=`verification-evidence/review-format/${path}.txt`;await mkdir(dirname(out),{recursive:true});await writeFile(out,formatted);}
