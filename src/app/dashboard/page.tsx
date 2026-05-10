"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { StatsCards } from "@/components/dashboard/StatsCards";
import {
  ProductivityChart,
  WeeklyTrendChart,
  StatusDistributionChart,
} from "@/components/dashboard/Charts";
import { RecentTasks } from "@/components/dashboard/RecentTasks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store";
import type {
  DashboardStats,
  ProductivityData,
  StatusDistribution,
  WeeklyTrend,
  TaskStatus,
} from "@/types";

export default function DashboardPage() {
  const { tasks, fetchTasks, fetchDashboard } = useAppStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    productivityScore: 0,
    weeklyCompletionRate: 0,
    todayCompleted: 0,
    todayTotal: 0,
    streak: 0,
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchTasks();
      const dashboardStats = await fetchDashboard();
      setStats(dashboardStats);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const productivityData: ProductivityData[] = [
    { date: "Mon", completed: 5, created: 3, timeSpent: 120 },
    { date: "Tue", completed: 8, created: 4, timeSpent: 150 },
    { date: "Wed", completed: 6, created: 6, timeSpent: 90 },
    { date: "Thu", completed: 10, created: 2, timeSpent: 180 },
    { date: "Fri", completed: 7, created: 5, timeSpent: 140 },
    { date: "Sat", completed: 3, created: 1, timeSpent: 60 },
    { date: "Sun", completed: 2, created: 0, timeSpent: 30 },
  ];

  const weeklyTrend: WeeklyTrend[] = [
    { day: "Mon", tasks: 5, time: 120 },
    { day: "Tue", tasks: 8, time: 150 },
    { day: "Wed", tasks: 6, time: 90 },
    { day: "Thu", tasks: 10, time: 180 },
    { day: "Fri", tasks: 7, time: 140 },
    { day: "Sat", tasks: 3, time: 60 },
    { day: "Sun", tasks: 2, time: 30 },
  ];

  const statusDistribution: StatusDistribution[] = [
    {
      status: "TODO" as TaskStatus,
      count: tasks.filter((t) => t.status === "TODO").length,
      percentage: 0,
    },
    {
      status: "IN_PROGRESS" as TaskStatus,
      count: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      percentage: 0,
    },
    {
      status: "REVIEW" as TaskStatus,
      count: tasks.filter((t) => t.status === "REVIEW").length,
      percentage: 0,
    },
    {
      status: "COMPLETED" as TaskStatus,
      count: tasks.filter((t) => t.status === "COMPLETED").length,
      percentage: 0,
    },
    {
      status: "ON_HOLD" as TaskStatus,
      count: tasks.filter((t) => t.status === "ON_HOLD").length,
      percentage: 0,
    },
  ].map((s) => ({
    ...s,
    percentage:
      tasks.length > 0 ? Math.round((s.count / tasks.length) * 100) : 0,
  }));

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
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome back! Here&apos;s your overview.
            </p>
          </div>
          <Link href="/tasks">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </Link>
        </div>

        <StatsCards stats={stats} />

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ProductivityChart data={productivityData} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatusDistributionChart data={statusDistribution} />
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentTasks tasks={tasks.slice(0, 5)} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Quick Actions
                  <Link href="/tasks">
                    <Button variant="ghost" size="sm">
                      View All
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/tasks">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Task
                  </Button>
                </Link>
                <Link href="/journal">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Write Daily Journal
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="outline" className="w-full justify-start">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
