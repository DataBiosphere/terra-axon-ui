import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TextField } from "mui-rff";
import * as Yup from "yup";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { TestForm, testFormValidate } from "../testing/testForm";
import {
  autoDatasetNameField,
  AutoDatasetNameTextField,
  datasetNameField,
} from "./datasetNameField";
import { resourceNameField, validateFields } from "./fieldValidation";

describe("dataset name field validation", () => {
  describe("optional", () => {
    it("allows empty", () => {
      expect(
        validateFields(Yup.object({ datasetName: datasetNameField(false) }), {})
      ).toEqual({});
    });
  });

  describe("required", () => {
    const schema = Yup.object({ datasetName: datasetNameField(true) });

    it("is successful", () => {
      expect(validateFields(schema, { datasetName: "valid_name" })).toEqual({});
    });

    it.each<[string, string, string]>([
      ["empty value", "", "Provide a Cloud dataset name"],
      [
        "long value",
        "x".repeat(1025),
        "Must be no longer than 1024 characters",
      ],
      [
        "value with invalid characters",
        "with spaces",
        "Only use lowercase letters, numbers and underscores",
      ],
    ])("rejects %s", (label: string, value: string, expected: string) => {
      expect(validateFields(schema, { datasetName: value })).toEqual({
        datasetName: expected,
      });
    });
  });

  describe("auto", () => {
    const schema = Yup.object({
      name: resourceNameField(),
      datasetName: autoDatasetNameField(),
    });

    it("waits for valid name", () => {
      expect(validateFields(schema, { name: "", datasetName: "" })).toEqual({
        name: "Provide a name",
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
            <AutoDatasetNameTextField workspaceId={workspace.id} />
          </TestForm>
        </FakeApiProvider>
      );
      const nameTextBox = screen.getByRole("textbox", { name: "Name" });
      const datasetTextBox = screen.getByRole("textbox", {
        name: "Cloud dataset name",
      });

      fireEvent.change(nameTextBox, { target: { value: "valid-name" } });
      await waitFor(() =>
        expect(datasetTextBox).toHaveDisplayValue("valid_name")
      );

      fireEvent.change(datasetTextBox, { target: { value: "custom_id" } });
      expect(datasetTextBox).toHaveDisplayValue("custom_id");

      fireEvent.change(nameTextBox, { target: { value: "yet-another-name" } });
      await waitFor(() =>
        expect(datasetTextBox).toHaveDisplayValue("custom_id")
      );

      fireEvent.click(screen.getByRole("button"), { name: "reload" });
      expect(datasetTextBox).toHaveDisplayValue("yet_another_name");

      fireEvent.focusOut(datasetTextBox);
      await waitFor(() => expect(onValidate).toBeCalledWith({}));
    });
  });
});
