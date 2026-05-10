"use client";

import React, { useState, useEffect, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  Mail,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Edit,
  Award,
  Target,
  Flame,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuthStore, useAppStore } from "@/store";
import {
  buildAchievements,
  OFFICE_CLOSE_HOUR,
  OFFICE_OPEN_HOUR,
} from "@/lib/achievements";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { tasks, fetchTasks, fetchDashboard } = useAppStore();
  const [activityItems, setActivityItems] = useState<
    { action: string; detail: string; time: string }[]
  >([]);
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);

  const [stats, setStats] = useState({
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

  useEffect(() => {
    fetchTasks();
    fetchDashboard().then(setStats);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profile/activity", {
          credentials: "include",
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setUserCreatedAt(data.userCreatedAt ?? null);
        setActivityItems(
          (data.items ?? []).map(
            (row: { action: string; detail: string; at: string }) => ({
              action: row.action,
              detail: row.detail,
              time: formatDistanceToNow(new Date(row.at), { addSuffix: true }),
            }),
          ),
        );
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const achievements = useMemo(
    () => buildAchievements(stats, tasks),
    [stats, tasks],
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{user?.name || "User"}</h1>
                  <Badge variant="secondary">Pro</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Productivity enthusiast | Task management pro
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {user?.email || "user@example.com"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined{" "}
                    {userCreatedAt
                      ? new Date(userCreatedAt).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </div>
                </div>
              </div>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Tasks",
              value: stats.totalTasks,
              icon: Target,
              color: "text-blue-500",
            },
            {
              label: "Completed",
              value: stats.completedTasks,
              icon: Award,
              color: "text-green-500",
            },
            {
              label: "Streak",
              value: `${stats.streak}d`,
              icon: Flame,
              color: "text-orange-500",
            },
            {
              label: "Productivity",
              value: `${stats.productivityScore}%`,
              icon: TrendingUp,
              color: "text-purple-500",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4 text-center">
                  <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>
              Progress is calculated from your tasks (completion times) and
              dashboard stats. Core office window is treated as{" "}
              {OFFICE_OPEN_HOUR}:00–{OFFICE_CLOSE_HOUR}:00 on weekdays — adjust
              in{" "}
              <code className="text-xs bg-muted px-1 rounded">
                src/lib/achievements.ts
              </code>{" "}
              if your office hours differ (e.g. 9–5 vs 9–6).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.name}
                  className="flex items-start gap-4 p-4 rounded-lg border"
                >
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium">{achievement.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={achievement.progress}
                        className="h-2 flex-1"
                      />
                      <span className="text-xs font-medium">
                        {achievement.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recent task or journal activity yet.
                </p>
              ) : (
                activityItems.map((activity, index) => (
                  <div
                    key={`${activity.detail}-${index}`}
                    className="flex items-center gap-4"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.action}</span>
                        {" — "}
                        <span className="text-muted-foreground">
                          {activity.detail}
                        </span>
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {activity.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
