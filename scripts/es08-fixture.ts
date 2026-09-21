// Dedicated public Screen Systems fixture; no production connections or private rates.
import { mkdir, writeFile } from "node:fs/promises";
import { localConfig } from "../src/platform/config";
import { database, closeDatabase } from "../src/platform/database";
import { reset } from "./database";
import { specialistFixture } from "../tests/helpers/specialist";
import { fixtureIds } from "../src/estimating/specialist/fixture-policy";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("ES08 fixture requires ppo_synthetic_test");
try {
  if (process.argv.includes("reset")) {
    process.env.PPO_ALLOW_RESET = "dispose-synthetic";
    process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
    await reset();
  }
  if (
    process.argv.includes("revoke-edit") ||
    process.argv.includes("revoke-read")
  ) {
    const capability = process.argv.includes("revoke-read")
      ? "estimating.read"
      : "estimating.edit";
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=(SELECT owner_id FROM ppo.specialist_configurations WHERE id=$1) AND capability=$2",
      [fixtureIds.configuration, capability],
    );
  } else if (
    !(
      await database().query(
        "SELECT 1 FROM ppo.specialist_configurations WHERE id=$1",
        [fixtureIds.configuration],
      )
    ).rowCount
  )
    await specialistFixture(true);
  await mkdir("tmp", { recursive: true });
  await writeFile(
    "tmp/es08-fixture.json",
    JSON.stringify(
      {
        ...fixtureIds,
        route: `/estimating/configurations/${fixtureIds.configuration}/configure`,
      },
      null,
      2,
    ),
  );
  console.log(
    "Dedicated SYN Northbank Screen Systems fixture ready in ppo_synthetic_test",
  );
} finally {
  await closeDatabase();
}
