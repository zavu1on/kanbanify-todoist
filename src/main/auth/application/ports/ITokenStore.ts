export interface TokenStoreResult {
  /** Whether the token was persisted through OS-level encryption (`safeStorage`). */
  encrypted: boolean;
}

export interface ITokenStore {
  save(accessToken: string): Promise<TokenStoreResult>;
}
