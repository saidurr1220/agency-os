"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  LayoutGrid,
  List,
  Calendar,
  Filter,
  SortAsc,
  Search,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { TaskList } from "@/components/tasks/TaskList";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { CalendarView } from "@/components/tasks/CalendarView";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store";
import type { Task, TaskStatus, TaskPriority, ViewType } from "@/types";

export default function TasksPage() {
  const { tasks, addTask, updateTask, moveTask, fetchTasks, tasksError, clearTasksError } =
    useAppStore();
  const [view, setView] = useState<ViewType>("LIST");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "ALL">(
    "ALL",
  );

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        searchQuery === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (editingTask) {
      await updateTask(editingTask.id, data as Partial<Task>);
      return true;
    }
    const created = await addTask({
      ...data,
      workspaceId: "1",
      creatorId: "1",
      tags: [],
      progress: 0,
    } as unknown as Omit<Task, "id" | "createdAt" | "updatedAt" | "position">);
    return created != null;
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    moveTask(taskId, status);
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const activeFiltersCount = [statusFilter, priorityFilter].filter(
    (f) => f !== "ALL",
  ).length;

  return (
    <AppShell>
      <div className="space-y-6">
        {tasksError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-start justify-between gap-3"
          >
            <span>{tasksError}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-destructive"
              onClick={() => clearTasksError()}
            >
              Dismiss
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Tasks</h2>
            <p className="text-muted-foreground">
              Manage and track all your tasks
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as TaskStatus | "ALL")}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="REVIEW">Review</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={priorityFilter}
              onValueChange={(v) =>
                setPriorityFilter(v as TaskPriority | "ALL")
              }
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("ALL");
                  setPriorityFilter("ALL");
                }}
              >
                Clear filters
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={view === "LIST" ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => setView("LIST")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={view === "KANBAN" ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => setView("KANBAN")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={view === "CALENDAR" ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => setView("CALENDAR")}
            >
              <Calendar className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{filteredTasks.length} tasks</span>
          {searchQuery && <span>matching &quot;{searchQuery}&quot;</span>}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view === "LIST" && (
              <TaskList
                tasks={filteredTasks}
                onStatusChange={handleStatusChange}
                onTaskClick={handleTaskClick}
              />
            )}
            {view === "KANBAN" && (
              <KanbanBoard
                tasks={filteredTasks}
                onStatusChange={handleStatusChange}
                onTaskClick={handleTaskClick}
              />
            )}
            {view === "CALENDAR" && (
              <CalendarView
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                onDateClick={(date) => {
                  setEditingTask(null);
                  setShowForm(true);
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <TaskForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTask(null);
        }}
        onSubmit={handleSubmit}
        task={editingTask}
      />
    </AppShell>
  );
}
