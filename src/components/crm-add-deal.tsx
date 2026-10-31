"use client";
import { useEffect, useRef, useState } from "react";
import { NewOpportunityForm } from "./crm-screens";
import { ProductIcon } from "./product-icons";
import type { OperationReceipt } from "../platform/operations";
export function AddDealDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (receipt: OperationReceipt) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state,setState] = useState({dirty:false,blocked:false});
  const close = () => { if(!state.blocked && (!state.dirty || window.confirm("Discard this unsaved deal?"))) onClose(); };
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current; dialog?.showModal();
    return () => {dialog?.close(); previous?.focus({preventScroll:true});};
  },[]);
  return <dialog ref={ref} className="crm-add-deal-dialog" aria-labelledby="crm-add-title" onCancel={e => {e.preventDefault();close();}}>
    <header className="crm-dialog-head"><div><h2 id="crm-add-title">Add deal</h2><p>Create an Open deal and its initial owned activity.</p></div><button className="secondary" disabled={state.blocked} aria-label="Close Add deal" onClick={close}><ProductIcon name="close"/></button></header>
    <div className="crm-add-body"><NewOpportunityForm embedded onSaved={onSaved} onState={setState}/></div>
    <footer className="crm-dialog-footer"><span>Values start as not estimated.</span><button className="secondary" onClick={close} disabled={state.blocked}>Cancel</button><button type="submit" form="crm-add-deal-form" disabled={state.blocked}>Add deal</button></footer>
  </dialog>;
}
