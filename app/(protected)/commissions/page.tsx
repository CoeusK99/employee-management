import { listCommissionCalculations } from "@/actions/commissions";
import { getCurrentUser } from "@/lib/authorization";
import { monthlyPeriodKey } from "@/lib/period";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodSelector } from "@/components/commissions/period-selector";
import { RunCalculationButton } from "@/components/commissions/run-calculation-button";
import { FinalizeControls } from "@/components/commissions/finalize-controls";
import { CommissionTable } from "@/components/commissions/commission-table";

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ periodType?: string; periodKey?: string }>;
}) {
  const params = await searchParams;
  const periodType = params.periodType === "QUARTERLY" ? "QUARTERLY" : "MONTHLY";
  const periodKey = params.periodKey || monthlyPeriodKey(new Date());

  const user = await getCurrentUser();
  const records = await listCommissionCalculations(periodType, periodKey);
  const draftCount = records.filter((r) => r.status === "DRAFT").length;
  const finalizedCount = records.filter((r) => r.status === "FINALIZED").length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>獎金結算</CardTitle>
        <div className="flex items-end gap-2">
          <PeriodSelector periodType={periodType} periodKey={periodKey} />
          {user.role === "ADMIN" && (
            <>
              <RunCalculationButton periodType={periodType} periodKey={periodKey} />
              <FinalizeControls
                periodType={periodType}
                periodKey={periodKey}
                draftCount={draftCount}
                finalizedCount={finalizedCount}
              />
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CommissionTable
          records={records.map((r) => ({
            id: r.id,
            employee: { firstName: r.employee.firstName, lastName: r.employee.lastName },
            baseCommission: Number(r.baseCommission),
            kpiBonus: Number(r.kpiBonus),
            overrideAmount: Number(r.overrideAmount),
            totalAmount: Number(r.totalAmount),
            status: r.status,
          }))}
        />
      </CardContent>
    </Card>
  );
}
