"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  generatePayroll,
  publishPayroll,
  unpublishPayroll,
  updatePayrollAdjustments,
  type PayrollAdjustment,
} from "@/actions/payroll";

type PayrollRow = {
  id: string;
  employeeName: string;
  baseSalary: number;
  commissionTotal: number;
  adjustments: PayrollAdjustment[];
  totalAmount: number;
  status: "DRAFT" | "PUBLISHED";
};

const currency = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 });

export function PayrollManager({
  periodKey,
  records,
}: {
  periodKey: string;
  records: PayrollRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [periodInput, setPeriodInput] = useState(periodKey);
  const [editing, setEditing] = useState<PayrollRow | null>(null);
  const [draftAdjustments, setDraftAdjustments] = useState<PayrollAdjustment[]>([]);

  const draftCount = records.filter((r) => r.status === "DRAFT").length;
  const publishedCount = records.filter((r) => r.status === "PUBLISHED").length;

  function changePeriod(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/payroll?periodKey=${encodeURIComponent(periodInput)}`);
  }

  function handleGenerate() {
    startTransition(async () => {
      try {
        const result = await generatePayroll(periodKey);
        let msg = `已產生 ${result.generated} 筆薪資單草稿`;
        if (result.skippedPublished > 0) msg += `，${result.skippedPublished} 筆已發布略過`;
        if (result.draftCommissions > 0)
          msg += `（注意：本期有 ${result.draftCommissions} 筆獎金尚未鎖定，未列入計算）`;
        toast.success(msg);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "產生失敗");
      }
    });
  }

  function handlePublish() {
    startTransition(async () => {
      try {
        const result = await publishPayroll(periodKey);
        toast.success(`已發布 ${result.published} 筆薪資單，員工現在可查看`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "發布失敗");
      }
    });
  }

  function handleUnpublish() {
    startTransition(async () => {
      try {
        const result = await unpublishPayroll(periodKey);
        toast.success(`已取消發布 ${result.unpublished} 筆`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失敗");
      }
    });
  }

  function openEdit(row: PayrollRow) {
    setEditing(row);
    setDraftAdjustments(row.adjustments.length > 0 ? [...row.adjustments] : []);
  }

  function saveAdjustments(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const cleaned = draftAdjustments.filter((a) => a.label.trim() !== "");
    startTransition(async () => {
      try {
        await updatePayrollAdjustments(editing.id, cleaned);
        toast.success("已更新加減項");
        setEditing(null);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "更新失敗");
      }
    });
  }

  const editingPreviewTotal = editing
    ? editing.baseSalary +
      editing.commissionTotal +
      draftAdjustments.reduce((s, a) => s + (a.amount || 0), 0)
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-2">
        <CardTitle>薪資管理</CardTitle>
        <div className="flex flex-wrap items-end gap-2">
          <form onSubmit={changePeriod} className="flex items-end gap-2">
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">期間（如 2026-07）</span>
              <Input value={periodInput} onChange={(e) => setPeriodInput(e.target.value)} className="w-32" />
            </div>
            <Button type="submit" variant="outline">
              查詢
            </Button>
          </form>
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? "處理中..." : "產生/重算薪資單"}
          </Button>
          {draftCount > 0 && (
            <Button variant="outline" onClick={handlePublish} disabled={isPending}>
              發布本期（{draftCount} 筆草稿）
            </Button>
          )}
          {publishedCount > 0 && (
            <Button variant="destructive" onClick={handleUnpublish} disabled={isPending}>
              取消發布（{publishedCount} 筆）
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>員工</TableHead>
              <TableHead>底薪</TableHead>
              <TableHead>獎金</TableHead>
              <TableHead>加減項</TableHead>
              <TableHead>實發總額</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  此期間尚無薪資單，點「產生/重算薪資單」開始
                </TableCell>
              </TableRow>
            )}
            {records.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.employeeName}</TableCell>
                <TableCell>{currency.format(row.baseSalary)}</TableCell>
                <TableCell>{currency.format(row.commissionTotal)}</TableCell>
                <TableCell>
                  {row.adjustments.length === 0
                    ? "—"
                    : row.adjustments.map((a, i) => (
                        <div key={i} className="text-sm">
                          {a.label}：{currency.format(a.amount)}
                        </div>
                      ))}
                </TableCell>
                <TableCell className="font-semibold">{currency.format(row.totalAmount)}</TableCell>
                <TableCell>
                  <Badge variant={row.status === "PUBLISHED" ? "default" : "secondary"}>
                    {row.status === "PUBLISHED" ? "已發布" : "草稿"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {row.status === "DRAFT" && (
                    <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                      編輯加減項
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯加減項 — {editing?.employeeName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveAdjustments} className="grid gap-4">
            <div className="grid gap-2">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs text-muted-foreground">
                <span>項目（如 全勤獎金、請假扣薪）</span>
                <span>金額（加項為正、減項為負）</span>
                <span />
              </div>
              {draftAdjustments.map((adj, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                  <Input
                    value={adj.label}
                    onChange={(e) =>
                      setDraftAdjustments(
                        draftAdjustments.map((a, j) => (j === i ? { ...a, label: e.target.value } : a))
                      )
                    }
                  />
                  <Input
                    type="number"
                    value={adj.amount}
                    onChange={(e) =>
                      setDraftAdjustments(
                        draftAdjustments.map((a, j) =>
                          j === i ? { ...a, amount: e.target.valueAsNumber || 0 } : a
                        )
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setDraftAdjustments(draftAdjustments.filter((_, j) => j !== i))}
                  >
                    移除
                  </Button>
                </div>
              ))}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDraftAdjustments([...draftAdjustments, { label: "", amount: 0 }])}
                >
                  新增項目
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              預覽實發總額：<span className="font-semibold text-foreground">{currency.format(editingPreviewTotal)}</span>
            </p>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "儲存中..." : "儲存"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
