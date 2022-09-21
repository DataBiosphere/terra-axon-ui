import * as Yup from "yup";
import {
  dataTableNameField,
  projectIdField,
  resourceNameField,
  validateFields,
} from "./fieldValidation";

describe("validate fields", () => {
  it("translates errors", () => {
    const schema = Yup.object({
      topLevelA: Yup.string().required(),
      topLevelB: Yup.string().required(),
      topLevelC: Yup.string(),
      nested: Yup.object({
        nestedA: Yup.string().required(),
        nestedB: Yup.string().required(),
        nestedC: Yup.string(),
      }),
      array: Yup.array().of(Yup.string().required()),
    });
    const values: Yup.InferType<typeof schema> = {
      topLevelA: "",
      topLevelB: "top level b",
      topLevelC: "top level c",
      nested: {
        nestedA: "nested b",
        nestedB: "",
      },
      array: ["array a", "", "array c"],
    };

    expect(validateFields(schema, values)).toEqual({
      topLevelA: "Provide a topLevelA",
      nested: {
        nestedB: "Provide a nested.nestedB",
      },
      array: [undefined, "Provide a array[1]"],
    });
  });
});

describe("resource name field validation", () => {
  const schema = Yup.object({
    name: resourceNameField(),
  });

  it("is successful", () => {
    expect(validateFields(schema, { name: "valid-name" })).toEqual({});
  });

  it.each<[string, string, string]>([
    ["empty value", "", "Provide a name"],
    ["long value", "x".repeat(1025), "Must be no longer than 1024 characters"],
    [
      "value with invalid characters",
      "with spaces",
      "Only use letters, numbers, dashes, and underscores",
    ],
    [
      "start with underscore",
      "_underscore",
      "Must start with a letter or number",
    ],
  ])("rejects %s", (label: string, value: string, expected: string) => {
    expect(validateFields(schema, { name: value })).toEqual({
      name: expected,
    });
  });
});

describe("data table name field validation", () => {
  const schema = Yup.object({ dataTableName: dataTableNameField() });

  it("is successful", () => {
    expect(validateFields(schema, { dataTableName: "valid_name" })).toEqual({});
  });

  it.each<[string, string, string]>([
    ["empty value", "", "Provide a Cloud data table name"],
    ["long value", "x".repeat(1025), "Must be no longer than 1024 characters"],
  ])("rejects %s", (label: string, value: string, expected: string) => {
    expect(validateFields(schema, { dataTableName: value })).toEqual({
      dataTableName: expected,
    });
  });
});

describe("project id field validation", () => {
  const schema = Yup.object({
    projectId: projectIdField(),
  });

  it("is successful", () => {
    expect(validateFields(schema, { projectId: "valid-name" })).toEqual({});
  });

  it.each<[string, string, string]>([
    ["empty value", "", "Provide a project ID"],
    ["long value", "x".repeat(31), "Must be no longer than 30 characters"],
    ["short value", "short", "Must be at least 6 characters"],
    [
      "value with invalid characters",
      "with spaces",
      "Only use lowercase letters, numbers and dashes",
    ],
  ])("rejects %s", (label: string, value: string, expected: string) => {
    expect(validateFields(schema, { projectId: value })).toEqual({
      projectId: expected,
    });
  });
});
