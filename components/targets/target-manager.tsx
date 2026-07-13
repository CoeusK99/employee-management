"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteTarget, upsertTarget } from "@/actions/targets";

type Target = {
  id: string;
  periodType: "MONTHLY" | "QUARTERLY";
  periodKey: string;
  quotaAmount: number;
};

const currency = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 });

export function TargetManager({
  employeeId,
  targets,
}: {
  employeeId: string;
  targets: Target[];
}) {
  const [isPending, startTransition] = useTransition();
  const [periodType, setPeriodType] = useState<"MONTHLY" | "QUARTERLY">("MONTHLY");
  const [periodKey, setPeriodKey] = useState("");
  const [quotaAmount, setQuotaAmount] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const quota = Number(quotaAmount);
    if (!periodKey.trim() || !quota) {
      toast.error("請填寫期間與配額");
      return;
    }
    startTransition(async () => {
      try {
        await upsertTarget({ employeeId, periodType, periodKey: periodKey.trim(), quotaAmount: quota });
        toast.success("已儲存配額");
        setPeriodKey("");
        setQuotaAmount("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失敗");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteTarget(id);
        toast.success("已刪除配額");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失敗");
      }
    });
  }

  return (
    <div className="grid gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>類型</TableHead>
            <TableHead>期間</TableHead>
            <TableHead>配額</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {targets.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                尚無配額設定
              </TableCell>
            </TableRow>
          )}
          {targets.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{t.periodType === "MONTHLY" ? "月度" : "季度"}</TableCell>
              <TableCell>{t.periodKey}</TableCell>
              <TableCell>{currency.format(t.quotaAmount)}</TableCell>
              <TableCell className="text-right">
                <Button variant="destructive" size="sm" onClick={() => handleDelete(t.id)} disabled={isPending}>
                  刪除
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <form onSubmit={handleAdd} className="grid grid-cols-[auto_1fr_1fr_auto] items-end gap-2">
        <div className="grid gap-1">
          <span className="text-xs text-muted-foreground">類型</span>
          <Select
            items={[{ value: "MONTHLY", label: "月度" }, { value: "QUARTERLY", label: "季度" }]}
            value={periodType}
            onValueChange={(v) => setPeriodType(v as "MONTHLY" | "QUARTERLY")}
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
          <Input value={periodKey} onChange={(e) => setPeriodKey(e.target.value)} placeholder="2026-07" />
        </div>
        <div className="grid gap-1">
          <span className="text-xs text-muted-foreground">配額金額</span>
          <Input
            type="number"
            value={quotaAmount}
            onChange={(e) => setQuotaAmount(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "儲存中..." : "新增/更新"}
        </Button>
      </form>
    </div>
  );
}
