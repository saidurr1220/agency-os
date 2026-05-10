export const APP_NAME = "AgencyOS";
export const APP_DESCRIPTION = "The complete operating system for digital agencies";
export const APP_VERSION = "0.2.0";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  DASHBOARD: "/dashboard",
  TASKS: "/tasks",
  TASK_DETAIL: (id: string) => `/tasks/${id}`,
  PROJECTS: "/projects",
  PROJECT_DETAIL: (id: string) => `/projects/${id}`,
  JOURNAL: "/journal",
  ANALYTICS: "/analytics",
  SETTINGS: "/settings",
  PROFILE: "/profile",
  NOTIFICATIONS: "/notifications",
  TEAM: "/team",
  COMPANY: "/company",
} as const;

export const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pending Review",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  WAITING_CLIENT: "Waiting Client",
  REVISION: "Revision",
  QA_TESTING: "QA Testing",
  DELIVERED: "Delivered",
  EXTENDED: "Extended",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
};

export const COMPANY_ROLE_LABELS: Record<string, string> = {
  CHAIRMAN: "Chairman",
  BOARD_MEMBER: "Board Member",
  MANAGER: "Manager",
  TEAM_LEADER: "Team Leader",
  CO_LEADER: "Co-Leader",
  EMPLOYEE: "Employee",
  HR: "HR",
  ADMIN: "Admin",
};

export const PLATFORM_LABELS: Record<string, string> = {
  FIVERR: "Fiverr",
  UPWORK: "Upwork",
  DIRECT: "Direct Client",
  REFERRAL: "Referral",
  OTHER: "Other",
};

export const TASK_STATUS_ICONS: Record<string, string> = {
  TODO: "Circle",
  IN_PROGRESS: "Clock",
  REVIEW: "Eye",
  COMPLETED: "CheckCircle2",
  ON_HOLD: "Pause",
};

export const PRIORITY_ICONS: Record<string, string> = {
  LOW: "ArrowDown",
  MEDIUM: "Minus",
  HIGH: "ArrowUp",
  URGENT: "AlertTriangle",
};

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const THEME = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const;

export const PRODUCTIVITY_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 70,
  AVERAGE: 50,
  NEEDS_IMPROVEMENT: 30,
} as const;
