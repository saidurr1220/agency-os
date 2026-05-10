"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Shield,
  Loader2,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Company {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  status: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    members: number;
    projects: number;
    departments: number;
  };
}

interface Stats {
  totalCompanies: number;
  activeCompanies: number;
  pendingCompanies: number;
  totalUsers: number;
  activeUsers: number;
}

export default function AdminPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [companiesRes, statsRes] = await Promise.all([
        fetch("/api/admin/companies"),
        fetch("/api/admin/stats"),
      ]);

      if (companiesRes.ok) {
        const data = await companiesRes.json();
        setCompanies(data.companies || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (companyId: string, action: string) => {
    setActionLoading(companyId);
    try {
      const res = await fetch("/api/admin/companies/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, action }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch {
      // Silent fail
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "PENDING_APPROVAL":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "SUSPENDED":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const pendingCompanies = companies.filter(
    (c) => c.status === "PENDING_APPROVAL"
  );
  const activeCompanies = companies.filter((c) => c.status === "ACTIVE");
  const suspendedCompanies = companies.filter((c) => c.status === "SUSPENDED");

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Super Admin Dashboard
            </h2>
            <p className="text-muted-foreground">
              Manage companies and platform operations
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Building2 className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalCompanies}</p>
                    <p className="text-xs text-muted-foreground">
                      Total Companies
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeCompanies}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pendingCompanies}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Users className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <BarChart3 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeUsers}</p>
                    <p className="text-xs text-muted-foreground">Active Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Companies List */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending
              {pendingCompanies.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCompanies.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">
              Active
              <Badge variant="secondary" className="ml-2">
                {activeCompanies.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="suspended">
              Suspended
              {suspendedCompanies.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {suspendedCompanies.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Pending Companies */}
          <TabsContent value="pending" className="space-y-4">
            {pendingCompanies.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">
                    No pending companies. All caught up!
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingCompanies.map((company) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {company.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {company.email}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {company._count.members} members
                              </span>
                              <span>
                                Owner: {company.owner.name} (
                                {company.owner.email})
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Applied:{" "}
                              {new Date(company.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleAction(company.id, "approve")
                            }
                            disabled={actionLoading === company.id}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            {actionLoading === company.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Active Companies */}
          <TabsContent value="active" className="space-y-4">
            {activeCompanies.map((company) => (
              <Card key={company.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">{company.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {company._count.members} members ·{" "}
                          {company._count.projects} projects
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getStatusColor(company.status)}
                      >
                        {company.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAction(company.id, "suspend")
                        }
                        disabled={actionLoading === company.id}
                        className="text-red-600"
                      >
                        Suspend
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Suspended Companies */}
          <TabsContent value="suspended" className="space-y-4">
            {suspendedCompanies.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">No suspended companies.</p>
                </CardContent>
              </Card>
            ) : (
              suspendedCompanies.map((company) => (
                <Card key={company.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">{company.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {company.owner.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAction(company.id, "reactivate")
                        }
                        disabled={actionLoading === company.id}
                        className="text-green-600"
                      >
                        Reactivate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
