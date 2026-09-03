import { Center, Loader, Modal } from "@mantine/core";
import type { FC } from "react";
import { useLabelsQuery } from "@/entities/label";
import { useProjectsQuery } from "@/entities/project";
import type { FilterDTO } from "@/main/filters";
import { FilterForm } from "./FilterForm";

type FilterFormModalProps = {
  opened: boolean;
  onClose: () => void;
  /** Absent in create mode. */
  filter?: FilterDTO;
};

/**
 * Outer shell: fetches projects/labels and only mounts `FilterForm` once the
 * projects list is ready (in edit mode). Resolving the saved query's
 * `#ProjectName` back to a `Select`-usable `projectId` (see `FilterForm`)
 * only happens once, at `useForm`'s `initialValues` — mounting the form
 * before `projects` has loaded would permanently lock the project field to
 * "unselected", since a later-arriving project list can't retroactively
 * patch a form's initial values.
 */
export const FilterFormModal: FC<FilterFormModalProps> = ({
  opened,
  onClose,
  filter,
}) => {
  const isEditMode = filter !== undefined;
  const projectsQuery = useProjectsQuery();
  const projects = projectsQuery.data?.ok ? projectsQuery.data.projects : [];
  const labelsQuery = useLabelsQuery();
  const labelOptions = labelsQuery.data?.ok
    ? labelsQuery.data.labels.map((label) => label.name)
    : [];

  if (isEditMode && projectsQuery.isPending) {
    return (
      <Modal opened={opened} onClose={onClose} title="Edit filter">
        <Center py="lg">
          <Loader />
        </Center>
      </Modal>
    );
  }

  return (
    <FilterForm
      opened={opened}
      onClose={onClose}
      filter={filter}
      projects={projects}
      labelOptions={labelOptions}
    />
  );
};
