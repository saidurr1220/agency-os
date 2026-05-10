"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Calendar,
  Users,
  Shield,
  Building2,
  FolderKanban,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Building2,
    title: "Company Management",
    description:
      "Full organizational hierarchy with departments, roles, and team structure.",
  },
  {
    icon: FolderKanban,
    title: "Project Tracking",
    description:
      "Manage projects from sales to delivery with status flows and team assignments.",
  },
  {
    icon: CheckCircle2,
    title: "Task Collaboration",
    description:
      "Assign, track, and collaborate on tasks with real-time progress updates.",
  },
  {
    icon: Users,
    title: "Team Hierarchy",
    description:
      "Chairman, managers, team leaders, and employees — everyone has their role.",
  },
  {
    icon: TrendingUp,
    title: "Performance Analytics",
    description:
      "Automatic performance evaluation based on delivery metrics and productivity.",
  },
  {
    icon: BarChart3,
    title: "Revenue Intelligence",
    description:
      "Track project values, delivery performance, and team contributions.",
  },
  {
    icon: Calendar,
    title: "Delivery Tracking",
    description:
      "Never miss a deadline with smart delivery tracking and extension management.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "RBAC permissions, encrypted credentials, and full audit logging.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">AgencyOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Agency Operating System
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Run Your Agency
              <span className="text-primary block">Like a Machine</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              The complete platform for digital agencies. Manage projects, teams,
              clients, and performance — from sales to delivery, all in one
              system.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="text-base px-8">
                  Start Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="text-base px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">
              Everything Your Agency Needs
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              ERP, project management, HRM, and performance tracking — combined
              into one agency-focused platform.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Scale Your Agency?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Join agencies using AgencyOS to streamline operations, boost
                team performance, and deliver projects on time.
              </p>
              <Link href="/register">
                <Button size="lg" className="text-base px-8">
                  Get Started for Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 AgencyOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
