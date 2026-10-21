/** Public CS-04 reference; immutable legacy storage and UUIDs remain unchanged. */
export function siteReference(stored: string): string {
  return /^SYN-PPO-SITE-[0-9]{6,}$/.test(stored)
    ? stored.replace("SYN-PPO-SITE-", "SYN-SITE-")
    : stored;
}

/** Accept complete or partial public references without rewriting ordinary name searches. */
export function siteReferenceSearch(query: string): string {
  return /^SYN-SITE-(?:[0-9]*)$/i.test(query)
    ? query.replace(/^SYN-SITE-/i, "SYN-PPO-SITE-")
    : query;
}
