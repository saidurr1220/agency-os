"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  BarChart3,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Zap,
  Calendar,
  LogOut,
  User,
  Users,
  Building2,
  FolderKanban,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import { useAuthStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Journal", href: "/journal", icon: BookOpen },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Team", href: "/team", icon: Users },
  { name: "Company", href: "/company", icon: Building2 },
];

const bottomNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Profile", href: "/profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { user, logout } = useAuthStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-40 h-screen border-r bg-card flex flex-col"
    >
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">AgencyOS</span>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          className="ml-auto"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        {!sidebarCollapsed && (
          <div className="mb-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-muted-foreground"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Search...</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
        )}

        <Button
          variant="default"
          size={sidebarCollapsed ? "icon" : "default"}
          className={cn("mb-4", sidebarCollapsed ? "w-10 h-10" : "w-full")}
          asChild
        >
          <Link href="/tasks" className={cn(!sidebarCollapsed && "gap-2")}>
            <Plus className={cn("w-4 h-4 shrink-0")} />
            {!sidebarCollapsed && <span>New Task</span>}
          </Link>
        </Button>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer group relative",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <item.icon
                  className={cn("w-5 h-5 shrink-0", isActive && "text-primary")}
                />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="ml-3 whitespace-nowrap overflow-hidden"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                  />
                )}
                {sidebarCollapsed && hoveredItem === item.name && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground rounded-md shadow-md text-sm whitespace-nowrap z-50 pointer-events-none">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}

          {user?.systemRole === "SUPER_ADMIN" && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer group relative",
                pathname.startsWith("/admin")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
              onMouseEnter={() => setHoveredItem("Admin")}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Shield
                className={cn(
                  "w-5 h-5 shrink-0",
                  pathname.startsWith("/admin") && "text-primary",
                )}
              />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="ml-3 whitespace-nowrap overflow-hidden"
                  >
                    Admin
                  </motion.span>
                )}
              </AnimatePresence>
              {pathname.startsWith("/admin") && (
                <motion.div
                  layoutId="sidebar-indicator-admin"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                />
              )}
              {sidebarCollapsed && hoveredItem === "Admin" && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground rounded-md shadow-md text-sm whitespace-nowrap z-50 pointer-events-none">
                  Admin
                </div>
              )}
            </Link>
          )}
        </nav>
      </div>

      <div className="border-t p-3 space-y-1">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="ml-3"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}

        <div
          className={cn(
            "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
          )}
          onClick={logout}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="ml-3"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {user && !sidebarCollapsed && (
          <div className="mt-3 p-3 rounded-lg bg-accent/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
