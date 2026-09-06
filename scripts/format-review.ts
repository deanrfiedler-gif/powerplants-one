import { readFile,mkdir,writeFile } from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {dirname} from "node:path";
import prettier from "prettier";
const paths=execFileSync("git",["diff","--name-only","4c4e4c7dbea85ffff9f5126c1023b5129ca9b343","HEAD"],{encoding:"utf8"}).trim().split("\n");
for(const path of paths){if(!/\.(ts|tsx|js|css|html)$/.test(path))continue;const source=await readFile(path,"utf8"),formatted=await prettier.format(source,{filepath:path});const out=`verification-evidence/review-format/${path}.txt`;await mkdir(dirname(out),{recursive:true});await writeFile(out,formatted);}
