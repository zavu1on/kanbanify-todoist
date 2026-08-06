export type AuthenticatedUserReconstituteSource = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
};

export class AuthenticatedUser {
  private constructor(
    readonly id: string,
    readonly fullName: string,
    readonly email: string,
    readonly avatarUrl: string | null,
  ) {}

  /** The only factory — this app never creates a Todoist user, it only reads
   * one already-trusted from the API (no invariants to validate here). */
  static reconstitute(
    source: AuthenticatedUserReconstituteSource,
  ): AuthenticatedUser {
    return new AuthenticatedUser(
      source.id,
      source.fullName,
      source.email,
      source.avatarUrl,
    );
  }
}
