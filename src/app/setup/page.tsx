"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Shield, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function SetupPage() {
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const handlePromote = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, secret }),
      });

      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Failed to promote user" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl">AgencyOS</span>
          </Link>
          <h1 className="text-2xl font-bold">Initial Setup</h1>
          <p className="text-muted-foreground mt-1">
            Promote your user to Super Admin
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
                <p className="font-medium text-yellow-600 dark:text-yellow-400">
                  One-time setup
                </p>
                <p className="text-yellow-600/80 dark:text-yellow-400/80 mt-1">
                  This page is for initial setup only. Enter the email of the
                  user you want to make Super Admin.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">User Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@agencyos.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret">Admin Secret</Label>
                <Input
                  id="secret"
                  type="password"
                  placeholder="Your BETTER_AUTH_SECRET"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use the same value as BETTER_AUTH_SECRET in your .env file
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handlePromote}
                disabled={isLoading || !email || !secret}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                Promote to Super Admin
              </Button>

              {result && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    result.success
                      ? "bg-green-500/10 border border-green-500/20 text-green-600"
                      : "bg-red-500/10 border border-red-500/20 text-red-600"
                  }`}
                >
                  {result.success ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {result.message}
                    </div>
                  ) : (
                    result.error
                  )}
                </div>
              )}

              {result?.success && (
                <Link href="/admin">
                  <Button variant="outline" className="w-full">
                    Go to Admin Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
