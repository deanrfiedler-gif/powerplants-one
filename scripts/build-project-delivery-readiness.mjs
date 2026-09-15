// Rebuild the stable working HTML. Pass --issue only before freezing a review issue.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve('docs/design/projects-delivery-readiness');
let html=await readFile(resolve(root,'template.html'),'utf8');
for(const [token,file] of [['FONTS','roboto.css'],['CSS','workspace.css'],['MODEL','model.js'],['APP','workspace.js']]){
  const text=await readFile(resolve(root,file),'utf8');
  if(token==='MODEL'||token==='APP')if(/<\/script/i.test(text))throw Error('Inline script contains a closing script tag.');
  html=html.replace('/*__'+token+'__*/',()=>text);
}
const working=resolve('docs/reference/ui/projects/project-delivery-readiness-and-change-control.html');
await writeFile(working,html);
if(process.argv.includes('--issue'))await writeFile(resolve('docs/reference/ui/projects/PPO-Project-Delivery-Readiness-and-Change-Control-r01.html'),html);
console.log('Built '+working+' ('+Buffer.byteLength(html)+' bytes)');
