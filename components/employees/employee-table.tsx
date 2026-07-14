"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { EMPLOYEE_TYPE_LABEL } from "@/lib/employee-type";
import type { EmployeeType, EmploymentStatus } from "@/app/generated/prisma/enums";

type EmployeeRow = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  type: EmployeeType;
  status: EmploymentStatus;
  department: { name: string };
  manager: { firstName: string; lastName: string } | null;
};

const STATUS_LABEL: Record<EmploymentStatus, string> = {
  ACTIVE: "在職",
  ON_LEAVE: "留職停薪",
  OFFBOARDED: "離職",
};

const STATUS_VARIANT: Record<EmploymentStatus, "default" | "secondary" | "destructive"> = {
  ACTIVE: "default",
  ON_LEAVE: "secondary",
  OFFBOARDED: "destructive",
};

const columns: ColumnDef<EmployeeRow>[] = [
  {
    accessorKey: "lastName",
    header: "姓名",
    cell: ({ row }) => (
      <Link href={`/employees/${row.original.id}`} className="font-medium hover:underline">
        {row.original.lastName} {row.original.firstName}
      </Link>
    ),
  },
  {
    accessorKey: "type",
    header: "類型",
    cell: ({ row }) => (
      <Badge variant="outline">{EMPLOYEE_TYPE_LABEL[row.original.type]}</Badge>
    ),
  },
  { accessorKey: "title", header: "職稱" },
  {
    id: "department",
    header: "部門",
    accessorFn: (row) => row.department.name,
  },
  {
    id: "manager",
    header: "主管",
    accessorFn: (row) => (row.manager ? `${row.manager.lastName} ${row.manager.firstName}` : "—"),
  },
  {
    accessorKey: "status",
    header: "狀態",
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANT[row.original.status]}>
        {STATUS_LABEL[row.original.status]}
      </Badge>
    ),
  },
];

export function EmployeeTable({ employees }: { employees: EmployeeRow[] }) {
  return <DataTable columns={columns} data={employees} emptyMessage="沒有員工資料" />;
}
