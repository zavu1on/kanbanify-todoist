export type AutoLaunchErrorType = "unknown";

export type AutoLaunchFailure = {
  ok: false;
  error: { type: AutoLaunchErrorType; message: string };
};
