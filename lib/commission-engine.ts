export type PercentageTier = { min: number; max: number | null; rate: number };
export type KpiThreshold = { achievementPct: number; bonus: number };
export type OverrideLevel = { level: number; percent: number };

/** Marginal/tiered rate application, like tax brackets: each tier's rate applies only to the portion of `amount` within that band. */
export function applyPercentageTiers(amount: number, tiers: PercentageTier[]): number {
  if (amount <= 0) return 0;
  const sorted = [...tiers].sort((a, b) => a.min - b.min);
  let commission = 0;
  for (const tier of sorted) {
    const upper = tier.max ?? Infinity;
    const band = Math.min(amount, upper) - tier.min;
    if (band <= 0) continue;
    commission += band * tier.rate;
  }
  return commission;
}

/** Non-progressive: pays the bonus for the single highest threshold met. */
export function applyKpiThresholds(achievementPct: number, thresholds: KpiThreshold[]): number {
  const matched = thresholds
    .filter((t) => achievementPct >= t.achievementPct)
    .sort((a, b) => b.achievementPct - a.achievementPct);
  return matched[0]?.bonus ?? 0;
}

/** Returns the override percent configured for a given org-chart depth (1 = direct report), or null if undefined. */
export function overridePercentForLevel(level: number, levels: OverrideLevel[]): number | null {
  return levels.find((l) => l.level === level)?.percent ?? null;
}
