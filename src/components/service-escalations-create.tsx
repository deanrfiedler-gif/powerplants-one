"use client";
import { useEffect, useState, type RefObject } from "react";
import {
  ErrorNotice,
  Field,
  SelectField,
  useResource,
  useCommand,
  ReadState,
  ValidationFields,
  type Failure,
} from "./business-ui";
import { useUnsavedChanges } from "./record-ui";
import { Button, ButtonLink } from "./ui/button";
import type { CaseOptions } from "../service/escalations/reads";
import type { readFindings } from "../service/findings/reads";
import type { OperationReceipt } from "../platform/operations";
import type { Wire } from "./service-escalations-command";
export function OpenCaseForm({
  findingKey,
  guardRef,
  onCreated,
  onCancel,
}: {
  findingKey: string;
  guardRef: RefObject<() => boolean>;
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const [id] = useState(() => crypto.randomUUID()),
    [key, setKey] = useState(findingKey),
    [search, setSearch] = useState(""),
    [assetId, setAssetId] = useState(""),
    [owner, setOwner] = useState(""),
    [fault, setFault] = useState<string | null>(null),
    [faultType, setFaultType] = useState(""),
    [reason, setReason] = useState(""),
    [dirty, setDirty] = useState(false);
  const findings = useResource<Wire<Awaited<ReturnType<typeof readFindings>>>>(
    !findingKey
      ? `service/findings?${new URLSearchParams({ view: "open", q: search, limit: "50" })}`
      : null,
  );
  const options = useResource<Wire<CaseOptions>>(
      key
        ? `service/escalations/options?${new URLSearchParams({ finding_key: key })}`
        : null,
    ),
    cmd = useCommand();
  const uncertain = !!(cmd.error as Failure)?.retryable,
    locked = cmd.busy || uncertain;
  const release = useUnsavedChanges(dirty, locked);
  useEffect(() => {
    guardRef.current = () =>
      !locked && (!dirty || window.confirm("Discard this unsaved case?"));
    return () => {
      guardRef.current = () => true;
    };
  }, [dirty, locked, guardRef]);
  const selectedAsset =
    assetId ||
    (options.data?.equipment.length === 1 ? options.data.equipment[0].id : "");
  const equipment = options.data?.equipment.find((a) => a.id === selectedAsset),
    description = fault ?? options.data?.finding.what_remains ?? "";
  const change = (work: () => void) => {
    work();
    setDirty(true);
  };
  async function save() {
    const result = await cmd.send<OperationReceipt>("service/escalations", {
      id,
      finding_key: key,
      asset_id: selectedAsset,
      owner_id: owner,
      fault: description,
      fault_type: faultType,
      reason,
    });
    if (result) {
      setDirty(false);
      release();
      guardRef.current = () => true;
      onCreated(result.record_id);
    }
  }
  return (
    <section className="sv08-create sv08-card">
      <h1>Request remote diagnosis</h1>
      <p>
        Open a synthetic case from a permitted finding and its equipment. The
        case has its own number and correspondence; the finding retains its own
        closure rules.
      </p>
      <ValidationFields error={cmd.error}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <ErrorNotice error={cmd.error} />
          <fieldset disabled={locked}>
            {!findingKey && (
              <>
                <Field
                  name="sv08-find-search"
                  label="Search open findings"
                  value={search}
                  onChange={setSearch}
                />
                <ReadState
                  loading={findings.loading}
                  error={findings.error}
                  retry={findings.reload}
                />
                <SelectField
                  name="sv08-finding_key"
                  validationField="finding_key"
                  label="Finding"
                  required
                  value={key}
                  onChange={(v) =>
                    change(() => {
                      setKey(v);
                      setAssetId("");
                      setOwner("");
                      setFault(null);
                    })
                  }
                  options={(findings.data?.items ?? []).map((f) => ({
                    id: f.id,
                    display_name: f.what_remains,
                    display_number: f.source_record.reference,
                  }))}
                />
                <small>
                  Up to 50 permitted source findings. Refine the search or open
                  this action from Findings.
                </small>
              </>
            )}
            <ReadState
              loading={options.loading}
              error={options.error}
              retry={options.reload}
            />
            {options.data && !options.loading && !options.error && (
              <>
                <p>
                  <strong>Finding:</strong> {options.data.finding.what_remains}{" "}
                  · {options.data.finding.source_record.reference}
                </p>
                <SelectField
                  name="sv08-asset_id"
                  validationField="asset_id"
                  label="Equipment"
                  required
                  value={selectedAsset}
                  onChange={(v) =>
                    change(() => {
                      setAssetId(v);
                      setOwner("");
                    })
                  }
                  options={options.data.equipment.map((a) => ({
                    id: a.id,
                    display_name: `${a.description} · ${a.manufacturer ?? "Manufacturer not recorded"}`,
                    display_number: a.display_number,
                  }))}
                />
                {!options.data.equipment.length && (
                  <p>
                    No permitted equipment is available for this finding. Review
                    its equipment and site in the source workflow.
                  </p>
                )}
                <Field
                  name="sv08-fault"
                  validationField="fault"
                  label="Fault"
                  required
                  value={description}
                  onChange={(v) => change(() => setFault(v))}
                />
                <Field
                  name="sv08-fault_type"
                  validationField="fault_type"
                  label="Fault type"
                  required
                  maxLength={100}
                  value={faultType}
                  onChange={(v) => change(() => setFaultType(v))}
                />
                <SelectField
                  name="sv08-owner_id"
                  validationField="owner_id"
                  label="Case owner"
                  required
                  value={owner}
                  onChange={(v) => change(() => setOwner(v))}
                  options={equipment?.owners ?? []}
                />
                <p>
                  Customer contact details, prices and credentials do not belong
                  in technical evidence.
                </p>
                <Field
                  name="sv08-reason"
                  validationField="reason"
                  label="Reason for opening"
                  required
                  multiline
                  maxLength={1000}
                  value={reason}
                  onChange={(v) => change(() => setReason(v))}
                />
              </>
            )}
          </fieldset>
          {uncertain && (
            <p role="status">
              The result is unconfirmed. Retry the unchanged request to recover
              its original case.
            </p>
          )}
          <div className="sv08-actions">
            <Button
              type="submit"
              variant="primary"
              disabled={
                cmd.busy || options.loading || !!options.error || !equipment
              }
            >
              {uncertain
                ? "Retry unchanged request"
                : cmd.busy
                  ? "Opening…"
                  : "Open case"}
            </Button>
            <Button
              disabled={locked}
              onClick={() => {
                if (guardRef.current()) onCancel();
              }}
            >
              Cancel
            </Button>
            <ButtonLink href="/service/findings">Open Findings</ButtonLink>
          </div>
        </form>
      </ValidationFields>
    </section>
  );
}
