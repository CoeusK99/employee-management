"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type Tier = { min: number; max: number | null; rate: number };

export function TierEditor({
  tiers,
  onChange,
}: {
  tiers: Tier[];
  onChange: (tiers: Tier[]) => void;
}) {
  function update(index: number, patch: Partial<Tier>) {
    onChange(tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function addRow() {
    const last = tiers[tiers.length - 1];
    onChange([...tiers, { min: last ? last.max ?? 0 : 0, max: null, rate: 0 }]);
  }

  function removeRow(index: number) {
    onChange(tiers.filter((_, i) => i !== index));
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground">
        <span>下限金額</span>
        <span>上限金額（留空表示無上限）</span>
        <span>費率（例如 0.05 = 5%）</span>
        <span />
      </div>
      {tiers.map((tier, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
          <Input
            type="number"
            value={tier.min}
            onChange={(e) => update(i, { min: e.target.valueAsNumber || 0 })}
          />
          <Input
            type="number"
            value={tier.max ?? ""}
            placeholder="無上限"
            onChange={(e) =>
              update(i, { max: e.target.value === "" ? null : e.target.valueAsNumber })
            }
          />
          <Input
            type="number"
            step="0.01"
            value={tier.rate}
            onChange={(e) => update(i, { rate: e.target.valueAsNumber || 0 })}
          />
          <Button type="button" variant="destructive" size="sm" onClick={() => removeRow(i)}>
            移除
          </Button>
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          新增級距
        </Button>
      </div>
    </div>
  );
}
