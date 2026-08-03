export interface TokenStoreResult {
  /** Whether the token was persisted through OS-level encryption (`safeStorage`). */
  encrypted: boolean;
}

export interface ITokenStore {
  save(accessToken: string): Promise<TokenStoreResult>;
  /** Returns the stored access token, or `null` when none is stored. */
  load(): Promise<string | null>;
  /** Deletes the stored token file, if any. */
  clear(): Promise<void>;
}
