import { getCurrentUser } from "@/lib/authorization";
import { getCommissionTrend, getDashboardSummary } from "@/actions/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/reports/trend-chart";

const currency = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 });

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "管理員",
  MANAGER: "主管",
  SALES_REP: "業務員",
  HR: "人事",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const [summary, commissionTrend] = await Promise.all([
    getDashboardSummary(),
    getCommissionTrend(6),
  ]);

  const teamSizeLabel =
    user.role === "ADMIN" ? "在職員工數" : user.role === "MANAGER" ? "團隊人數" : "";

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">本月銷售額（{summary.periodKey}）</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{currency.format(summary.salesTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {user.role === "SALES_REP" ? "本月獎金" : "本月獎金總額"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{currency.format(summary.commissionTotal)}</p>
          </CardContent>
        </Card>
        {teamSizeLabel && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{teamSizeLabel}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{summary.teamSize}</p>
            </CardContent>
          </Card>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>獎金趨勢（近 6 個月）</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={commissionTrend} label="獎金總額" />
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">目前角色：{ROLE_LABEL[user.role]}</p>
    </div>
  );
}
