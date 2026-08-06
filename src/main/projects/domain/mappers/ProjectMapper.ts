import type { ProjectDTO } from "../dtos/ProjectDTO";
import { Project } from "../entities/Project";

/** The subset of the Todoist API project shape this app reads — kept structural
 * (not the SDK's own type) so this mapper stays free of an SDK import. */
export type ProjectApiSource = {
  id: string;
  name: string;
  description: string;
  color: string;
  parentId: string | null;
  isInboxProject: boolean;
  isArchived: boolean;
};

/**
 * Maps a raw Todoist API project into the domain `Project`. `activeTaskCount` is
 * not part of the raw project response — it's counted separately across the
 * `tasks` module (see `ListProjectsUseCase`) — so it's supplied by the caller
 * rather than read off `source`.
 */
export class ProjectMapper {
  toDomain(source: ProjectApiSource, activeTaskCount: number): Project {
    return Project.reconstitute({ ...source, activeTaskCount });
  }

  /** `name`/`description`/`color` are prototype getters on `Project`, so
   * Electron's IPC transport (structured clone) drops them — this is the
   * plain shape that actually survives the trip to the renderer. */
  toDTO(project: Project): ProjectDTO {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      parentId: project.parentId,
      isInboxProject: project.isInboxProject,
      isArchived: project.isArchived,
      activeTaskCount: project.activeTaskCount,
    };
  }
}
