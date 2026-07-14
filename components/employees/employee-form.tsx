"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { employeeSchema, type EmployeeFormValues } from "@/lib/validation/employee";
import { EMPLOYEE_TYPES, EMPLOYEE_TYPE_LABEL } from "@/lib/employee-type";
import { createEmployee, updateEmployee } from "@/actions/employees";

type Option = { id: string; name?: string; firstName?: string; lastName?: string; title?: string };

const NO_MANAGER = "__none__";

export function EmployeeForm({
  employeeId,
  defaultValues,
  departments,
  managers,
}: {
  employeeId?: string;
  defaultValues?: Partial<EmployeeFormValues>;
  departments: Option[];
  managers: Option[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      title: "",
      type: "CONSULTANT",
      departmentId: "",
      managerId: null,
      status: "ACTIVE",
      hireDate: new Date().toISOString().slice(0, 10),
      ...defaultValues,
    },
  });

  function onSubmit(values: EmployeeFormValues) {
    startTransition(async () => {
      try {
        if (employeeId) {
          await updateEmployee(employeeId, values);
          toast.success("已更新員工資料");
        } else {
          await createEmployee(values);
          toast.success("已新增員工");
        }
        router.push("/employees");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失敗");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid max-w-xl gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>姓氏</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>名字</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>職稱</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>員工類型</FormLabel>
              <Select
                items={EMPLOYEE_TYPES.map((t) => ({ value: t, label: EMPLOYEE_TYPE_LABEL[t] }))}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EMPLOYEE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {EMPLOYEE_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="departmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>部門</FormLabel>
              <Select
                items={departments.map((d) => ({ value: d.id, label: d.name }))}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="請選擇部門" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="managerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>直屬主管</FormLabel>
              <Select
                items={[
                  { value: NO_MANAGER, label: "無" },
                  ...managers
                    .filter((m) => m.id !== employeeId)
                    .map((m) => ({
                      value: m.id,
                      label: `${m.lastName} ${m.firstName} · ${m.title}`,
                    })),
                ]}
                onValueChange={(v) => field.onChange(v === NO_MANAGER ? null : v)}
                value={field.value ?? NO_MANAGER}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="無" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_MANAGER}>無</SelectItem>
                  {managers
                    .filter((m) => m.id !== employeeId)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.lastName} {m.firstName} · {m.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>狀態</FormLabel>
              <Select
                items={{ ACTIVE: "在職", ON_LEAVE: "留職停薪", OFFBOARDED: "離職" }}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ACTIVE">在職</SelectItem>
                  <SelectItem value="ON_LEAVE">留職停薪</SelectItem>
                  <SelectItem value="OFFBOARDED">離職</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hireDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>到職日期</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "儲存中..." : "儲存"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            取消
          </Button>
        </div>
      </form>
    </Form>
  );
}
