"use client";
import { Fragment } from "react";
import Link from "next/link";
import {
  RegisterTable,
  RegisterFooter,
} from "../../components/ui/register-table";
import { CommercialState } from "./ui-common";
import { moneyLabel, recordHref, type Finance, type Row } from "./ui-model";
type ValueRow = Finance["breakdown"][number];
const contribution = (row: ValueRow) =>
  row.state === "Approved"
    ? "Approved changes"
    : row.disputed
      ? "Disputed"
      : ["Requested", "Assessed", "Submitted"].includes(row.state)
        ? "Pending"
        : "Not counted";
export function ValueBreakdown({
  data,
  rows,
  project,
}: {
  data: Finance;
  rows: Row[];
  project: string;
}) {
  const order = new Map(rows.map((row, i) => [row.id, i]));
  return (
    <>
      <RegisterTable
        caption="Variation value breakdown. Requested and priced are alternative valuations."
        footer={
          <RegisterFooter>
            {data.status === "Held"
              ? "Values held · retained Finance breakdown"
              : "Complete Finance breakdown"}{" "}
            · synthetic AUD excluding GST · rejected and withdrawn records are
            never counted
          </RegisterFooter>
        }
      >
        <thead>
          <tr>
            <th>Variation</th>
            <th>State</th>
            <th>Version</th>
            <th>Requested</th>
            <th>Priced</th>
            <th>Counts toward</th>
          </tr>
        </thead>
        <tbody>
          {["Approved changes", "Pending", "Disputed", "Not counted"].map(
            (label) => {
              const items = data.breakdown
                .filter((row) => contribution(row) === label)
                .sort(
                  (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
                );
              return items.length ? (
                <Fragment key={label}>
                  <tr
                    className="commercial-group"
                    data-state-group={
                      label === "Pending" ? "Waiting for decision" : label
                    }
                  >
                    <th colSpan={6}>
                      {label} · {items.length}
                      {label === "Approved changes"
                        ? ` · ${moneyLabel(data.approved_change_value, "Unavailable")}`
                        : ""}
                    </th>
                  </tr>
                  {items.map((row) => (
                    <tr key={row.id}>
                      <td className="ppo-register-wrap">
                        <Link
                          className="ppo-register-row-title"
                          href={recordHref(project, row.id)}
                        >
                          {rows.find((x) => x.id === row.id)?.content.title ??
                            "Variation"}
                        </Link>
                      </td>
                      <td>
                        <CommercialState row={{ ...row, kind: "Variation" }} />
                      </td>
                      <td>v{row.version}</td>
                      <td>{moneyLabel(row.requested_amount)}</td>
                      <td>{moneyLabel(row.priced_amount, "Not priced")}</td>
                      <td>
                        {label === "Approved changes"
                          ? `Approved change${row.predecessor_id ? " (adjustment)" : ""}`
                          : label === "Pending"
                            ? "Pending · requested and priced alternatives"
                            : label === "Disputed"
                              ? "Disputed · priced amount"
                              : label}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ) : null;
            },
          )}
        </tbody>
      </RegisterTable>
      <section className="commercial-reconciliation">
        <h2>How the control values reconcile</h2>
        <p>Synthetic definitions · integer cents · signed AUD excluding GST</p>
        <dl>
          <dt>Approved changes</dt>
          <dd>
            {moneyLabel(data.approved_change_value, "Unavailable")} · signed
            prices of approved variations, including adjustments
          </dd>
          <dt>Adjusted value</dt>
          <dd>
            {data.status === "Held"
              ? "Held — reconcile the retained source before another decision"
              : `${moneyLabel(data.original_control_value)} original + ${moneyLabel(data.approved_change_value)} approved changes = ${moneyLabel(data.adjusted_control_value)}`}
          </dd>
          <dt>Pending · priced</dt>
          <dd>
            {moneyLabel(data.priced_pending?.value, "Unavailable")} · assessed
            and submitted prices; never added to the requested figure
          </dd>
          <dt>Pending · requested</dt>
          <dd>
            {data.requested_pending?.completeness === "Incomplete"
              ? `Not complete · ${moneyLabel(data.requested_pending.known_subtotal)} known; no complete total is shown`
              : moneyLabel(data.requested_pending?.value, "Unavailable")}
          </dd>
          <dt>Disputed</dt>
          <dd>
            {moneyLabel(data.disputed?.value, "Unavailable")} · disputed prices
            are excluded from pending values
          </dd>
          <dt>Not available</dt>
          <dd>
            Billed value, cash, receivables, cost and margin are not derived
            from these records.
          </dd>
        </dl>
      </section>
    </>
  );
}
