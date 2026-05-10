"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Flame,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { DashboardStats } from "@/types";

interface StatsCardsProps {
  stats: DashboardStats;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      icon: Target,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      trend: null,
      href: "/tasks" as const,
    },
    {
      title: "Completed",
      value: stats.completedTasks,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
      trend: { value: 12, isUp: true },
      href: "/tasks" as const,
    },
    {
      title: "In Progress",
      value: stats.pendingTasks,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
      trend: null,
      href: "/tasks" as const,
    },
    {
      title: "Overdue",
      value: stats.overdueTasks,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950",
      trend: { value: 5, isUp: false },
      href: "/tasks" as const,
    },
    {
      title: "Productivity",
      value: `${stats.productivityScore}%`,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      trend: { value: 8, isUp: true },
      href: "/analytics" as const,
    },
    {
      title: "Streak",
      value: `${stats.streak} days`,
      icon: Flame,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      trend: null,
      href: "/profile" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          custom={index}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Link
            href={card.href}
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Card className="hover:shadow-lg transition-all duration-300 group h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  {card.trend && (
                    <div
                      className={`flex items-center gap-1 text-xs ${card.trend.isUp ? "text-green-500" : "text-red-500"}`}
                    >
                      {card.trend.isUp ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      <span>{card.trend.value}%</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.title}
                  </p>
                </div>
                {card.title === "Productivity" && (
                  <Progress
                    value={stats.productivityScore}
                    className="mt-3 h-1.5"
                  />
                )}
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
