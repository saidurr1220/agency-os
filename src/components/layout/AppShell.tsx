"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import { useAuthStore } from "@/store";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { sidebarCollapsed } = useAppStore();
  const fetchSession = useAuthStore((s) => s.fetchSession);

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Navbar />
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "pl-[72px]" : "pl-[260px]",
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
