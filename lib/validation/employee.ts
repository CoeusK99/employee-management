import { z } from "zod";

export const employeeSchema = z.object({
  firstName: z.string().min(1, "必填"),
  lastName: z.string().min(1, "必填"),
  email: z.string().email("email 格式錯誤"),
  title: z.string().min(1, "必填"),
  type: z.enum(["DOCTOR", "NURSE", "CONSULTANT", "LOGISTICS", "SCALP_SPECIALIST"]),
  departmentId: z.string().min(1, "請選擇部門"),
  managerId: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "ON_LEAVE", "OFFBOARDED"]),
  baseSalary: z.number().min(0, "底薪不可為負數"),
  hireDate: z.string().min(1, "必填"),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const departmentSchema = z.object({
  name: z.string().min(1, "必填"),
});

export type DepartmentFormValues = z.infer<typeof departmentSchema>;
