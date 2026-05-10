"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Moon,
  Sun,
  Monitor,
  Save,
  Loader2,
} from "lucide-react";
import { useTheme } from "next-themes";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store";

const SELECT_NONE = "__none__";

export default function SettingsPage() {
  const { user, fetchSession } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [deptId, setDeptId] = useState(SELECT_NONE);
  const [desigId, setDesigId] = useState(SELECT_NONE);
  const [departments, setDepartments] = useState<
    { id: string; name: string }[]
  >([]);
  const [designations, setDesignations] = useState<
    { id: string; title: string }[]
  >([]);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await fetch("/api/users/me", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const u = data.user;
      if (!u) return;
      setProfileName(u.name || "");
      setProfilePhone(u.phone || "");
      setDeptId(u.departmentId || SELECT_NONE);
      setDesigId(u.designationId || SELECT_NONE);

      const dRes = await fetch("/api/departments", { credentials: "include" });
      if (dRes.ok) {
        const dj = await dRes.json();
        setDepartments(dj.departments || []);
      }

      if (u.departmentId) {
        const gRes = await fetch(
          `/api/designations?departmentId=${encodeURIComponent(u.departmentId)}`,
          { credentials: "include" },
        );
        if (gRes.ok) {
          const gj = await gRes.json();
          setDesignations(gj.designations || []);
        }
      } else {
        setDesignations([]);
      }
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const loadDesignations = async (departmentId: string) => {
    if (!departmentId || departmentId === SELECT_NONE) {
      setDesignations([]);
      return;
    }
    const gRes = await fetch(
      `/api/designations?departmentId=${encodeURIComponent(departmentId)}`,
      { credentials: "include" },
    );
    if (gRes.ok) {
      const gj = await gRes.json();
      setDesignations(gj.designations || []);
    }
  };

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    dueReminders: true,
    overdueAlerts: true,
    weeklyReport: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone || null,
          departmentId: deptId === SELECT_NONE ? null : deptId,
          designationId: desigId === SELECT_NONE ? null : desigId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMessage(data.error || "Could not save");
        return;
      }
      setSaveMessage("Saved.");
      await fetchSession();
    } catch {
      setSaveMessage("Could not save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Name, phone, and your department / designation (when you
                  belong to a company).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ""}
                          disabled
                          className="opacity-80"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email is managed through your login provider.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                      />
                    </div>

                    {user?.companyId ? (
                      <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
                        <div className="space-y-2">
                          <Label>Department</Label>
                          <Select
                            value={deptId}
                            onValueChange={(v) => {
                              setDeptId(v);
                              setDesigId(SELECT_NONE);
                              void loadDesignations(v);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={SELECT_NONE}>None</SelectItem>
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
                            value={desigId}
                            onValueChange={setDesigId}
                            disabled={!deptId || deptId === SELECT_NONE}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Designation" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={SELECT_NONE}>None</SelectItem>
                              {designations.map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                  {d.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Choose department first. Options come from Company →
                            Structure.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground border-t pt-4">
                        Join a company to assign department and designation.
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Local time:{" "}
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </p>

                    {saveMessage && (
                      <p
                        className={`text-sm ${saveMessage === "Saved." ? "text-green-600" : "text-destructive"}`}
                      >
                        {saveMessage}
                      </p>
                    )}

                    <Button
                      onClick={() => void handleSave()}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, email: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications
                    </p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, push: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Due Date Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Get reminded before tasks are due
                    </p>
                  </div>
                  <Switch
                    checked={notifications.dueReminders}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        dueReminders: checked,
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Overdue Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get alerted about overdue tasks
                    </p>
                  </div>
                  <Switch
                    checked={notifications.overdueAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        overdueAlerts: checked,
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Report</p>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly productivity summary
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReport}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        weeklyReport: checked,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how AgencyOS looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base">Theme</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select your preferred theme
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: "light", icon: Sun, label: "Light" },
                      { value: "dark", icon: Moon, label: "Dark" },
                      { value: "system", icon: Monitor, label: "System" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setTheme(item.value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          theme === item.value
                            ? "border-primary bg-primary/10"
                            : "border-transparent hover:bg-accent"
                        }`}
                      >
                        <item.icon className="w-6 h-6" />
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button>Update Password</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
