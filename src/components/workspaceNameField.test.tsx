import * as Yup from "yup";
import { validateFields } from "./fieldValidation";
import { workspaceNameField } from "./workspaceNameField";

describe("workspace name field", () => {
  const schema = Yup.object({ name: workspaceNameField() });

  it("validates successfully", () => {
    expect(validateFields(schema, { name: "valid name" })).toEqual({});
  });

  it("rejects empty input", async () => {
    expect(validateFields(schema, { name: "" })).toEqual({
      name: "Provide a name",
    });
  });
});
