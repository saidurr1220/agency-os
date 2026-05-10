import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  Task,
  TaskStatus,
  TaskPriority,
  Journal,
  DashboardStats,
  ViewType,
} from "@/types";

interface TaskFilters {
  status?: string;
  priority?: string;
  search?: string;
  projectId?: string;
}

interface AppState {
  tasks: Task[];
  journals: Journal[];
  currentView: ViewType;
  selectedTask: Task | null;
  filters: TaskFilters;
  isLoading: boolean;
  sidebarCollapsed: boolean;
  /** Last API error for task list/create (cleared on successful fetch). */
  tasksError: string | null;

  // Task actions (API-backed)
  fetchTasks: () => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, status: TaskStatus) => Promise<void>;
  clearTasksError: () => void;

  // UI actions
  setSelectedTask: (task: Task | null) => void;
  setCurrentView: (view: ViewType) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  toggleSidebar: () => void;

  // Journal actions
  fetchJournals: () => Promise<void>;
  addJournal: (journal: Partial<Journal>) => Promise<void>;

  // Dashboard
  fetchDashboard: () => Promise<DashboardStats>;

  // Getters
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByDate: (date: Date) => Task[];
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      tasks: [],
      journals: [],
      currentView: "LIST",
      selectedTask: null,
      filters: {},
      isLoading: false,
      sidebarCollapsed: false,
      tasksError: null,

      // ─── TASK ACTIONS ─────────────────────────────────────────

      fetchTasks: async () => {
        set({ isLoading: true, tasksError: null });
        try {
          const params = new URLSearchParams();
          const { filters } = get();
          if (filters.status) params.set("status", filters.status);
          if (filters.priority) params.set("priority", filters.priority);
          if (filters.search) params.set("search", filters.search);
          if (filters.projectId) params.set("projectId", filters.projectId);

          const res = await fetch(`/api/tasks?${params}`, {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            set({ tasks: data.tasks || [], tasksError: null });
          } else {
            let msg = `Could not load tasks (${res.status})`;
            try {
              const body = (await res.json()) as { error?: string };
              if (body.error) msg = body.error;
            } catch {
              /* ignore */
            }
            set({ tasksError: msg });
          }
        } catch {
          console.error("Failed to fetch tasks");
          set({ tasksError: "Network error while loading tasks." });
        } finally {
          set({ isLoading: false });
        }
      },

      addTask: async (taskData) => {
        set({ tasksError: null });
        try {
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(taskData),
          });

          if (res.ok) {
            const data = await res.json();
            const task = data.task;
            set((state) => ({
              tasks: [task, ...state.tasks],
              tasksError: null,
            }));
            return task;
          }
          let msg = `Could not create task (${res.status})`;
          try {
            const body = (await res.json()) as { error?: string };
            if (body.error) msg = body.error;
          } catch {
            /* ignore */
          }
          set({ tasksError: msg });
        } catch {
          console.error("Failed to create task");
          set({ tasksError: "Network error while creating task." });
        }
        return null;
      },

      clearTasksError: () => set({ tasksError: null }),

      updateTask: async (id, updates) => {
        try {
          const res = await fetch(`/api/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(updates),
          });

          if (res.ok) {
            const data = await res.json();
            set((state) => ({
              tasks: state.tasks.map((t) => (t.id === id ? data.task : t)),
              selectedTask:
                state.selectedTask?.id === id ? data.task : state.selectedTask,
            }));
          }
        } catch {
          console.error("Failed to update task");
        }
      },

      deleteTask: async (id) => {
        try {
          const res = await fetch(`/api/tasks/${id}`, {
            method: "DELETE",
            credentials: "include",
          });

          if (res.ok) {
            set((state) => ({
              tasks: state.tasks.filter((t) => t.id !== id),
              selectedTask:
                state.selectedTask?.id === id ? null : state.selectedTask,
            }));
          }
        } catch {
          console.error("Failed to delete task");
        }
      },

      moveTask: async (id, status) => {
        await get().updateTask(id, { status });
      },

      // ─── UI ACTIONS ──────────────────────────────────────────

      setSelectedTask: (task) => set({ selectedTask: task }),
      setCurrentView: (view) => set({ currentView: view }),
      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),
      clearFilters: () => set({ filters: {} }),
      setLoading: (loading) => set({ isLoading: loading }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // ─── JOURNAL ACTIONS ─────────────────────────────────────

      fetchJournals: async () => {
        try {
          const res = await fetch("/api/journals");
          if (res.ok) {
            const data = await res.json();
            set({ journals: data.journals || [] });
          }
        } catch {
          console.error("Failed to fetch journals");
        }
      },

      addJournal: async (journalData) => {
        try {
          const res = await fetch("/api/journals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(journalData),
          });

          if (res.ok) {
            const data = await res.json();
            set((state) => ({
              journals: [data.journal, ...state.journals],
            }));
          }
        } catch {
          console.error("Failed to create journal");
        }
      },

      // ─── DASHBOARD ──────────────────────────────────────────

      fetchDashboard: async () => {
        try {
          const res = await fetch("/api/dashboard");
          if (res.ok) {
            const data = await res.json();
            return data.stats;
          }
        } catch {
          console.error("Failed to fetch dashboard");
        }
        return {
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          overdueTasks: 0,
          productivityScore: 0,
          weeklyCompletionRate: 0,
          todayCompleted: 0,
          todayTotal: 0,
          streak: 0,
        };
      },

      // ─── GETTERS ────────────────────────────────────────────

      getTasksByStatus: (status) => {
        return get().tasks.filter((t) => t.status === status);
      },

      getTasksByDate: (date) => {
        const dateStr = date.toISOString().split("T")[0];
        return get().tasks.filter((t) => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate).toISOString().split("T")[0] === dateStr;
        });
      },
    }),
    { name: "agency-erp" }
  )
);
