import { ownerKey, type Owner, type Outcome } from "./protocol.js";
import { queue, bytesFor, claim, release, saveStatus, lockLocal, invalidateContexts } from "./store.js";
export class HttpFailure extends Error { constructor(public status:number,public code:string,message:string){super(message);} }
export async function api<T>(path:string,body?:unknown):Promise<T> {
  const response=await fetch(`/api/v1/${path}`,{method:body===undefined?"GET":"POST",credentials:"same-origin",cache:"no-store",headers:body===undefined?{}:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  const data=await response.json();if(!response.ok)throw new HttpFailure(response.status,data.code,data.message);return data;
}
export async function verifyOwner(p:Owner) {
  try { const now=await api<Owner>("local-session");if(ownerKey(now)!==ownerKey(p)){await lockLocal();throw new HttpFailure(401,"IdentityChanged","The active identity changed. Reconnect as the original owner.");}return now; }
  catch(e){if(e instanceof HttpFailure&&e.status===401)await lockLocal();throw e;}
}
export async function base64(blob:Blob) {
  const bytes=new Uint8Array(await blob.arrayBuffer());let s="";for(let n=0;n<bytes.length;n+=32768)s+=String.fromCharCode(...bytes.subarray(n,n+32768));return btoa(s);
}
export async function synchronise(p:Owner,onChange:()=>Promise<void>|void=()=>{}) {
  await verifyOwner(p);
  const sender=crypto.randomUUID(),lease=await claim(p,sender);
  if(!lease)return "Another tab is sending. Its 30-second lease can be recovered if it stops.";
  try{
    const selected=[];const transfers:Record<string,string>={};let size=0;
    for(const row of await queue(p)){
      if(row.status.state==="ServerSaved"||row.status.recovery)continue;
      if(row.original.schema_version!==1){await saveStatus(p,row.original.operation_id,{state:"ReviewRequired",code:"PayloadVersionUnsupported",message:"Original schema retained. Export for supervised recovery; no automatic rewrite."},sender);continue;}
      if(row.original.command==="AttachmentUpload"){
        const file=await bytesFor(p,row.original.operation_id);
        if(!file){await saveStatus(p,row.original.operation_id,{state:"Failed",code:"MissingOriginalBytes",message:"Original photo bytes are missing. Keep its original metadata and recover from the source; do not replace it."},sender);continue;}
        const bytes=await base64(file.bytes);if(size+bytes.length+JSON.stringify(row.original).length>6000000)break;transfers[row.original.operation_id]=bytes;size+=bytes.length;
      }
      size+=JSON.stringify(row.original).length;if(size>6000000||selected.length===20)break;selected.push(row);
    }
    if(!selected.length)return "No eligible originals in this batch. Review retained exceptions.";
    for(const row of selected)await saveStatus(p,row.original.operation_id,{state:"Sending",attempts:row.status.attempts+1,message:"Sending original; no server acceptance confirmed."},sender);
    await onChange();
    try{
      const result=await api<{outcomes:Outcome[]}>("sync/operations",{operations:selected.map(x=>x.original),transfers});
      if(!Array.isArray(result.outcomes)||result.outcomes.length!==selected.length)throw new Error("Incomplete server outcome");
      for(const row of selected){const outcome=result.outcomes.find(x=>x.operation_id===row.original.operation_id);if(!outcome||(outcome.state==="ServerSaved"&&!outcome.receipt))throw new Error("Original receipt missing");
        await saveStatus(p,row.original.operation_id,{...outcome,code:outcome.code,message:outcome.message??`Server receipt · ${outcome.receipt?.state}`,next_attempt_at:outcome.retryable?Date.now()+Math.min(60000,1000*2**Math.min(row.status.attempts,6)):0},sender);
        if(outcome.state==="ReviewRequired"&&["Forbidden","RecordUnavailable","AuthorityChanged","VersionConflict"].includes(outcome.code??""))await invalidateContexts(p);
      }
      return "Batch outcomes committed on this device. Review each result; remaining batches need an explicit send.";
    }catch(e){
      for(const row of selected){await saveStatus(p,row.original.operation_id,{state:e instanceof HttpFailure&&[401,403,404].includes(e.status)?"ReviewRequired":"Pending",code:e instanceof HttpFailure?e.code:"OutcomeUncertain",message:"Server outcome is uncertain or unavailable. Original retained; retry uses the same identity.",next_attempt_at:Date.now()+2000},sender).catch(()=>{});}
      if(e instanceof HttpFailure&&e.status===401)await lockLocal();throw e;
    }
  }finally{await release(p,sender);await onChange();}
}
