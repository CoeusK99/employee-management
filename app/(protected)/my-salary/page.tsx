import { getCurrentUser } from "@/lib/authorization";
import { listMyPayroll, type PayrollAdjustment } from "@/actions/payroll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const currency = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 });

export default async function MySalaryPage() {
  const user = await getCurrentUser();

  if (!user.employeeId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>我的薪資</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            此帳號未連結員工資料，沒有薪資單可顯示。
          </p>
        </CardContent>
      </Card>
    );
  }

  const records = await listMyPayroll();

  return (
    <div className="grid gap-4">
      <h1 className="text-lg font-semibold">我的薪資</h1>
      {records.length === 0 && (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">尚無已發布的薪資單。</p>
          </CardContent>
        </Card>
      )}
      {records.map((r) => {
        const adjustments = (r.adjustments as PayrollAdjustment[]) ?? [];
        return (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle>{r.periodKey} 薪資單</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex justify-between border-b py-1">
                <span>底薪</span>
                <span>{currency.format(Number(r.baseSalary))}</span>
              </div>
              <div className="flex justify-between border-b py-1">
                <span>獎金</span>
                <span>{currency.format(Number(r.commissionTotal))}</span>
              </div>
              {adjustments.map((a, i) => (
                <div key={i} className="flex justify-between border-b py-1">
                  <span>{a.label}</span>
                  <span className={a.amount < 0 ? "text-destructive" : undefined}>
                    {currency.format(a.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between py-1 font-semibold">
                <span>實發總額</span>
                <span>{currency.format(Number(r.totalAmount))}</span>
              </div>
              {r.publishedAt && (
                <p className="text-xs text-muted-foreground">
                  發布於 {r.publishedAt.toLocaleString("zh-TW")}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
