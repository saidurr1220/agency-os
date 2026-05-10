"use client";

import React, { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Task, TaskStatus } from '@/types';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onDateClick?: (date: Date) => void;
}

const statusColors: Record<string, string> = {
  TODO: 'bg-gray-400',
  IN_PROGRESS: 'bg-blue-500',
  REVIEW: 'bg-purple-500',
  COMPLETED: 'bg-green-500',
  ON_HOLD: 'bg-yellow-500',
};

export function CalendarView({ tasks, onTaskClick, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(task);
      }
    });
    return map;
  }, [tasks]);

  const getTasksForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return tasksByDate[dateKey] || [];
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          {format(currentDate, 'MMMM yyyy')}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="bg-card p-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            const dayTasks = getTasksForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = isToday(day);

            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.01 }}
                className={cn(
                  'bg-card min-h-[100px] p-2 cursor-pointer hover:bg-accent/50 transition-colors',
                  !isCurrentMonth && 'opacity-40',
                  isSelected && 'ring-2 ring-primary/50'
                )}
                onClick={() => onDateClick?.(day)}
              >
                <div
                  className={cn(
                    'text-sm font-medium mb-1',
                    isSelected && 'text-primary font-bold'
                  )}
                >
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] bg-accent/80 cursor-pointer hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick?.(task);
                      }}
                    >
                      <div
                        className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          statusColors[task.status]
                        )}
                      />
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1.5">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
