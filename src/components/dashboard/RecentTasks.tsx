"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatRelativeTime, getPriorityColor, getStatusColor } from '@/lib/utils';
import type { Task } from '@/types';

interface RecentTasksProps {
  tasks: Task[];
  onViewAll?: () => void;
  onTaskClick?: (task: Task) => void;
}

export function RecentTasks({ tasks, onViewAll, onTaskClick }: RecentTasksProps) {
  const recentTasks = tasks.slice(0, 5);

  const statusIcons: Record<string, React.ReactNode> = {
    TODO: <Clock className="w-4 h-4 text-gray-400" />,
    IN_PROGRESS: <ArrowRight className="w-4 h-4 text-blue-500" />,
    REVIEW: <AlertCircle className="w-4 h-4 text-purple-500" />,
    COMPLETED: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    ON_HOLD: <Clock className="w-4 h-4 text-yellow-500" />,
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Recent Tasks</CardTitle>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          View All
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No tasks yet</p>
              <p className="text-xs mt-1">Create your first task to get started</p>
            </div>
          ) : (
            recentTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-all duration-200',
                  task.status === 'COMPLETED' && 'opacity-60'
                )}
                onClick={() => onTaskClick?.(task)}
              >
                <div className="shrink-0">{statusIcons[task.status]}</div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    task.status === 'COMPLETED' && 'line-through'
                  )}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] px-1.5 py-0', getPriorityColor(task.priority))}
                    >
                      {task.priority}
                    </Badge>
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        Due {formatRelativeTime(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {task.progress > 0 && task.progress < 100 && (
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  )}
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
