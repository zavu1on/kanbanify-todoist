import type { AutoLaunchFailure } from "./AutoLaunchFailure";

export type AutoLaunchStatusResult =
  | { ok: true; enabled: boolean }
  | AutoLaunchFailure;
