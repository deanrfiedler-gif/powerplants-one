// Audit-only reference browser observations; run from repository root.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(resolve('docs/reference/ui/specialist/PPO-Greenhouse-Blueprint-and-Screen-Calculator-r10.html')).href);
 await page.locator('#front svg').count();
 await page.screenshot({path:'docs/testing/evidence/es08-geometry-audit/r10-desktop.png',fullPage:true});
 await page.locator('#top').scrollIntoViewIfNeeded();
 const refreshed=await page.locator('#top').evaluate(svg=>{
  const r=[...svg.querySelectorAll('rect')].find(r=>r.getAttribute('stroke-width')==='1.3'),p=svg.createSVGPoint();p.x=+r.getAttribute('x') + +r.getAttribute('width')*59.25/60;p.y=+r.getAttribute('y') + +r.getAttribute('height')*30/32;const s=p.matrixTransform(svg.getScreenCTM());return{x:s.x,y:s.y};
 });
 await page.mouse.click(refreshed.x,refreshed.y);
 const selection={expected:{width:'8',length:'14'},actual:{width:await page.locator('#panelW').inputValue(),length:await page.locator('#panelL').inputValue()}};
 const desktop={overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),selection};
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'docs/testing/evidence/es08-geometry-audit/r10-phone.png',fullPage:true});
 const phone={overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};
 await page.setViewportSize({width:1440,height:1000});
 await page.goto(pathToFileURL(resolve('docs/reference/ui/specialist/PPO-Specialist-Configuration-Workbench-r02.html')).href);
 await page.screenshot({path:'docs/testing/evidence/es08-geometry-audit/r02-desktop.png',fullPage:true});
 const result={browser:await browser.version(),desktop,phone,page_errors:errors,scope:'Standalone reference observations only; native browser suite not run'};
 writeFileSync('docs/testing/evidence/es08-geometry-audit/browser-observations.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result));await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
