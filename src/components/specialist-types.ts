import type {
  readConfiguration,
  listConfigurations,
  creationOptions,
  readHistory,
} from "../estimating/specialist/reads";
import type { previewConfiguration } from "../estimating/specialist/service";
import type { previewReceiving } from "../estimating/specialist/receiving";
import type { previewRebase } from "../estimating/specialist/source";
import type {
  Calculation,
  Decision,
  DraftProposal,
  NativePriceProposal,
} from "../estimating/specialist/types";
import type { DrawingErrors, DrawingModel } from "../estimating/specialist/drawing";
import type { Gate, SheetGeometry, Untested } from "../estimating/specialist/workbench";
import type { useSpecialistCommand } from "./specialist-recovery";
export type Detail = Awaited<ReturnType<typeof readConfiguration>>;
export type Register = Awaited<ReturnType<typeof listConfigurations>>;
export type Preview = Awaited<ReturnType<typeof previewConfiguration>>;
export type Receiving = Awaited<ReturnType<typeof previewReceiving>>;
export type Options = Awaited<ReturnType<typeof creationOptions>>;
export type HistoryRead = Awaited<ReturnType<typeof readHistory>>;
export type Rebase = Awaited<ReturnType<typeof previewRebase>>;
export type Command = ReturnType<typeof useSpecialistCommand>;
export const basePath = "estimating/configurations";
// Everything a workbench view reads or changes. The editor owns the state;
// views stay presentational and never talk to the server themselves except
// through the editor's commands.
export type Bench = {
  id: string;
  path: string;
  data: Detail;
  proposal: DraftProposal;
  change: (work: (p: DraftProposal) => void) => void;
  canEdit: boolean;
  frozen: boolean;
  dirty: boolean;
  fresh: boolean;
  calculating: boolean;
  calculation: Calculation | null;
  preview: Preview | null;
  decisions: Decision[];
  decide: (key: string, choice: Decision["choice"], receiving?: boolean) => void;
  drawing: DrawingModel;
  setDrawing: (next: DrawingModel) => void;
  drawingErrors: DrawingErrors;
  errors: Record<string, string>;
  untested: Untested[];
  geometry: SheetGeometry | null;
  signature: string;
  gates: Gate[];
  reason: string;
  setReason: (reason: string) => void;
  command: Command;
  saveDraft: () => Promise<boolean>;
  saveReview: () => Promise<boolean>;
  working: string | null;
  openWorking: (key: string | null) => void;
  openManual: () => void;
  nativePrices: NativePriceProposal[];
  setNativePrices: (values: NativePriceProposal[]) => void;
  receiving: Receiving | null;
  receivingError: unknown;
  receivingDecisions: Decision[];
  reviewReceiving: () => Promise<void>;
  cancelReceiving: () => void;
  apply: () => Promise<boolean>;
  phone: boolean;
};
