import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import { duty, type Duty } from "./context";
import { costBindings } from "./costs";
import { productBindings } from "./products";
import { hash } from "./hash";
import {
  members,
  type PackageKind,
  type PackageContent,
  type PackageSnapshot,
  type PackageReference,
} from "./package-model";

export type PackageRoot = {
  id: string;
  workspace_id: string;
  company_id: string;
  kind: PackageKind;
  owner_id: string;
  version: number;
  current_revision_id: string;
  state: string;
  updated_at: Date;
};
export type PackageRevision = {
  id: string;
  package_id: string;
  version: number;
  fixture_owner_id: string;
  content: PackageContent;
  content_hash: string;
  created_by: string;
};
export type PackageEvent = {
  id: string;
  package_id: string;
  revision_id: string;
  version: number;
  action: string;
  state: string;
  actor_id: string;
  basis_id: string | null;
  report: Record<string, unknown>;
  report_hash: string;
};
export const packageError = (message: string) =>
  new AppError(409, "CpqPackageReviewRequired", message);
export async function packageRoot(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: Duty = "cpq.read",
) {
  const r = (
    await c.query<PackageRoot>(
      "SELECT * FROM ppo.cpq_packages WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, id],
    )
  ).rows[0];
  if (!r) throw unavailable();
  await duty(c, p, r.company_id, cap);
  return r;
}
export async function packageRevision(
  c: QueryClient,
  p: Principal,
  root: PackageRoot,
  id: string,
  current = false,
) {
  const r = (
    await c.query<PackageRevision>(
      "SELECT * FROM ppo.cpq_package_revisions WHERE workspace_id=$1 AND package_id=$2 AND id=$3",
      [p.workspace_id, root.id, id],
    )
  ).rows[0];
  if (!r) throw unavailable();
  if (
    hash(r.content) !== r.content_hash ||
    r.fixture_owner_id !== r.content.fixture_owner_id
  )
    throw packageError("The retained package content does not match its hash.");
  await productBindings(c, p, root.company_id, r.content.definition, current);
  await costBindings(c, p, root.company_id, r.content.definition, current);
  return r;
}
export async function packageEvent(
  c: QueryClient,
  p: Principal,
  root: PackageRoot,
  id: string,
) {
  const e = (
    await c.query<PackageEvent>(
      "SELECT * FROM ppo.cpq_package_events WHERE workspace_id=$1 AND package_id=$2 AND id=$3",
      [p.workspace_id, root.id, id],
    )
  ).rows[0];
  if (!e) throw unavailable();
  if (hash(e.report) !== e.report_hash)
    throw packageError(
      "The retained package evidence does not match its hash.",
    );
  return e;
}
export async function latestPackageEvent(
  c: QueryClient,
  p: Principal,
  root: PackageRoot,
) {
  const r = (
    await c.query<{ id: string }>(
      "SELECT id FROM ppo.cpq_package_events WHERE workspace_id=$1 AND package_id=$2 ORDER BY version DESC LIMIT 1",
      [p.workspace_id, root.id],
    )
  ).rows[0];
  if (!r) throw unavailable();
  return packageEvent(c, p, root, r.id);
}
export async function publishedPackage(
  c: QueryClient,
  p: Principal,
  company: string,
  ref: PackageReference,
  current = false,
) {
  const root = await packageRoot(c, p, ref.package_id);
  if (root.company_id !== company) throw unavailable();
  const revision = await packageRevision(c, p, root, ref.revision_id, current);
  const publication = await packageEvent(c, p, root, ref.publication_id);
  if (
    revision.content_hash !== ref.content_hash ||
    publication.revision_id !== revision.id ||
    publication.action !== "Publish" ||
    publication.state !== "Published" ||
    !publication.basis_id
  )
    throw packageError(
      "Select the exact published package revision and evidence.",
    );
  const review = await packageEvent(c, p, root, publication.basis_id);
  if (!review.basis_id)
    throw packageError("Package review evidence is missing.");
  const attestation = await packageEvent(c, p, root, review.basis_id);
  if (
    review.revision_id !== revision.id ||
    review.state !== "Reviewed" ||
    attestation.revision_id !== revision.id ||
    attestation.state !== "Tested" ||
    attestation.report.passed !== true ||
    attestation.report.content_hash !== revision.content_hash ||
    review.report.basis_id !== attestation.id ||
    review.report.outcome !== "Approved" ||
    review.report.basis_hash !== attestation.report_hash ||
    publication.report.review_id !== review.id ||
    publication.report.attestation_id !== attestation.id ||
    publication.report.review_hash !== review.report_hash ||
    publication.report.attestation_hash !== attestation.report_hash
  )
    throw packageError(
      "The exact package fixture and review evidence is incomplete.",
    );
  if (current) {
    if (
      root.current_revision_id !== revision.id ||
      root.state !== "Published" ||
      publication.version !== root.version
    )
      throw packageError(
        "This package is changed, withdrawn or superseded. Explicitly select and review a published revision; no replacement is automatic.",
      );
    for (const [actor, cap] of [
      [root.owner_id, "cpq.author"],
      [revision.fixture_owner_id, "cpq.author"],
      [review.actor_id, "cpq.review"],
      [publication.actor_id, "cpq.publish"],
    ] as const) {
      const principal = { ...p, actor_id: actor };
      await duty(c, principal, company, cap);
      await packageRevision(c, principal, root, revision.id);
    }
  }
  const snapshot: PackageSnapshot = {
    package_id: ref.package_id,
    revision_id: ref.revision_id,
    content_hash: ref.content_hash,
    publication_id: ref.publication_id,
    kind: root.kind,
    owner_id: root.owner_id,
    fixture_owner_id: revision.fixture_owner_id,
    evidence_hash: publication.report_hash,
    members: revision.content.member_keys.map((key) => ({
      key,
      content_hash: hash(
        members(revision.content.definition, root.kind).find(
          (m) => m.key === key,
        )!,
      ),
    })),
  };
  return { root, revision, publication, review, attestation, snapshot };
}
export async function packageReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  const e = (
    await c.query<{ revision_id: string; action: string }>(
      "SELECT revision_id,action FROM ppo.cpq_package_events WHERE workspace_id=$1 AND package_id=$2 AND actor_id=$3 AND operation_id=$4",
      [p.workspace_id, id, p.actor_id, operation],
    )
  ).rows[0];
  if (!e) throw unavailable();
  const cap =
    e.action === "Publish"
      ? "cpq.publish"
      : e.action === "Review"
        ? "cpq.review"
        : "cpq.author";
  const root = await packageRoot(c, p, id, cap);
  await packageRevision(c, p, root, e.revision_id);
}
