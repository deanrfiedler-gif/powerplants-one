import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { database } from "../platform/database";
import { sharedOperation } from "../platform/operations";
import { insert } from "../documents/packs";
import {
  common,
  commonKeys,
  object,
  choice,
  version,
  uuid,
} from "../shared/validation";
import { sameVersion } from "../scheduling/validation";
import { unavailable, AppError } from "../platform/errors";
import { financeAccount, accountCurrent, hash } from "./context";

export const accountFixtures = [
  "F-01",
  "F-02",
  "F-03",
  "F-04",
  "F-05",
  "Failed",
] as const;
export type AccountFixture = (typeof accountFixtures)[number];
// Independently specified F-01–F-05 values; no operational accounting calculation.
export function fixture(f: AccountFixture) {
  const invoice = {
      id: "SYN-F01-INVOICE",
      type: "SyntheticInvoice",
      original_amount: "1100.00",
      remaining_amount: f === "F-03" ? "1000.00" : "600.00",
      status: "Open",
      date: "2026-09-01",
      due_date: "2026-09-30",
      currency: "AUD",
    },
    payment = {
      id: "SYN-F01-PAYMENT",
      type: "SyntheticAppliedPayment",
      original_amount: "400.00",
      remaining_amount: null,
      status: f === "F-03" ? "Reversed" : "Applied",
      applies_to: invoice.id,
    },
    credit = {
      id: "SYN-F01-CREDIT",
      type: "SyntheticAppliedCredit",
      original_amount: "100.00",
      remaining_amount: null,
      status: "Applied",
      applies_to: invoice.id,
    },
    reversal = {
      id: "SYN-F03-REVERSAL",
      type: "SyntheticPaymentReversal",
      original_amount: "400.00",
      remaining_amount: null,
      status: "Effective",
      reverses: payment.id,
    },
    cash = {
      id: "SYN-F02-UNAPPLIED",
      type: "SyntheticUnappliedReceipt",
      original_amount: "200.00",
      remaining_amount: "200.00",
      status: "Unapplied",
    };
  const observations =
      f === "Failed"
        ? []
        : f === "F-04"
          ? [invoice]
          : [
              invoice,
              payment,
              credit,
              ...(f === "F-02" ? [cash] : []),
              ...(f === "F-03" ? [reversal] : []),
            ],
    complete = !["F-04", "Failed"].includes(f);
  return {
    fixture: f,
    source_as_at: "2026-09-06T00:00:00.000Z",
    cutoff: "2026-09-06T00:00:00.000Z",
    completeness: f === "Failed" ? "Failed" : complete ? "Complete" : "Partial",
    expected_pages: f === "F-04" ? 2 : 1,
    received_pages: f === "Failed" ? 0 : 1,
    expected_count: f === "F-04" ? 3 : f === "Failed" ? 3 : observations.length,
    received_count: observations.length,
    extraction_scope: {
      source: "PPO-Finance-Fixtures-v1",
      synthetic: true,
      entity: "CustomerAccount",
      currency: "AUD",
      include_reversals: true,
      cutoff_inclusive: true,
      filters: "One exact legal company and synthetic customer account",
      pagination: complete ? "All declared pages" : "Extraction incomplete",
    },
    observations,
    source_balance: complete ? (f === "F-03" ? "1000.00" : "600.00") : null,
    unapplied_cash: complete ? (f === "F-02" ? "200.00" : "0.00") : null,
    basis:
      "F-01–F-05: exact supplied source balance; invoice 1100, applied credit 100, effective payment 400 unless reversed. Unapplied cash is separate. No cross-company/currency aggregation; commitments not defined.",
  };
}
export async function observeAccount(
  p: Principal,
  accountID: string,
  input: unknown,
) {
  const v = object(input, [...commonKeys, "expected_version", "fixture"]),
    cmd = {
      ...common(v),
      id: uuid(accountID, "account_id"),
      expected_version: version(v.expected_version),
      fixture: choice(v.fixture, "fixture", accountFixtures),
    };
  return sharedOperation(
    p,
    cmd,
    "ObserveFinanceAccount",
    (c) => financeAccount(c, p, cmd.id),
    async (c, a) => {
      sameVersion(a.version, cmd.expected_version);
      await accountCurrent(c, p, a);
      const snapshot = {
        ...fixture(cmd.fixture),
        company_id: a.company_id,
        customer_id: a.organisation_id,
        account_id: a.id,
        currency: a.currency,
      };
      const r = await insert(c, "finance_account_runs", {
        ...fixture(cmd.fixture),
        id: randomUUID(),
        workspace_id: p.workspace_id,
        account_id: a.id,
        predecessor_id: a.current_run_id,
        extraction_scope: {
          ...snapshot.extraction_scope,
          company_id: a.company_id,
          customer_id: a.organisation_id,
          account_id: a.id,
          currency: a.currency,
        },
        observations: JSON.stringify(snapshot.observations),
        content_hash: hash(snapshot),
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
      });
      const updated = (
        await c.query(
          "UPDATE ppo.finance_accounts SET current_run_id=$3,version=version+1,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, a.id, r.id, p.actor_id],
        )
      ).rows[0];
      return {
        ...updated,
        state: r.completeness,
        audit_details: { run_id: r.id, fixture: cmd.fixture },
      };
    },
    "FinanceAccount",
    "FinanceAccountObserved",
  );
}
export async function readAccount(
  p: Principal,
  customerID: string,
  input: unknown,
) {
  const q = object(input, ["account_id"]),
    c = database(),
    a = await financeAccount(c, p, uuid(q.account_id, "account_id"));
  if (a.organisation_id !== uuid(customerID, "customer_id"))
    throw unavailable();
  let context_error: string | null = null;
  try {
    await accountCurrent(c, p, a);
  } catch (e) {
    if (!(e instanceof AppError)) throw e;
    context_error = e.message;
  }
  const runs = (
      await c.query(
        "SELECT * FROM ppo.finance_account_runs WHERE workspace_id=$1 AND account_id=$2 ORDER BY observed_at DESC,id DESC",
        [p.workspace_id, a.id],
      )
    ).rows,
    current = runs.find((r) => r.id === a.current_run_id) ?? null,
    last_good = runs.find((r) => r.completeness === "Complete") ?? null;
  return {
    schema_version: 1,
    synthetic: true,
    account: {
      id: a.id,
      version: a.version,
      company_id: a.company_id,
      customer_id: a.organisation_id,
      currency: a.currency,
      status: context_error
        ? "Historical synthetic context — re-verification required"
        : a.status,
      verification_basis: a.verification_basis,
    },
    current,
    last_good,
    history: runs,
    context_error,
    account_balance:
      !context_error && current?.completeness === "Complete"
        ? current.source_balance
        : null,
    balance_status: context_error
      ? "Current account verification unavailable; original observations retained"
      : current?.completeness === "Complete"
        ? "Fixture source reconciled"
        : current?.completeness === "Partial"
          ? "Incomplete — account total unavailable"
          : "Unavailable",
    commitments: {
      value: null,
      status: "Not defined",
      comparison: "Not comparable",
    },
    distribution: "Disabled",
  };
}
