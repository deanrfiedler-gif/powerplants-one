/* r18 choice-card pattern, with measured height and viewport-aware placement. */
(()=>{'use strict';
const icons={down:'<path d="m6 9 6 6 6-6"/>',check:'<path d="m5 12 4 4L19 6"/>'};
const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
const controls=new Map();let open=null,frame=0,sequence=0,typeBuffer='',typeAt=0;
function labelFor(select){return select.getAttribute('aria-label')||[...document.querySelectorAll('label')].find(l=>l.htmlFor===select.id)?.textContent.trim()||select.id;}
function sync(){
 for(const [select] of controls)if(!select.isConnected)controls.delete(select);
 for(const select of document.querySelectorAll('select')){
  if(select.dataset.native==='true')continue;
  let entry=controls.get(select);
  if(!entry){
   if(!select.id)select.id='ppo-choice-'+(++sequence);
   const label=labelFor(select),wrap=document.createElement('span'),button=document.createElement('button');
   wrap.className='choice-wrap';select.before(wrap);wrap.append(select);select.hidden=true;select.tabIndex=-1;select.setAttribute('aria-hidden','true');
   button.type='button';button.className='choice-trigger';button.id=select.id+'-trigger';button.dataset.pickerFor=select.id;button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');button.innerHTML='<span class="choice-value"></span>'+icon('down');wrap.append(button);
   for(const l of document.querySelectorAll('label'))if(l.htmlFor===select.id)l.htmlFor=button.id;
   entry={select,button,label};controls.set(select,entry);
  }
  const option=select.options[select.selectedIndex],value=option?.textContent.trim()||'Choose';entry.button.querySelector('.choice-value').textContent=value;entry.button.setAttribute('aria-label',entry.label+': '+value);entry.button.disabled=select.disabled;
  if(select.hasAttribute('aria-describedby'))entry.button.setAttribute('aria-describedby',select.getAttribute('aria-describedby'));else entry.button.removeAttribute('aria-describedby');
  entry.button.setAttribute('aria-invalid',select.getAttribute('aria-invalid')||'false');
 }
 if(open&&(open.select.disabled||!open.button.isConnected||open.button.closest('[hidden]')))close(false);
}
function close(restore=true){if(!open)return;const {panel,button}=open;open=null;panel.remove();button.setAttribute('aria-expanded','false');button.removeAttribute('aria-controls');typeBuffer='';if(frame){cancelAnimationFrame(frame);frame=0;}if(restore&&button.isConnected)button.focus({preventScroll:true});}
function viewport(){const v=window.visualViewport;const left=v?.offsetLeft||0,top=v?.offsetTop||0;return {left:left+12,top:top+12,right:left+(v?.width||document.documentElement.clientWidth||window.innerWidth)-12,bottom:top+(v?.height||window.innerHeight)-12};}
function position(){
 if(!open)return;const {button,panel}=open,r=button.getBoundingClientRect(),v=viewport(),availableWidth=Math.max(1,v.right-v.left);
 if(!button.isConnected||button.closest('[hidden]')||r.bottom<v.top||r.top>v.bottom||r.right<v.left||r.left>v.right){close(false);return;}
 const width=Math.min(Math.max(r.width,220),340,availableWidth),left=Math.max(v.left,Math.min(r.left,v.right-width));
 panel.style.width=width+'px';panel.style.left=left+'px';panel.style.maxWidth=availableWidth+'px';
 // Read after setting the width: wrapped options must contribute their real height.
 const natural=panel.scrollHeight+2,desired=Math.min(natural||360,360),below=Math.max(0,v.bottom-r.bottom-6),above=Math.max(0,r.top-v.top-6);
 const side=below>=desired||below>=above?'below':'above',space=side==='below'?below:above;
 const maxHeight=Math.min(360,space),height=Math.min(natural||maxHeight,maxHeight);
 panel.style.maxHeight=Math.max(0,maxHeight)+'px';
 const wantedTop=side==='below'?r.bottom+6:r.top-6-height,top=Math.max(v.top,Math.min(wantedTop,v.bottom-height));
 panel.style.top=top+'px';panel.dataset.placement=side;
}
function schedulePosition(){if(open&&!frame)frame=requestAnimationFrame(()=>{frame=0;position();});}
function enabled(){return open?[...open.panel.querySelectorAll('[role=option]:not([aria-disabled=true])')]:[];}
function focusOption(option){if(!open||!option)return;for(const row of open.panel.querySelectorAll('[role=option]'))row.tabIndex=-1;option.tabIndex=0;option.focus({preventScroll:true});const p=open.panel,top=option.offsetTop,bottom=top+option.offsetHeight;if(top<p.scrollTop+7)p.scrollTop=Math.max(0,top-7);else if(bottom>p.scrollTop+p.clientHeight-7)p.scrollTop=bottom-p.clientHeight+7;}
function show(button){
 const select=document.getElementById(button.dataset.pickerFor);if(!select||select.disabled)return;
 if(open?.button===button){close();return;}close(false);sync();
 const entry=controls.get(select),panel=document.createElement('div');panel.id='ppo-choice-listbox';panel.className='rounded-picker';panel.setAttribute('role','listbox');panel.setAttribute('aria-label',entry.label);panel.tabIndex=-1;
 let previousGroup='';
 [...select.options].forEach((option,index)=>{
  const group=option.parentElement.tagName==='OPTGROUP'?option.parentElement.label:'';
  if(group&&group!==previousGroup){if(index){const divider=document.createElement('div');divider.className='picker-divider';divider.setAttribute('role','presentation');panel.append(divider);}const heading=document.createElement('div');heading.className='picker-group';heading.setAttribute('role','presentation');heading.textContent=group;panel.append(heading);}previousGroup=group;
  const row=document.createElement('button'),text=document.createElement('span'),disabled=option.disabled||option.parentElement.disabled;
  row.type='button';row.className='picker-option';row.tabIndex=-1;row.dataset.pickerIndex=String(index);row.setAttribute('role','option');row.setAttribute('aria-selected',String(option.selected));row.setAttribute('aria-disabled',String(!!disabled));text.className='option-label';text.textContent=option.textContent.trim();row.append(text);
  if(option.selected)row.insertAdjacentHTML('beforeend',icon('check'));else{const spacer=document.createElement('span');spacer.className='check-space';spacer.setAttribute('aria-hidden','true');row.append(spacer);}panel.append(row);
 });
 // A choice belonging to a dialog must stay inside its top-layer/focus context.
 (button.closest('dialog[open]')||document.body).append(panel);open={select,button,panel};button.setAttribute('aria-expanded','true');button.setAttribute('aria-controls',panel.id);position();
 if(!open)return;const options=enabled();focusOption(options.find(o=>o.getAttribute('aria-selected')==='true')||options[0]);if(!options.length)panel.focus({preventScroll:true});
}
function choose(index){if(!open)return;const {select,button}=open,option=select.options[Number(index)];if(!option||option.disabled||option.parentElement.disabled)return;select.selectedIndex=Number(index);close(false);select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));sync();button.focus({preventScroll:true});}
document.addEventListener('click',e=>{const row=e.target.closest('[data-picker-index]');if(row&&open?.panel.contains(row)){e.preventDefault();choose(row.dataset.pickerIndex);return;}const trigger=e.target.closest('[data-picker-for]');if(trigger){e.preventDefault();show(trigger);return;}if(open&&!open.panel.contains(e.target))close(false);});
document.addEventListener('pointerdown',e=>{if(open&&!open.panel.contains(e.target)&&!open.button.contains(e.target))close(false);},true);
document.addEventListener('keydown',e=>{
 const trigger=e.target.closest('[data-picker-for]');
 if(trigger&&!open&&['ArrowDown','ArrowUp','Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();show(trigger);return;}
 if(!open)return;
 if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close(true);return;}
 if(e.key==='Tab'){close(true);return;}
 if(!open.panel.contains(e.target))return;
 const options=enabled();if(!options.length)return;let index=options.indexOf(document.activeElement),next=null;
 if(e.key==='ArrowDown')next=(index+1)%options.length;if(e.key==='ArrowUp')next=(index-1+options.length)%options.length;if(e.key==='Home')next=0;if(e.key==='End')next=options.length-1;
 if(next!==null){e.preventDefault();e.stopPropagation();focusOption(options[next]);return;}
 if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();choose(e.target.closest('[data-picker-index]')?.dataset.pickerIndex);return;}
 if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
  e.preventDefault();const now=Date.now();typeBuffer=now-typeAt>650?e.key.toLowerCase():typeBuffer+e.key.toLowerCase();typeAt=now;let term=typeBuffer;
  if([...term].every(c=>c===term[0]))term=term[0];const ordered=options.slice(index+1).concat(options.slice(0,index+1));let match=ordered.find(o=>o.textContent.trim().toLowerCase().startsWith(term));
  if(!match&&term.length>1){typeBuffer=e.key.toLowerCase();match=ordered.find(o=>o.textContent.trim().toLowerCase().startsWith(typeBuffer));}if(match)focusOption(match);
 }
},true);
document.addEventListener('cancel',e=>{if(open&&open.button.closest('dialog')===e.target){e.preventDefault();e.stopImmediatePropagation();close(true);}},true);
document.addEventListener('change',e=>{if(e.target instanceof HTMLSelectElement)sync();});
document.addEventListener('focusin',e=>{if(open&&!open.panel.contains(e.target)&&e.target!==open.button)close(false);});
window.addEventListener('resize',schedulePosition);window.addEventListener('scroll',e=>{if(open&&!(e.target instanceof Node&&open.panel.contains(e.target)))schedulePosition();},true);
window.visualViewport?.addEventListener('resize',schedulePosition);window.visualViewport?.addEventListener('scroll',schedulePosition);
window.addEventListener('beforeprint',()=>close(false));
window.PPOChoices=Object.freeze({sync,close});sync();
})();
