import { getCurrentUser } from "@/lib/authorization";
import { getEmployee, getOrgSubtree, listDepartmentOptions, listManagerOptions } from "@/actions/employees";
import { listTargetsForEmployee } from "@/actions/targets";
import { EmployeeForm } from "@/components/employees/employee-form";
import { OrgTree } from "@/components/employees/org-tree";
import { TargetManager } from "@/components/targets/target-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const employee = await getEmployee(id);
  const canEdit = user.role === "ADMIN" || user.role === "HR";
  const canManageTargets = user.role === "ADMIN" || user.role === "MANAGER";

  const subtree = employee.reports.length > 0 ? await getOrgSubtree(id) : [];
  const targets = canManageTargets
    ? (await listTargetsForEmployee(id)).map((t) => ({
        id: t.id,
        periodType: t.periodType,
        periodKey: t.periodKey,
        quotaAmount: Number(t.quotaAmount),
      }))
    : [];

  if (!canEdit) {
    return (
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {employee.lastName} {employee.firstName}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div>職稱：{employee.title}</div>
            <div>部門：{employee.department.name}</div>
            <div>
              主管：
              {employee.manager ? `${employee.manager.lastName} ${employee.manager.firstName}` : "無"}
            </div>
            <div>
              狀態：<Badge>{employee.status}</Badge>
            </div>
          </CardContent>
        </Card>
        {subtree.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>團隊組織圖</CardTitle>
            </CardHeader>
            <CardContent>
              <OrgTree employees={subtree} rootId={id} />
            </CardContent>
          </Card>
        )}
        {canManageTargets && (
          <Card>
            <CardHeader>
              <CardTitle>業績配額</CardTitle>
            </CardHeader>
            <CardContent>
              <TargetManager employeeId={id} targets={targets} />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const [departments, managers] = await Promise.all([
    listDepartmentOptions(),
    listManagerOptions(),
  ]);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {employee.lastName} {employee.firstName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm
            employeeId={employee.id}
            departments={departments}
            managers={managers}
            defaultValues={{
              firstName: employee.firstName,
              lastName: employee.lastName,
              email: employee.email,
              title: employee.title,
              departmentId: employee.departmentId,
              managerId: employee.managerId,
              status: employee.status,
              hireDate: employee.hireDate.toISOString().slice(0, 10),
            }}
          />
        </CardContent>
      </Card>
      {subtree.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>團隊組織圖</CardTitle>
          </CardHeader>
          <CardContent>
            <OrgTree employees={subtree} rootId={id} />
          </CardContent>
        </Card>
      )}
      {canManageTargets && (
        <Card>
          <CardHeader>
            <CardTitle>業績配額</CardTitle>
          </CardHeader>
          <CardContent>
            <TargetManager employeeId={id} targets={targets} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
