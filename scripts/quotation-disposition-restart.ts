// Same exact commercial-to-native proof, extended with disposition effects and a later held review.
export {};
process.env.PPO_CONVERSION_DISPOSITION = "1";
process.env.PPO_CONVERSION_PROOF_DIRECTORY =
  process.env.PPO_DISPOSITION_PROOF_DIRECTORY ??
  "verification-evidence/quotation-disposition-restart";
await import("./quotation-conversion-restart");
