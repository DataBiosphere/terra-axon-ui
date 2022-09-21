import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TextField } from "mui-rff";
import * as Yup from "yup";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { TestForm, testFormValidate } from "../testing/testForm";
import {
  autoBucketNameField,
  AutoBucketNameTextField,
  bucketNameField,
} from "./bucketNameField";
import { resourceNameField, validateFields } from "./fieldValidation";

describe("bucket name field validation", () => {
  describe("optional", () => {
    const schema = Yup.object({ bucketName: bucketNameField(false) });

    it("allows empty", () => {
      expect(validateFields(schema, {})).toEqual({});
    });
  });

  describe("required", () => {
    const schema = Yup.object({ bucketName: bucketNameField(true) });

    it("is successful", () => {
      expect(
        validateFields(schema, {
          bucketName: "valid-name",
        })
      ).toEqual({});
    });

    it.each<[string, string, string]>([
      ["empty value", "", "Provide a Cloud bucket name"],
      ["long value", "x".repeat(64), "Must be no longer than 63 characters"],
      [
        "value with invalid characters",
        "with spaces",
        "Only use lowercase letters, numbers, underscores and dashes",
      ],
      [
        "start with dash",
        "-dash",
        "Must start with a lowercase letter or number",
      ],
      ["end with dash", "dash-", "Must end with a lowercase letter or number"],
    ])("rejects %s", (label: string, value: string, expected: string) => {
      expect(
        validateFields(schema, { name: "name", bucketName: value })
      ).toEqual({
        bucketName: expected,
      });
    });
  });

  describe("auto", () => {
    const schema = Yup.object({
      name: resourceNameField(),
      bucketName: autoBucketNameField(),
    });

    it("waits for valid name", () => {
      expect(validateFields(schema, { name: "", bucketName: "" })).toEqual({
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
            <AutoBucketNameTextField workspaceId={workspace.id} />
          </TestForm>
        </FakeApiProvider>
      );
      const nameTextBox = screen.getByRole("textbox", { name: "Name" });
      const bucketTextBox = screen.getByRole("textbox", {
        name: "Cloud bucket name",
      });

      fireEvent.change(nameTextBox, { target: { value: "valid-name" } });
      await waitFor(() =>
        expect(bucketTextBox).toHaveDisplayValue(
          `valid-name-${workspace.gcpContext?.projectId}`
        )
      );

      fireEvent.change(bucketTextBox, { target: { value: "custom_id" } });
      expect(bucketTextBox).toHaveDisplayValue("custom_id");

      fireEvent.change(nameTextBox, { target: { value: "yet-another-name" } });
      await waitFor(() =>
        expect(bucketTextBox).toHaveDisplayValue("custom_id")
      );

      fireEvent.click(screen.getByRole("button"), { name: "reload" });
      expect(bucketTextBox).toHaveDisplayValue(
        `yet-another-name-${workspace.gcpContext?.projectId}`
      );

      fireEvent.focusOut(bucketTextBox);
      await waitFor(() => expect(onValidate).toBeCalledWith({}));
    });
  });
});
