"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    isAuthenticated,
    fetchSession,
    isLoading: authLoading,
  } = useAuthStore();
  const [code, setCode] = useState(
    () => searchParams.get("invite")?.trim().toUpperCase() || "",
  );
  const [preview, setPreview] = useState<{
    companyName: string;
    role: string;
    email: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  const validate = async () => {
    setError(null);
    const c = code.trim().toUpperCase();
    if (!c) {
      setError("Enter an invitation code");
      return;
    }
    const res = await fetch("/api/invitations/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: c }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(
        typeof data.error === "string" ? data.error : "Invalid or expired code",
      );
      setPreview(null);
      return;
    }
    setPreview({
      companyName: data.companyName,
      role: data.role,
      email: data.email,
    });
  };

  const accept = async () => {
    const c = code.trim().toUpperCase();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: c }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Could not join team",
        );
        return;
      }
      await fetchSession();
      router.push("/dashboard");
    } finally {
      setBusy(false);
    }
  };

  const inviteQs = searchParams.get("invite");
  const nextAfterLogin =
    inviteQs && inviteQs.trim()
      ? `/join?invite=${encodeURIComponent(inviteQs.trim())}`
      : "/join";

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in to accept your invite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use the same email address your manager invited. After signing in,
              you&apos;ll finish joining the team.
            </p>
            <Button asChild className="w-full">
              <Link href={`/login?next=${encodeURIComponent(nextAfterLogin)}`}>
                Go to login
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/register">Create an account</Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="w-full text-muted-foreground"
            >
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                Back to home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <CardTitle>Join a team</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Enter the code from your email or invitation link
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="join-code">Invitation code</Label>
            <Input
              id="join-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. A1B2C3D4"
              disabled={authLoading}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => void validate()}
            disabled={busy || authLoading}
          >
            Check code
          </Button>

          {preview && (
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3 text-sm">
              <p>
                <span className="font-medium">{preview.companyName}</span>
                <span className="text-muted-foreground"> — {preview.role}</span>
              </p>
              <p className="text-muted-foreground">
                Invited email: <strong>{preview.email}</strong>
              </p>
              {user &&
                user.email.toLowerCase() !== preview.email.toLowerCase() && (
                  <p className="text-destructive">
                    You&apos;re signed in as {user.email}. Sign out and sign in
                    with {preview.email}, or use a private window.
                  </p>
                )}
              <Button
                className="w-full"
                onClick={() => void accept()}
                disabled={
                  busy ||
                  authLoading ||
                  (user != null &&
                    user.email.toLowerCase() !== preview.email.toLowerCase())
                }
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining…
                  </>
                ) : (
                  "Accept and join"
                )}
              </Button>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive border border-destructive/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          {authLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          <div className="pt-2 border-t border-border/50">
            <Button
              variant="ghost"
              asChild
              className="w-full text-muted-foreground"
            >
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                Back to dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
