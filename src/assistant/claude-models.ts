// W5 comparison candidates; SDK pin and Sonnet request remain unchanged.
export const claudeModels = ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"] as const;
export type ClaudeModel = (typeof claudeModels)[number];
export const isClaudeModel = (value: unknown): value is ClaudeModel => claudeModels.some(model => model === value);
