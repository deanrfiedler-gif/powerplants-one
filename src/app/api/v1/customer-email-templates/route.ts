import {
  listCustomerEmailTemplates,
  proposeCustomerEmailTemplate,
} from "../../../../communications";
import { commandRoute, readRoute } from "../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => listCustomerEmailTemplates(p, q));
export const POST = commandRoute((p, _id, b) => proposeCustomerEmailTemplate(p, b));
