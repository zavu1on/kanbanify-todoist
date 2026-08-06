/** The IPC-serializable shape of an `AuthenticatedUser` — see
 * BACKEND_CODE_STYLE_GUIDE.md "IPC-контракт и обработка ошибок": a domain
 * entity never crosses IPC as-is, only through its DTO. */
export type AuthenticatedUserDTO = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
};
