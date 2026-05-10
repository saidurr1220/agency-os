"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type CollisionDetection,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "./TaskCard";
import type { Task, TaskStatus } from "@/types";

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: "TODO", title: "To Do", color: "bg-gray-100 dark:bg-gray-800" },
  {
    id: "IN_PROGRESS",
    title: "In Progress",
    color: "bg-blue-100 dark:bg-blue-900",
  },
  { id: "REVIEW", title: "Review", color: "bg-purple-100 dark:bg-purple-900" },
  {
    id: "COMPLETED",
    title: "Completed",
    color: "bg-green-100 dark:bg-green-900",
  },
  {
    id: "ON_HOLD",
    title: "On Hold",
    color: "bg-yellow-100 dark:bg-yellow-900",
  },
];

/** Prefer pointer (easier over empty columns); fall back to rectangle hits. */
const kanbanCollision: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  if (pointer.length > 0) return pointer;
  return rectIntersection(args);
};

function DraggableTaskCard({
  task,
  onStatusChange,
  onTaskClick,
}: {
  task: Task;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { type: "task", task },
    });

  const style = transform
    ? { transform: CSS.Transform.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "relative z-10")}
    >
      <TaskCard
        task={task}
        onStatusChange={onStatusChange}
        onClick={onTaskClick}
        isDragging={isDragging}
        dragListeners={listeners}
        dragAttributes={attributes}
      />
    </div>
  );
}

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
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", status: column.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-[min(420px,60vh)] shrink-0 flex-col rounded-xl border bg-card/50 transition-all",
        "w-[min(22rem,calc(100vw-2.5rem))] sm:w-72 md:min-w-[18rem] md:max-w-[20rem] md:w-[20rem]",
        isOver && "bg-accent/20 ring-2 ring-primary/40",
      )}
    >
      <div className="shrink-0 border-b p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full",
                column.color
                  .replace("bg-", "bg-")
                  .replace("100", "500")
                  .replace("800", "400")
                  .replace("900", "400"),
              )}
            />
            <h3 className="truncate text-sm font-semibold">{column.title}</h3>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden p-2 [scrollbar-gutter:stable]">
        {tasks.map((task) => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            onStatusChange={onStatusChange}
            onTaskClick={onTaskClick}
          />
        ))}
        {tasks.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({
  tasks,
  onStatusChange,
  onTaskClick,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
    const overId = String(over.id);

    let newStatus: TaskStatus | undefined;
    if (columns.some((c) => c.id === overId)) {
      newStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) newStatus = overTask.status;
    }

    if (newStatus) {
      const current = tasks.find((t) => t.id === taskId);
      if (current && current.status !== newStatus) {
        onStatusChange?.(taskId, newStatus);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={kanbanCollision}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="-mx-2 w-full min-w-0 px-2 pb-4 sm:-mx-1 sm:px-1">
        <div className="flex w-max max-w-none gap-3 overflow-x-auto pb-2 pt-1 [scrollbar-gutter:stable]">
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
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="w-[min(22rem,calc(100vw-2.5rem))] rotate-2 cursor-grabbing opacity-95 shadow-xl sm:w-72">
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
