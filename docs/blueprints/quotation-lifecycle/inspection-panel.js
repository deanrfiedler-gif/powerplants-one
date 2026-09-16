let basisReturn=null;
function openBasis(title,body){basisReturn=document.activeElement;const d=document.getElementById('basis-panel');d.innerHTML=`<div class="dialog-head"><h2 id="basis-title">${esc(title)}</h2><button data-action="close-basis" aria-label="Close basis panel">${icon('close')}</button></div><div class="dialog-body">${body}</div>`;d.showModal()}
function closeBasis(){document.getElementById('basis-panel').close();if(basisReturn?.isConnected)basisReturn.focus()}
document.getElementById('basis-panel').addEventListener('cancel',()=>setTimeout(()=>basisReturn?.isConnected&&basisReturn.focus(),0));
