/**
 * Free-tier `due` is the only date field this app uses — `deadline`/`duration`
 * are Pro-only and never read (see SPECIFICATION.md "Ограничения тарифа").
 */
export class TaskDue {
  private constructor(
    /** Calendar date, `YYYY-MM-DD`, always present when `due` is non-null. */
    readonly date: string,
    /** ISO 8601 datetime, present only when the task's due date has a time component. */
    readonly datetime: string | null,
  ) {}

  static of(date: string, datetime: string | null): TaskDue {
    return new TaskDue(date, datetime);
  }
}
