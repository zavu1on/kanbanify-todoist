import type { AutoLaunchStatusResult } from "@/main/startup";

export const getAutoLaunchStatus = (): Promise<AutoLaunchStatusResult> =>
  window.api.startup.getAutoLaunch();
