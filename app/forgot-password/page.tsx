"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { requestPasswordReset } from "@/actions/password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await requestPasswordReset({ email });
        setSubmitted(true);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "提交失敗");
      }
    });
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>忘記密碼</CardTitle>
          <CardDescription>
            {submitted
              ? "申請已送出"
              : "輸入你的帳號 email，管理員將協助你重設密碼"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="grid gap-4">
              <p className="text-sm text-muted-foreground">
                已收到你的重設申請。管理員處理後會將新密碼告知你，屆時請以新密碼登入。
              </p>
              <Button nativeButton={false} render={<Link href="/login" />} className="w-full">
                返回登入
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "送出中..." : "送出重設申請"}
              </Button>
              <Link
                href="/login"
                className="text-center text-sm text-muted-foreground hover:underline"
              >
                返回登入
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
