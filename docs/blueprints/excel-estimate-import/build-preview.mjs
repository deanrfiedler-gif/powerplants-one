import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const [css,model,reader,script,fixture]=await Promise.all(['preview.css','model.js','workbook-reader.js','preview.js','fixture.json'].map(n=>fs.readFile(path.join(dir,n),'utf8')));
let font='';if(process.argv[2]){const source=await fs.readFile(process.argv[2],'utf8');font=source.match(/@font-face\s*\{[^}]*PPOBoardRoboto[^}]*\}/)?.[0]||'';}
const html=`<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Powerplants One — Excel Estimate Import r01</title><style>body{margin:0}${font}${css}</style></head><body><main id="ppo-excel-import"></main><script type="application/json" id="fixture">${fixture.replaceAll('<','\\u003c')}</script><script>${model}\n${reader}\n${script}</script></body></html>`;
await fs.writeFile(path.join(dir,'../excel-estimate-import.html'),html);
console.log('Built standalone Excel import preview.');
