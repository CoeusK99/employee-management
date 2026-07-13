"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createDepartment,
  deleteDepartment,
  updateDepartment,
} from "@/actions/departments";

type Department = {
  id: string;
  name: string;
  _count: { employees: number };
};

export function DepartmentManager({
  departments,
  canEdit,
}: {
  departments: Department[];
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setName("");
    setOpen(true);
  }

  function openEdit(dept: Department) {
    setEditing(dept);
    setName(dept.name);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (editing) {
          await updateDepartment(editing.id, { name });
          toast.success("已更新部門");
        } else {
          await createDepartment({ name });
          toast.success("已建立部門");
        }
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失敗");
      }
    });
  }

  function handleDelete(dept: Department) {
    startTransition(async () => {
      try {
        await deleteDepartment(dept.id);
        toast.success("已刪除部門");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失敗");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>部門</CardTitle>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button onClick={openCreate} />}>新增部門</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "編輯部門" : "新增部門"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <Input
                  placeholder="部門名稱"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <DialogFooter>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "儲存中..." : "儲存"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名稱</TableHead>
              <TableHead>員工人數</TableHead>
              {canEdit && <TableHead className="text-right">操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell>{dept.name}</TableCell>
                <TableCell>{dept._count.employees}</TableCell>
                {canEdit && (
                  <TableCell className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(dept)}>
                      編輯
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(dept)}
                      disabled={dept._count.employees > 0}
                    >
                      刪除
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
