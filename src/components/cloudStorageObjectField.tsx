import * as Yup from "yup";

type BucketAndObject = {
  bucketName?: string;
  objectName?: string;
};

export function bucketObjectNameField() {
  return Yup.string().test({
    name: "bucketObjectName",
    message: "Provide a bucket object reference",
    test: (value, testContext) => {
      if (!value) return false;
      const { bucketName, objectName } = parseObjectBucket(value);
      if (!bucketName || !objectName) return false;

      if (bucketName.length < 3) {
        return testContext.createError({
          message: "Bucket name must be at least 3 characters long",
        });
      }
      if (bucketName.length > 63) {
        return testContext.createError({
          message: "Bucket name must be no longer than 63 characters",
        });
      }
      if (!/^[-_\.a-z0-9]*$/.test(bucketName)) {
        return testContext.createError({
          message:
            "Bucket name must only use lowercase letters, numbers, underscores and dashes",
        });
      }
      if (!/[a-z0-9]$/.test(bucketName)) {
        return testContext.createError({
          message: "Bucket name must end with a lowercase letter or number",
        });
      }
      if (!/^[a-z0-9]/.test(bucketName)) {
        return testContext.createError({
          message: "Bucket name must start with a lowercase letter or number",
        });
      }

      if (objectName.length > 1024) {
        return testContext.createError({
          message: "Object name must be no longer than 1024 characters",
        });
      }
      return true;
    },
  });
}

export function parseObjectBucket(url: string | undefined): BucketAndObject {
  const regArrays = [
    // gsutil URI
    //  Parses bucket name up to "/" (not inclusive)
    //  Parses object name up to "/" (not inclusive)
    /(?:^gs:\/\/)(?<bucket>[^\/]*)\/(?<object>[^\/]*)/.exec(url || ""),
    // Authenticated URL (go to object detail page)
    //  Parses bucket name up to "/" (not inclusive)
    //  Parses object name up to "/", "?", or ";" (not inclusive)
    /(?:^https:\/\/console.cloud.google.com\/storage\/browser\/_details\/)(?<bucket>[^\/]*)\/(?<object>[^\/;?]*)/.exec(
      url || ""
    ),
    // Authenticated URL (go directly to object)
    //  Parses bucket name up to "/" (not inclusive)
    //  Parses object name up to "/", "?", or ";" (not inclusive)
    /(?:^https:\/\/storage.cloud.google.com\/)(?<bucket>[^\/]*)\/(?<object>[^\/;?]*)/.exec(
      url || ""
    ),
  ];
  for (const regArray of regArrays) {
    if (regArray && regArray.groups?.bucket && regArray.groups?.object) {
      return {
        bucketName: regArray.groups?.bucket,
        objectName: regArray.groups?.object,
      };
    }
  }
  return {
    bucketName: undefined,
    objectName: undefined,
  };
}
