import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommissionRuleForm } from "@/components/commission-rules/commission-rule-form";

export default function NewCommissionRulePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>新增獎金規則</CardTitle>
      </CardHeader>
      <CardContent>
        <CommissionRuleForm />
      </CardContent>
    </Card>
  );
}
