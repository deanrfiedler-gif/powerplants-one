import { localConfig } from '../platform/config';
import { AppError } from '../platform/errors';
export function assistantMode() {
  localConfig();
  const mode = process.env.PPO_ASSISTANT_MODE ?? 'off';
  if (mode !== 'off' && mode !== 'simulated') throw new AppError(503,'AssistantConfiguration','The assistant configuration is unavailable.');
  return mode;
}
export function requireAssistant() {
  if (assistantMode() !== 'simulated') throw new AppError(503,'AssistantDisabled','The simulated assistant is switched off. Ordinary PPO screens remain available.');
}
