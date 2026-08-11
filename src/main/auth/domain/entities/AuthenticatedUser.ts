export type AuthenticatedUserReconstituteSource = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  /** 0-6, Sunday-based (`Date.getDay()` convention) — see
   * `AuthenticatedUserMapper` for the conversion from Todoist's 1-7,
   * Monday-based `startDay`. */
  weekStartsOn: number;
};

export class AuthenticatedUser {
  private constructor(
    readonly id: string,
    readonly fullName: string,
    readonly email: string,
    readonly avatarUrl: string | null,
    readonly weekStartsOn: number,
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
      source.weekStartsOn,
    );
  }
}
