import Link from "next/link";
import { listSalesRecords } from "@/actions/sales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesTable } from "@/components/sales/sales-table";

export default async function SalesPage() {
  const records = await listSalesRecords();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>銷售紀錄</CardTitle>
        <Button nativeButton={false} render={<Link href="/sales/new" />}>
          新增銷售紀錄
        </Button>
      </CardHeader>
      <CardContent>
        <SalesTable
          records={records.map((r) => ({
            id: r.id,
            customerName: r.customerName,
            amount: Number(r.amount),
            saleDate: r.saleDate.toISOString(),
            employee: { firstName: r.employee.firstName, lastName: r.employee.lastName },
          }))}
        />
      </CardContent>
    </Card>
  );
}
