"use client";

import React, { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  FolderKanban,
  Clock,
  CheckCircle2,
  Loader2,
  UserPlus,
  Shield,
  X,
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store";
import {
  PROJECT_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  PLATFORM_LABELS,
} from "@/config/constants";

interface ProjectData {
  project: {
    id: string;
    name: string;
    description: string | null;
    clientName: string | null;
    clientEmail: string | null;
    platform: string | null;
    orderId: string | null;
    orderValue: number | null;
    currency: string;
    priority: string;
    projectStatus: string;
    startDate: string | null;
    deliveryDate: string | null;
    estimatedDays: number | null;
    createdAt: string;
    owner: { id: string; name: string; email: string; avatar: string | null };
    department: { id: string; name: string } | null;
    assignments: {
      id: string;
      role: string;
      user: { id: string; name: string; email: string; avatar: string | null };
    }[];
    tasks: {
      id: string;
      title: string;
      status: string;
      priority: string;
      assignee: { id: string; name: string } | null;
    }[];
    extensions: {
      id: string;
      fromDate: string;
      toDate: string;
      reason: string;
      createdAt: string;
    }[];
    _count: { tasks: number };
  };
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    review: number;
    onHold: number;
  };
}

const statusColors: Record<string, string> = {
  PENDING_REVIEW: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  ASSIGNED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  IN_PROGRESS: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  WAITING_CLIENT: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  REVISION: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  QA_TESTING: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  DELIVERED: "bg-green-500/10 text-green-500 border-green-500/20",
  EXTENDED: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ON_HOLD: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  CANCELLED: "bg-red-500/10 text-red-500 border-red-500/20",
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING_REVIEW: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "ON_HOLD", "CANCELLED"],
  IN_PROGRESS: ["WAITING_CLIENT", "REVISION", "QA_TESTING", "ON_HOLD", "EXTENDED"],
  WAITING_CLIENT: ["IN_PROGRESS", "ON_HOLD"],
  REVISION: ["IN_PROGRESS", "QA_TESTING"],
  QA_TESTING: ["IN_PROGRESS", "DELIVERED"],
  DELIVERED: [],
  EXTENDED: ["IN_PROGRESS"],
  ON_HOLD: ["IN_PROGRESS", "CANCELLED"],
  CANCELLED: [],
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuthStore();
  const [data, setData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [showAssign, setShowAssign] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRole, setAssignRole] = useState("MEMBER");
  const [assigning, setAssigning] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch("/api/team/members");
      if (res.ok) {
        const result = await res.json();
        setTeamMembers(result.members || []);
      }
    } catch {
      // Silent fail
    }
  };

  useEffect(() => {
    fetchProject();
    fetchTeamMembers();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchProject();
      }
    } catch {
      // Silent fail
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignUserId) return;
    setAssigning(true);

    try {
      const res = await fetch(`/api/projects/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: assignUserId, role: assignRole }),
      });

      if (res.ok) {
        setShowAssign(false);
        setAssignUserId("");
        setAssignRole("MEMBER");
        fetchProject();
      }
    } catch {
      // Silent fail
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (userId: string) => {
    try {
      await fetch(`/api/projects/${id}/assign?userId=${userId}`, {
        method: "DELETE",
      });
      fetchProject();
    } catch {
      // Silent fail
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Project not found</h2>
          <Link href="/projects">
            <Button variant="outline" className="mt-4">
              Back to Projects
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const { project, taskStats } = data;
  const progress =
    taskStats.total > 0
      ? Math.round((taskStats.completed / taskStats.total) * 100)
      : 0;
  const allowedTransitions =
    VALID_TRANSITIONS[project.projectStatus] || [];
  const isManager = user?.companyRole && 
    ["CHAIRMAN", "MANAGER", "ADMIN", "TEAM_LEADER"].includes(user.companyRole);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link
              href="/projects"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Projects
            </Link>
            <h2 className="text-2xl font-bold">{project.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={statusColors[project.projectStatus]}
              >
                {PROJECT_STATUS_LABELS[project.projectStatus]}
              </Badge>
              <Badge variant="outline">
                {project.priority}
              </Badge>
              {project.platform && (
                <Badge variant="outline">
                  {PLATFORM_LABELS[project.platform]}
                </Badge>
              )}
            </div>
          </div>

          {/* Status Change */}
          {isManager && allowedTransitions.length > 0 && (
            <div className="flex items-center gap-2">
              <Select onValueChange={handleStatusChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  {allowedTransitions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {PROJECT_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {statusLoading && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.description && (
                  <p className="text-muted-foreground">{project.description}</p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {project.clientName && (
                    <div>
                      <p className="text-xs text-muted-foreground">Client</p>
                      <p className="font-medium">{project.clientName}</p>
                    </div>
                  )}
                  {project.orderValue && (
                    <div>
                      <p className="text-xs text-muted-foreground">Value</p>
                      <p className="font-medium flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {project.orderValue} {project.currency}
                      </p>
                    </div>
                  )}
                  {project.deliveryDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Delivery</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.deliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {project.department && (
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="font-medium">{project.department.name}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Task Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Task Progress</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {taskStats.completed} / {taskStats.total}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="mb-4" />
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-gray-500/10">
                    <p className="text-lg font-bold">{taskStats.todo}</p>
                    <p className="text-xs text-muted-foreground">To Do</p>
                  </div>
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <p className="text-lg font-bold">{taskStats.inProgress}</p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <p className="text-lg font-bold">{taskStats.review}</p>
                    <p className="text-xs text-muted-foreground">Review</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <p className="text-lg font-bold">{taskStats.completed}</p>
                    <p className="text-xs text-muted-foreground">Done</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-500/10">
                    <p className="text-lg font-bold">{taskStats.onHold}</p>
                    <p className="text-xs text-muted-foreground">On Hold</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasks List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tasks</span>
                  <Link href={`/tasks?project=${id}`}>
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.tasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No tasks yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {project.tasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              task.status === "COMPLETED"
                                ? "bg-green-500"
                                : task.status === "IN_PROGRESS"
                                  ? "bg-yellow-500"
                                  : "bg-gray-500"
                            }`}
                          />
                          <span className="text-sm">{task.title}</span>
                        </div>
                        {task.assignee && (
                          <span className="text-xs text-muted-foreground">
                            {task.assignee.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Team</span>
                  {isManager && (
                    <Dialog open={showAssign} onOpenChange={setShowAssign}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Team Member</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <Label>Member</Label>
                            <Select
                              value={assignUserId}
                              onValueChange={setAssignUserId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select member" />
                              </SelectTrigger>
                              <SelectContent>
                                {teamMembers.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name} ({m.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Role</Label>
                            <Select
                              value={assignRole}
                              onValueChange={setAssignRole}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LEADER">Leader</SelectItem>
                                <SelectItem value="CO_LEADER">Co-Leader</SelectItem>
                                <SelectItem value="MEMBER">Member</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            className="w-full"
                            onClick={handleAssign}
                            disabled={assigning || !assignUserId}
                          >
                            {assigning ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Assign
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Owner */}
                  <div className="flex items-center gap-3 p-2 bg-accent/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {project.owner.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{project.owner.name}</p>
                      <p className="text-xs text-muted-foreground">Owner</p>
                    </div>
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  </div>

                  {/* Assignments */}
                  {project.assignments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-2 border rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                        {a.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{a.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.role}
                        </p>
                      </div>
                      {isManager && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleUnassign(a.user.id)}
                          className="text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {project.assignments.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-2">
                      No members assigned
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Extensions */}
            {project.extensions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Extensions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.extensions.map((ext) => (
                      <div key={ext.id} className="p-2 border rounded-lg">
                        <p className="text-sm font-medium">
                          {new Date(ext.fromDate).toLocaleDateString()} →{" "}
                          {new Date(ext.toDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ext.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
