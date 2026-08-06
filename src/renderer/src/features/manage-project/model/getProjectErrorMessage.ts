import type { ProjectsErrorType } from "@/main/projects";

const MESSAGES: Record<ProjectsErrorType, string> = {
  auth_error: "Your session has expired. Please log in again.",
  network_error: "Couldn't reach Todoist. Check your connection and try again.",
  not_found:
    "This project no longer exists — it may have been removed elsewhere.",
  invalid_name: "Please enter a valid project name.",
  inbox_protected: "The Inbox project can't be archived or deleted.",
  unknown: "Something went wrong. Please try again.",
};

export const getProjectErrorMessage = (type: ProjectsErrorType): string =>
  MESSAGES[type];
