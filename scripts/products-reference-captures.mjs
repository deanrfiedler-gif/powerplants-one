import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root='docs/testing/evidence/products-native';
await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),sources=[];
try{
 for(const [name,path]of [['products','docs/reference/ui/products/PPO-Products-Preview-r04.html'],['supplier-pricing','docs/reference/ui/supplier-pricing/PPO-Supplier-Pricing-and-Cost-Sources-r01.html']]){
  const page=await browser.newPage();await page.route(/^https?:/,r=>r.abort());
  for(const [width,height]of [[1440,960],[1024,768],[390,844],[320,844],[720,844]]){
   await page.setViewportSize({width,height});await page.goto(pathToFileURL(resolve(path)).href);await page.screenshot({path:`${root}/reference-${name}-${width}.png`});
  }
  sources.push({path,sha256:createHash('sha256').update(await readFile(path)).digest('hex'),capture:'Original local HTML; external network requests blocked; issued bytes unchanged.'});await page.close();
 }
 await writeFile(`${root}/reference-sources.json`,JSON.stringify({browser:browser.version(),sources},null,2)+'\n');
}finally{await browser.close();}
