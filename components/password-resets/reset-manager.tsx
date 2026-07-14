"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dismissResetRequest,
  resetUserPassword,
} from "@/actions/password-reset";

type ResetRequest = {
  id: string;
  email: string;
  status: "PENDING" | "RESOLVED";
  createdAt: string;
  resolvedAt: string | null;
};

function generatePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += chars[b % chars.length];
  return out;
}

export function ResetManager({ requests }: { requests: ResetRequest[] }) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  function openReset(targetEmail: string) {
    setEmail(targetEmail);
    setNewPassword(generatePassword());
    setDialogOpen(true);
  }

  function handleReset(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await resetUserPassword({ email, newPassword });
        toast.success(`已重設 ${email} 的密碼，請將新密碼告知員工`);
        setDialogOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "重設失敗");
      }
    });
  }

  function handleDismiss(id: string) {
    startTransition(async () => {
      try {
        await dismissResetRequest(id);
        toast.success("已結案");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失敗");
      }
    });
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>密碼重設申請</CardTitle>
          <Button variant="outline" onClick={() => openReset("")}>
            直接重設任一帳號
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>申請時間</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    目前沒有重設申請
                  </TableCell>
                </TableRow>
              )}
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{req.email}</TableCell>
                  <TableCell>{new Date(req.createdAt).toLocaleString("zh-TW")}</TableCell>
                  <TableCell>
                    <Badge variant={req.status === "PENDING" ? "destructive" : "secondary"}>
                      {req.status === "PENDING" ? "待處理" : "已處理"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    {req.status === "PENDING" && (
                      <>
                        <Button size="sm" onClick={() => openReset(req.email)} disabled={isPending}>
                          重設密碼
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDismiss(req.id)}
                          disabled={isPending}
                        >
                          不處理結案
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重設密碼</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReset} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reset-email">帳號 Email</Label>
              <Input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reset-password">新密碼（至少 8 碼）</Label>
              <div className="flex gap-2">
                <Input
                  id="reset-password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="font-mono"
                />
                <Button type="button" variant="outline" onClick={() => setNewPassword(generatePassword())}>
                  隨機產生
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                重設後請自行將新密碼告知員工（系統不會寄送 email）
              </p>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "重設中..." : "確認重設"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
