import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", passwordHash, role: "ADMIN" },
  });

  await prisma.user.upsert({
    where: { email: "hr@example.com" },
    update: {},
    create: { email: "hr@example.com", passwordHash, role: "HR" },
  });

  const north = await prisma.department.upsert({
    where: { name: "Sales - North" },
    update: {},
    create: { name: "Sales - North" },
  });
  const south = await prisma.department.upsert({
    where: { name: "Sales - South" },
    update: {},
    create: { name: "Sales - South" },
  });

  // --- Org chart: Alice (manager) -> Bob, Carol, Dave (manager) -> Erin ---
  const alice = await prisma.employee.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      firstName: "Alice",
      lastName: "Chen",
      email: "alice@example.com",
      title: "Sales Manager",
      type: "CONSULTANT",
      departmentId: north.id,
      status: "ACTIVE",
      hireDate: new Date("2023-01-10"),
    },
  });
  await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: { employeeId: alice.id },
    create: { email: "alice@example.com", passwordHash, role: "MANAGER", employeeId: alice.id },
  });

  const dave = await prisma.employee.upsert({
    where: { email: "dave@example.com" },
    update: {},
    create: {
      firstName: "Dave",
      lastName: "Wu",
      email: "dave@example.com",
      title: "Team Lead",
      type: "CONSULTANT",
      departmentId: north.id,
      managerId: alice.id,
      status: "ACTIVE",
      hireDate: new Date("2023-06-01"),
    },
  });
  await prisma.user.upsert({
    where: { email: "dave@example.com" },
    update: { employeeId: dave.id },
    create: { email: "dave@example.com", passwordHash, role: "MANAGER", employeeId: dave.id },
  });

  const bob = await prisma.employee.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      firstName: "Bob",
      lastName: "Lin",
      email: "bob@example.com",
      title: "Sales Rep",
      type: "CONSULTANT",
      departmentId: north.id,
      managerId: alice.id,
      status: "ACTIVE",
      hireDate: new Date("2024-02-15"),
    },
  });
  await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: { employeeId: bob.id },
    create: { email: "bob@example.com", passwordHash, role: "SALES_REP", employeeId: bob.id },
  });

  const carol = await prisma.employee.upsert({
    where: { email: "carol@example.com" },
    update: {},
    create: {
      firstName: "Carol",
      lastName: "Huang",
      email: "carol@example.com",
      title: "Sales Rep",
      type: "CONSULTANT",
      departmentId: south.id,
      managerId: alice.id,
      status: "ACTIVE",
      hireDate: new Date("2024-03-01"),
    },
  });
  await prisma.user.upsert({
    where: { email: "carol@example.com" },
    update: { employeeId: carol.id },
    create: { email: "carol@example.com", passwordHash, role: "SALES_REP", employeeId: carol.id },
  });

  const erin = await prisma.employee.upsert({
    where: { email: "erin@example.com" },
    update: {},
    create: {
      firstName: "Erin",
      lastName: "Kuo",
      email: "erin@example.com",
      title: "Sales Rep",
      type: "CONSULTANT",
      departmentId: north.id,
      managerId: dave.id,
      status: "ACTIVE",
      hireDate: new Date("2024-09-01"),
    },
  });
  await prisma.user.upsert({
    where: { email: "erin@example.com" },
    update: { employeeId: erin.id },
    create: { email: "erin@example.com", passwordHash, role: "SALES_REP", employeeId: erin.id },
  });

  // --- Sales records + targets for 2026-06 (spans all three percentage tiers / KPI bands) ---
  const period = { periodType: "MONTHLY" as const, periodKey: "2026-06" };
  const saleDate = new Date("2026-06-15");

  const salesPlan = [
    { employee: bob, amount: 40000, quota: 50000 }, // 80% achievement
    { employee: carol, amount: 70000, quota: 70000 }, // 100% achievement
    { employee: dave, amount: 120000, quota: 100000 }, // 120% achievement
    { employee: erin, amount: 30000, quota: 25000 }, // 120% achievement
  ];

  for (const { employee, amount, quota } of salesPlan) {
    await prisma.salesRecord.create({
      data: {
        employeeId: employee.id,
        customerName: `${employee.firstName} 客戶 A`,
        amount,
        saleDate,
      },
    });
    await prisma.target.upsert({
      where: {
        employeeId_periodType_periodKey: {
          employeeId: employee.id,
          periodType: period.periodType,
          periodKey: period.periodKey,
        },
      },
      update: { quotaAmount: quota },
      create: {
        employeeId: employee.id,
        periodType: period.periodType,
        periodKey: period.periodKey,
        quotaAmount: quota,
      },
    });
  }

  // --- Commission rules: one of each type, effective for all seeded periods ---
  const effectiveFrom = new Date("2026-01-01");

  const existingPercentage = await prisma.commissionRule.findFirst({
    where: { type: "PERCENTAGE_TIER", active: true },
  });
  if (!existingPercentage) {
    await prisma.commissionRule.create({
      data: {
        name: "標準業績提成級距",
        type: "PERCENTAGE_TIER",
        active: true,
        effectiveFrom,
        config: {
          tiers: [
            { min: 0, max: 50000, rate: 0.03 },
            { min: 50000, max: 100000, rate: 0.05 },
            { min: 100000, max: null, rate: 0.07 },
          ],
        },
      },
    });
  }

  const existingKpi = await prisma.commissionRule.findFirst({
    where: { type: "KPI_BONUS", active: true },
  });
  if (!existingKpi) {
    await prisma.commissionRule.create({
      data: {
        name: "標準 KPI 目標獎金",
        type: "KPI_BONUS",
        active: true,
        effectiveFrom,
        config: {
          thresholds: [
            { achievementPct: 80, bonus: 200 },
            { achievementPct: 100, bonus: 500 },
            { achievementPct: 120, bonus: 1000 },
          ],
        },
      },
    });
  }

  const existingOverride = await prisma.commissionRule.findFirst({
    where: { type: "OVERRIDE", active: true },
  });
  if (!existingOverride) {
    await prisma.commissionRule.create({
      data: {
        name: "標準階層分潤",
        type: "OVERRIDE",
        active: true,
        effectiveFrom,
        config: {
          levels: [
            { level: 1, percent: 0.05 },
            { level: 2, percent: 0.02 },
          ],
        },
      },
    });
  }

  console.log("Seed complete.");
  console.log("Login as: admin@example.com / hr@example.com / alice@example.com / dave@example.com / bob@example.com / carol@example.com / erin@example.com");
  console.log("Password (all): password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
