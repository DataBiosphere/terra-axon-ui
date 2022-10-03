import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TextField } from "mui-rff";
import { Form } from "react-final-form";
import * as Yup from "yup";
import { StewardshipType } from "../generated/workspacemanager";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { TestForm, testFormValidate } from "../testing/testForm";
import {
  autoBucketNameField,
  AutoBucketNameTextField,
  bucketNameField,
  BucketNameTextField,
} from "./bucketNameField";
import { resourceNameField, validateFields } from "./fieldValidation";
import nop from "./nop";

describe("bucket name field", () => {
  describe("renders", () => {
    it("controlled", () => {
      render(
        <Form
          onSubmit={nop}
          render={() => (
            <BucketNameTextField stewardship={StewardshipType.Controlled} />
          )}
        />
      );
      screen.getByText("Only use lowercase letters, numbers and dashes");
    });

    it("referenced", () => {
      render(
        <Form
          onSubmit={nop}
          render={() => (
            <BucketNameTextField stewardship={StewardshipType.Referenced} />
          )}
        />
      );
      screen.getByText(
        "Only use lowercase letters, numbers, underscores and dashes"
      );
    });

    it("disabled", () => {
      render(
        <Form
          onSubmit={nop}
          render={() => (
            <BucketNameTextField
              disabled
              stewardship={StewardshipType.Referenced}
            />
          )}
        />
      );
      expect(
        screen.queryByText(
          "Only use lowercase letters, numbers, underscores and dashes"
        )
      ).not.toBeInTheDocument();
    });
  });

  describe("validation", () => {
    const schema = Yup.object({
      bucketName: bucketNameField(StewardshipType.Referenced),
    });

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
