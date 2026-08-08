import type { CreateLabelResult } from "@/main/labels";

export const createLabel = (name: string): Promise<CreateLabelResult> =>
  window.api.labels.create({ name });
