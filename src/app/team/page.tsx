"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Copy,
  Check,
  Clock,
  Mail,
  Shield,
  Loader2,
  Pencil,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store";
import { userCanManageOrg } from "@/config/org-roles";

/** Radix Select cannot use empty string as value — sentinel for “unassigned”. */
const SELECT_NONE = "__none__";

interface Invitation {
  id: string;
  email: string;
  code: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  memberRole: string;
  companyRole: string;
  departmentId: string | null;
  departmentName: string | null;
  designationId: string | null;
  designationTitle: string | null;
}

interface DeptOption {
  id: string;
  name: string;
}

interface DesigOption {
  id: string;
  title: string;
}

export default function TeamPage() {
  const { user } = useAuthStore();
  const canInvite =
    user?.companyRole &&
    ["CHAIRMAN", "MANAGER", "ADMIN", "TEAM_LEADER"].includes(user.companyRole);

  const canOrg = userCanManageOrg(user?.companyRole);

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("EMPLOYEE");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [designationOpts, setDesignationOpts] = useState<DesigOption[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [editDeptId, setEditDeptId] = useState<string>(SELECT_NONE);
  const [editDesigId, setEditDesigId] = useState<string>(SELECT_NONE);
  const [savingMember, setSavingMember] = useState(false);
  const [memberError, setMemberError] = useState("");

  const fetchInvitations = async () => {
    try {
      const res = await fetch("/api/invitations/list", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
      }
    } catch {
      /* ignore */
    } finally {
      setIsFetching(false);
    }
  };

  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const res = await fetch("/api/team/members", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch {
      /* ignore */
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/departments", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const fetchDesignationsForDept = useCallback(async (departmentId: string) => {
    if (!departmentId || departmentId === SELECT_NONE) {
      setDesignationOpts([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/designations?departmentId=${encodeURIComponent(departmentId)}`,
        { credentials: "include" },
      );
      if (res.ok) {
        const data = await res.json();
        const rows = (data.designations || []) as {
          id: string;
          title: string;
        }[];
        setDesignationOpts(rows.map((r) => ({ id: r.id, title: r.title })));
      }
    } catch {
      setDesignationOpts([]);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
    fetchMembers();
    fetchDepartments();
  }, [fetchMembers, fetchDepartments]);

  useEffect(() => {
    if (editOpen && editDeptId && editDeptId !== SELECT_NONE) {
      void fetchDesignationsForDept(editDeptId);
    } else if (!editDeptId || editDeptId === SELECT_NONE) {
      setDesignationOpts([]);
    }
  }, [editOpen, editDeptId, fetchDesignationsForDept]);

  const openEdit = (m: TeamMember) => {
    setMemberError("");
    setEditMember(m);
    setEditDeptId(m.departmentId || SELECT_NONE);
    setEditDesigId(m.designationId || SELECT_NONE);
    setEditOpen(true);
    if (m.departmentId) {
      void fetchDesignationsForDept(m.departmentId);
    } else {
      setDesignationOpts([]);
    }
  };

  const saveMemberOrg = async () => {
    if (!editMember || !canOrg) return;
    setSavingMember(true);
    setMemberError("");
    try {
      const res = await fetch("/api/team/members", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editMember.id,
          departmentId:
            !editDeptId || editDeptId === SELECT_NONE ? null : editDeptId,
          designationId:
            !editDesigId || editDesigId === SELECT_NONE ? null : editDesigId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMemberError(data.error || "Update failed");
        return;
      }
      setEditOpen(false);
      setEditMember(null);
      fetchMembers();
    } catch {
      setMemberError("Update failed");
    } finally {
      setSavingMember(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;

    setIsLoading(true);
    setError("");
    setGeneratedCode("");

    try {
      const res = await fetch("/api/invitations/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create invitation");
        return;
      }

      setGeneratedCode(data.code);
      setInviteEmail("");
      fetchInvitations();
    } catch {
      setError("Failed to create invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = async (code: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable or permission denied */
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "ACCEPTED":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "EXPIRED":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Team Management</h2>
            <p className="text-muted-foreground">
              Members, org assignments, and invitations
            </p>
          </div>
        </div>

        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team members
            </CardTitle>
            <CardDescription>
              People in your company. Managers can set department and job title
              (designation).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !user?.companyId ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Join a company to see your team.
              </p>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No members found yet.
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">{m.companyRole}</Badge>
                        {m.departmentName && (
                          <Badge variant="outline">{m.departmentName}</Badge>
                        )}
                        {m.designationTitle && (
                          <Badge variant="outline">{m.designationTitle}</Badge>
                        )}
                      </div>
                    </div>
                    {canOrg && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(m)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Dept / title
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Department & designation</DialogTitle>
              <DialogDescription>
                {editMember?.name} — pick department first, then designation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={editDeptId}
                  onValueChange={(v) => {
                    setEditDeptId(v);
                    setEditDesigId(SELECT_NONE);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_NONE}>Unassigned</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Select
                  value={editDesigId}
                  onValueChange={setEditDesigId}
                  disabled={!editDeptId || editDeptId === SELECT_NONE}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        editDeptId && editDeptId !== SELECT_NONE
                          ? "Designation"
                          : "Choose department first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_NONE}>None</SelectItem>
                    {designationOpts.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {memberError && (
                <p className="text-sm text-destructive">{memberError}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void saveMemberOrg()}
                disabled={savingMember}
              >
                {savingMember ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invite Section */}
        {canInvite && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Invite Team Member
              </CardTitle>
              <CardDescription>
                Generate an invitation code for a new team member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end flex-wrap">
                <div className="flex-1 space-y-2 min-w-[200px]">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="team-member@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="w-48 space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">Employee</SelectItem>
                      <SelectItem value="TEAM_LEADER">Team Leader</SelectItem>
                      <SelectItem value="CO_LEADER">Co-Leader</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleInvite}
                  disabled={isLoading || !inviteEmail}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Generate Code
                    </>
                  )}
                </Button>
              </div>

              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

              {generatedCode && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                >
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                    Invitation code generated!
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-2xl font-mono font-bold tracking-wider bg-background px-4 py-2 rounded border">
                      {generatedCode}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCode(generatedCode)}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this code with the team member. They can use it during
                    registration.
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Invitations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isFetching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No invitations yet. Invite your first team member!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{inv.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            {inv.role}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getStatusColor(inv.status)}`}
                          >
                            {inv.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {inv.status === "PENDING" && (
                        <>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(inv.expiresAt).toLocaleDateString()}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyCode(inv.code)}
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-1" />
                                {inv.code}
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
