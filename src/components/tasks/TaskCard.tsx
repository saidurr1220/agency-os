"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GripVertical,
  Clock,
  Calendar,
  Tag,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  ArrowRight,
  AlertCircle,
  Pause,
  Eye,
} from 'lucide-react';
import { cn, formatDate, getPriorityColor, getStatusColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Task, TaskStatus } from '@/types';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onClick?: (task: Task) => void;
  isDragging?: boolean;
}

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  TODO: Circle,
  IN_PROGRESS: ArrowRight,
  REVIEW: Eye,
  COMPLETED: CheckCircle2,
  ON_HOLD: Pause,
};

export function TaskCard({ task, onStatusChange, onClick, isDragging }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const StatusIcon = statusIcons[task.status] || Circle;

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ON_HOLD'];
    const currentIndex = statuses.indexOf(task.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onStatusChange?.(task.id, nextStatus);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        'group relative flex items-start gap-3 p-4 rounded-xl border bg-card transition-all duration-200 cursor-pointer',
        isDragging && 'shadow-lg ring-2 ring-primary/20',
        task.status === 'COMPLETED' && 'opacity-70'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(task)}
    >
      <div className="shrink-0 mt-0.5 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="shrink-0 mt-0.5" onClick={cycleStatus}>
        <StatusIcon
          className={cn(
            'w-5 h-5 cursor-pointer transition-colors',
            task.status === 'COMPLETED' ? 'text-green-500' : 'text-muted-foreground hover:text-primary'
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              'text-sm font-medium leading-tight',
              task.status === 'COMPLETED' && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant="outline"
              className={cn('text-[10px] px-1.5 py-0', getPriorityColor(task.priority))}
            >
              {task.priority}
            </Badge>
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-3">
          <Badge
            variant="secondary"
            className={cn('text-[10px]', getStatusColor(task.status))}
          >
            {task.status.replace('_', ' ')}
          </Badge>

          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}

          {task.estimatedMinutes && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{task.estimatedMinutes}m</span>
            </div>
          )}

          {task.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-muted-foreground" />
              {task.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0"
                  style={{ borderColor: tag.color, color: tag.color }}
                >
                  {tag.name}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <span className="text-[10px] text-muted-foreground">
                  +{task.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {task.progress > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-1.5" />
          </div>
        )}
      </div>

      {isHovered && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
}
