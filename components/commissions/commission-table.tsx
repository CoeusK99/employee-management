"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";

type CalcRow = {
  id: string;
  employee: { firstName: string; lastName: string };
  baseCommission: number;
  kpiBonus: number;
  overrideAmount: number;
  totalAmount: number;
  status: "DRAFT" | "FINALIZED";
};

const currency = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 });

const columns: ColumnDef<CalcRow>[] = [
  {
    id: "employee",
    header: "員工",
    accessorFn: (row) => `${row.employee.lastName} ${row.employee.firstName}`,
    cell: ({ row }) => (
      <Link href={`/commissions/${row.original.id}`} className="font-medium hover:underline">
        {row.original.employee.lastName} {row.original.employee.firstName}
      </Link>
    ),
  },
  {
    accessorKey: "baseCommission",
    header: "業績提成",
    cell: ({ row }) => currency.format(row.original.baseCommission),
  },
  {
    accessorKey: "kpiBonus",
    header: "KPI 獎金",
    cell: ({ row }) => currency.format(row.original.kpiBonus),
  },
  {
    accessorKey: "overrideAmount",
    header: "階層分潤",
    cell: ({ row }) => currency.format(row.original.overrideAmount),
  },
  {
    accessorKey: "totalAmount",
    header: "總計",
    cell: ({ row }) => <span className="font-semibold">{currency.format(row.original.totalAmount)}</span>,
  },
  {
    accessorKey: "status",
    header: "狀態",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "FINALIZED" ? "default" : "secondary"}>
        {row.original.status === "FINALIZED" ? "已鎖定" : "草稿"}
      </Badge>
    ),
  },
];

export function CommissionTable({ records }: { records: CalcRow[] }) {
  return <DataTable columns={columns} data={records} emptyMessage="此期間尚無獎金結算資料" />;
}
