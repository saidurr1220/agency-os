// ─── ENUMS ──────────────────────────────────────────────────────

export type SystemRole = "USER" | "SUPER_ADMIN";

export type CompanyRole =
  | "CHAIRMAN"
  | "BOARD_MEMBER"
  | "MANAGER"
  | "TEAM_LEADER"
  | "CO_LEADER"
  | "EMPLOYEE"
  | "HR"
  | "ADMIN";

export type CompanyStatus = "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED";

export type ProjectStatus =
  | "PENDING_REVIEW"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_CLIENT"
  | "REVISION"
  | "QA_TESTING"
  | "DELIVERED"
  | "EXTENDED"
  | "ON_HOLD"
  | "CANCELLED";

export type ProjectPlatform = "FIVERR" | "UPWORK" | "DIRECT" | "REFERRAL" | "OTHER";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type AssignmentRole = "LEADER" | "CO_LEADER" | "MEMBER";

export type CredentialType =
  | "HOSTING"
  | "CPANEL"
  | "DOMAIN"
  | "FTP"
  | "DATABASE"
  | "API_KEY"
  | "SOCIAL_MEDIA"
  | "OTHER";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_COMPLETED"
  | "TASK_OVERDUE"
  | "COMMENT_MENTION"
  | "PROJECT_ASSIGNED"
  | "PROJECT_EXTENSION"
  | "DAILY_REPORT_REMINDER"
  | "WORKSPACE_INVITE"
  | "SYSTEM";

export type ViewType = "LIST" | "KANBAN" | "CALENDAR" | "TIMELINE";

// ─── MODELS ─────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  employeeId?: string;
  systemRole: SystemRole;
  isActive: boolean;
  companyId?: string;
  departmentId?: string;
  designationId?: string;
  reportingManagerId?: string;
  companyRole: CompanyRole;
  joinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  website?: string;
  size?: string;
  logo?: string;
  description?: string;
  status: CompanyStatus;
  ownerId: string;
  approvedById?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  name: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Designation {
  id: string;
  title: string;
  departmentId: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  companyId: string;
  ownerId: string;
  departmentId?: string;
  isArchived: boolean;
  clientName?: string;
  clientEmail?: string;
  platform?: ProjectPlatform;
  orderId?: string;
  orderValue?: number;
  currency: string;
  priority: TaskPriority;
  projectStatus: ProjectStatus;
  startDate?: Date;
  deliveryDate?: Date;
  estimatedDays?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectAssignment {
  id: string;
  projectId: string;
  userId: string;
  role: AssignmentRole;
  assignedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId?: string;
  companyId?: string | null;
  assigneeId?: string;
  creatorId: string;
  dueDate?: Date;
  startDate?: Date;
  estimatedMinutes?: number;
  actualMinutes?: number;
  progress: number;
  tags: Tag[];
  category?: string;
  position: number;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskLog {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  progressChange?: number;
  timeSpent?: number;
  createdAt: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  companyId: string;
}

export interface Journal {
  id: string;
  userId: string;
  companyId: string;
  date: Date;
  summary: string;
  completedItems: string[];
  blockers: string[];
  tomorrowPlan: string[];
  mood?: number;
  productivityScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyReport {
  id: string;
  userId: string;
  companyId: string;
  date: Date;
  summary: string;
  completedTasks: string[];
  pendingTasks: string[];
  blockers: string[];
  hoursSpent?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  userId: string;
  companyId: string;
  entityType: string;
  entityId: string;
  action: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

export interface DeliveryRecord {
  id: string;
  projectId: string;
  deliveredById: string;
  deliveredAt: Date;
  finalValue: number;
  extensionsUsed: number;
  notes?: string;
  createdAt: Date;
}

export interface PerformanceRecord {
  id: string;
  userId: string;
  companyId: string;
  month: number;
  year: number;
  projectsCompleted: number;
  deliveryValue: number;
  productivityScore: number;
  deadlineAdherence: number;
  activeDays: number;
  totalHoursLogged: number;
  ranking?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientData {
  id: string;
  projectId: string;
  key: string;
  value: string;
  type: CredentialType;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectExtension {
  id: string;
  projectId: string;
  fromDate: Date;
  toDate: Date;
  reason: string;
  approvedById?: string;
  createdAt: Date;
}

export interface Invitation {
  id: string;
  email: string;
  code: string;
  companyId: string;
  role: CompanyRole;
  invitedById: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
}

// ─── DASHBOARD ──────────────────────────────────────────────────

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  productivityScore: number;
  weeklyCompletionRate: number;
  todayCompleted: number;
  todayTotal: number;
  streak: number;
}

export interface ProductivityData {
  date: string;
  completed: number;
  created: number;
  timeSpent: number;
}

export interface StatusDistribution {
  status: TaskStatus;
  count: number;
  percentage: number;
}

export interface WeeklyTrend {
  day: string;
  tasks: number;
  time: number;
}
