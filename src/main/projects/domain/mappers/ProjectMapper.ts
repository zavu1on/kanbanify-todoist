import { Project } from "../entities/Project";

/** The subset of the Todoist API project shape this app reads — kept structural
 * (not the SDK's own type) so this mapper stays free of an SDK import. */
export type ProjectApiSource = {
  id: string;
  name: string;
  color: string;
  isInboxProject: boolean;
};

/**
 * Maps a raw Todoist API project into the domain `Project`. `activeTaskCount` is
 * not part of the raw project response — it's counted separately across the
 * `tasks` module (see `ListProjectsUseCase`) — so it's supplied by the caller
 * rather than read off `source`.
 */
export class ProjectMapper {
  toDomain(source: ProjectApiSource, activeTaskCount: number): Project {
    return new Project(
      source.id,
      source.name,
      source.color,
      source.isInboxProject,
      activeTaskCount,
    );
  }
}
