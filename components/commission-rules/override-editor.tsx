"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type OverrideLevel = { level: number; percent: number };

export function OverrideEditor({
  levels,
  onChange,
}: {
  levels: OverrideLevel[];
  onChange: (levels: OverrideLevel[]) => void;
}) {
  function update(index: number, patch: Partial<OverrideLevel>) {
    onChange(levels.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addRow() {
    const last = levels[levels.length - 1];
    onChange([...levels, { level: last ? last.level + 1 : 1, percent: 0 }]);
  }

  function removeRow(index: number) {
    onChange(levels.filter((_, i) => i !== index));
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs text-muted-foreground">
        <span>層級（1 = 直屬主管，2 = 隔代主管...）</span>
        <span>分潤比例（例如 0.05 = 5%）</span>
        <span />
      </div>
      {levels.map((lvl, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
          <Input
            type="number"
            min="1"
            value={lvl.level}
            onChange={(e) => update(i, { level: e.target.valueAsNumber || 1 })}
          />
          <Input
            type="number"
            step="0.01"
            value={lvl.percent}
            onChange={(e) => update(i, { percent: e.target.valueAsNumber || 0 })}
          />
          <Button type="button" variant="destructive" size="sm" onClick={() => removeRow(i)}>
            移除
          </Button>
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          新增層級
        </Button>
      </div>
    </div>
  );
}
