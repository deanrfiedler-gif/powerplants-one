"use client";
import { useEffect, useState } from "react";
import {
  api,
  isDenied,
  Stamp,
  ReadState,
  type Failure,
} from "../../components/business-ui";
import { RegisterChip } from "../../components/ui/register-table";
import {
  moneyLabel,
  type Finance,
  type ListRead,
  type Read,
  type Row,
} from "./ui-model";

export function useCommercialList(project: string) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    project: string;
    revision: number;
    data: ListRead | null;
    error: unknown;
  }>({ project: "", revision: -1, data: null, error: null });
  useEffect(() => {
    let live = true;
    if (project)
      void (async () => {
        try {
          let cursor: string | null = null,
            result: ListRead | null = null,
            partial = false;
          const items: ListRead["items"] = [];
          // Finish the permitted list before claiming group counts. A bounded UI
          // ceiling is reported as partial, never as a complete register.
          for (let i = 0; i < 20; i++) {
            const page: ListRead = await api<ListRead>(
              `projects/${project}/commercial?limit=200${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
            );
            if (!live) return;
            result = page;
            items.push(...(page.items ?? []));
            partial ||= page.completeness === "Partial";
            cursor = page.next_cursor ?? null;
            if (!cursor) break;
          }
          if (live && result)
            setState({
              project,
              revision,
              error: null,
              data: {
                ...result,
                items: [...new Map(items.map((x) => [x.id, x])).values()],
                completeness: partial || cursor ? "Partial" : "Complete",
                next_cursor: cursor,
              },
            });
        } catch (error) {
          if (live)
            setState((old) => ({
              project,
              revision,
              error,
              data:
                !isDenied(error) && old.project === project ? old.data : null,
            }));
        }
      })();
    return () => {
      live = false;
    };
  }, [project, revision]);
  const current = state.project === project && state.revision === revision;
  return {
    data: state.project === project ? state.data : null,
    error: current ? state.error : null,
    loading: !!project && !current,
    reload: () => setRevision((x) => x + 1),
  };
}
export function CommercialState({
  row,
}: {
  row: Pick<Row, "state" | "disputed" | "kind"> &
    Partial<Pick<Row, "correction_status">>;
}) {
  return (
    <RegisterChip
      tone={
        row.disputed
          ? "negative"
          : row.state === "Submitted"
            ? "attention"
            : ["Approved", "Satisfied"].includes(row.state)
              ? "positive"
              : "neutral"
      }
    >
      {row.kind === "Notice" && row.correction_status === "Corrected"
        ? "Corrected"
        : row.kind === "Notice" && row.correction_status === "Unavailable"
          ? "Correction status unavailable"
          : row.kind === "Obligation" && row.state === "Submitted"
            ? "Waiver requested"
            : row.state === "RecordedEvidence"
              ? "Recorded evidence"
              : row.state}
      {row.disputed && row.state !== "Disputed" ? " · previously disputed" : ""}
    </RegisterChip>
  );
}
export function ControlValues({
  data,
  error,
  loading,
  retry,
}: {
  data: Finance | null;
  error: unknown;
  loading: boolean;
  retry: () => void;
}) {
  if (error || loading || !data)
    return (
      <section
        className="commercial-values-unavailable"
        aria-label="Control values"
      >
        <strong>Control values · {loading ? "Loading" : "Unavailable"}</strong>
        {error && [403, 404].includes((error as Failure).status ?? 0) ? (
          <p>
            Finance read access is required. Commercial records remain
            available.
          </p>
        ) : (
          <ReadState loading={loading} error={error} retry={retry} />
        )}
      </section>
    );
  const values = [
    ["Original value", moneyLabel(data.original_control_value, "Unavailable")],
    ["Approved changes", moneyLabel(data.approved_change_value, "Unavailable")],
    [
      "Adjusted value",
      data.status === "Held"
        ? "Held"
        : moneyLabel(data.adjusted_control_value, "Unavailable"),
    ],
    ["Pending · priced", moneyLabel(data.priced_pending?.value, "Unavailable")],
    [
      "Pending · requested",
      data.requested_pending?.completeness === "Incomplete"
        ? "Not complete"
        : moneyLabel(data.requested_pending?.value, "Unavailable"),
    ],
    ["Disputed", moneyLabel(data.disputed?.value, "Unavailable")],
  ];
  return (
    <section className="commercial-values" aria-label="Control values">
      <div className="commercial-compact-values">
        <small>Adjusted value</small>
        <strong>{values[2][1]}</strong>
        <p>
          Original {values[0][1]} · approved changes {values[1][1]}
        </p>
        <p>
          Pending: priced {values[3][1]} · requested {values[4][1]}
          {data.requested_pending?.completeness === "Incomplete"
            ? ` (${moneyLabel(data.requested_pending.known_subtotal)} known)`
            : ""}
        </p>
        <p>Disputed {values[5][1]} · synthetic AUD excluding GST</p>
      </div>
      <div className="commercial-measures">
        {values.map(([label, value]) => (
          <div key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
            {label === "Pending · requested" &&
              data.requested_pending?.completeness === "Incomplete" && (
                <span>
                  {moneyLabel(data.requested_pending.known_subtotal)} known ·
                  incomplete
                </span>
              )}
          </div>
        ))}
      </div>
      {data.status === "Held" && (
        <p role="status">
          Values held ·{" "}
          {data.reason === "ApprovedBasisNeeded"
            ? "An approved original basis is needed"
            : data.reason === "SourceChanged"
              ? "Source changed; reconcile before another decision"
              : "Required evidence unavailable"}
          .
        </p>
      )}
      <p className="commercial-value-desktop-note">
        Synthetic · AUD excluding GST · definition PJ05-FD08 v1 · read{" "}
        <Stamp value={data.observed_at} />. Project control values, not revenue,
        billing or cash. Requested and priced are alternatives and are never
        added together.
      </p>
    </section>
  );
}

export function PendingCommercialSave({
  context,
  onRecover,
}: {
  context: Read["context"];
  onRecover: () => void;
}) {
  const [present, setPresent] = useState(false);
  useEffect(() => {
    let live = true;
    void Promise.resolve().then(() => {
      if (!live) return;
      try {
        setPresent(
          !!sessionStorage.getItem(
            `ppo.commercial.pending:${context.workspace_id}:${context.actor_id}:${context.project.id}`,
          ),
        );
      } catch {
        setPresent(true);
      }
    });
    return () => {
      live = false;
    };
  }, [context]);
  return present ? (
    <div className="commercial-banner" role="status">
      An earlier commercial save needs confirmation.{" "}
      <button type="button" className="secondary" onClick={onRecover}>
        Recover pending save
      </button>
    </div>
  ) : null;
}
