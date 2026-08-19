import { Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { PlusIcon } from "lucide-animated";
import type { FC } from "react";
import { tasksListQueryKey } from "@/entities/task";
import { TaskFormModal } from "@/features/manage-task";

export const SidebarNewTaskButton: FC = () => {
  const [isOpen, { open, close }] = useDisclosure(false);

  return (
    <>
      <Button
        h={38}
        radius={9}
        fullWidth
        justify="center"
        leftSection={
          <PlusIcon
            size={17}
            animateOnHover={false}
            style={{ display: "flex" }}
          />
        }
        onClick={open}
      >
        New task
      </Button>

      {/* Mounted only while open — a fresh instance each time means the form
          always starts blank (see `ProjectActionsMenu`'s edit modal).
          No page context from the sidebar — project defaults to Inbox, every
          other field starts empty (SPECIFICATION.md "Добавление задачи").
          Optimistic write lands in the global "Tasks" list cache since no
          specific list is on screen; other cached lists get invalidated on
          success (see `useCreateTaskMutation`). */}
      {isOpen && (
        <TaskFormModal
          opened={isOpen}
          onClose={close}
          queryKey={tasksListQueryKey}
        />
      )}
    </>
  );
};
