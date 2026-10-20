"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./estimation-wizard-ui";

// The existing ES-02 review dialog, shared by first creation and saved revisions.
export function WizardDialog({ title, subtitle, children, footer, close, wide = false, label, dismissible = true, className = "" }: {
  title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode;
  close: () => void; wide?: boolean; label?: string; dismissible?: boolean; className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!, opener = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  return <dialog ref={ref} className={`es02-dialog${wide ? " es02-dialog-wide" : ""} ${className}`}
    aria-label={label ?? title} onCancel={event => { event.preventDefault(); if (dismissible) close(); }}>
    <div className="es02-dialog-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
      <button type="button" className="es02-button es02-button-icon" disabled={!dismissible}
        onClick={close} aria-label={`Close ${title}`}><Icon name="close" /></button>
    </div>
    <div className="es02-dialog-body">{children}</div>
    {footer && <div className="es02-dialog-foot">{footer}</div>}
  </dialog>;
}
