import { TodoistApi } from "@doist/todoist-sdk";
import type { ILabelGateway } from "../application/ports/ILabelGateway";
import type { Label } from "../domain/entities/Label";
import { LabelMapper } from "../domain/mappers/LabelMapper";
import { TodoistLabelsErrorClassifier } from "./TodoistLabelsErrorClassifier";

/** Todoist caps list pages at 200 (see SPECIFICATION.md "Задачи") — a personal
 * label set almost always fits in one page, but the loop stays correct either way. */
const PAGE_SIZE = 200;

export class TodoistLabelGateway implements ILabelGateway {
  private readonly labelMapper = new LabelMapper();
  private readonly errorClassifier = new TodoistLabelsErrorClassifier();

  async listLabels(accessToken: string): Promise<Label[]> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const labels: Label[] = [];
      let cursor: string | null = null;

      do {
        const { results, nextCursor } = await api.getLabels({
          cursor,
          limit: PAGE_SIZE,
        });
        labels.push(
          ...results.map((label) => this.labelMapper.toDomain(label)),
        );
        cursor = nextCursor;
      } while (cursor !== null);

      return labels;
    });
  }

  async create(accessToken: string, label: Label): Promise<Label> {
    return this.errorClassifier.wrap(async () => {
      const api = new TodoistApi(accessToken);
      const created = await api.addLabel({ name: label.name });
      return this.labelMapper.toDomain(created);
    });
  }
}
