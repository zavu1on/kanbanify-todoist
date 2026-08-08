import { describe, expect, it } from "vitest";
import { InvalidLabelNameError } from "../errors/InvalidLabelNameError";
import { Label } from "./Label";

describe("Label.create", () => {
  it("builds a new label with an empty id and a trimmed name", () => {
    const label = Label.create({ name: "  urgent  " });

    expect(label.id).toBe("");
    expect(label.name).toBe("urgent");
  });

  it("throws InvalidLabelNameError for an empty name", () => {
    expect(() => Label.create({ name: "   " })).toThrow(InvalidLabelNameError);
  });
});

describe("Label.reconstitute", () => {
  it("rebuilds a label without re-validating", () => {
    const label = Label.reconstitute({ id: "1", name: "urgent" });

    expect(label.id).toBe("1");
    expect(label.name).toBe("urgent");
  });
});
