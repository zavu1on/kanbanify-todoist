import { describe, expect, it } from "vitest";
import { InboxProjectProtectedError } from "../errors/InboxProjectProtectedError";
import { InvalidProjectNameError } from "../errors/InvalidProjectNameError";
import { Project } from "./Project";

type ProjectOverrides = {
  isInboxProject?: boolean;
  isArchived?: boolean;
  parentId?: string | null;
  activeTaskCount?: number;
};

const buildProject = (overrides: ProjectOverrides = {}) =>
  Project.reconstitute({
    id: "1",
    name: "Work",
    description: "Description",
    color: "charcoal",
    parentId: overrides.parentId ?? null,
    isInboxProject: overrides.isInboxProject ?? false,
    isArchived: overrides.isArchived ?? false,
    activeTaskCount: overrides.activeTaskCount ?? 3,
  });

describe("Project", () => {
  describe("create", () => {
    it("builds a not-yet-created project with an empty id and a trimmed name/description", () => {
      const project = Project.create({
        name: "  Work  ",
        description: "  Work stuff  ",
        color: "blue",
        parentId: "parent-1",
      });

      expect(project.id).toBe("");
      expect(project.name).toBe("Work");
      expect(project.description).toBe("Work stuff");
      expect(project.color).toBe("blue");
      expect(project.parentId).toBe("parent-1");
      expect(project.isInboxProject).toBe(false);
      expect(project.isArchived).toBe(false);
      expect(project.activeTaskCount).toBe(0);
    });

    it("throws InvalidProjectNameError for a blank name", () => {
      expect(() =>
        Project.create({
          name: "   ",
          description: "",
          color: "blue",
          parentId: null,
        }),
      ).toThrow(InvalidProjectNameError);
    });
  });

  describe("reconstitute", () => {
    it("builds a project from trusted data without re-validating invariants", () => {
      // A blank name would be rejected by `create`/`updateDetails` — `reconstitute`
      // trusts the source (an already-mapped API response) instead of re-checking.
      const project = Project.reconstitute({
        id: "1",
        name: "",
        description: "",
        color: "charcoal",
        parentId: null,
        isInboxProject: false,
        isArchived: false,
        activeTaskCount: 0,
      });

      expect(project.name).toBe("");
    });
  });

  describe("updateDetails", () => {
    it("mutates name, description and color on the same instance", () => {
      const project = buildProject();

      project.updateDetails({
        name: "Renamed",
        description: "New description",
        color: "red",
      });

      expect(project.name).toBe("Renamed");
      expect(project.description).toBe("New description");
      expect(project.color).toBe("red");
    });

    it("trims the new name and description", () => {
      const project = buildProject();

      project.updateDetails({
        name: "  Renamed  ",
        description: "  New description  ",
        color: "red",
      });

      expect(project.name).toBe("Renamed");
      expect(project.description).toBe("New description");
    });

    it("leaves id, parentId, isInboxProject, isArchived and activeTaskCount unchanged", () => {
      const project = buildProject({
        parentId: "parent-1",
        isArchived: true,
        activeTaskCount: 7,
      });

      project.updateDetails({
        name: "Renamed",
        description: "",
        color: "blue",
      });

      expect(project.id).toBe("1");
      expect(project.parentId).toBe("parent-1");
      expect(project.isArchived).toBe(true);
      expect(project.activeTaskCount).toBe(7);
    });

    it("throws InvalidProjectNameError for a blank name without mutating the project", () => {
      const project = buildProject();

      expect(() =>
        project.updateDetails({ name: "   ", description: "", color: "red" }),
      ).toThrow(InvalidProjectNameError);
      expect(project.name).toBe("Work");
    });
  });

  describe("archive", () => {
    it("does nothing for a regular project", () => {
      const project = buildProject();
      expect(() => project.archive()).not.toThrow();
    });

    it("throws when the project is the Inbox project", () => {
      const project = buildProject({ isInboxProject: true });
      expect(() => project.archive()).toThrow(InboxProjectProtectedError);
    });
  });

  describe("delete", () => {
    it("does nothing for a regular project", () => {
      const project = buildProject();
      expect(() => project.delete()).not.toThrow();
    });

    it("throws when the project is the Inbox project", () => {
      const project = buildProject({ isInboxProject: true });
      expect(() => project.delete()).toThrow(InboxProjectProtectedError);
    });
  });
});
