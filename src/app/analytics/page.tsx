"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, CheckCircle2, Target, Flame } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];

const emptyStats = {
  totalTasks: 0,
  completedTasks: 0,
  pendingTasks: 0,
  overdueTasks: 0,
  productivityScore: 0,
  weeklyCompletionRate: 0,
  todayCompleted: 0,
  todayTotal: 0,
  streak: 0,
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState(emptyStats);
  const [dailyData, setDailyData] = useState<
    { date: string; completed: number; created: number; timeSpent: number }[]
  >([]);
  const [weeklyTrend, setWeeklyTrend] = useState<
    { week: string; tasks: number; hours: number }[]
  >([]);
  const [statusDistribution, setStatusDistribution] = useState<
    { status: string; count: number; percentage: number }[]
  >([]);
  const [priorityDistribution, setPriorityDistribution] = useState<
    { priority: string; count: number }[]
  >([]);
  const [productivityTrend, setProductivityTrend] = useState<
    { date: string; score: number; tasks: number }[]
  >([]);
  const [completionRates, setCompletionRates] = useState({
    thisWeek: 0,
    thisMonth: 0,
    allTime: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/analytics", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.stats) setStats(data.stats);
        if (Array.isArray(data.dailyData)) setDailyData(data.dailyData);
        if (Array.isArray(data.weeklyTrend)) setWeeklyTrend(data.weeklyTrend);
        if (Array.isArray(data.statusDistribution))
          setStatusDistribution(data.statusDistribution);
        if (Array.isArray(data.priorityDistribution))
          setPriorityDistribution(data.priorityDistribution);
        if (Array.isArray(data.productivityTrend))
          setProductivityTrend(data.productivityTrend);
        if (data.completionRates) setCompletionRates(data.completionRates);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusData = useMemo(
    () =>
      statusDistribution.map((s) => ({
        name: s.status.replace(/_/g, " "),
        value: s.count,
      })),
    [statusDistribution],
  );

  const priorityData = useMemo(
    () =>
      priorityDistribution.map((p) => ({
        name: p.priority,
        value: p.count,
      })),
    [priorityDistribution],
  );

  const completionRows = useMemo(
    () => [
      { label: "This Week", rate: completionRates.thisWeek },
      { label: "This Month", rate: completionRates.thisMonth },
      { label: "All Time", rate: completionRates.allTime },
    ],
    [completionRates],
  );

  const topStats = [
    {
      label: "Productivity Score",
      value: `${stats.productivityScore}%`,
      icon: TrendingUp,
      color: "text-purple-500",
    },
    {
      label: "Tasks Completed",
      value: stats.completedTasks.toString(),
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      label: "Current Streak",
      value: `${stats.streak} days`,
      icon: Flame,
      color: "text-orange-500",
    },
    {
      label: "Weekly Rate",
      value: `${stats.weeklyCompletionRate}%`,
      icon: Target,
      color: "text-blue-500",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">
            Detailed insights into your productivity
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {topStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent">
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="time">Time</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Daily Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyData}>
                        <defs>
                          <linearGradient
                            id="colorCompleted"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#6366f1"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#6366f1"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted"
                        />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="completed"
                          stroke="#6366f1"
                          fillOpacity={1}
                          fill="url(#colorCompleted)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {statusData.length === 0 ||
                    statusData.every((d) => d.value === 0) ? (
                      <p className="text-sm text-muted-foreground p-6">
                        No tasks in scope yet.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                          >
                            {statusData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Productivity Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={productivityTrend}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#6366f1"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="tasks"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tasks by Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={priorityData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted"
                        />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {completionRows.map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{row.label}</span>
                        <span className="text-sm font-bold">{row.rate}%</span>
                      </div>
                      <Progress value={row.rate} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="time" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Time Spent (hours)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyTrend}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis dataKey="week" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar
                        dataKey="hours"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Weekly Task Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyTrend}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis dataKey="week" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="tasks"
                        stroke="#6366f1"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
