import { contextBridge, ipcRenderer } from "electron";
import type {
  LoginResult,
  LogoutResult,
  SessionCheckResult,
} from "../main/auth";

const api = {
  auth: {
    login: (accessToken: string): Promise<LoginResult> =>
      ipcRenderer.invoke("auth:login", accessToken),
    checkSession: (): Promise<SessionCheckResult> =>
      ipcRenderer.invoke("auth:checkSession"),
    logout: (): Promise<LogoutResult> => ipcRenderer.invoke("auth:logout"),
  },
};

export type ElectronApi = typeof api;

contextBridge.exposeInMainWorld("api", api);
