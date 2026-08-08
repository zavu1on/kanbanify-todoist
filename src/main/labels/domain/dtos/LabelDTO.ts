/** The IPC-serializable shape of a `Label` — see BACKEND_CODE_STYLE_GUIDE.md
 * "IPC-контракт": a domain entity never crosses IPC as-is, only through its DTO. */
export type LabelDTO = {
  id: string;
  name: string;
};
