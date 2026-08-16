import type { AutoLaunchStatusResult } from "@/main/startup";

export const setAutoLaunchStatus = (
  enabled: boolean,
): Promise<AutoLaunchStatusResult> =>
  window.api.startup.setAutoLaunch(enabled);
