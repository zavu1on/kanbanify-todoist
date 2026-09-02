import path from "node:path";
import Database from "better-sqlite3";
import { app } from "electron";
import type { IFilterStore } from "../application/ports/IFilterStore";
import { Filter } from "../domain/entities/Filter";
import { FilterMapper } from "../domain/mappers/FilterMapper";

const DB_FILE_NAME = "filters.db";

type FilterRow = {
  id: number;
  title: string;
  color: string;
  query: string;
};

/**
 * Persists filters in a local sqlite database — see ADR
 * `docs/decisions/04-filters-persistence.md` for why sqlite/`better-sqlite3`
 * over the alternatives, and why a single `CREATE TABLE IF NOT EXISTS`
 * (no migration framework) is enough for one table.
 *
 * `id` is `INTEGER PRIMARY KEY AUTOINCREMENT`, so row order already matches
 * insertion order — no reordering is planned (see the ADR), so no separate
 * ordering column is needed.
 */
export class SqliteFilterStore implements IFilterStore {
  private readonly db: Database.Database;
  private readonly filterMapper = new FilterMapper();

  constructor() {
    const dbPath = path.join(app.getPath("userData"), DB_FILE_NAME);
    this.db = new Database(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS filters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        color TEXT NOT NULL,
        query TEXT NOT NULL
      )
    `);
  }

  async list(): Promise<Filter[]> {
    const rows = this.db
      .prepare("SELECT * FROM filters ORDER BY id ASC")
      .all() as FilterRow[];
    return rows.map((row) => this.filterMapper.toDomain(row));
  }

  async get(id: number): Promise<Filter | null> {
    const row = this.db.prepare("SELECT * FROM filters WHERE id = ?").get(id) as
      | FilterRow
      | undefined;
    return row ? this.filterMapper.toDomain(row) : null;
  }

  async insert(filter: Filter): Promise<Filter> {
    const { lastInsertRowid } = this.db
      .prepare("INSERT INTO filters (title, color, query) VALUES (?, ?, ?)")
      .run(filter.title, filter.color, filter.query);

    return Filter.reconstitute({
      id: Number(lastInsertRowid),
      title: filter.title,
      color: filter.color,
      query: filter.query,
    });
  }

  async update(filter: Filter): Promise<Filter> {
    this.db
      .prepare(
        "UPDATE filters SET title = ?, color = ?, query = ? WHERE id = ?",
      )
      .run(filter.title, filter.color, filter.query, filter.id);
    return filter;
  }

  async delete(id: number): Promise<void> {
    this.db.prepare("DELETE FROM filters WHERE id = ?").run(id);
  }
}
