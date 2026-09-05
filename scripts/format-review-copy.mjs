// Reproducible review copies only. Never modifies the executed checkout.
import { readdir,readFile,mkdir,writeFile } from 'node:fs/promises';
import { dirname,join } from 'node:path';
import { format } from 'prettier';
const files=['src/components/field-screens.tsx','tests/helpers/field.ts','tests/database/field.test.ts','tests/unit/field.test.ts','tests/helpers/field-http.ts','tests/http/field.test.ts','scripts/persistence-proof.ts','tests/browser/field.spec.ts'];
for(const file of await readdir('src/field'))if(file.endsWith('.ts'))files.push(join('src/field',file));
for(const path of files){const content=await readFile(path,'utf8'),output=await format(content,{filepath:path});const target=join('test-results/p07-review-copy',path+'.txt');await mkdir(dirname(target),{recursive:true});await writeFile(target,output);}
