/* One iframe, one exact issue; the parent checks event.source and hash/revision.
 * Opaque iframe origin is intentional. This is a local demonstration bridge,
 * not authentication. The issued HTML is never mutated after hashing. */
function sendResponse(kind,payload){
 if(!canRespond())return;
 state.transport='saving';state.form.consent=false;render();
 parent.postMessage({type:'ppo-customer-response',kind,payload,hash:responseContext.hash,revision:DOCUMENT.revision,quotation:DOCUMENT.quotationNumber},'*');
}
function openQuestion(){
 if(!canRespond())return;
 const d=$("ppq-review-dialog");
 $("ppq-review-content").innerHTML='<h2 id="ppq-review-h" tabindex="-1">Ask about this quotation</h2><p>Your request will be retained against this revision in the local example. Changed scope needs a revised offer.</p><div class="ppq-field"><label for="ppq-question-kind">Request type</label><select id="ppq-question-kind"><option>Clarification</option><option>Change request</option></select></div><div class="ppq-field"><label for="ppq-question-text">Question or requested change</label><textarea id="ppq-question-text" rows="5" maxlength="2000"></textarea></div><p id="ppq-question-error" role="alert"></p><div class="ppq-dlg-actions"><button class="ppq-btn" id="ppq-question-cancel">Cancel</button><button class="ppq-btn ppq-btn-primary" id="ppq-question-save">Save local request</button></div>';
 d.showModal();$("ppq-review-h").focus();
 onView($("ppq-question-cancel"),'click',()=>d.close());
 onView($("ppq-question-save"),'click',()=>{const text=$("ppq-question-text").value.trim();if(!text){$("ppq-question-error").textContent='Enter your question or requested change.';return}parent.postMessage({type:'ppo-customer-question',hash:responseContext.hash,revision:DOCUMENT.revision,kind:$("ppq-question-kind").value,text},'*');d.close();});
}
let receivedContext=false;
on(root,'input',()=>setTimeout(sendDraft,0));
on(root,'change',()=>setTimeout(sendDraft,0));
function sendDraft(){if(!responseContext?.allowed)return;parent.postMessage({type:'ppo-customer-draft',hash:responseContext.hash,revision:DOCUMENT.revision,draft:{selection:[...state.selection],form:{...state.form,consent:false}}},'*')}
on(window,'message',e=>{
 const m=e.data;
 if(e.source!==parent||m?.type!=='ppo-response-context'||m.quotation!==DOCUMENT.quotationNumber||m.revision!==DOCUMENT.revision)return;
 responseContext=m;
 if(!receivedContext&&m.draft){state.selection=new Map(m.draft.selection);state.form={...m.draft.form,actingFor:DOCUMENT.customer.name,consent:false}}
 receivedContext=true;
 state.lifecycle=m.lifecycle;state.transport=m.transport;state.selectable=m.allowed;
 if(m.acceptance){state.acceptance=m.acceptance;state.selection=new Map(m.acceptance.selection)}
 if(m.message)announce(m.message);
 render();
 if(m.message)toast(m.message);
});
