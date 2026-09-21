"use client";
import Link from "next/link";
import { useCrmResource } from "./crm-state";
export function SpecialistEntry({
  workspaceId,
  optionId,
}: {
  workspaceId?: string;
  optionId?: string;
}) {
  const contract = useCrmResource<{ available: boolean }>(
    "estimating/configurations/availability",
    true,
  );
  if (!contract.data?.available) return null;
  return (
    <Link
      href={`/estimating/configurations${workspaceId ? `?estimating_workspace_id=${workspaceId}${optionId ? `&option_id=${optionId}` : ""}` : ""}`}
    >
      Specialist configurations
    </Link>
  );
}
