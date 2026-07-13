"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runCalculation } from "@/actions/commissions";

export function RunCalculationButton({
  periodType,
  periodKey,
}: {
  periodType: "MONTHLY" | "QUARTERLY";
  periodKey: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await runCalculation(periodType, periodKey);
        toast.success(
          `已計算 ${result.calculated} 筆${result.skipped > 0 ? `，${result.skipped} 筆已鎖定略過` : ""}`
        );
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "計算失敗");
      }
    });
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {isPending ? "計算中..." : "執行計算"}
    </Button>
  );
}
