"use client";
import { useSyncExternalStore, type ReactNode } from "react";
import { WorklistPanel } from "../components/crm-worklist-tools";
import { Button } from "../components/ui/button";
import { RegisterChip } from "../components/ui/register-table";
import { ProductIcon } from "../components/product-icons";
import { incidentLabel } from "./presentation";

const subscribe = (change: () => void) => {
  window.addEventListener("online", change);
  window.addEventListener("offline", change);
  return () => {
    window.removeEventListener("online", change);
    window.removeEventListener("offline", change);
  };
};
export const useIncidentOnline = () =>
  useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
export function IncidentState({ state }: { state: string }) {
  return (
    <RegisterChip
      tone={
        state === "Accepted"
          ? "positive"
          : [
                "Submitted",
                "InReview",
                "Returned",
                "ClarificationRequired",
              ].includes(state)
            ? "attention"
            : "neutral"
      }
    >
      {incidentLabel(state)}
    </RegisterChip>
  );
}
export function IncidentSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="fi06-card">
      <h2 className="fi06-section-title">{title}</h2>
      {children}
    </section>
  );
}
export function SubmitIncident({
  summary,
  classification,
  scope,
  restricted,
  locked,
  onClose,
  onSubmit,
}: {
  summary: string;
  classification: string;
  scope: string;
  restricted: boolean;
  locked: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fi06-submit">
      <WorklistPanel title="Submit this report?" onClose={onClose}>
        <p>
          {summary} · {incidentLabel(classification)}
        </p>
        <div className="fi06-confirm-row">
          <ProductIcon name="warning" />
          <div>
            <strong>Holds {scope} until the incident is closed</strong>
            <p>
              Readiness and Start for visits on this scope are held. Your
              attendance and timer are not changed.
            </p>
          </div>
        </div>
        <div className="fi06-confirm-row">
          <ProductIcon name="info" />
          <div>
            <strong>An independent reviewer triages it</strong>
            <p>
              They record the assessment, priority, an accountable owner and a
              due time.
            </p>
          </div>
        </div>
        <div className="fi06-confirm-row">
          <ProductIcon name="info" />
          <div>
            <strong>
              Restricted details: {restricted ? "entered" : "none entered"}
            </strong>
            <p>Only you and authorised sensitive reviewers can read them.</p>
          </div>
        </div>
        <p className="fi06-note">
          After you submit, the facts change only through a correction with its
          own reason. Earlier versions stay in history.
        </p>
        <div className="button-row">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={locked} onClick={onSubmit}>
            Submit report
          </Button>
        </div>
      </WorklistPanel>
    </div>
  );
}
