import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TextField } from "mui-rff";
import * as Yup from "yup";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { TestForm, testFormValidate } from "../testing/testForm";
import { resourceNameField, validateFields } from "./fieldValidation";
import {
  AutoInstanceNameTextField,
  instanceNameField,
} from "./instanceNameField";

describe("instance name field validation", () => {
  const schema = Yup.object({
    name: resourceNameField(),
    instanceName: instanceNameField(),
  });

  it("waits for valid name", () => {
    expect(validateFields(schema, { name: "", instanceName: "" })).toEqual({
      name: "Provide a name",
    });
  });

  it("is successful", () => {
    expect(
      validateFields(schema, { name: "name", instanceName: "valid-name" })
    ).toEqual({});
  });

  it.each<[string, string, string]>([
    ["empty value", "", "Provide a Cloud instance name"],
    ["long value", "x".repeat(64), "Must be no longer than 63 characters"],
    [
      "value with invalid characters",
      "with spaces",
      "Only use lowercase letters, numbers, and dashes",
    ],
    ["start with dash", "-dash", "Must start with a lowercase letter"],
    ["end with dash", "dash-", "Must end with a lowercase letter or number"],
  ])("rejects %s", (label: string, value: string, expected: string) => {
    expect(
      validateFields(schema, { name: "name", instanceName: value })
    ).toEqual({
      instanceName: expected,
    });
  });

  it("generates from name", async () => {
    const apis = apiFakes();
    const workspace = await createTestWorkspace(apis);

    const onValidate = jest.fn();
    render(
      <FakeApiProvider apis={apis}>
        <TestForm validate={testFormValidate(schema, onValidate)}>
          <TextField required fullWidth name="name" label="Name" />
          <AutoInstanceNameTextField workspaceId={workspace.id} />
        </TestForm>
      </FakeApiProvider>
    );
    const nameTextBox = screen.getByRole("textbox", { name: "Name" });
    const instanceIdTextBox = screen.getByRole("textbox", {
      name: "Cloud instance name",
    });

    fireEvent.change(nameTextBox, { target: { value: "valid-name" } });
    await waitFor(() =>
      expect(instanceIdTextBox).toHaveDisplayValue("valid-name")
    );

    fireEvent.change(instanceIdTextBox, { target: { value: "custom_id" } });
    expect(instanceIdTextBox).toHaveDisplayValue("custom_id");

    fireEvent.change(nameTextBox, { target: { value: "yet-another-name" } });
    await waitFor(() =>
      expect(instanceIdTextBox).toHaveDisplayValue("custom_id")
    );

    fireEvent.click(screen.getByRole("button"), { name: "reload" });
    expect(instanceIdTextBox).toHaveDisplayValue("yet-another-name");

    fireEvent.focusOut(instanceIdTextBox);
    await waitFor(() => expect(onValidate).toBeCalledWith({}));
  });
});
