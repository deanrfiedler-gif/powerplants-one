import type { NextRequest } from "next/server";
import { database } from "../../../../platform/database";
import { failure, localRequest, reply } from "../../../../platform/http";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    localRequest(request);
    const migration = await database().query(
      "SELECT version FROM public.ppo_migrations WHERE version=1",
    );
    if (migration.rowCount !== 1) throw new Error("P01 migration is not applied.");
    return reply({
      environment: "LocalSynthetic",
      database: "Connected",
      observed_at: new Date().toISOString(),
    });
  } catch (error) {
    return failure(error);
  }
}
