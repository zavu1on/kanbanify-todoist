import { describe, expect, it } from "vitest";
import { InvalidFilterTitleError } from "../errors/InvalidFilterTitleError";
import { Filter } from "./Filter";

const buildFilter = () =>
  Filter.reconstitute({
    id: 1,
    title: "Urgent",
    color: "red",
    query: "p1",
  });

describe("Filter", () => {
  describe("create", () => {
    it("builds a not-yet-created filter with an empty id and a trimmed title", () => {
      const filter = Filter.create({
        title: "  Urgent  ",
        color: "red",
        query: "p1",
      });

      expect(filter.id).toBe(0);
      expect(filter.title).toBe("Urgent");
      expect(filter.color).toBe("red");
      expect(filter.query).toBe("p1");
    });

    it("throws InvalidFilterTitleError for a blank title", () => {
      expect(() =>
        Filter.create({ title: "   ", color: "red", query: "p1" }),
      ).toThrow(InvalidFilterTitleError);
    });
  });

  describe("reconstitute", () => {
    it("builds a filter from trusted data without re-validating invariants", () => {
      // A blank title would be rejected by `create`/`updateDetails` —
      // `reconstitute` trusts the source (an already-validated store row)
      // instead of re-checking.
      const filter = Filter.reconstitute({
        id: 1,
        title: "",
        color: "red",
        query: "p1",
      });

      expect(filter.title).toBe("");
    });
  });

  describe("updateDetails", () => {
    it("mutates title, color and query on the same instance", () => {
      const filter = buildFilter();

      filter.updateDetails({
        title: "Renamed",
        color: "blue",
        query: "p2",
      });

      expect(filter.title).toBe("Renamed");
      expect(filter.color).toBe("blue");
      expect(filter.query).toBe("p2");
    });

    it("trims the new title", () => {
      const filter = buildFilter();

      filter.updateDetails({
        title: "  Renamed  ",
        color: "blue",
        query: "p2",
      });

      expect(filter.title).toBe("Renamed");
    });

    it("leaves id unchanged", () => {
      const filter = buildFilter();

      filter.updateDetails({ title: "Renamed", color: "blue", query: "p2" });

      expect(filter.id).toBe(1);
    });

    it("throws InvalidFilterTitleError for a blank title without mutating the filter", () => {
      const filter = buildFilter();

      expect(() =>
        filter.updateDetails({ title: "   ", color: "blue", query: "p2" }),
      ).toThrow(InvalidFilterTitleError);
      expect(filter.title).toBe("Urgent");
    });
  });
});
