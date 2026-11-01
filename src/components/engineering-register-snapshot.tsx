"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { CoordinationForm, EngineeringModal } from "./engineering-workspace";
import {
  ErrorNotice,
  Field,
  ReadState,
  ValidationFields,
  useCommand,
  useResource,
  type Failure,
} from "./business-ui";
import { Button, ButtonLink } from "./ui/button";
import { RecordPanel, RecordTabs, useUnsavedChanges } from "./record-ui";
import { WorklistMenu } from "./crm-worklist-tools";
import { EngineeringIcon as Icon } from "./engineering-register-icon";
import { ControlSummary } from "../engineering/control/components/summary";
import { engineeringDate, type EngineeringDetail } from "../engineering/model";
import type { ControlRead } from "../engineering/control/reads";
import { formatDateTime } from "../shell/date-format";
import { useSearchParams, useRouter } from "next/navigation";
import { navigateWithReview } from "./navigation-intent";
import { RegisterChip } from "./ui/register-table";
import { phoneMenuEvent } from "./shell-phone-header";
import { useConversationsAction } from "./shell-conversations";
export function EngineeringSnapshot({
  id,
  draft,
  onDraft,
  onClose,
  onSaved,
  previous,
  next,
  position,
  workloadNotice,
  handoverError,
  onRefreshRegister,
}: {
  id: string;
  draft: string;
  onDraft: (value: string) => void;
  onClose: () => void;
  onSaved: () => void;
  previous?: () => void;
  next?: () => void;
  position: string;
  workloadNotice: string;
  handoverError: unknown;
  onRefreshRegister: () => void;
}) {
  const params = useSearchParams(),
    router = useRouter();
  const conversations = useConversationsAction();
  const detail = useResource<EngineeringDetail>("engineering/" + id);
  const technical = useResource<ControlRead>("engineering/" + id + "/control");
  const command = useCommand(),
    noteVersion = useRef<number | null>(null);
  const tab = ["documents", "queries", "review"].includes(
    params.get("section") ?? "",
  )
    ? params.get("section")!
    : "documents";
  const setTab = (value: string) => {
    const next = new URLSearchParams(params);
    next.set("section", value);
    const href = "/engineering?" + next;
    navigateWithReview(() => router.replace(href, { scroll: false }), { href });
  };
  const [edit, setEdit] = useState(false),
    [showNote, setShowNote] = useState(!!draft);
  const [editBlocked, setEditBlocked] = useState(false),
    [editDirty, setEditDirty] = useState(false),
    [notice, setNotice] = useState("");
  const p = detail.error || detail.loading ? null : detail.data?.package;
  const blocked =
    command.busy ||
    !!(command.error as Failure | null)?.retryable ||
    editBlocked;
  useUnsavedChanges(editDirty, blocked, ["section"]);
  const reload = () => {
    detail.reload();
    technical.reload();
  };
  const leave = (action: () => void) => {
    if (blocked) return;
    if (
      editDirty &&
      !window.confirm(
        "Discard the unsaved coordination update? Your review note will be kept.",
      )
    )
      return;
    action();
  };
  const technicalChanged = !!(
    p &&
    technical.data &&
    technical.data.package.version !== p.version
  );
  const technicalRead = technicalChanged
    ? {
        ...technical,
        data: null,
        error: {
          message:
            "The package changed between reads. Refresh the snapshot to reconcile its facts.",
        },
      }
    : technical;
  const native =
    technicalRead.error || technicalRead.loading ? null : technicalRead.data;
  const cancelUpdate = () => {
    if (
      editDirty &&
      !window.confirm(
        "Discard the unsaved coordination update and reload the latest package?",
      )
    )
      return;
    setEdit(false);
    setEditDirty(false);
    reload();
  };
  const tabs = [
    {
      id: "documents",
      label: (
        <>Deliverables{native ? ` ${native.records.deliverable.length}` : ""}</>
      ),
    },
    {
      id: "queries",
      label: <>Queries{native ? ` ${native.records.query.length}` : ""}</>,
    },
    { id: "review", label: "Reviews & issues" },
  ];
  return (
    <EngineeringModal
      open
      drawer
      maxWidth={960}
      className="er-snapshot"
      closeIcon={
        <>
          <span className="er-close-desktop">×</span>
          <span className="er-close-phone">
            <Icon name="chevron-left" />
          </span>
        </>
      }
      hideFooter
      title={p?.display_number ?? "Engineering package"}
      onClose={() => leave(onClose)}
      blocked={blocked}
      navigation={
        <>
          <span className="er-position">{position}</span>
          <Button
            className="er-snapshot-step"
            aria-label="Previous package"
            disabled={!previous || blocked}
            onClick={() => previous && leave(previous)}
          >
            <Icon name="chevron-left" />
          </Button>
          <Button
            className="er-snapshot-step"
            aria-label="Next package"
            disabled={!next || blocked}
            onClick={() => next && leave(next)}
          >
            <Icon name="chevron-right" />
          </Button>
          <Button
            className="er-snapshot-refresh"
            aria-label="Refresh package snapshot"
            disabled={
              blocked || editDirty || detail.loading || technical.loading
            }
            onClick={reload}
          >
            <Icon name="rotate-left" />
          </Button>
          <div className="er-snapshot-phone-more">
            <WorklistMenu
              label="More package actions"
              icon="more"
              disabled={blocked}
            >
              <Button
                data-menu-close
                onClick={() =>
                  leave(() => {
                    onClose();
                    requestAnimationFrame(() =>
                      window.dispatchEvent(new CustomEvent(phoneMenuEvent)),
                    );
                  })
                }
              >
                Open menu
              </Button>
              {conversations && (
                <Button
                  data-menu-close
                  aria-label={conversations.name}
                  onClick={() =>
                    leave(() => {
                      navigateWithReview(() => router.push("/conversations"), {
                        href: "/conversations",
                      });
                    })
                  }
                >
                  Conversations {conversations.badge}
                </Button>
              )}
              <Button
                className="er-narrow-step"
                data-menu-close
                disabled={!previous}
                onClick={() => previous && leave(previous)}
              >
                Previous package
              </Button>
              <Button
                className="er-narrow-step"
                data-menu-close
                disabled={!next}
                onClick={() => next && leave(next)}
              >
                Next package
              </Button>
              <Button
                data-menu-close
                disabled={editDirty || detail.loading || technical.loading}
                onClick={reload}
              >
                Refresh package snapshot
              </Button>
            </WorklistMenu>
          </div>
        </>
      }
    >
      <ReadState loading={detail.loading} error={detail.error} retry={reload} />
      {p && !detail.error && (
        <div className="er-snapshot-columns">
          <div className="er-record">
            <div className="er-record-scroll">
              {(workloadNotice || !!handoverError) && (
                <div className="er-rule">
                  {workloadNotice && (
                    <p role="status">
                      {workloadNotice} Refresh this snapshot, or close it and
                      select packages again.
                    </p>
                  )}
                  {!!handoverError && (
                    <>
                      <p>
                        The workload read is unconfirmed. These snapshot facts
                        describe its last successful reads.
                      </p>
                      <ErrorNotice error={handoverError} focusOnError={false} />
                    </>
                  )}
                  <Button disabled={blocked} onClick={onRefreshRegister}>
                    Refresh workload
                  </Button>
                </div>
              )}
              <h2 className="er-record-title">{p.title}</h2>
              <p className="er-muted">
                {p.display_number} · Record version {p.version}
              </p>
              <div className="er-status-line">
                <RegisterChip
                  tone={
                    p.state === "Awaiting information" ? "attention" : "neutral"
                  }
                >
                  {p.state}
                </RegisterChip>
                <span>
                  {p.discipline} ·{" "}
                  {p.context_kind === "Project"
                    ? "Project work"
                    : "Presales support"}
                </span>
              </div>
              <section>
                <h3>Summary</h3>
                <dl className="er-facts">
                  <div>
                    <Icon name="building" />
                    <dt>Customer</dt>
                    <dd>{p.customer_name}</dd>
                  </div>
                  <div>
                    <Icon name="diagram-project" />
                    <dt>{p.context_kind}</dt>
                    <dd>
                      <Link
                        href={`${p.context_kind === "Project" ? "/projects" : "/sales/opportunities"}/${p.context_id}`}
                      >
                        {p.context_reference} · {p.context_title}
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <Icon name="user" />
                    <dt>Engineer</dt>
                    <dd>{p.owner_name}</dd>
                  </div>
                  <div>
                    <Icon name="badge-check" />
                    <dt>Technical reviewer</dt>
                    <dd>
                      <Link href={`/engineering/${p.id}/reviews`}>
                        See assigned technical reviews
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <Icon name="calendar-exclamation" />
                    <dt>Package required by</dt>
                    <dd>{engineeringDate(p.required_date)}</dd>
                  </div>
                  <div>
                    <Icon name="clock" />
                    <dt>Engineering effort</dt>
                    <dd>To be assessed</dd>
                  </div>
                </dl>
              </section>
              <section>
                <h3>Next action</h3>
                <p>{p.next_action}</p>
                <p className="er-muted">
                  {p.owner_name} ·{" "}
                  {p.action_due
                    ? engineeringDate(p.action_due)
                    : "Action date needed"}
                </p>
                {p.blocker && (
                  <div className="er-rule er-attention">
                    <strong>Awaiting design input</strong>
                    <p>{p.blocker}</p>
                  </div>
                )}
              </section>
              <section>
                <h3>Design brief</h3>
                <p>{p.brief}</p>
              </section>
              <section>
                <h3>Linked records</h3>
                <ul className="er-links">
                  <li>
                    <Link href={`/engineering/${id}/basis`}>
                      <Icon name="sitemap" />
                      Design basis & interfaces
                    </Link>
                  </li>
                  <li>
                    <Link href={`/engineering/${id}/materials`}>
                      <Icon name="layer-group" />
                      Released materials & substitutions
                    </Link>
                  </li>
                  <li>
                    <Link href={`/engineering/${id}/changes`}>
                      <Icon name="code-pull-request" />
                      Engineering changes
                    </Link>
                  </li>
                  <li>
                    <Link href={`/engineering/commissioning?package=${id}`}>
                      <Icon name="gauge" />
                      Commissioning basis & as-built release
                    </Link>
                  </li>
                </ul>
              </section>
              <p className="er-rule">
                Planned and authorised effort belongs to accountable
                deliverables and requires evidence. Actual effort and staff
                availability are unknown; utilisation is not calculated.
              </p>
              {!p.can_edit && (
                <p className="er-rule">
                  View only. Coordination and notes require package edit access.
                  Technical decisions retain their separate authority.
                </p>
              )}
              {edit && p.can_edit && (
                <CoordinationForm
                  key={p.id}
                  p={p}
                  onBlocked={setEditBlocked}
                  onDirty={setEditDirty}
                  onCancel={cancelUpdate}
                  onSaved={() => {
                    setEdit(false);
                    setEditBlocked(false);
                    setEditDirty(false);
                    reload();
                    onSaved();
                  }}
                />
              )}
            </div>
            <div className="er-record-footer">
              {p.can_edit && (
                <WorklistMenu
                  label="Package actions"
                  icon="more"
                  disabled={blocked || edit}
                >
                  <Button
                    data-menu-close
                    onClick={() => {
                      setShowNote(true);
                      setTab("review");
                    }}
                  >
                    Add note
                  </Button>
                </WorklistMenu>
              )}
              <ButtonLink
                href={`/engineering/${id}`}
                aria-disabled={blocked || undefined}
                onClick={(e) => {
                  if (blocked) e.preventDefault();
                }}
              >
                Open package
              </ButtonLink>
              {p.can_edit && !edit && (
                <Button
                  variant="primary"
                  disabled={blocked || detail.loading}
                  onClick={() => setEdit(true)}
                >
                  Update coordination
                </Button>
              )}
            </div>
          </div>
          <div className="er-activity">
            <div className="er-technical">
              <RecordTabs
                id="engineering-technical"
                label="Technical package sections"
                tabs={tabs}
                value={tab}
                onChange={setTab}
              />
              <ReadState
                loading={technicalRead.loading}
                error={technicalRead.error}
                retry={reload}
              />
              {native && (
                <>
                  {tabs.map((t) => (
                    <RecordPanel
                      key={t.id}
                      id="engineering-technical"
                      tab={t.id}
                      value={tab}
                    >
                      {tab === t.id && (
                        <ControlSummary
                          packageId={id}
                          mode={t.id as "documents" | "queries" | "review"}
                          snapshot={technicalRead}
                        />
                      )}
                    </RecordPanel>
                  ))}
                  <p className="er-footnote">
                    Permitted technical records · Read{" "}
                    {formatDateTime(native.observed_at)}. Restricted sources are
                    excluded.
                  </p>
                </>
              )}
              {!native && !technicalRead.loading && (
                <p className="er-rule">
                  Package details are available; technical facts are not
                  confirmed. Retry this source before relying on its records or
                  counts.
                </p>
              )}
            </div>
            <section className="er-history">
              <h3>History</h3>
              <p className="er-muted">
                Coordination history. Technical decisions and exact formal
                issues are separate.
              </p>
              {notice && <p role="status">{notice}</p>}
              {showNote && p.can_edit && (
                <form
                  className="er-note-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (detail.loading) return;
                    noteVersion.current ??= p.version;
                    const result = await command.send(
                      "engineering/" + id + "/notes",
                      {
                        expected_version: noteVersion.current,
                        note: draft,
                        reason: "Engineering coordination note",
                      },
                    );
                    if (result) {
                      onDraft("");
                      noteVersion.current = null;
                      command.clear();
                      setNotice("Note saved.");
                      reload();
                      onSaved();
                    }
                  }}
                >
                  <ValidationFields error={command.error}>
                    <ErrorNotice error={command.error} />
                    <fieldset disabled={blocked}>
                      <Field
                        name="note"
                        label="Add a review note"
                        multiline
                        required
                        value={draft}
                        onChange={onDraft}
                      />
                    </fieldset>
                  </ValidationFields>
                  <p className="er-footnote">
                    A note does not approve or release a design.
                  </p>
                  <Button
                    type="submit"
                    disabled={
                      detail.loading || command.busy || editBlocked || edit
                    }
                  >
                    {command.busy
                      ? "Saving…"
                      : blocked
                        ? "Retry original note"
                        : "Add note"}
                  </Button>
                  {(command.error as Failure | null)?.code ===
                    "VersionConflict" && (
                    <Button
                      onClick={() => {
                        noteVersion.current = null;
                        command.clear();
                        reload();
                      }}
                    >
                      Reload latest package and keep note
                    </Button>
                  )}
                </form>
              )}
              {detail.data?.has_more_history && (
                <p className="er-rule">
                  Latest 100 coordination events. Earlier events are retained;
                  this is not the complete history.
                </p>
              )}
              {detail.data?.events.map((e) => (
                <article key={e.package_version}>
                  <strong>
                    {e.event_type === "EngineeringRequested"
                      ? "Engineering request created"
                      : e.event_type === "EngineeringCoordinated"
                        ? "Coordination updated"
                        : "Review note added"}
                  </strong>
                  <small>
                    {e.actor_name} · {formatDateTime(e.created_at)} · Record
                    version {e.package_version}
                  </small>
                  <p>{e.note ?? e.reason}</p>
                </article>
              ))}
            </section>
          </div>
        </div>
      )}
    </EngineeringModal>
  );
}
