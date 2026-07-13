"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type KpiThreshold = { achievementPct: number; bonus: number };

export function KpiEditor({
  thresholds,
  onChange,
}: {
  thresholds: KpiThreshold[];
  onChange: (thresholds: KpiThreshold[]) => void;
}) {
  function update(index: number, patch: Partial<KpiThreshold>) {
    onChange(thresholds.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function addRow() {
    onChange([...thresholds, { achievementPct: 100, bonus: 0 }]);
  }

  function removeRow(index: number) {
    onChange(thresholds.filter((_, i) => i !== index));
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs text-muted-foreground">
        <span>達成率 %（例如 100 = 100%）</span>
        <span>獎金金額</span>
        <span />
      </div>
      {thresholds.map((th, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
          <Input
            type="number"
            value={th.achievementPct}
            onChange={(e) => update(i, { achievementPct: e.target.valueAsNumber || 0 })}
          />
          <Input
            type="number"
            value={th.bonus}
            onChange={(e) => update(i, { bonus: e.target.valueAsNumber || 0 })}
          />
          <Button type="button" variant="destructive" size="sm" onClick={() => removeRow(i)}>
            移除
          </Button>
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          新增門檻
        </Button>
      </div>
    </div>
  );
}
