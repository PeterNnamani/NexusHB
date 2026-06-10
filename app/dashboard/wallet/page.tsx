"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Wallet, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  reference: string | null;
}

export default function WalletPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("payments")
      .select("id, amount, reference, status, paid_at, course_id, courses(title)")
      .eq("user_id", user.id)
      .order("paid_at", { ascending: false });

    const txs: Transaction[] = (data || []).map((p: any) => ({
      id: p.id,
      description: p.courses?.title
        ? `Enrollment payment for ${p.courses.title}`
        : "Course purchase",
      amount: Number(p.amount) || 0,
      date: p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "",
      status: p.status || "success",
      reference: p.reference,
    }));
    setTransactions(txs);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const totalSpent = useMemo(
    () => transactions.reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing &amp; Payments</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Review your course purchases and payment history.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">₦{totalSpent.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total spent</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{transactions.length}</p>
              <p className="text-sm text-muted-foreground">Transactions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{user?.enrolledCourses?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Courses owned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Transaction history</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold">No transactions yet</h3>
              <p className="text-muted-foreground mt-1">Your course purchases will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground">{t.description}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t.date}
                      {t.reference ? ` • Ref: ${t.reference}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-destructive font-medium">-₦{t.amount.toLocaleString()}</span>
                    <Badge variant="secondary">{t.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
