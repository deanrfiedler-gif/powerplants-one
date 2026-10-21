"use client";
import { useState } from "react";
import {
  Field,
  SelectField,
  ValidationFields,
  ErrorNotice,
} from "../business-ui";
import { CommandStatus, type CsOptions } from "../cs-forms";
import { useCrmCommand } from "../crm-state";
import { Button } from "../ui/button";
import {
  useSurveyFormFocus,
  SurveySection,
  surveyDate,
  type SurveyWorkspace,
} from "./survey-ui";
import type { SurveyContent } from "../../shared/cs/model";
export function SurveyPhotos({
  data,
  options,
  onSaved,
}: {
  data: SurveyWorkspace;
  options: CsOptions | null;
  onSaved: () => void;
}) {
  const [adding, setAdding] = useState(false),
    [correcting, setCorrecting] = useState<string | null>(null);
  const editable = data.can_edit && data.record.state === "Draft";
  return (
    <>
      <SurveySection
        title="Original photos"
        action={
          editable &&
          !adding &&
          !correcting &&
          options &&
          data.photos.length < 8 ? (
            <Button onClick={() => setAdding(true)}>Add photo</Button>
          ) : undefined
        }
      >
        <p className="srv-note">
          The original file is retained unchanged. Caption corrections are
          separate records.
        </p>
        <div className="srv-photo-grid">
          {data.photos.map((photo) => {
            const facts = data.survey?.photo_facts.find(
              (p) => p.id === photo.id,
            );
            return (
              <article className="srv-photo" key={photo.id}>
                <a
                  className="srv-photo-original"
                  href={
                    "/api/v1/cs/Survey/" +
                    data.record.id +
                    "/photos/" +
                    photo.id
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Open original{" "}
                  {facts?.media_type.split("/")[1].toUpperCase() ?? "image"}
                </a>
                <div>
                  <h3>{photo.caption?.caption ?? "Original photo"}</h3>
                  <p>{facts?.file_name ?? "Original filename not recorded"}</p>
                  <p>
                    {Math.ceil(photo.byte_count / 1024)} KiB ·{" "}
                    {facts?.media_type ?? "image/png"} · original retained
                  </p>
                  <details>
                    <summary>SHA-256 and recording</summary>
                    <code>{photo.content_hash}</code>
                    <p>
                      {photo.observer} · {photo.captured_on}
                    </p>
                    <p>{photo.method_source}</p>
                  </details>
                  {editable && !adding && !correcting && (
                    <Button
                      variant="quiet"
                      onClick={() => setCorrecting(photo.id)}
                    >
                      Correct caption
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        {!data.photos.length && <p>No original photos recorded.</p>}
      </SurveySection>
      {adding && options && (
        <PhotoForm
          data={data}
          options={options}
          onClose={() => setAdding(false)}
          onSaved={onSaved}
        />
      )}
      {correcting && (
        <CaptionForm
          key={correcting}
          data={data}
          photoId={correcting}
          onClose={() => setCorrecting(null)}
          onSaved={onSaved}
        />
      )}
      <SurveySection title="Caption corrections">
        {data.survey?.captions
          .filter((c) => c.predecessor_id)
          .map((c) => (
            <article className="srv-decision" key={c.id}>
              <strong>{c.caption}</strong>
              <p>
                {surveyDate(c.recorded_at, data.survey?.site.timezone, true)} ·
                original file unchanged
              </p>
              <p>
                Previous:{" "}
                {data.survey?.captions.find((p) => p.id === c.predecessor_id)
                  ?.caption ?? "Earlier retained caption"}
              </p>
            </article>
          ))}
        {!data.survey?.captions.some((c) => c.predecessor_id) && (
          <p>No caption corrections recorded.</p>
        )}
      </SurveySection>
    </>
  );
}
function PhotoForm({
  data,
  options,
  onClose,
  onSaved,
}: {
  data: SurveyWorkspace;
  options: CsOptions;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [base] = useState(data.record),
    [file, setFile] = useState<{ name: string; encoded: string } | null>(null),
    [error, setError] = useState<unknown>(null),
    [caption, setCaption] = useState(""),
    [method, setMethod] = useState(""),
    [date, setDate] = useState(""),
    [target, setTarget] = useState("");
  const formRef = useSurveyFormFocus();
  const command = useCrmCommand(
    () => {
      onSaved();
      onClose();
    },
    "Unsaved",
    undefined,
    true,
    ["view"],
  );
  const content = base.content as SurveyContent;
  const targets = [
    ...options.facilities
      .filter((f) => content.facility_ids.includes(f.id))
      .map((f) => ({ ...f, id: "facility:" + f.id })),
    ...options.assets
      .filter((a) => content.asset_ids.includes(a.id))
      .map((a) => ({ ...a, id: "asset:" + a.id })),
  ];
  return (
    <form
      ref={formRef}
      className="srv-form"
      onChange={command.dirty}
      onSubmit={(e) => {
        e.preventDefault();
        if (!file) {
          setError({ message: "Choose an original image." });
          return;
        }
        const [kind, id] = target.split(":");
        void command.send("cs/Survey/" + base.id + "/photos", {
          id: crypto.randomUUID(),
          expected_version: base.version,
          file_name: file.name,
          file_base64: file.encoded,
          caption,
          method_source: method,
          captured_on: date,
          observer:
            options.owners.edit.find((u) => u.id === data.actor_id)
              ?.display_name ?? "Current user",
          asset_id: kind === "asset" ? id : null,
          facility_id:
            kind === "asset"
              ? (options.assets.find((a) => a.id === id)?.facility_id ?? null)
              : kind === "facility"
                ? id
                : null,
          reason: "Retain original photo: " + file.name,
        });
      }}
    >
      <SurveySection title="Add original photo">
        <ValidationFields error={command.error}>
          <fieldset disabled={command.busy || command.uncertain}>
            <div className="field">
              <label htmlFor="survey-photo-file">Original image</label>
              <input
                id="survey-photo-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={async (e) => {
                  const image = e.target.files?.[0];
                  setFile(null);
                  setError(null);
                  if (!image) return;
                  if (
                    image.size > 1048576 ||
                    !["image/jpeg", "image/png", "image/webp"].includes(
                      image.type,
                    )
                  ) {
                    setError({
                      message: "Choose JPG, PNG or WebP up to 1 MiB.",
                    });
                    return;
                  }
                  try {
                    const encoded = await new Promise<string>(
                      (resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () =>
                          resolve(String(reader.result).split(",")[1]);
                        reader.onerror = () =>
                          reject(new Error("Could not read the image."));
                        reader.readAsDataURL(image);
                      },
                    );
                    setFile({ name: image.name, encoded });
                    command.dirty();
                  } catch {
                    setError({
                      message:
                        "Could not read the image. Choose the file again.",
                    });
                  }
                }}
              />
              <small>
                JPG, PNG or WebP · up to 1 MiB each · eight originals per
                survey.
              </small>
            </div>
            <SelectField
              name="photo-target"
              label="Target"
              value={target}
              onChange={setTarget}
              options={targets}
              empty="Whole site"
            />
            <Field
              name="caption"
              label="Caption"
              value={caption}
              onChange={setCaption}
              multiline
              required
              maxLength={2000}
            />
            <Field
              name="method_source"
              label="Method and source"
              value={method}
              onChange={setMethod}
              required
              maxLength={2000}
            />
            <Field
              name="captured_on"
              label="Captured on"
              value={date}
              onChange={setDate}
              type="date"
              required
            />
            <footer className="srv-form-actions">
              <Button
                onClick={() => {
                  if (
                    !command.hasUnsavedChanges ||
                    window.confirm("Discard this unsaved photo entry?")
                  ) {
                    command.discard();
                    onClose();
                  }
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Retain original photo
              </Button>
            </footer>
          </fieldset>
        </ValidationFields>
        <ErrorNotice error={error} />
        <CommandStatus command={command} />
      </SurveySection>
    </form>
  );
}
function CaptionForm({
  data,
  photoId,
  onClose,
  onSaved,
}: {
  data: SurveyWorkspace;
  photoId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [base] = useState(() => ({
    version: data.record.version,
    photo: data.photos.find((p) => p.id === photoId)!,
  }));
  const [caption, setCaption] = useState(
      String(base.photo.caption?.caption ?? ""),
    ),
    [reason, setReason] = useState("");
  const formRef = useSurveyFormFocus();
  const command = useCrmCommand(
    () => {
      onSaved();
      onClose();
    },
    "Unsaved",
    undefined,
    true,
    ["view"],
  );
  return (
    <form
      ref={formRef}
      className="srv-form"
      onChange={command.dirty}
      onSubmit={(e) => {
        e.preventDefault();
        void command.send(
          "cs/Survey/" + data.record.id + "/photos/" + photoId + "/caption",
          {
            expected_version: base.version,
            previous_caption_id: base.photo.caption.id,
            caption,
            reason,
          },
        );
      }}
    >
      <SurveySection title="Correct caption">
        <ValidationFields error={command.error}>
          <fieldset disabled={command.busy || command.uncertain}>
            <Field
              name="caption"
              label="Corrected caption"
              value={caption}
              onChange={setCaption}
              required
              multiline
              maxLength={2000}
            />
            <Field
              name="reason"
              label="Reason for correction"
              value={reason}
              onChange={setReason}
              required
            />
            <p>The earlier caption and original image remain retained.</p>
            <footer className="srv-form-actions">
              <Button
                onClick={() => {
                  if (
                    !command.hasUnsavedChanges ||
                    window.confirm("Discard this caption correction?")
                  ) {
                    command.discard();
                    onClose();
                  }
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save caption correction
              </Button>
            </footer>
          </fieldset>
        </ValidationFields>
        <CommandStatus command={command} />
      </SurveySection>
    </form>
  );
}
