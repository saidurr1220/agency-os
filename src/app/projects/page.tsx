"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Loader2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
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

interface Project {
  id: string;
  name: string;
  description: string | null;
  clientName: string | null;
  platform: string | null;
  orderValue: number | null;
  currency: string;
  priority: string;
  projectStatus: string;
  deliveryDate: string | null;
  createdAt: string;
  owner: { id: string; name: string; avatar: string | null };
  department: { id: string; name: string } | null;
  assignments: {
    id: string;
    role: string;
    user: { id: string; name: string; avatar: string | null };
  }[];
  _count: { tasks: number };
}

const statusColors: Record<string, string> = {
  PENDING_REVIEW: "bg-gray-500/10 text-gray-500",
  ASSIGNED: "bg-blue-500/10 text-blue-500",
  IN_PROGRESS: "bg-yellow-500/10 text-yellow-500",
  WAITING_CLIENT: "bg-orange-500/10 text-orange-500",
  REVISION: "bg-purple-500/10 text-purple-500",
  QA_TESTING: "bg-cyan-500/10 text-cyan-500",
  DELIVERED: "bg-green-500/10 text-green-500",
  EXTENDED: "bg-amber-500/10 text-amber-500",
  ON_HOLD: "bg-slate-500/10 text-slate-500",
  CANCELLED: "bg-red-500/10 text-red-500",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-blue-500/10 text-blue-500",
  MEDIUM: "bg-yellow-500/10 text-yellow-500",
  HIGH: "bg-orange-500/10 text-orange-500",
  URGENT: "bg-red-500/10 text-red-500",
};

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [departments, setDepartments] = useState<
    { id: string; name: string }[]
  >([]);

  // Create form state
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    clientName: "",
    platform: "",
    orderValue: "",
    currency: "USD",
    priority: "MEDIUM",
    departmentId: "",
    deliveryDate: "",
  });
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/projects?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || []);
      }
    } catch {
      // Silent fail
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchDepartments();
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchProjects, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = async () => {
    if (!newProject.name) return;
    setCreating(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });

      if (res.ok) {
        setShowCreate(false);
        setNewProject({
          name: "",
          description: "",
          clientName: "",
          platform: "",
          orderValue: "",
          currency: "USD",
          priority: "MEDIUM",
          departmentId: "",
          deliveryDate: "",
        });
        fetchProjects();
      }
    } catch {
      // Silent fail
    } finally {
      setCreating(false);
    }
  };

  const canCreate =
    user?.companyRole &&
    ["CHAIRMAN", "MANAGER", "ADMIN"].includes(user.companyRole);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Projects</h2>
            <p className="text-muted-foreground">Manage your agency projects</p>
          </div>
          {canCreate && (
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Project Name *</Label>
                      <Input
                        placeholder="E-commerce Website"
                        value={newProject.name}
                        onChange={(e) =>
                          setNewProject({ ...newProject, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Client Name</Label>
                      <Input
                        placeholder="Client name"
                        value={newProject.clientName}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            clientName: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Project description"
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Platform</Label>
                      <Select
                        value={newProject.platform || undefined}
                        onValueChange={(v) =>
                          setNewProject({ ...newProject, platform: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIVERR">Fiverr</SelectItem>
                          <SelectItem value="UPWORK">Upwork</SelectItem>
                          <SelectItem value="DIRECT">Direct</SelectItem>
                          <SelectItem value="REFERRAL">Referral</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Order Value</Label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={newProject.orderValue}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            orderValue: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select
                        value={newProject.priority || "MEDIUM"}
                        onValueChange={(v) =>
                          setNewProject({ ...newProject, priority: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select
                        value={newProject.departmentId || undefined}
                        onValueChange={(v) =>
                          setNewProject({ ...newProject, departmentId: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              departments.length
                                ? "Select department"
                                : "Add departments under Company first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Delivery Date</Label>
                      <Input
                        type="date"
                        value={newProject.deliveryDate}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            deliveryDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreate(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={creating || !newProject.name}
                    >
                      {creating ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Create Project
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(PROJECT_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Project List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FolderKanban className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">
                {canCreate
                  ? "Create your first project to get started."
                  : "No projects assigned to you yet."}
              </p>
              {canCreate && (
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/projects/${project.id}`}>
                  <Card className="hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {project.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={statusColors[project.projectStatus]}
                            >
                              {PROJECT_STATUS_LABELS[project.projectStatus]}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={priorityColors[project.priority]}
                            >
                              {project.priority}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {project.clientName && (
                              <span>Client: {project.clientName}</span>
                            )}
                            {project.platform && (
                              <span>
                                {PLATFORM_LABELS[project.platform] ||
                                  project.platform}
                              </span>
                            )}
                            {project.orderValue && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {project.orderValue} {project.currency}
                              </span>
                            )}
                            {project.department && (
                              <span>{project.department.name}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <FolderKanban className="w-3 h-3" />
                              {project._count.tasks} tasks
                            </span>
                            {project.deliveryDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(
                                  project.deliveryDate,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Assigned Members */}
                        <div className="flex items-center gap-1">
                          {project.assignments.slice(0, 3).map((a) => (
                            <div
                              key={a.id}
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold border-2 border-background"
                              title={`${a.user.name} (${a.role})`}
                            >
                              {a.user.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {project.assignments.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                              +{project.assignments.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
