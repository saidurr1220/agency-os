"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  MessageSquare,
  Users,
  Loader2,
  LayoutList,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type DbNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

function iconForType(type: string) {
  switch (type) {
    case "TASK_OVERDUE":
      return { Icon: AlertTriangle, color: "text-red-500" };
    case "TASK_COMPLETED":
      return { Icon: Check, color: "text-green-500" };
    case "COMMENT_MENTION":
      return { Icon: MessageSquare, color: "text-blue-500" };
    case "WORKSPACE_INVITE":
    case "TASK_ASSIGNED":
      return { Icon: Users, color: "text-purple-500" };
    default:
      return { Icon: Bell, color: "text-muted-foreground" };
  }
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  return d.toLocaleDateString();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const markAllAsRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">Notifications</h2>
            <p className="text-muted-foreground">
              {loading
                ? "Loading…"
                : unreadCount > 0
                  ? `${unreadCount} unread`
                  : notifications.length === 0
                    ? "No notifications yet — activity will appear here."
                    : "All caught up!"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void markAllAsRead()}
              disabled={loading || unreadCount === 0}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <LayoutList className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No notifications in your inbox.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">
                All
                <Badge variant="secondary" className="ml-2">
                  {notifications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2">
              {notifications.map((notification, index) => {
                const { Icon, color } = iconForType(notification.type);
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card
                      className={`transition-all ${
                        !notification.isRead
                          ? "border-l-4 border-l-primary"
                          : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg bg-accent ${color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="text-sm font-medium">
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                              )}
                              <Badge variant="outline" className="text-[10px]">
                                {notification.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground break-words">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => void markAsRead(notification.id)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </TabsContent>

            <TabsContent value="unread" className="space-y-2">
              {notifications
                .filter((n) => !n.isRead)
                .map((notification, index) => {
                  const { Icon, color } = iconForType(notification.type);
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div
                              className={`p-2 rounded-lg bg-accent ${color}`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium mb-1">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatTime(notification.createdAt)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => void markAsRead(notification.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              {notifications.filter((n) => !n.isRead).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No unread notifications</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}
