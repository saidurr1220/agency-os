import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function calculateProductivityScore(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: "text-blue-500 bg-blue-50 dark:bg-blue-950",
    MEDIUM: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950",
    HIGH: "text-orange-500 bg-orange-50 dark:bg-orange-950",
    URGENT: "text-red-500 bg-red-50 dark:bg-red-950",
  };
  return colors[priority] || "text-gray-500 bg-gray-50";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    TODO: "text-gray-500 bg-gray-100 dark:bg-gray-800",
    IN_PROGRESS: "text-blue-500 bg-blue-100 dark:bg-blue-900",
    REVIEW: "text-purple-500 bg-purple-100 dark:bg-purple-900",
    COMPLETED: "text-green-500 bg-green-100 dark:bg-green-900",
    ON_HOLD: "text-yellow-500 bg-yellow-100 dark:bg-yellow-900",
  };
  return colors[status] || "text-gray-500 bg-gray-100";
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
