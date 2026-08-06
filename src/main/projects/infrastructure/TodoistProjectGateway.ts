import type {
  ColorKey,
  PersonalProject,
  WorkspaceProject,
} from "@doist/todoist-sdk";
import { TodoistApi } from "@doist/todoist-sdk";
import type { IProjectGateway } from "../application/ports/IProjectGateway";
import type { Project } from "../domain/entities/Project";
import type { ProjectApiSource } from "../domain/mappers/ProjectMapper";
import { TodoistProjectsErrorClassifier } from "./TodoistProjectsErrorClassifier";

/** Todoist caps list pages at 200 (see SPECIFICATION.md "Задачи") — the free
 * tier's 5-project cap means this loop almost always runs once. */
const PAGE_SIZE = 200;

export class TodoistProjectGateway implements IProjectGateway {
  private readonly errorClassifier = new TodoistProjectsErrorClassifier();

  async listProjects(accessToken: string): Promise<ProjectApiSource[]> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const projects: ProjectApiSource[] = [];
      let cursor: string | null = null;

      do {
        const { results, nextCursor } = await api.getProjects({
          cursor,
          limit: PAGE_SIZE,
        });
        projects.push(...results.map((project) => this.toApiSource(project)));
        cursor = nextCursor;
      } while (cursor !== null);

      return projects;
    });
  }

  async getProject(accessToken: string, id: string): Promise<ProjectApiSource> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const project = await api.getProject(id);
      return this.toApiSource(project);
    });
  }

  async create(
    accessToken: string,
    project: Project,
  ): Promise<ProjectApiSource> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const created = await api.addProject({
        name: project.name,
        description: project.description,
        color: project.color as ColorKey,
        parentId: project.parentId ?? undefined,
      });
      return this.toApiSource(created);
    });
  }

  async save(accessToken: string, project: Project): Promise<ProjectApiSource> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const updated = await api.updateProject(project.id, {
        name: project.name,
        // Pass the (possibly empty) description as-is, never `|| undefined` —
        // an omitted field means "leave unchanged" to this endpoint, so that
        // would silently prevent ever clearing a description back to empty.
        description: project.description,
        color: project.color as ColorKey,
      });
      return this.toApiSource(updated);
    });
  }

  async archive(accessToken: string, id: string): Promise<void> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      await api.archiveProject(id);
    });
  }

  async delete(accessToken: string, id: string): Promise<void> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      await api.deleteProject(id);
    });
  }

  private toApiSource(
    project: PersonalProject | WorkspaceProject,
  ): ProjectApiSource {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      // Only `PersonalProject` carries `parentId`/`inboxProject` — workspace
      // projects (not used on the free tier this app targets) never are.
      parentId: "parentId" in project ? project.parentId : null,
      isInboxProject: "inboxProject" in project ? project.inboxProject : false,
      isArchived: project.isArchived,
    };
  }
}
