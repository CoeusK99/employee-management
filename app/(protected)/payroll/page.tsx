import { listPayroll, type PayrollAdjustment } from "@/actions/payroll";
import { monthlyPeriodKey } from "@/lib/period";
import { PayrollManager } from "@/components/payroll/payroll-manager";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ periodKey?: string }>;
}) {
  const params = await searchParams;
  const periodKey = params.periodKey || monthlyPeriodKey(new Date());
  const records = await listPayroll(periodKey);

  return (
    <PayrollManager
      periodKey={periodKey}
      records={records.map((r) => ({
        id: r.id,
        employeeName: `${r.employee.lastName} ${r.employee.firstName}`,
        baseSalary: Number(r.baseSalary),
        commissionTotal: Number(r.commissionTotal),
        adjustments: (r.adjustments as PayrollAdjustment[]) ?? [],
        totalAmount: Number(r.totalAmount),
        status: r.status,
      }))}
    />
  );
}
