// Authored expectations for seed 49, independent of its SQL. No counters advance.
export const supplySeedIdentities = [1, 2, 3].map((number) => ({
  workspace_id: "10000000-0000-4000-8000-000000000001",
  id: `5c000049-0000-4000-8000-${String(number).padStart(12, "0")}`,
  object_type: "SupplyRecord",
  display_number: null,
  synthetic: true,
}));
