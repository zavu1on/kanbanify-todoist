import { contextBridge, ipcRenderer } from "electron";
import type {
  LoginResult,
  LogoutResult,
  SessionCheckResult,
} from "../main/auth";
import type {
  CreateLabelRequest,
  CreateLabelResult,
  LabelsListResult,
} from "../main/labels";
import type {
  ArchiveProjectResult,
  CreateProjectRequest,
  CreateProjectResult,
  DeleteProjectResult,
  ProjectsListResult,
  UpdateProjectRequest,
  UpdateProjectResult,
} from "../main/projects";
import type {
  CompleteTaskResult,
  CreateTaskRequest,
  CreateTaskResult,
  KanbanStatusLevel,
  TasksCountResult,
  TasksListResult,
  UpdateTaskRequest,
  UpdateTaskResult,
  UpdateTaskStatusResult,
} from "../main/tasks";

const api = {
  auth: {
    login: (accessToken: string): Promise<LoginResult> =>
      ipcRenderer.invoke("auth:login", accessToken),
    checkSession: (): Promise<SessionCheckResult> =>
      ipcRenderer.invoke("auth:checkSession"),
    logout: (): Promise<LogoutResult> => ipcRenderer.invoke("auth:logout"),
  },
  tasks: {
    list: (
      cursor: string | null,
      projectId?: string,
    ): Promise<TasksListResult> =>
      ipcRenderer.invoke("tasks:list", cursor, projectId),
    updateStatus: (
      taskId: string,
      status: KanbanStatusLevel,
    ): Promise<UpdateTaskStatusResult> =>
      ipcRenderer.invoke("tasks:updateStatus", taskId, status),
    count: (): Promise<TasksCountResult> => ipcRenderer.invoke("tasks:count"),
    complete: (taskId: string): Promise<CompleteTaskResult> =>
      ipcRenderer.invoke("tasks:complete", taskId),
    create: (input: CreateTaskRequest): Promise<CreateTaskResult> =>
      ipcRenderer.invoke("tasks:create", input),
    update: (
      taskId: string,
      input: UpdateTaskRequest,
    ): Promise<UpdateTaskResult> =>
      ipcRenderer.invoke("tasks:update", taskId, input),
  },
  labels: {
    list: (): Promise<LabelsListResult> => ipcRenderer.invoke("labels:list"),
    create: (input: CreateLabelRequest): Promise<CreateLabelResult> =>
      ipcRenderer.invoke("labels:create", input),
  },
  projects: {
    list: (): Promise<ProjectsListResult> =>
      ipcRenderer.invoke("projects:list"),
    create: (input: CreateProjectRequest): Promise<CreateProjectResult> =>
      ipcRenderer.invoke("projects:create", input),
    update: (
      id: string,
      input: UpdateProjectRequest,
    ): Promise<UpdateProjectResult> =>
      ipcRenderer.invoke("projects:update", id, input),
    archive: (id: string): Promise<ArchiveProjectResult> =>
      ipcRenderer.invoke("projects:archive", id),
    delete: (id: string): Promise<DeleteProjectResult> =>
      ipcRenderer.invoke("projects:delete", id),
  },
};

export type ElectronApi = typeof api;

contextBridge.exposeInMainWorld("api", api);
