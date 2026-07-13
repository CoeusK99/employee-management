import { listDepartments } from "@/actions/departments";
import { getCurrentUser } from "@/lib/authorization";
import { DepartmentManager } from "@/components/departments/department-manager";

export default async function DepartmentsPage() {
  const user = await getCurrentUser();
  const departments = await listDepartments();
  const canEdit = user.role === "ADMIN" || user.role === "HR";

  return (
    <DepartmentManager departments={departments} canEdit={canEdit} />
  );
}
