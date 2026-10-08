"use client";
import { useEffect, useId, useState } from "react";
import { Button } from "./ui/button";
import { ErrorNotice } from "./business-ui";
import { useIdentity } from "./business-session";
import { sha256 } from "../offline/protocol";

type PhotoProps = {
  reportId: string;
  revisionId: string;
  revision: number;
  attachment: {
    id: string;
    version: number;
    sha256: string;
    byte_count: number;
  };
  caption: string;
};
function PhotoImage({
  reportId,
  revisionId,
  revision,
  attachment,
  caption,
  focusReturnId,
}: PhotoProps & { focusReturnId: string }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ready"; url: string }
    | { kind: "error"; error: unknown }
  >({ kind: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    let live = true,
      url: string | undefined;
    async function load() {
      try {
        const query = new URLSearchParams({
          revision_id: revisionId,
          attachment_id: attachment.id,
        });
        const response = await fetch(
          `/api/v1/reports/${reportId}/photo?${query}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (!response.ok) throw await response.json();
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (
          response.headers.get("content-type") !== "image/png" ||
          bytes.length !== attachment.byte_count ||
          (await sha256(bytes)) !== attachment.sha256
        )
          throw {
            message:
              "The photo differs from the submitted original. Refresh the report and recover the original photo.",
          };
        if (!live) return;
        url = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
        setState({ kind: "ready", url });
      } catch (error) {
        if (live) setState({ kind: "error", error });
      }
    }
    void load();
    return () => {
      live = false;
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [
    reportId,
    revisionId,
    attachment.id,
    attachment.sha256,
    attachment.byte_count,
    attempt,
  ]);
  return (
    <>
      {state.kind === "loading" && (
        <p role="status">Opening the submitted photo…</p>
      )}
      {state.kind === "error" && (
        <>
          <ErrorNotice error={state.error} />
          <Button
            onClick={(event) => {
              if (document.activeElement === event.currentTarget)
                document.getElementById(focusReturnId)?.focus();
              setState({ kind: "loading" });
              setAttempt((n) => n + 1);
            }}
          >
            Retry photo
          </Button>
        </>
      )}
      {state.kind === "ready" && (
        <figure>
          {/* Exact protected original: keep it out of the public image optimiser. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.url}
            alt={caption || "Submitted field photograph"}
            style={{
              display: "block",
              maxWidth: "100%",
              height: "auto",
              maxHeight: "70vh",
              objectFit: "contain",
            }}
            onError={() => {
              URL.revokeObjectURL(state.url);
              setState({
                kind: "error",
                error: {
                  message:
                    "The submitted photo could not be displayed. Retry the original photo.",
                },
              });
            }}
          />
          <figcaption>
            Original photo · Report revision {revision}. Inspection does not
            approve the entry or share the photo with the customer.
          </figcaption>
        </figure>
      )}
    </>
  );
}

export function ReportPhoto({
  available,
  ...props
}: PhotoProps & { available: boolean }) {
  const [open, setOpen] = useState(false),
    panelId = useId(),
    identity = useIdentity();
  const key = [
    identity.workspace_id,
    identity.actor_id,
    props.reportId,
    props.revisionId,
    props.attachment.id,
    props.attachment.version,
    props.attachment.sha256,
    props.attachment.byte_count,
  ].join(":");
  return (
    <div className="report-photo">
      <Button
        id={`${panelId}-toggle`}
        disabled={!available}
        aria-expanded={open && available}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Hide submitted photo" : "Inspect submitted photo"}
      </Button>
      <div id={panelId}>
        {open && available && (
          <PhotoImage
            key={key}
            {...props}
            focusReturnId={`${panelId}-toggle`}
          />
        )}
      </div>
    </div>
  );
}
