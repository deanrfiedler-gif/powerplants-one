import type { Calculation, Scope } from "../../estimating/fertigation/types";
import type {
  FertigationRecord,
  ScopeRevision,
} from "../../estimating/fertigation/storage-types";
import type { TraceKey } from "../../estimating/fertigation/trace";
import type { Resolvable } from "../../estimating/fertigation/resolutions";
import type { Declaration } from "../../estimating/fertigation/declarations";
import type { Register } from "../fertigation-fields";
import type { FertigationView } from "../fertigation-frame";

/** The exact permitted scope as the server returns it (reads.ts). */
export type Detail = {
  scope: FertigationRecord;
  revision: ScopeRevision;
  source: {
    workspace_version: number;
    option_label: string;
    revision: number;
    scope_readiness: string;
    selected: boolean;
    current_revision_id: string;
    context_hash: string;
    changed?: boolean;
  };
  calculation: Calculation;
  can_edit: boolean;
  edit_blocker: string | null;
};

export type EditorRegister =
  | Register
  | "production_context"
  | "hydraulics"
  | "services"
  | "resilience"
  | "groscales";

/** What every view receives from the workspace: one proposal, one calculation and the actions on them. */
export interface ViewContext {
  data: Detail;
  scopeId: string;
  /** The working draft, or the saved proposal when nothing has changed. */
  proposal: Scope;
  draft: Scope | null;
  /** The calculation that belongs to `proposal`, or null while a changed draft is uncalculated. */
  calculation: Calculation | null;
  /** One consistent pair for guidance: the calculation on screen and the proposal it came from. */
  guidanceScope: Scope;
  guidanceCalculation: Calculation;
  guidanceBasis: string;
  canEdit: boolean;
  historical: boolean;
  dirty: boolean;
  pending: boolean;
  previewBusy: boolean;
  section: Register;
  setSection: (register: Register) => void;
  calculate: () => void;
  update: (next: Scope) => void;
  edit: (register: EditorRegister, record?: object) => void;
  remove: (register: Register, id: string) => void;
  changeView: (view: FertigationView) => void;
  trace: (key: TraceKey) => void;
  resolveList: Resolvable[];
  resolveFor: (match: (key: string) => boolean) => void;
  declarationList: Declaration[];
  declarable: (code: string) => Declaration | undefined;
  declare: (key: string | null) => void;
  openRecord: (id: string) => void;
  openHistory: () => void;
  reportHref: string;
}

/** Registers shown by each view, in the order of their tabs. */
export const viewRegisters: Partial<Record<FertigationView, Register[]>> = {
  growing: ["valves", "masters", "areas", "crop_groups"],
  water: ["sources", "pipes", "filters", "water_samples"],
  recipes: ["recipes", "stocks", "channels"],
  controls: ["controllers", "banks", "sensors", "strategies"],
  operating: ["groups", "scenarios"],
  configurator: ["candidates"],
  evidence: ["evidence", "actions"],
};
