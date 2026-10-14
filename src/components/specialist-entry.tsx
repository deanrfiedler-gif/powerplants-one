"use client";
import Link from "next/link";
import { useCrmResource } from "./crm-state";
export function SpecialistEntry({
  workspaceId,
  optionId,
  role,
}: {
  workspaceId?: string;
  optionId?: string;
  role?: "menuitem";
}) {
  const contract = useCrmResource<{ available: boolean }>(
    "estimating/configurations/availability",
    true,
  );
  if (!contract.data?.available) return null;
  return (
    <Link
      role={role}
      href={`/estimating/configurations${workspaceId ? `?estimating_workspace_id=${workspaceId}${optionId ? `&option_id=${optionId}` : ""}` : ""}`}
    >
      Specialist configurations
    </Link>
  );
}
