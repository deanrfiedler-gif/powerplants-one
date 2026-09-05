import { documentStore } from "./store";
export const sourceFixtures = [
  {
    id: "c2000000-0000-4000-8000-000000000001",
    text: "Synthetic prototype — not for operational use\nVisual inspection reference version 1. Observe external condition only. Do not isolate, open, adjust or operate equipment. Stop and escalate uncertain identity or unsafe access.",
    hash: "363bc1e22ad3b41cb0c56f2959bf8e63e396a38ed039231ed20e65b1fffadc9a",
  },
  {
    id: "c2000000-0000-4000-8000-000000000002",
    text: "Synthetic prototype — not for operational use\nCollect the fictional visual-inspection kit before departure. No stock availability or procurement transaction is asserted.",
    hash: "706c6ea40ebdd04e9bafde18369a0a3c6ff778019d69543b3d08bdad651f7411",
  },
  {
    id: "c2000000-0000-4000-8000-000000000003",
    text: "PRIVATE_FINANCE_CANARY: fictional balances and margins must never appear in technician output or attachment names.",
    hash: "31ef264b3625e5cc3f5fec45097c2bc0d163868610760f51e933c528a4d08242",
  },
];
export async function seedDocumentFiles() {
  for (const s of sourceFixtures)
    await documentStore().store(
      {
        workspace_id: "10000000-0000-4000-8000-000000000001",
        actor_id: "30000000-0000-4000-8000-000000000001",
        operation_id: s.id,
      },
      Buffer.from(s.text),
      s.hash,
    );
}
