import { contextBridge, ipcRenderer } from "electron";
import type {
  LoginResult,
  LogoutResult,
  SessionCheckResult,
} from "../main/auth";
import type {
  KanbanStatusLevel,
  TasksListResult,
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
    list: (cursor: string | null): Promise<TasksListResult> =>
      ipcRenderer.invoke("tasks:list", cursor),
    updateStatus: (
      taskId: string,
      status: KanbanStatusLevel,
    ): Promise<UpdateTaskStatusResult> =>
      ipcRenderer.invoke("tasks:updateStatus", taskId, status),
  },
};

export type ElectronApi = typeof api;

contextBridge.exposeInMainWorld("api", api);
