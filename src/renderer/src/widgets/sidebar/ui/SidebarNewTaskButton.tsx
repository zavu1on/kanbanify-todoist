import { Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { PlusIcon } from "lucide-animated";
import type { FC } from "react";
import { TaskFormModal } from "@/features/manage-task";
import { useActiveTasksListQueryKey } from "../model/useActiveTasksListQueryKey";

export const SidebarNewTaskButton: FC = () => {
  const [isOpen, { open, close }] = useDisclosure(false);
  const queryKey = useActiveTasksListQueryKey();

  return (
    <>
      <Button
        h={38}
        radius={9}
        fullWidth
        justify="center"
        styles={{ section: { marginInlineEnd: 6 } }}
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
          always starts blank (see `ProjectActionsMenu`'s edit modal). No
          project/due default from the sidebar — project defaults to Inbox,
          every other field starts empty (SPECIFICATION.md "Добавление
          задачи"). Optimistic write lands in whichever list cache is
          currently on screen (`useActiveTasksListQueryKey`), same as every
          in-page "Add task" button — other cached lists still get
          invalidated on success (see `useCreateTaskMutation`). */}
      {isOpen && (
        <TaskFormModal opened={isOpen} onClose={close} queryKey={queryKey} />
      )}
    </>
  );
};
