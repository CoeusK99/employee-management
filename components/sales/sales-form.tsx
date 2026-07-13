"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { salesRecordSchema, type SalesRecordFormValues } from "@/lib/validation/sales";
import { createSalesRecord, deleteSalesRecord, updateSalesRecord } from "@/actions/sales";

type EmployeeOption = { id: string; firstName: string; lastName: string };

export function SalesForm({
  recordId,
  defaultValues,
  employees,
}: {
  recordId?: string;
  defaultValues?: Partial<SalesRecordFormValues>;
  employees: EmployeeOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SalesRecordFormValues>({
    resolver: zodResolver(salesRecordSchema),
    defaultValues: {
      employeeId: employees.length === 1 ? employees[0].id : "",
      customerName: "",
      amount: 0,
      saleDate: new Date().toISOString().slice(0, 10),
      notes: "",
      ...defaultValues,
    },
  });

  function onSubmit(values: SalesRecordFormValues) {
    startTransition(async () => {
      try {
        if (recordId) {
          await updateSalesRecord(recordId, values);
          toast.success("已更新銷售紀錄");
        } else {
          await createSalesRecord(values);
          toast.success("已新增銷售紀錄");
        }
        router.push("/sales");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失敗");
      }
    });
  }

  function handleDelete() {
    if (!recordId) return;
    startTransition(async () => {
      try {
        await deleteSalesRecord(recordId);
        toast.success("已刪除銷售紀錄");
        router.push("/sales");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失敗");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid max-w-xl gap-4">
        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>業務員</FormLabel>
              <Select
                items={employees.map((e) => ({ value: e.id, label: `${e.lastName} ${e.firstName}` }))}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="請選擇業務員" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.lastName} {e.firstName}
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
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>客戶名稱</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>金額</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="saleDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>成交日期</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>備註</FormLabel>
              <FormControl>
                <Textarea {...field} />
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
          {recordId && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
              刪除
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
