"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";

type SalesRow = {
  id: string;
  customerName: string;
  amount: number;
  saleDate: string;
  employee: { firstName: string; lastName: string };
};

const currency = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 });

const columns: ColumnDef<SalesRow>[] = [
  {
    accessorKey: "saleDate",
    header: "日期",
    cell: ({ row }) => new Date(row.original.saleDate).toLocaleDateString("zh-TW"),
  },
  {
    id: "employee",
    header: "業務員",
    accessorFn: (row) => `${row.employee.lastName} ${row.employee.firstName}`,
  },
  { accessorKey: "customerName", header: "客戶" },
  {
    accessorKey: "amount",
    header: "金額",
    cell: ({ row }) => currency.format(row.original.amount),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/sales/${row.original.id}`} className="text-sm hover:underline">
        查看
      </Link>
    ),
  },
];

export function SalesTable({ records }: { records: SalesRow[] }) {
  return <DataTable columns={columns} data={records} emptyMessage="沒有銷售紀錄" />;
}
