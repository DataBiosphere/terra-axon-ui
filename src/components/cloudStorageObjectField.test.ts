import * as Yup from "yup";
import {
  bucketObjectNameField,
  parseObjectBucket,
} from "./cloudStorageObjectField";
import { validateFields } from "./fieldValidation";

describe("bucket object name field parsing", () => {
  describe("gs:// prefix style link", () => {
    it.each<[string, string, string, string]>([
      [
        "base case",
        "gs://test-bucket/test_object",
        "test-bucket",
        "test_object",
      ],
      [
        "extra slashes (contiguous)",
        `gs://test-bucket/test_object${"/".repeat(20)}`,
        "test-bucket",
        "test_object",
      ],
      [
        "extra slashes (non-contiguous, no whitespace)",
        `gs://test-bucket/test_object${"/extraneous".repeat(5)}`,
        "test-bucket",
        "test_object",
      ],
      [
        "extra slashes (non-contiguous, whitespace)",
        `gs://test-bucket/test_object${"/   ".repeat(20)}`,
        "test-bucket",
        "test_object",
      ],
    ])(
      "handles %s",
      (
        urlType: string,
        url: string,
        expectedBucket: string,
        expectedObject: string
      ) => {
        expect(parseObjectBucket(url)).toEqual({
          bucketName: expectedBucket,
          objectName: expectedObject,
        });
      }
    );
  });
  describe("cloud storage details link", () => {
    const pre = "https://console.cloud.google.com/storage/browser/_details/";

    it.each<[string, string, string, string]>([
      [
        "base case",
        `${pre}test-bucket/test_object`,
        "test-bucket",
        "test_object",
      ],
      [
        "flag temrination(?)",
        `${pre}test-bucket/test_object?test-flag`,
        "test-bucket",
        "test_object",
      ],
      [
        "semicolon termination (?)",
        `${pre}test-bucket/test_object;tab=live?test-flag`,
        "test-bucket",
        "test_object",
      ],
      [
        "extra slashes (contiguous)",
        `${pre}test-bucket/test_object${"/".repeat(20)}`,
        "test-bucket",
        "test_object",
      ],
      [
        "extra slashes (non-contiguous, no whitespace)",
        `${pre}test-bucket/test_object${"/extraneous".repeat(5)}`,
        "test-bucket",
        "test_object",
      ],
      [
        "extra slashes (non-contiguous, whitespace)",
        `${pre}test-bucket/test_object${"/   ".repeat(20)}`,
        "test-bucket",
        "test_object",
      ],
    ])(
      "handles %s",
      (
        urlType: string,
        url: string,
        expectedBucket: string,
        expectedObject: string
      ) => {
        expect(parseObjectBucket(url)).toEqual({
          bucketName: expectedBucket,
          objectName: expectedObject,
        });
      }
    );
  });
  describe("cloud storage direct link (to object)", () => {
    const pre = "https://storage.cloud.google.com/";

    it.each<[string, string, string, string]>([
      [
        "base case",
        `${pre}test-bucket/test_object`,
        "test-bucket",
        "test_object",
      ],
      [
        "flag temrination(?)",
        `${pre}test-bucket/test_object?test-flag`,
        "test-bucket",
        "test_object",
      ],
      [
        "semicolon termination (?)",
        `${pre}test-bucket/test_object;tab=live?test-flag`,
        "test-bucket",
        "test_object",
      ],
      [
        "extra slashes (contiguous)",
        `${pre}test-bucket/test_object${"/".repeat(20)}`,
        "test-bucket",
        "test_object",
      ],
      [
        "extra slashes (non-contiguous, no whitespace)",
        `${pre}test-bucket/test_object${"/extraneous".repeat(5)}`,
        "test-bucket",
        "test_object",
      ],
      [
        "extra slashes (non-contiguous, whitespace)",
        `${pre}test-bucket/test_object${"/   ".repeat(20)}`,
        "test-bucket",
        "test_object",
      ],
    ])(
      "handles %s",
      (
        urlType: string,
        url: string,
        expectedBucket: string,
        expectedObject: string
      ) => {
        expect(parseObjectBucket(url)).toEqual({
          bucketName: expectedBucket,
          objectName: expectedObject,
        });
      }
    );
  });
});

describe("bucket object name field validation", () => {
  const schema = Yup.object({ bucketObjectName: bucketObjectNameField() });
  it("is successful", () => {
    expect(
      validateFields(schema, {
        bucketObjectName: "gs://valid-name/test_object",
      })
    ).toEqual({});
  });
  describe("bucket name validation", () => {
    it.each<[string, string, string]>([
      ["empty value", "gs:///", "Provide a bucket object reference"],
      [
        "short value",
        "gs://xx/x",
        "Bucket name must be at least 3 characters long",
      ],
      [
        "long value",
        `gs://${"x".repeat(64)}/x`,
        "Bucket name must be no longer than 63 characters",
      ],
      [
        "value with invalid characters",
        "gs://with spaces/x",
        "Bucket name must only use lowercase letters, numbers, underscores and dashes",
      ],
      [
        "start with dash",
        "gs://-dash/x",
        "Bucket name must start with a lowercase letter or number",
      ],
      [
        "end with dash",
        "gs://dash-/x",
        "Bucket name must end with a lowercase letter or number",
      ],
    ])("rejects %s", (label: string, value: string, expected: string) => {
      expect(validateFields(schema, { bucketObjectName: value })).toEqual({
        bucketObjectName: expected,
      });
    });
  });
  describe("object name validation", () => {
    it.each<[string, string, string]>([
      ["empty value", "gs://test-bucket/", "Provide a bucket object reference"],
      [
        "long value",
        `gs://test-bucket/${"x".repeat(1025)}`,
        "Object name must be no longer than 1024 characters",
      ],
    ])("rejects %s", (label: string, value: string, expected: string) => {
      expect(validateFields(schema, { bucketObjectName: value })).toEqual({
        bucketObjectName: expected,
      });
    });
  });
});
