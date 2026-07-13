"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { finalizeCommissions, reopenCommissions } from "@/actions/commissions";

export function FinalizeControls({
  periodType,
  periodKey,
  draftCount,
  finalizedCount,
}: {
  periodType: "MONTHLY" | "QUARTERLY";
  periodKey: string;
  draftCount: number;
  finalizedCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleFinalize() {
    startTransition(async () => {
      try {
        const result = await finalizeCommissions(periodType, periodKey);
        toast.success(`已鎖定 ${result.finalized} 筆`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "鎖定失敗");
      }
    });
  }

  function handleReopen() {
    startTransition(async () => {
      try {
        const result = await reopenCommissions(periodType, periodKey);
        toast.success(`已重新開放 ${result.reopened} 筆`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "重新開放失敗");
      }
    });
  }

  return (
    <div className="flex items-end gap-2">
      {draftCount > 0 && (
        <Button variant="outline" onClick={handleFinalize} disabled={isPending}>
          {isPending ? "處理中..." : `鎖定本期（${draftCount} 筆草稿）`}
        </Button>
      )}
      {finalizedCount > 0 && (
        <Button variant="destructive" onClick={handleReopen} disabled={isPending}>
          {isPending ? "處理中..." : `重新開放（${finalizedCount} 筆已鎖定）`}
        </Button>
      )}
    </div>
  );
}
