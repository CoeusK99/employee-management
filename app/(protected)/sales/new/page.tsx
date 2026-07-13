import { listSalesEmployeeOptions } from "@/actions/sales";
import { SalesForm } from "@/components/sales/sales-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewSalesRecordPage() {
  const employees = await listSalesEmployeeOptions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>新增銷售紀錄</CardTitle>
      </CardHeader>
      <CardContent>
        <SalesForm employees={employees} />
      </CardContent>
    </Card>
  );
}
