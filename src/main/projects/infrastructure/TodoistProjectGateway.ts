import { TodoistApi } from "@doist/todoist-sdk";
import type { IProjectGateway } from "../application/ports/IProjectGateway";
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
        projects.push(
          ...results.map((project) => ({
            id: project.id,
            name: project.name,
            color: project.color,
            // Only `PersonalProject` carries `inboxProject` — workspace projects
            // (not used on the free tier this app targets) never are the inbox.
            isInboxProject:
              "inboxProject" in project ? project.inboxProject : false,
          })),
        );
        cursor = nextCursor;
      } while (cursor !== null);

      return projects;
    });
  }
}
