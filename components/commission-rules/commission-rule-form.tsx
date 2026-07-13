"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierEditor, type Tier } from "@/components/commission-rules/tier-editor";
import { KpiEditor, type KpiThreshold } from "@/components/commission-rules/kpi-editor";
import { OverrideEditor, type OverrideLevel } from "@/components/commission-rules/override-editor";
import { createCommissionRule, deleteCommissionRule, updateCommissionRule } from "@/actions/commission-rules";

type RuleType = "PERCENTAGE_TIER" | "KPI_BONUS" | "OVERRIDE";

const TYPE_LABEL: Record<RuleType, string> = {
  PERCENTAGE_TIER: "業績提成級距",
  KPI_BONUS: "KPI 目標獎金",
  OVERRIDE: "階層式分潤",
};

const DEFAULT_CONFIG: Record<RuleType, unknown> = {
  PERCENTAGE_TIER: { tiers: [{ min: 0, max: null, rate: 0.03 }] },
  KPI_BONUS: { thresholds: [{ achievementPct: 100, bonus: 0 }] },
  OVERRIDE: { levels: [{ level: 1, percent: 0.05 }] },
};

export function CommissionRuleForm({
  ruleId,
  defaultName,
  defaultType,
  defaultActive,
  defaultEffectiveFrom,
  defaultEffectiveTo,
  defaultConfig,
}: {
  ruleId?: string;
  defaultName?: string;
  defaultType?: RuleType;
  defaultActive?: boolean;
  defaultEffectiveFrom?: string;
  defaultEffectiveTo?: string | null;
  defaultConfig?: unknown;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(defaultName ?? "");
  const [type, setType] = useState<RuleType>(defaultType ?? "PERCENTAGE_TIER");
  const [active, setActive] = useState(defaultActive ?? true);
  const [effectiveFrom, setEffectiveFrom] = useState(
    defaultEffectiveFrom ?? new Date().toISOString().slice(0, 10)
  );
  const [effectiveTo, setEffectiveTo] = useState(defaultEffectiveTo ?? "");
  const [config, setConfig] = useState<unknown>(defaultConfig ?? DEFAULT_CONFIG[type]);

  function handleTypeChange(newType: RuleType) {
    setType(newType);
    if (!defaultConfig) {
      setConfig(DEFAULT_CONFIG[newType]);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("請輸入規則名稱");
      return;
    }
    const payload = {
      name,
      type,
      active,
      effectiveFrom,
      effectiveTo: effectiveTo || null,
      config,
    };
    startTransition(async () => {
      try {
        if (ruleId) {
          await updateCommissionRule(ruleId, payload);
          toast.success("已更新獎金規則");
        } else {
          await createCommissionRule(payload);
          toast.success("已建立獎金規則");
        }
        router.push("/commission-rules");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失敗");
      }
    });
  }

  function handleDelete() {
    if (!ruleId) return;
    startTransition(async () => {
      try {
        await deleteCommissionRule(ruleId);
        toast.success("已刪除獎金規則");
        router.push("/commission-rules");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失敗");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-2xl gap-4">
      <div className="grid gap-2">
        <Label>規則名稱</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label>類型</Label>
        <Select
          items={Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))}
          value={type}
          onValueChange={(v) => handleTypeChange(v as RuleType)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(TYPE_LABEL) as RuleType[]).map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>生效日</Label>
          <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>結束日（留空表示持續生效）</Label>
          <Input type="date" value={effectiveTo} onChange={(e) => setEffectiveTo(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="active"
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="size-4"
        />
        <Label htmlFor="active">啟用（同類型只能有一個啟用規則，啟用後其他同類型規則會自動停用）</Label>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{TYPE_LABEL[type]}設定</CardTitle>
        </CardHeader>
        <CardContent>
          {type === "PERCENTAGE_TIER" && (
            <TierEditor
              tiers={(config as { tiers: Tier[] }).tiers}
              onChange={(tiers) => setConfig({ tiers })}
            />
          )}
          {type === "KPI_BONUS" && (
            <KpiEditor
              thresholds={(config as { thresholds: KpiThreshold[] }).thresholds}
              onChange={(thresholds) => setConfig({ thresholds })}
            />
          )}
          {type === "OVERRIDE" && (
            <OverrideEditor
              levels={(config as { levels: OverrideLevel[] }).levels}
              onChange={(levels) => setConfig({ levels })}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "儲存中..." : "儲存"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
        {ruleId && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
            刪除
          </Button>
        )}
      </div>
    </form>
  );
}
