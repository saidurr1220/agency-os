"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Plus, Trash2, Layers, Tag, Loader2, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store";
import { userCanManageOrg } from "@/config/org-roles";

interface Department {
  id: string;
  name: string;
  _count: { users: number; designations: number };
}

interface Designation {
  id: string;
  title: string;
  departmentId: string;
  department: { name: string };
  _count: { users: number };
}

export default function CompanyPage() {
  const { user } = useAuthStore();
  const canEditOrg = userCanManageOrg(user?.companyRole);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDesigTitle, setNewDesigTitle] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [addingDept, setAddingDept] = useState(false);
  const [addingDesig, setAddingDesig] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDepartments(data.departments || []);
        setApiError(null);
      } else {
        setApiError(data.error || "Could not load departments");
      }
    } catch {
      setApiError("Could not load departments");
    }
  };

  const fetchDesignations = async () => {
    try {
      const res = await fetch("/api/designations", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDesignations(data.designations || []);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    Promise.all([fetchDepartments(), fetchDesignations()]).finally(() =>
      setIsLoading(false),
    );
  }, []);

  const addDepartment = async () => {
    if (!newDeptName.trim() || !canEditOrg) return;
    setAddingDept(true);
    setApiError(null);

    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDeptName.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setNewDeptName("");
        fetchDepartments();
      } else {
        setApiError(data.error || "Could not add department");
      }
    } catch {
      setApiError("Could not add department");
    } finally {
      setAddingDept(false);
    }
  };

  const deleteDepartment = async (id: string) => {
    if (!canEditOrg) return;
    setApiError(null);
    try {
      const res = await fetch(`/api/departments?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        fetchDepartments();
        fetchDesignations();
      } else {
        setApiError(data.error || "Could not delete department");
      }
    } catch {
      setApiError("Could not delete department");
    }
  };

  const addDesignation = async () => {
    if (!newDesigTitle.trim() || !selectedDept || !canEditOrg) return;
    setAddingDesig(true);
    setApiError(null);

    try {
      const res = await fetch("/api/designations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newDesigTitle.trim(),
          departmentId: selectedDept,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setNewDesigTitle("");
        fetchDesignations();
      } else {
        setApiError(data.error || "Could not add designation");
      }
    } catch {
      setApiError("Could not add designation");
    } finally {
      setAddingDesig(false);
    }
  };

  const deleteDesignation = async (id: string) => {
    if (!canEditOrg) return;
    setApiError(null);
    try {
      const res = await fetch(`/api/designations?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        fetchDesignations();
      } else {
        setApiError(data.error || "Could not delete designation");
      }
    } catch {
      setApiError("Could not delete designation");
    }
  };

  const defaultDepartments = [
    "WordPress",
    "Shopify",
    "MERN",
    "UI/UX",
    "Graphics Design",
    "Operations",
    "Sales",
    "HR",
    "Admin",
  ];

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
        <div>
          <h2 className="text-2xl font-bold">Company Structure</h2>
          <p className="text-muted-foreground">
            Manage departments and designations for your workspace
          </p>
          {!user?.companyId && (
            <p className="text-sm text-amber-600 dark:text-amber-500 mt-2">
              Join or create a company to manage departments.
            </p>
          )}
          {user?.companyId && !canEditOrg && (
            <p className="text-sm text-muted-foreground mt-2">
              Only chairs, board, managers, HR, and team leads can add or remove
              departments and designations. You can still view the structure.
            </p>
          )}
          {apiError && (
            <p className="text-sm text-destructive mt-2">{apiError}</p>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Departments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Departments
                <Badge variant="secondary" className="ml-auto">
                  {departments.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Department */}
              <div className="flex gap-2">
                <Input
                  placeholder="Department name"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addDepartment()}
                />
                <Button
                  onClick={addDepartment}
                  disabled={addingDept || !newDeptName.trim() || !canEditOrg}
                >
                  {addingDept ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Quick Add Defaults */}
              {departments.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Quick add common departments:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {defaultDepartments.map((dept) => (
                      <Badge
                        key={dept}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={async () => {
                          if (!canEditOrg) return;
                          setApiError(null);
                          const res = await fetch("/api/departments", {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: dept }),
                          });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok) {
                            setApiError(data.error || "Quick add failed");
                            return;
                          }
                          fetchDepartments();
                        }}
                      >
                        + {dept}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Department List */}
              <div className="space-y-2">
                <AnimatePresence>
                  {departments.map((dept) => (
                    <motion.div
                      key={dept.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{dept.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {dept._count.users} members ·{" "}
                          {dept._count.designations} designations
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteDepartment(dept.id)}
                        disabled={!canEditOrg}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {departments.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No departments yet. Add one above.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Designations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Designations
                <Badge variant="secondary" className="ml-auto">
                  {designations.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Designation */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Select
                  value={selectedDept || undefined}
                  onValueChange={setSelectedDept}
                >
                  <SelectTrigger className="w-full sm:flex-1 min-w-[180px]">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Designation title"
                  value={newDesigTitle}
                  onChange={(e) => setNewDesigTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addDesignation()}
                  className="w-full sm:w-48"
                />
                <Button
                  onClick={addDesignation}
                  disabled={
                    addingDesig ||
                    !newDesigTitle.trim() ||
                    !selectedDept ||
                    !canEditOrg
                  }
                >
                  {addingDesig ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Designation List */}
              <div className="space-y-2">
                <AnimatePresence>
                  {designations.map((desig) => (
                    <motion.div
                      key={desig.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{desig.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {desig.department.name} · {desig._count.users} members
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteDesignation(desig.id)}
                        disabled={!canEditOrg}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {designations.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No designations yet. Add departments first.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
