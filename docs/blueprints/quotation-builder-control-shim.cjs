/* eslint-disable @typescript-eslint/no-require-imports */
// Minimal control model for running the authored design logic without a browser.
// It does not implement layout, accessibility, real storage or browser security.
const vm=require('node:vm');
class Element {
 constructor(id,attrs={}){this.id=id;this.attrs=attrs;this.value='';this.disabled=false;this.checked=false;this.hidden=false;this.listeners={};this.dataset={};this.classList={toggle(){}};this.innerHTML='';this.textContent='';}
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
 dispatchEvent(e){for(const fn of this.listeners[e.type]||[])fn({...e,target:this});}
 click(){if(!this.disabled)this.dispatchEvent({type:'click'});}
 setAttribute(k,v){this.attrs[k]=v;}
 removeAttribute(k){delete this.attrs[k];}
 focus(){}scrollIntoView(){}
 querySelector(selector){if(selector==='[data-line="L06"]'){this.optional=new Element('optional');return this.optional;}return null;}
 querySelectorAll(){return [];}
}
function create(html,stored){
 const elements={};for(const m of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)){const e=elements[m[1]]=new Element(m[1]);e.disabled=/\bdisabled/.test(m[0]);}
 const steps=['estimate','content','review'].map(s=>{const e=new Element(s+'-step');e.dataset.step=s;return e;});
 const go=['content','review'].map(s=>{const e=new Element(s+'-go');e.dataset.go=s;return e;});
 const storage=new Map(stored?[['ppo-quotation-builder-design-r01',stored]]:[]);
 const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 const document={getElementById:id=>elements[id]||null,querySelectorAll:s=>s==='[data-step]'?steps:s==='[data-go]'?go:s==='.step-panel'?['estimate','content','review'].map(x=>elements[x+'-panel']):[],querySelector:s=>s==='[data-line="L06"]'?elements['estimate-lines'].optional:new Element('generic'),createElement:()=>new Element('generic')};
 const window={};const context={document,window,localStorage,location:{href:'https://quotation-design.invalid/quotation-builder.html'},structuredClone,URL,Intl,Date,Map,JSON,Number,String,Array,Blob,console,setTimeout,confirm:()=>true};
 vm.runInNewContext(html.match(/<script>([\s\S]*)<\/script>/)[1],context,{timeout:3000});
 return {window:{...window,document,localStorage,Event:class{constructor(type){this.type=type;}},close(){}},elements};
}
module.exports={create};
