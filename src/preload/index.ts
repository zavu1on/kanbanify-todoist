import { contextBridge, ipcRenderer } from "electron";
import type { LoginResult } from "../main/auth/domain/contracts/LoginResult";

const api = {
  auth: {
    login: (accessToken: string): Promise<LoginResult> =>
      ipcRenderer.invoke("auth:login", accessToken),
  },
};

export type ElectronApi = typeof api;

contextBridge.exposeInMainWorld("api", api);
