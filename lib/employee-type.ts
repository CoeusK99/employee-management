import type { EmployeeType } from "@/app/generated/prisma/enums";

export const EMPLOYEE_TYPE_LABEL: Record<EmployeeType, string> = {
  DOCTOR: "醫師",
  NURSE: "護理師",
  CONSULTANT: "諮詢業務",
  LOGISTICS: "後勤",
  SCALP_SPECIALIST: "頭管師",
};

export const EMPLOYEE_TYPES = Object.keys(EMPLOYEE_TYPE_LABEL) as EmployeeType[];
