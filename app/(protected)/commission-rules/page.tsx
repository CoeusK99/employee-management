import Link from "next/link";
import { listCommissionRules } from "@/actions/commission-rules";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TYPE_LABEL: Record<string, string> = {
  PERCENTAGE_TIER: "業績提成級距",
  KPI_BONUS: "KPI 目標獎金",
  OVERRIDE: "階層式分潤",
};

export default async function CommissionRulesPage() {
  const rules = await listCommissionRules();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>獎金規則</CardTitle>
        <Button nativeButton={false} render={<Link href="/commission-rules/new" />}>
          新增規則
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名稱</TableHead>
              <TableHead>類型</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>生效範圍</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  尚無獎金規則
                </TableCell>
              </TableRow>
            )}
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.name}</TableCell>
                <TableCell>{TYPE_LABEL[rule.type]}</TableCell>
                <TableCell>
                  <Badge variant={rule.active ? "default" : "secondary"}>
                    {rule.active ? "啟用中" : "未啟用"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {rule.effectiveFrom.toLocaleDateString("zh-TW")}
                  {" ~ "}
                  {rule.effectiveTo ? rule.effectiveTo.toLocaleDateString("zh-TW") : "持續生效"}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/commission-rules/${rule.id}`} className="text-sm hover:underline">
                    編輯
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
