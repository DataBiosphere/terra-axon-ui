import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ValidationErrors } from "final-form";
import * as Yup from "yup";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { TestForm, testFormValidate } from "../testing/testForm";
import { validateFields } from "./fieldValidation";
import {
  generateIdFromName,
  WorkspaceGeneratedIdTextField,
  workspaceIdField,
} from "./workspaceIdField";
import {
  workspaceNameField,
  WorkspaceNameTextField,
} from "./workspaceNameField";

describe("workspace id field", () => {
  const schema = Yup.object({
    name: workspaceNameField(),
    id: workspaceIdField(),
  });

  it("waits for valid name", () => {
    expect(validateFields(schema, { name: "", id: "" })).toEqual({
      name: "Provide a name",
    });
  });

  it.each<[string, string, string]>([
    ["empty value", "", "Provide an ID"],
    ["long value", "x".repeat(64), "Must be no longer than 63 characters"],
    [
      "value spaces",
      "with spaces",
      "Only use lowercase letters, numbers, dashes, and underscores",
    ],
    [
      "value spaces",
      "WithUppercase",
      "Only use lowercase letters, numbers, dashes, and underscores",
    ],
    [
      "start with dash",
      "-dash",
      "Must start with a lowercase letter or number",
    ],
  ])("rejects %s", (label: string, value: string, expected: string) => {
    expect(validateFields(schema, { name: "valid name", id: value })).toEqual({
      id: expected,
    });
  });

  it("validates unique", async () => {
    const apis = apiFakes();
    await createTestWorkspace(apis, { userFacingId: "taken-id" });

    const onValidate = jest.fn();
    render(
      <FakeApiProvider apis={apis}>
        <TestIdValidationForm schema={schema} onValidate={onValidate} />
      </FakeApiProvider>
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "valid name" },
    });
    const idTextBox = screen.getByRole("textbox", { name: "ID" });
    await waitFor(() => expect(idTextBox).toHaveDisplayValue("valid-name"));

    fireEvent.change(idTextBox, { target: { value: "unique-id" } });
    await waitFor(() => expect(onValidate).toBeCalledWith({}));

    fireEvent.change(idTextBox, { target: { value: "taken-id" } });
    await screen.findByText("This ID already exists. Must be unique.");

    fireEvent.change(idTextBox, { target: { value: "new-unique-id" } });
    await waitFor(() => expect(onValidate).toBeCalledWith({}));
  });

  it("generates from name", async () => {
    const apis = apiFakes();
    await createTestWorkspace(apis, { userFacingId: "taken-name" });

    const onValidate = jest.fn();
    render(
      <FakeApiProvider apis={apis}>
        <TestForm validate={testFormValidate(schema, onValidate)}>
          <WorkspaceNameTextField />
          <WorkspaceGeneratedIdTextField />
        </TestForm>
      </FakeApiProvider>
    );
    const nameTextBox = screen.getByRole("textbox", { name: "Name" });
    const idTextBox = screen.getByRole("textbox", { name: "ID" });

    fireEvent.change(nameTextBox, { target: { value: "valid name" } });
    await waitFor(() => expect(idTextBox).toHaveDisplayValue("valid-name"));

    fireEvent.change(nameTextBox, { target: { value: "taken name" } });
    await waitFor(() =>
      expect(idTextBox).toHaveDisplayValue(/taken\-name\-[0-9]+/)
    );

    fireEvent.change(idTextBox, { target: { value: "custom_id" } });
    expect(idTextBox).toHaveDisplayValue("custom_id");

    fireEvent.change(nameTextBox, { target: { value: "yet another name" } });
    await waitFor(() => expect(idTextBox).toHaveDisplayValue("custom_id"));

    fireEvent.click(screen.getByRole("button"), { name: "reload" });
    expect(idTextBox).toHaveDisplayValue("yet-another-name");

    fireEvent.focusOut(idTextBox);
    await waitFor(() => expect(onValidate).toBeCalledWith({}));
  });

  it.each([
    [" name with    spaces ", "name-with-spaces"],
    ["UpperCaseNamE", "uppercasename"],
    ["invalid @#$ chars", "invalid-chars"],
    ["-starting-ending-dash-", "starting-ending-dash"],
    ["1starting-ending-number1", "1starting-ending-number1"],
    ["$starting-ending-invalid$", "starting-ending-invalid"],
    ["long-name-" + "x".repeat(63), "long-name-" + "x".repeat(53)],
  ])("generates from %s", (name, expected) => {
    expect(generateIdFromName(name)).toEqual(expected);
  });
});

const TestIdValidationForm = ({
  schema,
  onValidate,
}: {
  schema: Yup.Schema;
  onValidate: (values: unknown) => ValidationErrors | Promise<ValidationErrors>;
}) => {
  return (
    <TestForm
      validate={(values: Yup.InferType<typeof schema>) => {
        const res = validateFields(schema, values);
        onValidate(res);
        return res;
      }}
    >
      <WorkspaceNameTextField />
      <WorkspaceGeneratedIdTextField />
    </TestForm>
  );
};
