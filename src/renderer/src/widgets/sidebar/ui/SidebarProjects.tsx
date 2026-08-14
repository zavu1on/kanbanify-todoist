import { useDisclosure } from "@mantine/hooks";
import type { FC } from "react";
import { useProjectsQuery } from "@/entities/project";
import { ProjectFormModal } from "@/features/manage-project";
import { SidebarProjectsSection } from "./SidebarProjectsSection";
import { SidebarProjectsSkeleton } from "./SidebarProjectsSkeleton";

export const SidebarProjects: FC = () => {
  const [isAddProjectOpen, { open: openAddProject, close: closeAddProject }] =
    useDisclosure(false);
  const projectsQuery = useProjectsQuery();
  const projects = projectsQuery.data?.ok ? projectsQuery.data.projects : [];

  return (
    <>
      {projectsQuery.isPending ? (
        <SidebarProjectsSkeleton />
      ) : (
        <SidebarProjectsSection
          projects={projects}
          isRefetching={projectsQuery.isRefetching}
          onRefetch={() => projectsQuery.refetch()}
          onAddProject={openAddProject}
        />
      )}

      {/* Mounted only while open — a fresh instance each time means the form
          always starts blank (see `ProjectActionsMenu`'s edit modal). */}
      {isAddProjectOpen && (
        <ProjectFormModal opened={isAddProjectOpen} onClose={closeAddProject} />
      )}
    </>
  );
};
