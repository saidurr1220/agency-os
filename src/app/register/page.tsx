"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Zap,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  Users,
  User,
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Crown,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store";

// ─── SCHEMAS ────────────────────────────────────────────────────

const generalUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const companySchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    companyName: z.string().min(2, "Company name is required"),
    companyEmail: z.string().email("Invalid company email"),
    phone: z.string().optional(),
    website: z.string().optional(),
    role: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const teamMemberSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    inviteCode: z.string().min(6, "Invitation code is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type GeneralUserFormData = z.infer<typeof generalUserSchema>;
type CompanyFormData = z.infer<typeof companySchema>;
type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

type RegistrationType = "select" | "company" | "team-member" | "general";

// ─── ROLE OPTIONS ───────────────────────────────────────────────

const boardRoles = [
  {
    value: "CHAIRMAN",
    label: "Chairman",
    description: "Highest company authority",
  },
  {
    value: "MANAGER",
    label: "Managing Director / Manager",
    description: "Oversees operations & teams",
  },
];

// ─── COMPONENT ──────────────────────────────────────────────────

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    register: registerUser,
    isLoading,
    error,
    clearError,
  } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [companySubmitting, setCompanySubmitting] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [regType, setRegType] = useState<RegistrationType>(() => {
    const invite = searchParams.get("invite");
    if (invite) return "team-member";
    return "select";
  });
  const [inviteCodeFromUrl] = useState(() => searchParams.get("invite") || "");

  // ─── General User Form ───────────────────────────────────────

  const generalForm = useForm<GeneralUserFormData>({
    resolver: zodResolver(generalUserSchema),
  });

  const onGeneralSubmit = async (data: GeneralUserFormData) => {
    clearError();
    await registerUser(data.name, data.email, data.password);
    const state = useAuthStore.getState();
    if (state.isAuthenticated) {
      router.push("/dashboard");
    }
  };

  // ─── Company Form ────────────────────────────────────────────

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: { role: "CHAIRMAN" },
  });

  const onCompanySubmit = async (data: CompanyFormData) => {
    clearError();
    setCompanyError(null);
    setCompanySubmitting(true);
    try {
      const res = await fetch("/api/auth/register/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          companyName: data.companyName,
          companyEmail: data.companyEmail,
          phone: data.phone,
          website: data.website,
          role: data.role,
        }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setCompanyError(
          typeof payload.error === "string"
            ? payload.error
            : "Registration failed. Please try again.",
        );
        return;
      }

      router.push("/login?registered=pending");
    } catch {
      setCompanyError("Registration failed. Please try again.");
    } finally {
      setCompanySubmitting(false);
    }
  };

  // ─── Team Member Form ────────────────────────────────────────

  const teamForm = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: { inviteCode: inviteCodeFromUrl },
  });

  const onTeamSubmit = async (data: TeamMemberFormData) => {
    clearError();
    try {
      const inviteRes = await fetch("/api/invitations/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: data.inviteCode }),
      });

      if (!inviteRes.ok) return;

      await registerUser(data.name, data.email, data.password);
      const state = useAuthStore.getState();
      if (state.isAuthenticated) {
        await fetch("/api/invitations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: data.inviteCode,
            userId: state.user?.id,
          }),
        });
        router.push("/dashboard");
      }
    } catch {
      // Error handled
    }
  };

  // ─── Selection Screen ────────────────────────────────────────

  if (regType === "select") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl">AgencyOS</span>
            </Link>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-muted-foreground mt-1">
              Choose how you want to get started
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Company Owner Card */}
            <Card
              className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group"
              onClick={() => setRegType("company")}
            >
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Crown className="w-7 h-7 text-blue-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Company Owner</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Chairman, Managing Director — Register your agency
                </p>
                <Badge variant="secondary">Creates Company</Badge>
              </CardContent>
            </Card>

            {/* Team Member Card */}
            <Card
              className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group"
              onClick={() => setRegType("team-member")}
            >
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <Users className="w-7 h-7 text-green-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Team Member</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manager, Team Leader, Employee — Join via invitation
                </p>
                <Badge variant="secondary">Invite Required</Badge>
              </CardContent>
            </Card>

            {/* General User Card */}
            <Card
              className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group"
              onClick={() => setRegType("general")}
            >
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                  <User className="w-7 h-7 text-violet-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Personal Use</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Track your daily tasks, journals, and productivity
                </p>
                <Badge variant="secondary">Free Forever</Badge>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center text-sm">
            <span className="text-muted-foreground">
              Already have an account?{" "}
            </span>
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Registration Form ───────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Back Button - Top Left */}
        <button
          onClick={() => setRegType("select")}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>

        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl">AgencyOS</span>
          </Link>

          {regType === "company" && (
            <>
              <h2 className="text-xl font-bold">Register Your Agency</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Create your company workspace
              </p>
            </>
          )}
          {regType === "team-member" && (
            <>
              <h2 className="text-xl font-bold">Join Your Team</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Enter the invitation code from your manager
              </p>
            </>
          )}
          {regType === "general" && (
            <>
              <h2 className="text-xl font-bold">Personal Account</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Track your daily tasks and productivity
              </p>
            </>
          )}
        </div>

        <Card>
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* ─── Company Owner Form ────────────────────────── */}
              {regType === "company" && (
                <motion.form
                  key="company"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={companyForm.handleSubmit(onCompanySubmit)}
                  className="space-y-4"
                >
                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label>Your Role</Label>
                    <Select
                      value={companyForm.watch("role")}
                      onValueChange={(v) => companyForm.setValue("role", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {boardRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {
                        boardRoles.find(
                          (r) => r.value === companyForm.watch("role"),
                        )?.description
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        {...companyForm.register("name")}
                      />
                      {companyForm.formState.errors.name && (
                        <p className="text-xs text-red-500">
                          {companyForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Your Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@agency.com"
                        {...companyForm.register("email")}
                      />
                      {companyForm.formState.errors.email && (
                        <p className="text-xs text-red-500">
                          {companyForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Min 8 characters"
                          {...companyForm.register("password")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {companyForm.formState.errors.password && (
                        <p className="text-xs text-red-500">
                          {companyForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        {...companyForm.register("confirmPassword")}
                      />
                      {companyForm.formState.errors.confirmPassword && (
                        <p className="text-xs text-red-500">
                          {companyForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Company Details
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyName">Company Name</Label>
                          <Input
                            id="companyName"
                            placeholder="FB Internation BD"
                            {...companyForm.register("companyName")}
                          />
                          {companyForm.formState.errors.companyName && (
                            <p className="text-xs text-red-500">
                              {companyForm.formState.errors.companyName.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companyEmail">Company Email</Label>
                          <Input
                            id="companyEmail"
                            type="email"
                            placeholder="info@agency.com"
                            {...companyForm.register("companyEmail")}
                          />
                          {companyForm.formState.errors.companyEmail && (
                            <p className="text-xs text-red-500">
                              {
                                companyForm.formState.errors.companyEmail
                                  .message
                              }
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone (optional)</Label>
                          <Input
                            id="phone"
                            placeholder="+1 234 567 890"
                            {...companyForm.register("phone")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website">Website (optional)</Label>
                          <Input
                            id="website"
                            placeholder="https://agency.com"
                            {...companyForm.register("website")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {companyError && (
                    <p className="text-sm text-red-500 text-center">
                      {companyError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={companySubmitting}
                  >
                    {companySubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating agency...
                      </>
                    ) : (
                      <>
                        Register Agency
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Your company will be reviewed by our team before activation.
                  </p>
                </motion.form>
              )}

              {/* ─── Team Member Form ──────────────────────────── */}
              {regType === "team-member" && (
                <motion.form
                  key="team-member"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={teamForm.handleSubmit(onTeamSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode">Invitation Code</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="inviteCode"
                        placeholder="Enter code from your manager"
                        className="pl-10"
                        {...teamForm.register("inviteCode")}
                      />
                    </div>
                    {teamForm.formState.errors.inviteCode && (
                      <p className="text-xs text-red-500">
                        {teamForm.formState.errors.inviteCode.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Ask your manager for the invitation code
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      {...teamForm.register("name")}
                    />
                    {teamForm.formState.errors.name && (
                      <p className="text-xs text-red-500">
                        {teamForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      {...teamForm.register("email")}
                    />
                    {teamForm.formState.errors.email && (
                      <p className="text-xs text-red-500">
                        {teamForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Min 8 characters"
                          {...teamForm.register("password")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {teamForm.formState.errors.password && (
                        <p className="text-xs text-red-500">
                          {teamForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm"
                        {...teamForm.register("confirmPassword")}
                      />
                      {teamForm.formState.errors.confirmPassword && (
                        <p className="text-xs text-red-500">
                          {teamForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining team...
                      </>
                    ) : (
                      <>
                        Join Team
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.form>
              )}

              {/* ─── General User Form ─────────────────────────── */}
              {regType === "general" && (
                <motion.form
                  key="general"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={generalForm.handleSubmit(onGeneralSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      {...generalForm.register("name")}
                    />
                    {generalForm.formState.errors.name && (
                      <p className="text-xs text-red-500">
                        {generalForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      {...generalForm.register("email")}
                    />
                    {generalForm.formState.errors.email && (
                      <p className="text-xs text-red-500">
                        {generalForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Min 8 characters"
                          {...generalForm.register("password")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {generalForm.formState.errors.password && (
                        <p className="text-xs text-red-500">
                          {generalForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm"
                        {...generalForm.register("confirmPassword")}
                      />
                      {generalForm.formState.errors.confirmPassword && (
                        <p className="text-xs text-red-500">
                          {generalForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">
                Already have an account?{" "}
              </span>
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
