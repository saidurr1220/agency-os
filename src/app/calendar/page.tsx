"use client";

import React, { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarView } from "@/components/tasks/CalendarView";
import { useAppStore } from "@/store";
import type { Task } from "@/types";

export default function CalendarPage() {
  const { tasks, fetchTasks } = useAppStore();

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const handleTaskClick = (task: Task) => {
    // Navigate to task detail or open modal
    console.log("Task clicked:", task);
  };

  const handleDateClick = (date: Date) => {
    // Open new task form for this date
    console.log("Date clicked:", date);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Calendar</h2>
          <p className="text-muted-foreground">
            View and manage your tasks on a calendar
          </p>
        </div>

        <CalendarView
          tasks={tasks}
          onTaskClick={handleTaskClick}
          onDateClick={handleDateClick}
        />
      </div>
    </AppShell>
  );
}
