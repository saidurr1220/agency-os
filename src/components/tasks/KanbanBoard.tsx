"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '@/types';

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900' },
  { id: 'REVIEW', title: 'Review', color: 'bg-purple-100 dark:bg-purple-900' },
  { id: 'COMPLETED', title: 'Completed', color: 'bg-green-100 dark:bg-green-900' },
  { id: 'ON_HOLD', title: 'On Hold', color: 'bg-yellow-100 dark:bg-yellow-900' },
];

function DroppableColumn({
  column,
  tasks,
  onStatusChange,
  onTaskClick,
}: {
  column: (typeof columns)[number];
  tasks: Task[];
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-w-[280px] max-w-[320px] rounded-xl border bg-card/50 transition-all',
        isOver && 'ring-2 ring-primary/30 bg-accent/30'
      )}
    >
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('w-2.5 h-2.5 rounded-full', column.color.replace('bg-', 'bg-').replace('100', '500').replace('800', '400').replace('900', '400'))} />
            <h3 className="text-sm font-semibold">{column.title}</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onClick={onTaskClick}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({ tasks, onStatusChange, onTaskClick }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    if (columns.some((c) => c.id === newStatus)) {
      onStatusChange?.(taskId, newStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id);
          return (
            <DroppableColumn
              key={column.id}
              column={column}
              tasks={columnTasks}
              onStatusChange={onStatusChange}
              onTaskClick={onTaskClick}
            />
          );
        })}
      </div>
      <DragOverlay>
        {activeTask && (
          <TaskCard task={activeTask} isDragging />
        )}
      </DragOverlay>
    </DndContext>
  );
}
