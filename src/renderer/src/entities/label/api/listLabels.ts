import type { LabelsListResult } from "@/main/labels";

export const listLabels = (): Promise<LabelsListResult> =>
  window.api.labels.list();
