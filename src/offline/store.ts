import { ownerKey, sha256, canonical, original, type Owner, type WireOperation, type Outcome, type Authority } from "./protocol";
import type { Job } from "../components/field-screens";
export const DB_NAME="PPO-offline-field",DB_VERSION=2;
export type CachedJob={key:string;owner:Owner;verified_at:string;expires_at:string;authority:Authority;recovery:{id:string;token:string;expires_at:string};job:Job;pack_html?:string;locked?:boolean};
export type LocalStatus={key:string;owner:string;state:"LocalSaved"|"Sending"|Outcome["state"];code?:string;message?:string;receipt?:Outcome["receipt"];recovery?:Record<string,unknown>;attempts:number;next_attempt_at:number};
type StoredOperation={key:string;owner:string;original:WireOperation;created_at:number};
export type LocalEvidence={key:string;owner:string;operation_id:string;payload:Record<string,unknown>};
export type LocalBytes={key:string;owner:string;operation_id:string;bytes:Blob;sha256:string;byte_count:number};
type Ownership={key:"active";owner:Owner|null;verified_at:number;locked:boolean;generation:string};
const stores=["meta","contexts","operations","evidence","bytes","status","leases"];
export class LocalStorageError extends Error { constructor(message:string){super(message);this.name="LocalStorageError";} }
function storageError(e:unknown) {
  if(e instanceof LocalStorageError)return e;
  const name=(e as {name?:string})?.name??"StorageUnavailable";
  return new LocalStorageError(`${name}: Not saved on this device. Keep this page open and retry after resolving browser storage. Previously committed originals are retained.`);
}
export function openStore(version=DB_VERSION):Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    if(!globalThis.indexedDB){reject(storageError(new DOMException("IndexedDBUnavailable","IndexedDBUnavailable")));return;}
    let failed=false;
    const r=indexedDB.open(DB_NAME,version);
    r.onupgradeneeded=()=>{for(const name of stores.filter(x=>version>=2||x!=="leases"))if(!r.result.objectStoreNames.contains(name))r.result.createObjectStore(name,{keyPath:"key"});};
    r.onblocked=()=>{failed=true;reject(new LocalStorageError("Database upgrade is blocked by another tab. Close other PPO tabs and reload; pending originals have not been deleted."));};
    r.onerror=()=>reject(storageError(r.error));
    r.onsuccess=()=>{if(failed){r.result.close();return;}r.result.onversionchange=()=>{r.result.close();globalThis.dispatchEvent?.(new Event("ppo-storage-update"));};resolve(r.result);};
  });
}
const request=<T>(r:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
export async function localTransaction<T>(names:string[],mode:IDBTransactionMode,work:(tx:IDBTransaction)=>Promise<T>|T):Promise<T> {
  const db=await openStore();
  try{
    const tx=db.transaction(names,mode,{durability:"strict"});
    const done=new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error??new DOMException("Transaction aborted","AbortError"));tx.onerror=()=>{};});
    let value:T;
    try{value=await work(tx);}catch(e){try{tx.abort();}catch{}await done.catch(()=>{});throw e;}
    await done;return value;
  }catch(e){throw storageError(e);}finally{db.close();}
}
export async function ownership():Promise<Ownership|null> {
  return localTransaction(["meta"],"readonly",async tx=>(await request(tx.objectStore("meta").get("active")))??null);
}
async function guard(tx:IDBTransaction,p:Owner) {
  const active=await request<Ownership|undefined>(tx.objectStore("meta").get("active"));
  if(!active||active.locked||!active.owner||ownerKey(active.owner)!==ownerKey(p)||Date.now()-active.verified_at>86400000) throw new LocalStorageError("Cached workspace is locked or expired. Reconnect as its original owner. Unsent evidence has not been deleted.");
  return active;
}
export async function unlock(p:Owner) {
  const value:Ownership={key:"active",owner:p,verified_at:Date.now(),locked:false,generation:crypto.randomUUID()};
  await localTransaction(["meta"],"readwrite",tx=>{tx.objectStore("meta").put(value);});
  localStorage.setItem("ppo-offline-marker","present");
  const channel=new BroadcastChannel("ppo-offline-ownership");channel.postMessage("refresh");channel.close();
}
export async function lockLocal() {
  // The durable lock precedes session mutation; if it cannot commit, identity switching stops.
  await localTransaction(["meta"],"readwrite",tx=>{tx.objectStore("meta").put({key:"active",owner:null,locked:true,verified_at:0,generation:crypto.randomUUID()});});
  localStorage.setItem("ppo-offline-marker","present");
  const channel=new BroadcastChannel("ppo-offline-ownership");channel.postMessage("locked");channel.close();
}
export async function cacheJob(p:Owner,data:Omit<CachedJob,"key">) {
  if(ownerKey(data.owner)!==ownerKey(p))throw new LocalStorageError("Downloaded context belongs to another identity.");
  await localTransaction(["meta","contexts"],"readwrite",async tx=>{
    await guard(tx,p);const s=tx.objectStore("contexts"),all=await request<CachedJob[]>(s.getAll()),key=`${ownerKey(p)}:${data.job.id}`;
    if(all.filter(x=>ownerKey(x.owner)===ownerKey(p)&&x.key!==key).length>=2)throw new LocalStorageError("Two jobs are already downloaded. Remove a cached context explicitly before downloading another; originals stay retained.");
    s.put({...data,key});
  });
}
export async function contexts(p:Owner) {
  return localTransaction(["meta","contexts"],"readonly",async tx=>{await guard(tx,p);return (await request<CachedJob[]>(tx.objectStore("contexts").getAll())).filter(x=>ownerKey(x.owner)===ownerKey(p));});
}
export async function removeContext(p:Owner,id:string) {
  await localTransaction(["meta","contexts"],"readwrite",async tx=>{await guard(tx,p);tx.objectStore("contexts").delete(`${ownerKey(p)}:${id}`);});
}
export async function invalidateContexts(p:Owner) {
  await localTransaction(["meta","contexts"],"readwrite",async tx=>{const s=tx.objectStore("contexts");for(const c of await request<CachedJob[]>(s.getAll()))if(ownerKey(c.owner)===ownerKey(p))s.put({...c,locked:true});});
}
export async function commitOperations(p:Owner,operations:WireOperation[],files:LocalBytes[]=[]) {
  // Hash and Blob reads occur BEFORE opening the transaction; no asynchronous network/crypto inside it.
  for(const op of operations)if(op.actor_id!==p.actor_id||op.workspace_id!==p.workspace_id||await sha256(canonical(original(op)))!==op.payload_hash)throw new LocalStorageError("Original operation ownership or hash does not match.");
  for(const file of files)if(file.owner!==ownerKey(p)||file.byte_count!==file.bytes.size||await sha256(new Uint8Array(await file.bytes.arrayBuffer()))!==file.sha256)throw new LocalStorageError("Original photo bytes do not match their size and hash.");
  await localTransaction(["meta","operations","evidence","bytes","status"],"readwrite",async tx=>{
    await guard(tx,p);
    for(const op of operations){const key=`${ownerKey(p)}:${op.operation_id}`,s=tx.objectStore("operations"),prior=await request<StoredOperation|undefined>(s.get(key));
      if(prior){if(canonical(prior.original)!==canonical(op))throw new LocalStorageError("OperationConflict: an original cannot be changed. Create a linked successor.");continue;}
      s.add({key,owner:ownerKey(p),original:op,created_at:Date.now()} satisfies StoredOperation);
      tx.objectStore("evidence").add({key,owner:ownerKey(p),operation_id:op.operation_id,payload:op.payload} satisfies LocalEvidence);
      tx.objectStore("status").add({key,owner:ownerKey(p),state:"LocalSaved",attempts:0,next_attempt_at:0} satisfies LocalStatus);
    }
    for(const file of files){if(!operations.some(o=>o.operation_id===file.operation_id&&o.command==="AttachmentUpload"&&o.payload.sha256===file.sha256&&o.payload.byte_count===file.byte_count))throw new LocalStorageError("Photo bytes need their exact original transfer operation.");const s=tx.objectStore("bytes"),prior=await request<LocalBytes|undefined>(s.get(file.key));if(prior&&(prior.sha256!==file.sha256||prior.byte_count!==file.byte_count))throw new LocalStorageError("Original photo replacement is refused.");if(!prior)s.add(file);}
  });
}
export async function queue(p:Owner) {
  return localTransaction(["meta","operations","status"],"readonly",async tx=>{
    await guard(tx,p);const statuses=await request<LocalStatus[]>(tx.objectStore("status").getAll());
    return (await request<StoredOperation[]>(tx.objectStore("operations").getAll())).filter(x=>x.owner===ownerKey(p)).sort((a,b)=>a.created_at-b.created_at||a.key.localeCompare(b.key)).map(x=>({...x,status:statuses.find(s=>s.key===x.key)!}));
  });
}
export async function bytesFor(p:Owner,id:string) {
  return localTransaction(["meta","bytes"],"readonly",async tx=>{await guard(tx,p);return request<LocalBytes|undefined>(tx.objectStore("bytes").get(`${ownerKey(p)}:${id}`));});
}
export async function claim(p:Owner,sender:string,now=Date.now()) {
  return localTransaction(["meta","leases","operations","status"],"readwrite",async tx=>{
    const active=await guard(tx,p),s=tx.objectStore("leases"),key=ownerKey(p),prior=await request<{sender:string;until:number}|undefined>(s.get(key));
    if(prior&&prior.until>now&&prior.sender!==sender)return null;
    const lease={key,sender,until:now+30000,generation:active.generation};s.put(lease);return lease;
  });
}
export async function release(p:Owner,sender:string) {
  await localTransaction(["leases"],"readwrite",async tx=>{const s=tx.objectStore("leases"),key=ownerKey(p),prior=await request<{sender:string}|undefined>(s.get(key));if(prior?.sender===sender)s.delete(key);});
}
export async function saveStatus(p:Owner,id:string,patch:Partial<LocalStatus>,sender?:string) {
  await localTransaction(["meta","leases","status"],"readwrite",async tx=>{
    await guard(tx,p);if(sender){const lease=await request<{sender:string;until:number}|undefined>(tx.objectStore("leases").get(ownerKey(p)));if(lease?.sender!==sender||lease.until<Date.now())throw new LocalStorageError("Sender lease expired. Original remains recoverable.");}
    const s=tx.objectStore("status"),key=`${ownerKey(p)}:${id}`,old=await request<LocalStatus|undefined>(s.get(key));if(!old)throw new LocalStorageError("Original status is missing; possible storage eviction. Reconcile before recapturing.");s.put({...old,...patch,key,owner:ownerKey(p)});
  });
}
