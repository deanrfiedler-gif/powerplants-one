"use client";
import Link from "next/link";
import { useEffect,useRef,useState,type ReactNode } from "react";
import { api,ErrorNotice,Stamp,type Failure } from "../../components/business-ui";
import { Button } from "../../components/ui/button";
import { RegisterChip } from "../../components/ui/register-table";
import { SecondaryMenuFrame,useSecondaryMenu } from "../../shell/secondary-menu";
import { useShell } from "../../components/shell-provider";
import { ProductIcon } from "../../components/product-icons";
import type { Page,Family } from "./types";
import "./templates.css";

// Each continuation belongs to one live query. Changing identity is handled by
// BusinessSession; changing query, restarting or refocusing drops the old stream.
export function useTemplatePages<T>(path:string|null,cursorKey="cursor") {
  const [epoch,setEpoch]=useState(0);
  const generation=useRef(0),pending=useRef(false);
  const [state,setState]=useState<{path:string|null;epoch:number;data:Page<T>|null;error:unknown;busy:boolean}>({path:null,epoch:-1,data:null,error:null,busy:false});
  useEffect(()=>{
    const n=++generation.current;
    pending.current=!!path;
    if(path) void api<Page<T>>(path).then(data=>{if(n===generation.current){pending.current=false;setState({path,epoch,data,error:null,busy:false});}},error=>{if(n===generation.current){pending.current=false;setState({path,epoch,data:null,error,busy:false});}});
    return ()=>{generation.current++;};
  },[path,epoch]);
  useEffect(()=>{const refresh=()=>setEpoch(n=>n+1);window.addEventListener("focus",refresh);return()=>window.removeEventListener("focus",refresh);},[]);
  const current=state.path===path&&state.epoch===epoch;
  const data=current?state.data:null;
  const cursor=data?.next_cursor??data?.next_after;
  async function more(){
    if(!path||!cursor||pending.current)return;
    const n=generation.current; pending.current=true;
    setState(s=>({...s,busy:true,error:null}));
    try {const next=await api<Page<T>>(`${path}${path.includes("?")?"&":"?"}${cursorKey}=${encodeURIComponent(cursor)}`);
      if(n===generation.current)setState(s=>({...s,busy:false,error:null,data:{...next,items:[...(s.data?.items??[]),...next.items]}}));
    } catch(error){if(n===generation.current)setState(s=>({...s,busy:false,error,data:[401,403,404].includes((error as Failure).status??0)?null:s.data}));}
    finally{if(n===generation.current)pending.current=false;}
  }
  return {data,error:current?state.error:null,loading:!!path&&(!current||state.busy),more,hasMore:!!cursor,reload:()=>setEpoch(n=>n+1)};
}
export function ReadFeedback({loading,error,reload}:{loading:boolean;error:unknown;reload:()=>void}) {
  return <>{loading&&<p role="status" className="tm-note">Loading current records…</p>}{!!error&&<div className="tm-note"><ErrorNotice error={error}/><p>These records could not be confirmed. Start again to read current permissions and page tokens.</p><Button onClick={reload}>Start again</Button></div>}</>;
}
export function Paging({read,order="identity order",scope="records you can see"}:{read:{data:Page<unknown>|null;error:unknown;loading:boolean;hasMore:boolean;more:()=>void;reload:()=>void};order?:string;scope?:string}) {
  return <footer className="tm-paging"><span>{read.data?(read.hasMore?"More available":"End of list"):""}{read.data&&` · ${scope} · ${order}`}</span>{read.hasMore&&<Button busy={read.loading} disabled={!!read.error} onClick={read.more}>Load more</Button>}</footer>;
}
export function Facts({items}:{items:[string,ReactNode][]}){return <dl className="tm-facts">{items.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value??"Not recorded"}</dd></div>)}</dl>;}
export function Note({children,warning=false}:{children:ReactNode;warning?:boolean}){return <div className={`tm-note ${warning?"tm-warning":""}`}>{children}</div>;}
export function Chip({value}:{value:string}){return <RegisterChip tone={["Supported","Reviewed","Selected now"].includes(value)?"positive":["ChangesRequested","DefinitionChanged","RendererChanged"].includes(value)?"attention":"neutral"}>{value.replace(/([a-z])([A-Z])/g,"$1 $2")}</RegisterChip>;}
export function Time({value}:{value:string|null|undefined}){return value?<Stamp value={value}/>:<>Not recorded</>;}
export function TemplateFrame({view,family,manage,children}:{view:"definitions"|"proposals"|"use";family:Family|null;manage:boolean;children:ReactNode}) {
  const [open,setOpen]=useState(true),menu=useSecondaryMenu(open,setOpen),shell=useShell();
  const query=family?`&family=${family}`:"";
  const nav=<nav aria-label="Template views"><Link className="mw-menu-item" aria-current={view==="definitions"?"page":undefined} href={`/documents/templates?view=definitions${query}`}><ProductIcon name="nav-documents"/>Definitions</Link>{manage&&<><Link className="mw-menu-item" aria-current={view==="proposals"?"page":undefined} href={`/documents/templates?view=proposals${query}`}><ProductIcon name="nav-documents"/>Proposals</Link><h2 className="mw-menu-heading">Job pack use</h2><Link className="mw-menu-item" aria-current={view==="use"?"page":undefined} href="/documents/templates/use"><ProductIcon name="nav-sites"/>Site use</Link></>}<h2 className="mw-menu-heading">Other document pages</h2>{shell.context?.navigation.includes("documents")?<Link className="mw-menu-item" href="/documents">Document library</Link>:<span className="tm-unavailable">Document library · unavailable</span>}{shell.context?.navigation.includes("outputs")?<Link className="mw-menu-item" href="/documents/issues">Outputs</Link>:<span className="tm-unavailable">Outputs · unavailable</span>}</nav>;
  return <SecondaryMenuFrame state={menu} id="ppo-templates" name="Templates" menuId="template-menu" contentId="template-content" menu={nav} message="" phoneHeader={{title:view==="use"?"Site use":"Templates"}}>{children}</SecondaryMenuFrame>;
}
export function Empty({children}:{children:ReactNode}){return <p className="tm-empty" role="status">{children}</p>;}
