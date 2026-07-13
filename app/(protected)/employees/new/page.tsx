import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/authorization";
import { listDepartmentOptions, listManagerOptions } from "@/actions/employees";
import { EmployeeForm } from "@/components/employees/employee-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewEmployeePage() {
  const user = await getCurrentUser();
  if (user.role !== "ADMIN" && user.role !== "HR") {
    redirect("/employees");
  }

  const [departments, managers] = await Promise.all([
    listDepartmentOptions(),
    listManagerOptions(),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>新增員工</CardTitle>
      </CardHeader>
      <CardContent>
        <EmployeeForm departments={departments} managers={managers} />
      </CardContent>
    </Card>
  );
}
