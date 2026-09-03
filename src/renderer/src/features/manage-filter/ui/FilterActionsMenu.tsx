import { ActionIcon, Box, Menu } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { DeleteIcon, MenuIcon, SquarePenIcon } from "lucide-animated";
import type { FC } from "react";
import type { FilterDTO } from "@/main/filters";
import { DeleteFilterModal } from "./DeleteFilterModal";
import { FilterFormModal } from "./FilterFormModal";

type FilterActionsMenuProps = {
  filter: FilterDTO;
};

/** Mirrors `ProjectActionsMenu` — a single meatball button opening Edit/
 * Delete, no Archive: a filter has no Todoist-side archival semantics. */
export const FilterActionsMenu: FC<FilterActionsMenuProps> = ({ filter }) => {
  const [isEditOpen, { open: openEdit, close: closeEdit }] =
    useDisclosure(false);
  const [isDeleteOpen, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);

  return (
    // Mirrors `ProjectActionsMenu` — `SidebarFilterLink` wraps this in a
    // router `Link`, so a click here (including inside the Portal'd Menu
    // dropdown and the two modals below) would otherwise bubble up and
    // navigate, re-rendering every nav link in the sidebar.
    <Box onClick={(event) => event.stopPropagation()} display="contents">
      <Menu withinPortal position="bottom-end">
        <Menu.Target>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={`${filter.title} actions`}
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
            color="red"
            leftSection={<DeleteIcon size={16} />}
            onClick={openDelete}
          >
            Delete
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      {/* Mounted only while open — see `ProjectActionsMenu` for why. */}
      {isEditOpen && (
        <FilterFormModal
          opened={isEditOpen}
          onClose={closeEdit}
          filter={filter}
        />
      )}
      {isDeleteOpen && (
        <DeleteFilterModal
          opened={isDeleteOpen}
          onClose={closeDelete}
          filter={filter}
        />
      )}
    </Box>
  );
};
