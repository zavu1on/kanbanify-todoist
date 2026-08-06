import { ActionIcon, Menu } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  ArchiveIcon,
  DeleteIcon,
  MenuIcon,
  SquarePenIcon,
} from "lucide-animated";
import type { FC } from "react";
import type { ProjectDTO } from "@/main/projects";
import { ArchiveProjectModal } from "./ArchiveProjectModal";
import { DeleteProjectModal } from "./DeleteProjectModal";
import { ProjectFormModal } from "./ProjectFormModal";

type ProjectActionsMenuProps = {
  project: ProjectDTO;
};

/** Groups every project management action (matching Todoist's own layout: a
 * single meatball button opening Edit/Archive/Delete) behind one trigger. */
export const ProjectActionsMenu: FC<ProjectActionsMenuProps> = ({
  project,
}) => {
  const [isEditOpen, { open: openEdit, close: closeEdit }] =
    useDisclosure(false);
  const [isArchiveOpen, { open: openArchive, close: closeArchive }] =
    useDisclosure(false);
  const [isDeleteOpen, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);

  return (
    <>
      <Menu withinPortal position="bottom-end">
        <Menu.Target>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={`${project.name} actions`}
            onClick={(event) => event.preventDefault()}
          >
            <MenuIcon size={16} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            leftSection={<SquarePenIcon size={16} />}
            onClick={openEdit}
          >
            Edit
          </Menu.Item>
          <Menu.Item
            leftSection={<ArchiveIcon size={16} />}
            onClick={openArchive}
          >
            Archive
          </Menu.Item>
          <Menu.Item
            color="red"
            leftSection={<DeleteIcon size={16} />}
            onClick={openDelete}
          >
            Delete
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      {/* Mounted only while open — a fresh instance per open means the form
          picks up the current `project` values directly as `initialValues`,
          no manual resync effect needed (and no stale state across opens). */}
      {isEditOpen && (
        <ProjectFormModal
          opened={isEditOpen}
          onClose={closeEdit}
          project={project}
        />
      )}
      {isArchiveOpen && (
        <ArchiveProjectModal
          opened={isArchiveOpen}
          onClose={closeArchive}
          project={project}
        />
      )}
      {isDeleteOpen && (
        <DeleteProjectModal
          opened={isDeleteOpen}
          onClose={closeDelete}
          project={project}
        />
      )}
    </>
  );
};
