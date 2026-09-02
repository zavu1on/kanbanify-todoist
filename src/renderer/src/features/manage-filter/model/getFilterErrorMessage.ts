import type { FiltersErrorType } from "@/main/filters";

const MESSAGES: Record<FiltersErrorType, string> = {
  auth_error: "Your session has expired. Please log in again.",
  network_error: "Couldn't reach Todoist. Check your connection and try again.",
  not_found:
    "This filter no longer exists — it may have been removed elsewhere.",
  invalid_title: "Please enter a valid filter title.",
  unknown: "Something went wrong. Please try again.",
};

export const getFilterErrorMessage = (type: FiltersErrorType): string =>
  MESSAGES[type];
