"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PeriodSelector({
  periodType,
  periodKey,
}: {
  periodType: "MONTHLY" | "QUARTERLY";
  periodKey: string;
}) {
  const router = useRouter();
  const [type, setType] = useState(periodType);
  const [key, setKey] = useState(periodKey);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/commissions?periodType=${type}&periodKey=${encodeURIComponent(key)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="grid gap-1">
        <span className="text-xs text-muted-foreground">類型</span>
        <Select
          items={[{ value: "MONTHLY", label: "月度" }, { value: "QUARTERLY", label: "季度" }]}
          value={type}
          onValueChange={(v) => setType(v as "MONTHLY" | "QUARTERLY")}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MONTHLY">月度</SelectItem>
            <SelectItem value="QUARTERLY">季度</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1">
        <span className="text-xs text-muted-foreground">期間（如 2026-07 或 2026-Q3）</span>
        <Input value={key} onChange={(e) => setKey(e.target.value)} className="w-40" />
      </div>
      <Button type="submit" variant="outline">
        查詢
      </Button>
    </form>
  );
}
