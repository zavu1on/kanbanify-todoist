# Projects

A Todoist project is either `PersonalProject` or `WorkspaceProject` (`Project = PersonalProject | WorkspaceProject`, the SDK picks the variant by presence of `workspaceId`). Shared fields (`BaseProjectSchema`): `id`, `name`, `color`, `childOrder`, `isArchived`, `isDeleted`, `isFavorite`, `isFrozen`, `isCollapsed`, `isShared`, `viewStyle`, `description`, `createdAt`/`updatedAt` (`Date | null`).

`PersonalProject` adds: `parentId: string | null`, `inboxProject: boolean`.
`WorkspaceProject` adds: `workspaceId`, `folderId`, `access`, `role`, `status`, ...— for this project (personal Access Token, community-tier), it'll almost always be `PersonalProject`.

`viewStyle` — `'list' | 'board' | 'calendar'` (Todoist's native project view style; **not** the same as this app's kanban framework — independent, separate modes).

## Reading

### `getProject(id: string): Promise<PersonalProject | WorkspaceProject>`

### `getProjects(args?: GetProjectsArgs): Promise<GetProjectsResponse>`
```typescript
type GetProjectsArgs = { folderId?: string | null; workspaceId?: string | null; cursor?: string | null; limit?: number }
type GetProjectsResponse = { results: (PersonalProject | WorkspaceProject)[]; nextCursor: string | null }
```

### `searchProjects(args: SearchProjectsArgs): Promise<GetProjectsResponse>`
`{ query: string; cursor?: string | null; limit?: number }`.

### `getArchivedProjects(args?)` / `getArchivedProjectsCount(args?)`
Separate endpoints for archived projects — they don't show up in a plain `getProjects`.

### `getFullProject(id: string, args?: GetFullProjectArgs): Promise<GetFullProjectResponse>`
One request instead of several: returns the project plus its `tasks`, `sections`, `collaborators`, `notes` (comments), `commentsCount`. Useful for a project page's initial load instead of `getProject` + `getTasks({ projectId })` separately.

## Creating and updating

### `addProject(args: AddProjectArgs, requestId?): Promise<PersonalProject | WorkspaceProject>`
```typescript
type AddProjectArgs = {
    name: string
    parentId?: string
    color?: ColorKey        // see reference/labels.md — same color set
    isFavorite?: boolean
    viewStyle?: 'list' | 'board' | 'calendar'
    workspaceId?: string
    description?: string    // Markdown
}
```

### `updateProject(id: string, args: UpdateProjectArgs, requestId?)`
Same fields, all optional, plus `folderId?: string | null` (move into a folder — workspace projects only; `null` removes it from a folder).

### `deleteProject(id, requestId?)` / `archiveProject(id, requestId?)` / `unarchiveProject(id, requestId?)`
`delete` is irreversible; use `archive`/`unarchive` for soft-hiding instead.

## Other (likely not needed by this project, but exists)

`moveProjectToWorkspace`, `moveProjectToPersonal`, `getProjectPermissions`, `joinProject`, `getProjectCollaborators` — all about workspaces/collaboration, not the single-user community-token mode this project runs in.
