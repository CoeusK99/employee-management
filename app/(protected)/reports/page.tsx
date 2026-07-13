import { getCommissionTrend, getLeaderboard, getSalesTrend } from "@/actions/reports";
import { getCurrentUser } from "@/lib/authorization";
import { monthlyPeriodKey } from "@/lib/period";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/reports/trend-chart";
import { LeaderboardChart } from "@/components/reports/leaderboard-chart";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  const periodKey = monthlyPeriodKey(new Date());

  const [salesTrend, commissionTrend, leaderboard] = await Promise.all([
    getSalesTrend(6),
    getCommissionTrend(6),
    getLeaderboard(periodKey),
  ]);

  const showLeaderboard = user.role !== "SALES_REP";

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>銷售趨勢（近 6 個月）</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={salesTrend} label="銷售額" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>獎金趨勢（近 6 個月）</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={commissionTrend} label="獎金總額" />
        </CardContent>
      </Card>
      {showLeaderboard && (
        <Card>
          <CardHeader>
            <CardTitle>本期排行榜（{periodKey}）</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              <LeaderboardChart data={leaderboard} />
            ) : (
              <p className="text-sm text-muted-foreground">本期尚無獎金結算資料</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
