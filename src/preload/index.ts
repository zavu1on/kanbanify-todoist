import { contextBridge, ipcRenderer } from "electron";
import type {
  DownloadAttachmentRequest,
  DownloadAttachmentResult,
} from "../main/attachments";
import type {
  LoginResult,
  LogoutResult,
  SessionCheckResult,
} from "../main/auth";
import type {
  CommentsListResult,
  CreateCommentRequest,
  CreateCommentResult,
  DeleteCommentResult,
  UpdateCommentRequest,
  UpdateCommentResult,
} from "../main/comments";
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
  GetProjectResult,
  ProjectsListResult,
  UpdateProjectRequest,
  UpdateProjectResult,
} from "../main/projects";
import type {
  CompleteTaskResult,
  CreateTaskRequest,
  CreateTaskResult,
  DeleteTaskResult,
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
      parentId?: string,
    ): Promise<TasksListResult> =>
      ipcRenderer.invoke("tasks:list", cursor, projectId, parentId),
    listWithDueDate: (cursor: string | null): Promise<TasksListResult> =>
      ipcRenderer.invoke("tasks:listWithDueDate", cursor),
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
    delete: (taskId: string): Promise<DeleteTaskResult> =>
      ipcRenderer.invoke("tasks:delete", taskId),
  },
  labels: {
    list: (): Promise<LabelsListResult> => ipcRenderer.invoke("labels:list"),
    create: (input: CreateLabelRequest): Promise<CreateLabelResult> =>
      ipcRenderer.invoke("labels:create", input),
  },
  projects: {
    list: (): Promise<ProjectsListResult> =>
      ipcRenderer.invoke("projects:list"),
    get: (id: string): Promise<GetProjectResult> =>
      ipcRenderer.invoke("projects:get", id),
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
  comments: {
    list: (taskId: string): Promise<CommentsListResult> =>
      ipcRenderer.invoke("comments:list", taskId),
    create: (input: CreateCommentRequest): Promise<CreateCommentResult> =>
      ipcRenderer.invoke("comments:create", input),
    update: (
      commentId: string,
      input: UpdateCommentRequest,
    ): Promise<UpdateCommentResult> =>
      ipcRenderer.invoke("comments:update", commentId, input),
    delete: (commentId: string): Promise<DeleteCommentResult> =>
      ipcRenderer.invoke("comments:delete", commentId),
  },
  attachments: {
    download: (
      request: DownloadAttachmentRequest,
    ): Promise<DownloadAttachmentResult> =>
      ipcRenderer.invoke("attachments:download", request),
  },
};

export type ElectronApi = typeof api;

contextBridge.exposeInMainWorld("api", api);
