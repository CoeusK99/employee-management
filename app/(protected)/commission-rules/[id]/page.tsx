import { getCommissionRule } from "@/actions/commission-rules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommissionRuleForm } from "@/components/commission-rules/commission-rule-form";

export default async function CommissionRuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rule = await getCommissionRule(id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>編輯獎金規則</CardTitle>
      </CardHeader>
      <CardContent>
        <CommissionRuleForm
          ruleId={rule.id}
          defaultName={rule.name}
          defaultType={rule.type}
          defaultActive={rule.active}
          defaultEffectiveFrom={rule.effectiveFrom.toISOString().slice(0, 10)}
          defaultEffectiveTo={rule.effectiveTo ? rule.effectiveTo.toISOString().slice(0, 10) : null}
          defaultConfig={rule.config}
        />
      </CardContent>
    </Card>
  );
}
