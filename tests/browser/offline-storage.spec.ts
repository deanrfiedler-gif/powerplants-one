import { test, expect } from "@playwright/test";

test("P08 compatible IndexedDB upgrade preserves pending originals and exact Blob; abort and blocked upgrade retain evidence", async ({page}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const path="/offline/modules/offline/store.js", protocol="/offline/modules/offline/protocol.js";
    const s=await import(path),h=await import(protocol);
    const p={workspace_id:crypto.randomUUID(),actor_id:crypto.randomUUID(),display_name:"SYN storage-boundary fixture"};
    const id=crypto.randomUUID(),key=`${h.ownerKey(p)}:${id}`,bytes=new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:"image/png"});
    const original={schema_version:1,operation_id:id,actor_id:p.actor_id,workspace_id:p.workspace_id,appointment_id:crypto.randomUUID(),command:"AttachmentUpload",target_id:crypto.randomUUID(),authority:{assignment_id:crypto.randomUUID(),assignment_version:1,schedule_version:1,scope_revision_id:crypto.randomUUID(),scope_version:1,scope_hash:"a".repeat(64),issue_id:crypto.randomUUID(),issue_hash:"b".repeat(64)},depends_on:[],supersedes_operation_id:null,payload:{operation_id:id,schema_version:1,sha256:await h.sha256(new Uint8Array(await bytes.arrayBuffer())),byte_count:bytes.size}};
    const wire={...original,payload_hash:await h.sha256(h.canonical(original))};
    // The maintained v1 layout has the same originals/Blob stores; v2 adds the recoverable sender lease.
    const old=await s.openStore(1);
    await new Promise<void>((resolve,reject)=>{const tx=old.transaction(["meta","operations","bytes","status"],"readwrite",{durability:"strict"});tx.objectStore("meta").put({key:"active",owner:p,verified_at:Date.now(),locked:false,generation:crypto.randomUUID()});tx.objectStore("operations").put({key,owner:h.ownerKey(p),original:wire,created_at:Date.now()});tx.objectStore("bytes").put({key,owner:h.ownerKey(p),operation_id:id,bytes,sha256:wire.payload.sha256,byte_count:bytes.size});tx.objectStore("status").put({key,owner:h.ownerKey(p),state:"LocalSaved",attempts:0,next_attempt_at:0});tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});old.close();
    const upgraded=await s.openStore();const version=upgraded.version,hasLease=upgraded.objectStoreNames.contains("leases");upgraded.close();
    const rows=await s.queue(p),file=await s.bytesFor(p,id);
    let abort="";try{await s.localTransaction(["operations"],"readwrite",(tx:IDBTransaction)=>{tx.objectStore("operations").put({key:"SYN-must-rollback"});tx.abort();});}catch(e){abort=String(e);}
    const after=await s.queue(p);
    // Hold a genuine pre-upgrade connection without the application's cooperative onversionchange close.
    const blocker=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(s.DB_NAME,2);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    let blocked="";try{await s.openStore(3);}catch(e){blocked=String(e);}finally{blocker.close();}
    return {version,hasLease,unchanged:JSON.stringify(rows[0].original)===JSON.stringify(wire),blob:[...new Uint8Array(await file.bytes.arrayBuffer())],abort,after:after.length,blocked};
  });
  expect(result).toMatchObject({version:2,hasLease:true,unchanged:true,blob:[137,80,78,71,13,10,26,10],after:1});
  expect(result.abort).toContain("AbortError");expect(result.blocked).toContain("blocked by another tab");
});

test("P08 unavailable IndexedDB and detected eviction refuse persistence claims", async ({page}) => {
  await page.addInitScript(()=>Object.defineProperty(globalThis,"indexedDB",{configurable:true,get:()=>undefined}));
  await page.goto("/offline/index.html");
  await expect(page.locator("#error")).toContainText("Not saved on this device");
  await expect(page.locator("#workspace")).not.toBeVisible();
  await expect(page.locator("body")).not.toContainText("Saved on this device — awaiting server acceptance.");
});

test("P08 retained ownership locks deny cross-actor context, originals, bytes and receipts", async ({page}) => {
  await page.goto("/");
  const result=await page.evaluate(async()=>{
    const path="/offline/modules/offline/store.js",s=await import(path);
    const p={actor_id:crypto.randomUUID(),workspace_id:crypto.randomUUID(),display_name:"SYN original owner"},other={...p,actor_id:crypto.randomUUID(),display_name:"SYN other owner"};
    await s.unlock(p);await s.lockLocal();const failures=[];
    for(const action of [()=>s.contexts(p),()=>s.queue(p),()=>s.bytesFor(p,crypto.randomUUID())])try{await action();}catch(e){failures.push(String(e));}
    await s.unlock(other);let oldDenied=false;try{await s.queue(p);}catch{oldDenied=true;}
    return {failures,oldDenied,otherRows:await s.queue(other),otherContexts:await s.contexts(other)};
  });
  expect(result.failures).toHaveLength(3);expect(result.failures.every(x=>x.includes("locked or expired"))).toBe(true);expect(result.oldDenied).toBe(true);expect(result.otherRows).toEqual([]);expect(result.otherContexts).toEqual([]);
});
