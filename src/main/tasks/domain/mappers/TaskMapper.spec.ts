import { describe, expect, it } from "vitest";
import type { TaskApiSource } from "./TaskMapper";
import { TaskMapper } from "./TaskMapper";

const baseSource: TaskApiSource = {
  id: "1",
  content: "Write report",
  description: "",
  projectId: "inbox",
  priority: 1,
  due: null,
  labels: [],
  checked: false,
  parentId: null,
};

describe("TaskMapper", () => {
  const mapper = new TaskMapper();

  it("keeps a plain date-only due as-is", () => {
    const task = mapper.toDomain({
      ...baseSource,
      due: { date: "2026-08-19", datetime: null },
    });
    expect(task.due).toMatchObject({ date: "2026-08-19", datetime: null });
  });

  it("uses `datetime` when the API splits date and time normally", () => {
    const task = mapper.toDomain({
      ...baseSource,
      due: { date: "2026-08-19", datetime: "2026-08-19T17:00:00Z" },
    });
    expect(task.due).toMatchObject({
      date: "2026-08-19",
      datetime: "2026-08-19T17:00:00Z",
    });
  });

  // Some Todoist responses pack the full timestamp into `date` and leave
  // `datetime` unset — see TaskMapper.parseDue's doc comment.
  it("splits a full timestamp packed into `date` with no separate `datetime`", () => {
    const task = mapper.toDomain({
      ...baseSource,
      due: { date: "2026-08-19T17:00:00Z", datetime: undefined },
    });
    expect(task.due).toMatchObject({
      date: "2026-08-19",
      datetime: "2026-08-19T17:00:00Z",
    });
  });
});
