import { getCommissionCalculation } from "@/actions/commissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const currency = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 });

type Breakdown = {
  salesTotal: number;
  target: number | null;
  achievementPct: number | null;
  overrideSources: {
    subordinateId: string;
    subordinateName: string;
    level: number;
    subordinateOwnCommission: number;
    percent: number;
    amount: number;
  }[];
};

export default async function CommissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const calc = await getCommissionCalculation(id);
  const breakdown = calc.breakdown as unknown as Breakdown;

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {calc.employee.lastName} {calc.employee.firstName} · {calc.periodKey}
          </CardTitle>
          <Badge variant={calc.status === "FINALIZED" ? "default" : "secondary"}>
            {calc.status === "FINALIZED" ? "已鎖定" : "草稿"}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>當期銷售總額：{currency.format(breakdown.salesTotal)}</div>
          <div>
            目標配額：{breakdown.target != null ? currency.format(breakdown.target) : "未設定"}
            {breakdown.achievementPct != null && ` (達成率 ${breakdown.achievementPct.toFixed(1)}%)`}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">業績提成</div>
              <div className="font-semibold">{currency.format(Number(calc.baseCommission))}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">KPI 獎金</div>
              <div className="font-semibold">{currency.format(Number(calc.kpiBonus))}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">階層分潤</div>
              <div className="font-semibold">{currency.format(Number(calc.overrideAmount))}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">總計</div>
              <div className="font-semibold">{currency.format(Number(calc.totalAmount))}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {breakdown.overrideSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">階層分潤明細</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {breakdown.overrideSources.map((src) => (
              <div key={src.subordinateId} className="flex justify-between border-b py-2 last:border-0">
                <span>
                  {src.subordinateName}（第 {src.level} 層，個人獎金 {currency.format(src.subordinateOwnCommission)} ×{" "}
                  {(src.percent * 100).toFixed(0)}%）
                </span>
                <span className="font-medium">{currency.format(src.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
