import Link from "next/link";
import { listEmployees } from "@/actions/employees";
import { getCurrentUser } from "@/lib/authorization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeTable } from "@/components/employees/employee-table";

export default async function EmployeesPage() {
  const user = await getCurrentUser();
  const employees = await listEmployees();
  const canCreate = user.role === "ADMIN" || user.role === "HR";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>員工</CardTitle>
        {canCreate && (
          <Button nativeButton={false} render={<Link href="/employees/new" />}>
            新增員工
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <EmployeeTable employees={employees} />
      </CardContent>
    </Card>
  );
}
