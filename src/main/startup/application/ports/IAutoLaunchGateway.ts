export interface IAutoLaunchGateway {
  /** Reads the OS login-item state. Can throw `UnknownAutoLaunchError`. */
  isEnabled(): boolean;

  /**
   * Registers/unregisters the app as a login item. Can throw
   * `UnknownAutoLaunchError`.
   */
  setEnabled(enabled: boolean): void;
}
