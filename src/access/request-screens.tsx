"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import {
  api,
  ErrorNotice,
  Field,
  type Failure,
  isDenied,
  PageHeader,
  ReadState,
  SelectField,
  Stamp,
  Status,
  useResource,
  ValidationFields,
} from "../components/business-ui";
import { useRecoverableCommand } from "../shared/ui/use-recoverable-command";
import type { JournalEntry } from "../shared/lib/command-journal";

type Person = { id: string; display_name: string };
type Actor = { actor_id: string; workspace_id: string };
type Context = {
  actor: Actor;
  people: Person[];
  reviewers: Person[];
  companies: (Person & { erp_company_id: string })[];
  sites: (Person & { company_id: string; display_number: string })[];
  capabilities: { key: string; label: string }[];
  can_submit: boolean;
};
type Request = {
  id: string;
  subject_name: string;
  requester_name: string;
  reviewer_name: string;
  capability: string;
  scope_type: string;
  company_name: string | null;
  erp_company_id: string | null;
  site_name: string | null;
  site_number: string | null;
  valid_from: string;
  valid_to: string | null;
  reason: string;
  state: string;
  version: number;
  created_at: string;
  decision_reason: string | null;
  subject_id: string;
  grant_id: string | null;
  applied_at: string | null;
  application_reason: string | null;
};
type Detail = {
  actor: Actor;
  request: Request;
  can_decide: boolean;
  can_apply: boolean;
  history: {
    command: string;
    request_version: number;
    actor_name: string;
    reason: string;
    occurred_at: string;
    operation_id: string;
  }[];
};
const base = "admin/access/requests";
const transport = <T,>(path: string, body?: unknown) =>
  api<T>(path.startsWith("operations/") ? `${base}/${path}` : path, body);
const hidden = (error: unknown) =>
  isDenied(error) || (error as Failure)?.code === "WorkingCompanySelected";
const accepts = (e: JournalEntry) =>
  e.path === base ||
  e.path === `${base}/${e.record_id}/decision` ||
  e.path === `${base}/${e.record_id}/apply`;
function useAccessCommand(actor: Actor, key: string) {
  return useRecoverableCommand({
    key: `ppo-access-request:${actor.workspace_id}:${actor.actor_id}:${key}`,
    scope: actor,
    accepts,
    transport,
  });
}
type Command = ReturnType<typeof useAccessCommand>;
function Recovery({ command }: { command: Command }) {
  return (
    <>
      <ErrorNotice error={command.error} />
      {command.pending && (
        <div className="callout" role="status">
          <p>
            The original {command.pending.label.toLowerCase()} is awaiting
            confirmation. Its submitted values are retained in this tab.
          </p>
          <Button
            variant="secondary"
            disabled={command.busy}
            onClick={() => void command.recover()}
          >
            Check original result
          </Button>{" "}
          <Button
            variant="secondary"
            disabled={command.busy}
            onClick={() => void command.retry()}
          >
            Retry unchanged action
          </Button>
        </div>
      )}
      {command.accepted && (
        <p role="status">
          {command.saved}{" "}
          <Link
            href={`/admin/access/requests/${command.accepted.receipt.record_id}`}
          >
            Open saved request
          </Link>
          .{" "}
          {command.accepted.receipt.state === "Applied"
            ? "The exact approved grant was installed. Check its dates and current access separately."
            : "No grants changed."}
        </p>
      )}
    </>
  );
}
function Boundary() {
  return (
    <p className="callout">
      Local synthetic requests only. Approval records a review; it does not make
      access effective. Applying an Approved request is a separate controlled
      step. Administrative grants and hosted provisioning remain outside this
      workflow.
    </p>
  );
}
function Scope({ request: r }: { request: Request }) {
  return (
    <p className="narrative">
      {r.scope_type}
      {r.erp_company_id
        ? ` · ${r.company_name} · ${r.erp_company_id}`
        : " · All companies, including companies added later"}
      {r.site_number ? ` · ${r.site_number} · ${r.site_name}` : ""}
    </p>
  );
}

