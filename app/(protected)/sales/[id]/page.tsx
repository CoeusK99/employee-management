import { getSalesRecord, listSalesEmployeeOptions } from "@/actions/sales";
import { SalesForm } from "@/components/sales/sales-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SalesRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [record, employees] = await Promise.all([
    getSalesRecord(id),
    listSalesEmployeeOptions(),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>銷售紀錄明細</CardTitle>
      </CardHeader>
      <CardContent>
        <SalesForm
          recordId={record.id}
          employees={employees}
          defaultValues={{
            employeeId: record.employeeId,
            customerName: record.customerName,
            amount: Number(record.amount),
            saleDate: record.saleDate.toISOString().slice(0, 10),
            notes: record.notes ?? "",
          }}
        />
      </CardContent>
    </Card>
  );
}
