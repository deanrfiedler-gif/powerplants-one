// The public surface of the customer communications domain (D-025 S2). Supply, Service and
// Projects request customer messages through it and never call a channel themselves (C1).
export {
  messageClasses,
  classRules,
  displayState,
  type MessageClass,
  type SourceType,
  type State,
  type HoldReason,
} from "./model";
export { family as templateFamily, sharedBindings, stopLine } from "./templates";
export {
  prepareCustomerMessage,
  confirmCustomerMessage,
  withdrawCustomerMessage,
  reconcileCustomerMessage,
  type MessageSource,
  type ResolvedFacts,
} from "./service";
export {
  listCustomerCommunications,
  readCustomerCommunication,
  customerCommunicationQueue,
} from "./reads";
export { recordNoticePreference, readNoticePreferences } from "./preferences";
export { setMessageClassSwitch, readMessageClassSwitches } from "./switches";
export {
  proposeCustomerEmailTemplate,
  publishCustomerEmailTemplate,
  listCustomerEmailTemplates,
} from "./template-commands";
export {
  runCustomerMessageJobs,
  processCustomerMessageJob,
  observeCustomerMessages,
} from "./worker";
export type { SourceRecord } from "./records";