export function AccessRequestsScreen() {
  const [state, setState] = useState(""),
    [offset, setOffset] = useState(0);
  const context = useResource<Context>(`${base}/context`);
  const queue = useResource<{ items: Request[]; has_more: boolean }>(
    `${base}?state=${state}&offset=${offset}`,
  );
  const retry = () => {
    context.reload();
    queue.reload();
  };
  const error = context.error || queue.error,
    loading = context.loading || queue.loading;
  return (
    <>
      <Link href="/admin/access">Back to users and access</Link>
      <PageHeader
        variant="register"
        eyebrow="Administration · AD-01"
        title="Access-change requests"
        description="Submit one proposed business capability for an independent decision, then inspect its exact saved history."
      />
      <Boundary />
      <ReadState loading={loading} error={error} retry={retry} />
      {context.data && queue.data && !loading && !error && (
        <>
          {context.data.can_submit ? (
            <SubmitForm context={context.data} retry={retry} />
          ) : (
            <p>
              Your current duty permits inspection or review, not submission.
            </p>
          )}
          <h2>Saved requests</h2>
          <SelectField
            name="request-state"
            label="Request state"
            value={state}
            onChange={(v) => {
              setState(v);
              setOffset(0);
            }}
            empty="All states"
            options={["Submitted", "Approved", "Returned", "Applied"].map(
              (id) => ({
                id,
              }),
            )}
          />
          <div className="record-grid">
            {queue.data.items.map((r) => (
              <article className="record-card" key={r.id}>
                <h3>
                  <Link href={`/admin/access/requests/${r.id}`}>
                    {r.subject_name} · {r.capability}
                  </Link>
                </h3>
                <Status value={r.state} />
                <Scope request={r} />
                <p>Reviewer: {r.reviewer_name}</p>
                <p>
                  Submitted <Stamp value={r.created_at} />
                </p>
                <p className="narrative">Request {r.id}</p>
              </article>
            ))}
          </div>
          {!queue.data.items.length && <p>No requests match this state.</p>}
          <div className="button-row">
            <Button
              variant="secondary"
              disabled={!offset}
              onClick={() => setOffset(offset - 50)}
            >
              Previous requests
            </Button>
            <Button
              variant="secondary"
              disabled={!queue.data.has_more}
              onClick={() => setOffset(offset + 50)}
            >
              Next requests
            </Button>
            <Button variant="secondary" onClick={retry}>
              Refresh requests
            </Button>
          </div>
        </>
      )}
    </>
  );
}
function SubmitForm({
  context: c,
  retry,
}: {
  context: Context;
  retry: () => void;
}) {
  const command = useAccessCommand(c.actor, "submit");
  // A command refusal invalidates the containing workspace queue as well.
  useEffect(() => {
    if (hidden(command.error)) retry();
  }, [command.error, retry]);
  const [subject, setSubject] = useState(""),
    [reviewer, setReviewer] = useState(""),
    [capability, setCapability] = useState(""),
    [scope, setScope] = useState("Company"),
    [company, setCompany] = useState(""),
    [site, setSite] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [reason, setReason] = useState("");
  if (hidden(command.error))
    return <ReadState loading={false} error={command.error} retry={retry} />;
  return (
    <section aria-label="Submit access request">
      <h2>Propose one additional capability</h2>
      <p>
        Choose a future UTC start. Existing grants, including expired grants,
        need a different change workflow. Returned requests remain retained;
        submit a new corrected proposal.
      </p>
      <ValidationFields error={command.error}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const id = crypto.randomUUID();
            void command.send(
              base,
              {
                request_id: id,
                subject_id: subject,
                reviewer_id: reviewer,
                capability,
                scope_type: scope,
                company_id: scope === "Workspace" ? null : company,
                site_id: scope === "Site" ? site : null,
                valid_from: from ? `${from}:00.000Z` : "",
                valid_to: to ? `${to}:00.000Z` : null,
                reason,
              },
              `/admin/access/requests/${id}`,
              "Access request",
              id,
            );
          }}
        >
          <fieldset
            disabled={command.busy || !!command.pending || !command.ready}
          >
            <legend>Exact proposal</legend>
            <SelectField
              name="subject_id"
              label="Affected person"
              value={subject}
              onChange={(v) => {
                setSubject(v);
                setReviewer("");
              }}
              required
              options={c.people.filter((p) => p.id !== c.actor.actor_id)}
            />
            <SelectField
              name="reviewer_id"
              label="Independent reviewer"
              value={reviewer}
              onChange={setReviewer}
              required
              options={c.reviewers.filter(
                (p) => p.id !== subject && p.id !== c.actor.actor_id,
              )}
            />
            <SelectField
              name="capability"
              label="Capability to add"
              value={capability}
              onChange={setCapability}
              required
              options={c.capabilities.map((x) => ({
                id: x.key,
                display_name: `${x.key} · ${x.label}`,
              }))}
            />
            <SelectField
              name="scope_type"
              label="Grant scope"
              value={scope}
              onChange={(v) => {
                setScope(v);
                setCompany("");
                setSite("");
              }}
              required
              options={["Workspace", "Company", "Site"].map((id) => ({ id }))}
            />
            {scope === "Workspace" ? (
              <p className="callout">
                This proposal covers all companies in the workspace, including
                future companies.
              </p>
            ) : (
              <SelectField
                name="company_id"
                label="Company"
                value={company}
                onChange={(v) => {
                  setCompany(v);
                  setSite("");
                }}
                required
                options={c.companies.map((x) => ({
                  ...x,
                  display_name: `${x.display_name} · ${x.erp_company_id}`,
                }))}
              />
            )}
            {scope === "Site" && (
              <SelectField
                name="site_id"
                label="Site"
                value={site}
                onChange={setSite}
                required
                options={c.sites.filter((s) => s.company_id === company)}
              />
            )}
            <Field
              name="valid_from"
              label="Proposed start (UTC)"
              type="datetime-local"
              required
              value={from}
              onChange={setFrom}
              hint="UTC, not Brisbane local time. Approval does not apply the grant."
            />
            <Field
              name="valid_to"
              label="Proposed end (UTC, optional)"
              type="datetime-local"
              value={to}
              onChange={setTo}
              hint="Leave empty to propose no end date."
            />
            <Field
              name="reason"
              label="Request reason"
              value={reason}
              onChange={setReason}
              required
              maxLength={1000}
              hint="10–1000 characters. Explain why this exact capability and scope are needed."
            />
            <Button type="submit">Submit for independent review</Button>
          </fieldset>
          <Recovery command={command} />
        </form>
      </ValidationFields>
    </section>
  );
}
export function AccessRequestScreen({ id }: { id: string }) {
  const resource = useResource<Detail>(`${base}/${id}`);
  return (
    <>
      <Link href="/admin/access/requests">Back to access-change requests</Link>
      <PageHeader
        eyebrow="Administration · AD-01"
        title="Access request"
        description="Review the exact saved proposal, independent decision and controlled application."
      />
      <Boundary />
      <ReadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {resource.data && !resource.loading && !resource.error && (
        <RequestDetail
          key={`${id}:${resource.data.request.version}`}
          detail={resource.data}
          retry={resource.reload}
        />
      )}
    </>
  );
}
function RequestDetail({
  detail: d,
  retry,
}: {
  detail: Detail;
  retry: () => void;
}) {
  const command = useAccessCommand(d.actor, d.request.id),
    [decision, setDecision] = useState("Returned"),
    [reason, setReason] = useState("");
  const r = d.request;
  if (hidden(command.error))
    return <ReadState loading={false} error={command.error} retry={retry} />;
  return (
    <>
      <h2>
        {r.subject_name} · {r.capability}
      </h2>
      <Status value={r.state} />
      <p className="narrative">
        Request {r.id} · Version {r.version}
      </p>
      <Scope request={r} />
      <p>
        Requester: {r.requester_name}. Named reviewer: {r.reviewer_name}.
      </p>
      <p>
        Proposed start: <Stamp value={r.valid_from} /> (Australia/Brisbane).
        Proposed end:{" "}
        {r.valid_to ? (
          <>
            <Stamp value={r.valid_to} /> (Australia/Brisbane)
          </>
        ) : (
          "No end date"
        )}
        .
      </p>
      <p>Request reason: {r.reason}</p>
      {r.state === "Approved" && (
        <p className="callout">
          Approved, awaiting separate application. This request has not
          installed a grant. Application must happen before the proposed start
          and rechecks the exact scope, people and current duties.
        </p>
      )}
      {r.state === "Applied" && (
        <div className="callout">
          <p>
            Applied <Stamp value={r.applied_at} />. The approved grant was
            installed with the exact dates above. Applied does not mean current
            effective access; authentication, validity, working company and
            business checks still apply.
          </p>
          <p className="narrative">Grant {r.grant_id}</p>
          <p>Application reason: {r.application_reason}</p>
          <Link href={`/admin/access/${r.subject_id}`}>
            Inspect current person access
          </Link>
        </div>
      )}
      {r.state === "Returned" && (
        <p className="callout">
          Returned: {r.decision_reason}. The requester can submit a new
          corrected proposal; this record stays unchanged.
        </p>
      )}
      {d.can_decide && !command.accepted && (
        <ValidationFields error={command.error}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void command.send(
                `${base}/${r.id}/decision`,
                { expected_version: r.version, decision, reason },
                `/admin/access/requests/${r.id}`,
                "Access decision",
                r.id,
              );
            }}
          >
            <fieldset
              disabled={command.busy || !!command.pending || !command.ready}
            >
              <legend>Independent decision</legend>
              <SelectField
                name="decision"
                label="Decision"
                value={decision}
                onChange={setDecision}
                required
                options={[
                  { id: "Returned", display_name: "Return for correction" },
                  { id: "Approved", display_name: "Approve proposal only" },
                ]}
              />
              <Field
                name="reason"
                label="Decision reason"
                value={reason}
                onChange={setReason}
                required
                maxLength={1000}
                hint="10–1000 characters. Approving does not change grants."
              />
              <Button type="submit">Record decision</Button>
            </fieldset>
          </form>
        </ValidationFields>
      )}
      {d.can_apply && !command.accepted && (
        <ValidationFields error={command.error}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void command.send(
                `${base}/${r.id}/apply`,
                { expected_version: r.version, reason },
                `/admin/access/requests/${r.id}`,
                "Access application",
                r.id,
              );
            }}
          >
            <fieldset
              disabled={command.busy || !!command.pending || !command.ready}
            >
              <legend>Apply approved local grant</legend>
              <p>
                This installs one grant for the person, capability, scope and
                dates shown above. You must differ from the reviewer and
                affected person. No date is shifted or backdated.
              </p>
              <Field
                name="reason"
                label="Application reason"
                value={reason}
                onChange={setReason}
                required
                maxLength={1000}
                hint="10–1000 characters. Explain why you are applying this exact approval."
              />
              <Button type="submit">Apply approved grant</Button>
            </fieldset>
          </form>
        </ValidationFields>
      )}
      <Recovery command={command} />
      <Button variant="secondary" onClick={retry}>
        Refresh request and history
      </Button>
      <h2>Saved history</h2>
      <ol>
        {d.history.map((h) => (
          <li key={h.request_version}>
            <strong>
              {h.command} · Version {h.request_version}
            </strong>{" "}
            · {h.actor_name} · <Stamp value={h.occurred_at} />
            <p>{h.reason}</p>
            <p className="narrative">Operation {h.operation_id}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
