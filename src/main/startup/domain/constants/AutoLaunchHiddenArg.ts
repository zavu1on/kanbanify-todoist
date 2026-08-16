/**
 * Passed as a login-item launch argument when auto-launch is enabled. The
 * composition root (`src/main/index.ts`) checks for this exact flag in
 * `process.argv` to decide whether to skip showing the window on startup —
 * on Windows `app.getLoginItemSettings().wasOpenedAsHidden` is macOS-only,
 * so a custom argument is the only reliable signal.
 */
export const AUTO_LAUNCH_HIDDEN_ARG = "--hidden";
