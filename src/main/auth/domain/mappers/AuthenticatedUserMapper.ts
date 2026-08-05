import { AuthenticatedUser } from "../entities/AuthenticatedUser";

/** The subset of the Todoist API user shape this app reads — kept structural
 * (not the SDK's own type) so this mapper stays free of an SDK import. */
export type AuthenticatedUserApiSource = {
  id: string;
  fullName: string;
  email: string;
  avatarMedium?: string | null;
};

/** Maps a raw Todoist API user into the domain `AuthenticatedUser`. */
export class AuthenticatedUserMapper {
  toDomain(source: AuthenticatedUserApiSource): AuthenticatedUser {
    return new AuthenticatedUser(
      source.id,
      source.fullName,
      source.email,
      source.avatarMedium ?? null,
    );
  }
}
