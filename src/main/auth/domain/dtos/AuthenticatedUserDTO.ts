/** The IPC-serializable shape of an `AuthenticatedUser` — see
 * BACKEND_CODE_STYLE_GUIDE.md "IPC-контракт и обработка ошибок": a domain
 * entity never crosses IPC as-is, only through its DTO. */
export type AuthenticatedUserDTO = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  /** 0-6, Sunday-based (`Date.getDay()` convention) — first day of the week
   * per the user's Todoist settings, used to align the Calendar grid
   * (SPECIFICATION.md "Календарь"). */
  weekStartsOn: number;
};
