import fs from "node:fs/promises";
import path from "node:path";
import { app, safeStorage } from "electron";
import type {
  ITokenStore,
  TokenStoreResult,
} from "../application/ports/ITokenStore";
import { AccessToken } from "../domain/value-objects/AccessToken";

const TOKEN_FILE_NAME = "kanbanify-todoist-token.enc";

/**
 * Persists the Todoist access token under `app.getPath('userData')`, encrypted via
 * Electron `safeStorage` (OS keychain/DPAPI/libsecret-backed) whenever available.
 *
 * When OS-level encryption is unavailable (typical for Linux without a keyring),
 * this falls back to a plaintext file rather than failing the whole login flow —
 * the caller is told via `TokenStoreResult.encrypted` so it can warn the user.
 */
export class SafeStorageTokenStore implements ITokenStore {
  async save(accessToken: string): Promise<TokenStoreResult> {
    const tokenFilePath = path.join(app.getPath("userData"), TOKEN_FILE_NAME);

    if (!safeStorage.isEncryptionAvailable()) {
      console.warn(
        "[auth] OS-level encryption is unavailable on this system — storing the Todoist access token in plaintext.",
      );

      await fs.writeFile(tokenFilePath, accessToken, { mode: 0o600 });
      return { encrypted: false };
    }

    const encrypted = safeStorage.encryptString(accessToken);
    await fs.writeFile(tokenFilePath, encrypted, { mode: 0o600 });

    return { encrypted: true };
  }

  async load(): Promise<AccessToken | null> {
    const tokenFilePath = path.join(app.getPath("userData"), TOKEN_FILE_NAME);

    let fileContents: Buffer;
    try {
      fileContents = await fs.readFile(tokenFilePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }

    const rawValue = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(fileContents)
      : fileContents.toString("utf-8");

    return AccessToken.of(rawValue);
  }

  async clear(): Promise<void> {
    const tokenFilePath = path.join(app.getPath("userData"), TOKEN_FILE_NAME);
    await fs.rm(tokenFilePath, { force: true });
  }
}
