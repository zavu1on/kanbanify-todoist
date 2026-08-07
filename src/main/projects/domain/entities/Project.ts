import { InboxProjectProtectedError } from "../errors/InboxProjectProtectedError";
import { InvalidProjectNameError } from "../errors/InvalidProjectNameError";
import { ProjectName } from "../value-objects/ProjectName";

export type ProjectCreateDetails = {
  name: string;
  description: string;
  color: string;
  parentId: string | null;
};

export type ProjectReconstituteSource = {
  id: string;
  name: string;
  description: string;
  color: string;
  parentId: string | null;
  isInboxProject: boolean;
  isArchived: boolean;
  activeTaskCount: number;
};

export type ProjectUpdateDetails = {
  name: string;
  description: string;
  color: string;
};

export class Project {
  private _name: ProjectName;
  private _description: string;
  private _color: string;

  private constructor(
    readonly id: string,
    name: ProjectName,
    description: string,
    color: string,
    readonly parentId: string | null,
    readonly isInboxProject: boolean,
    readonly isArchived: boolean,
    readonly activeTaskCount: number,
  ) {
    this._name = name;
    this._description = description;
    this._color = color;
  }

  get name(): string {
    return this._name.value;
  }

  get description(): string {
    return this._description;
  }

  get color(): string {
    return this._color;
  }

  /** Factory for a project that doesn't exist in Todoist yet — `id` is empty
   * until `IProjectGateway.create` resolves with the real, API-assigned one
   * (see `CreateProjectUseCase`). Validates its inputs. */
  static create(details: ProjectCreateDetails): Project {
    return new Project(
      "",
      Project.parseName(details.name),
      details.description.trim(),
      details.color,
      details.parentId,
      false,
      false,
      0,
    );
  }

  /** Rebuilds a project from already-trusted data (a mapped API response) —
   * unlike `create`, it does not re-validate invariants, since the source
   * either came from Todoist itself or was already validated once. */
  static reconstitute(source: ProjectReconstituteSource): Project {
    return new Project(
      source.id,
      ProjectName.of(source.name),
      source.description,
      source.color,
      source.parentId,
      source.isInboxProject,
      source.isArchived,
      source.activeTaskCount,
    );
  }

  /** Mutates this project in place — `parentId` is excluded on purpose:
   * the SDK's `updateProject` has no `parentId` field at all (only
   * `addProject` accepts it), so a project's parent can only be set at
   * creation, never changed afterward. */
  updateDetails(details: ProjectUpdateDetails): void {
    this._name = Project.parseName(details.name);
    this._description = details.description.trim();
    this._color = details.color;
  }

  /** Todoist rejects archiving the Inbox project — it's the catch-all every
   * project-less task lands in, so hiding it would orphan them. */
  archive(): void {
    if (this.isInboxProject) throw new InboxProjectProtectedError("archive");
  }

  /** Same Inbox restriction as `archive` — deleting it would strip every
   * project-less task of its home. */
  delete(): void {
    if (this.isInboxProject) throw new InboxProjectProtectedError("delete");
  }

  private static parseName(rawName: string): ProjectName {
    const result = ProjectName.safeParse(rawName);
    if (!result.success) throw new InvalidProjectNameError(result.error);
    return result.data;
  }
}
