import { randomUUID } from "node:crypto";
import type { Principal } from "../../platform/identity";
import { database } from "../../platform/database";
import { AppError, unavailable } from "../../platform/errors";
import { sharedOperation } from "../../platform/operations";
import { documentStore, digest } from "../../documents/store";
import { inspectPng } from "../../field/media";
import { visible } from "../reads";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  label,
  narrative,
  optionalId,
  dateOnly,
  invalid,
} from "../validation";
import { currentVersion } from "../contacts/commands";
import type { SurveyContent } from "./model";
import { csRecord, contentAuthority, updateCs } from "./service";

export async function addSurveyPhoto(p: Principal, id: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "id",
    "facility_id",
    "asset_id",
    "observer",
    "captured_on",
    "method_source",
    "caption",
    "png_base64",
  ]);
  if (
    typeof r.png_base64 !== "string" ||
    r.png_base64.length > 5592408 ||
    !/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      r.png_base64,
    )
  )
    invalid("png_base64", "Choose an original PNG image up to 4 MB.");
  const bytes = Buffer.from(r.png_base64 as string, "base64");
  inspectPng(bytes);
  const command = {
    ...common(r),
    survey_id: uuid(id, "survey_id"),
    id: uuid(r.id, "id"),
    expected_version: version(r.expected_version),
    facility_id: optionalId(r.facility_id, "facility_id"),
    asset_id: optionalId(r.asset_id, "asset_id"),
    observer: label(r.observer, "observer", 200),
    captured_on: dateOnly(r.captured_on, "captured_on"),
    method_source: narrative(r.method_source, "method_source", 2000),
    caption: narrative(r.caption, "caption", 2000),
    content_hash: digest(bytes),
  };
  return sharedOperation(
    p,
    command,
    "CsPhoto:Survey",
    (c) => csRecord(c, p, "Survey", id, true),
    async (c, row) => {
      currentVersion(row.version, command.expected_version);
      if (row.state !== "Draft")
        throw new AppError(
          409,
          "StateConflict",
          "Add evidence to a Draft survey revision.",
        );
      const content = row.content as SurveyContent;
      await contentAuthority(c, p, "Survey", row, content);
      if (
        (command.facility_id &&
          !content.facility_ids.includes(command.facility_id)) ||
        (command.asset_id && !content.asset_ids.includes(command.asset_id))
      )
        throw unavailable();
      if (command.asset_id && command.facility_id) {
        const asset = await visible(c, p, "Asset", command.asset_id);
        if (asset.facility_id !== command.facility_id)
          invalid(
            "facility_id",
            "The equipment and Facility targets must match the canonical installed location.",
          );
      }
      const key = await documentStore().store(
        {
          workspace_id: p.workspace_id,
          actor_id: p.actor_id,
          operation_id: command.operation_id,
        },
        bytes,
        command.content_hash,
      );
      await c.query(
        "INSERT INTO ppo.cs_survey_photos(id,workspace_id,survey_id,facility_id,asset_id,observer,captured_on,method_source,storage_key,content_hash,byte_count,recorded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
        [
          command.id,
          p.workspace_id,
          id,
          command.facility_id,
          command.asset_id,
          command.observer,
          command.captured_on,
          command.method_source,
          key,
          command.content_hash,
          bytes.length,
          p.actor_id,
        ],
      );
      await c.query(
        "INSERT INTO ppo.cs_photo_captions(id,workspace_id,survey_id,photo_id,caption,recorded_by) VALUES($1,$2,$3,$4,$5,$6)",
        [
          randomUUID(),
          p.workspace_id,
          id,
          command.id,
          command.caption,
          p.actor_id,
        ],
      );
      return updateCs(c, p, "Survey", row, command.reason);
    },
    "SiteSurvey",
    "SharedRecordUpdated",
  );
}
export async function correctSurveyCaption(
  p: Principal,
  id: string,
  photoId: string,
  input: unknown,
) {
  const r = object(input, [
      ...commonKeys,
      "expected_version",
      "previous_caption_id",
      "caption",
    ]),
    command = {
      ...common(r),
      id: uuid(id, "id"),
      photo_id: uuid(photoId, "photo_id"),
      expected_version: version(r.expected_version),
      previous_caption_id: uuid(r.previous_caption_id, "previous_caption_id"),
      caption: narrative(r.caption, "caption", 2000),
    };
  return sharedOperation(
    p,
    command,
    "CsCaption:Survey",
    (c) => csRecord(c, p, "Survey", id, true),
    async (c, row) => {
      currentVersion(row.version, command.expected_version);
      if (row.state !== "Draft")
        throw new AppError(
          409,
          "StateConflict",
          "Start a successor draft before correcting evidence metadata.",
        );
      await contentAuthority(c, p, "Survey", row, row.content);
      const previous = (
        await c.query(
          "SELECT c.id FROM ppo.cs_photo_captions c JOIN ppo.cs_survey_photos p ON (p.workspace_id,p.id)=(c.workspace_id,c.photo_id) WHERE p.workspace_id=$1 AND p.survey_id=$2 AND p.id=$3 ORDER BY c.recorded_at DESC,c.id LIMIT 1",
          [p.workspace_id, id, command.photo_id],
        )
      ).rows[0];
      if (!previous) throw unavailable();
      if (previous.id !== command.previous_caption_id)
        throw new AppError(
          409,
          "VersionConflict",
          "The caption has changed. Reload the current caption before correcting it.",
        );
      await c.query(
        "INSERT INTO ppo.cs_photo_captions(id,workspace_id,survey_id,photo_id,predecessor_id,caption,recorded_by) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          randomUUID(),
          p.workspace_id,
          id,
          command.photo_id,
          previous.id,
          command.caption,
          p.actor_id,
        ],
      );
      return updateCs(c, p, "Survey", row, command.reason);
    },
    "SiteSurvey",
    "SharedRecordUpdated",
  );
}
export async function surveyPhotoBytes(
  p: Principal,
  id: string,
  photoId: string,
) {
  const c = database(),
    row = await csRecord(c, p, "Survey", id);
  await contentAuthority(c, p, "Survey", row, row.content);
  const photo = (
    await c.query(
      "SELECT * FROM ppo.cs_survey_photos WHERE workspace_id=$1 AND survey_id=$2 AND id=$3",
      [p.workspace_id, id, uuid(photoId, "photo_id")],
    )
  ).rows[0];
  if (!photo) throw unavailable();
  const bytes = await documentStore().read(
    {
      workspace_id: p.workspace_id,
      actor_id: p.actor_id,
      operation_id: photo.storage_key.item_id,
    },
    photo.storage_key,
  );
  if (bytes.length !== photo.byte_count || digest(bytes) !== photo.content_hash)
    throw new AppError(
      503,
      "ExactDocumentUnavailable",
      "The exact original photo is unavailable. Its reference is retained for recovery.",
    );
  inspectPng(Buffer.from(bytes));
  await csRecord(c, p, "Survey", id);
  return bytes;
}
