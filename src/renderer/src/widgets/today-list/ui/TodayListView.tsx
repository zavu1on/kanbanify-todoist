import { Button, Stack } from "@mantine/core";
import type { QueryKey } from "@tanstack/react-query";
import dayjs from "dayjs";
import { PlusIcon } from "lucide-animated";
import { type FC, useCallback, useMemo, useRef, useState } from "react";
import { useCompleteTaskMutation } from "@/features/complete-task";
import { TaskFormModal } from "@/features/manage-task";
import type { TaskDTO } from "@/main/tasks";
import { useMoveOverdueToTodayHandler } from "../model/useMoveOverdueToTodayHandler";
import { splitTodayTasks } from "../model/splitTodayTasks";
import { MoveOverdueToTodayConfirmModal } from "./MoveOverdueToTodayConfirmModal";
import { OverdueSection } from "./OverdueSection";
import { TodaySection } from "./TodaySection";

type TodayListViewProps = {
  tasks: TaskDTO[];
  queryKey: QueryKey;
};

/** The Today page's list mode (SPECIFICATION.md "Сегодня") — an Overdue
 * section (with the "Move all to today" bulk action) above a Today section,
 * instead of `widgets/task-list`'s single flat stack. */
export const TodayListView: FC<TodayListViewProps> = ({ tasks, queryKey }) => {
  const completeTaskMutation = useCompleteTaskMutation(queryKey);
  const moveOverdueToToday = useMoveOverdueToTodayHandler(queryKey);

  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMoveAllConfirmOpen, setIsMoveAllConfirmOpen] = useState(false);

  const { overdue, today } = useMemo(() => splitTodayTasks(tasks), [tasks]);

  const handleComplete = useCallback(
    (taskId: string) => completeTaskMutation.mutate({ taskId }),
    [completeTaskMutation.mutate],
  );

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const handleCardClick = useCallback((taskId: string) => {
    const task = tasksRef.current.find((t) => t.id === taskId);
    if (task) setEditingTask(task);
  }, []);

  const handleConfirmMoveAll = () => {
    setIsMoveAllConfirmOpen(false);
    moveOverdueToToday(overdue);
  };

  return (
    <Stack gap="lg">
      {overdue.length > 0 && (
        <OverdueSection
          tasks={overdue}
          onComplete={handleComplete}
          onCardClick={handleCardClick}
          onMoveAllClick={() => setIsMoveAllConfirmOpen(true)}
        />
      )}

      <TodaySection
        tasks={today}
        onComplete={handleComplete}
        onCardClick={handleCardClick}
      />

      <Button
        variant="subtle"
        color="gray"
        justify="flex-start"
        leftSection={<PlusIcon size={16} animateOnHover={false} />}
        onClick={() => setIsCreateOpen(true)}
      >
        Add task
      </Button>

      <MoveOverdueToTodayConfirmModal
        opened={isMoveAllConfirmOpen}
        count={overdue.length}
        onCancel={() => setIsMoveAllConfirmOpen(false)}
        onConfirm={handleConfirmMoveAll}
      />

      {(editingTask || isCreateOpen) && (
        <TaskFormModal
          opened
          onClose={() => {
            setEditingTask(null);
            setIsCreateOpen(false);
          }}
          queryKey={queryKey}
          task={editingTask ?? undefined}
          defaults={{
            due: { date: dayjs().format("YYYY-MM-DD"), datetime: null },
          }}
        />
      )}
    </Stack>
  );
};
