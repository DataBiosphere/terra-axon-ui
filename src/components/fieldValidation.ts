import { FORM_ERROR, ValidationErrors } from "final-form";
import Lodash from "lodash";
import * as Yup from "yup";

export const toFinalFormError = (e: unknown) => ({ [FORM_ERROR]: e });

Yup.setLocale({
  mixed: {
    required: "Provide a ${path}",
  },
  string: {
    min: "Must be at least ${min} characters",
    max: "Must be no longer than ${max} characters",
  },
});

export const onlyUseLettersNumbersDashesAndUnderscores =
  "Only use letters, numbers, dashes, and underscores";

export const resourceNameHelperText = onlyUseLettersNumbersDashesAndUnderscores;

export function resourceNameField() {
  return Yup.string()
    .label("name")
    .required()
    .max(1024)
    .matches(/^[-_a-zA-Z0-9]*$/, onlyUseLettersNumbersDashesAndUnderscores)
    .matches(/^[a-zA-Z0-9]/, "Must start with a letter or number");
}

export function dataTableNameField() {
  return Yup.string().label("Cloud data table name").required().max(1024);
}

export const projectIdHelperText =
  "Only use lowercase letters, numbers and dashes";

export function projectIdField() {
  return Yup.string()
    .label("project ID")
    .required()
    .max(30)
    .min(6)
    .matches(/^[-a-z0-9]*$/, {
      excludeEmptyString: true,
      message: projectIdHelperText,
    });
}

export function gitRepoUrlField() {
  return Yup.string().label("repository URL").required();
}

/**
 * Executes field validation and translates the yup error into the final-form structure.
 */
export function validateFields(
  schema: Yup.Schema,
  values: unknown
): ValidationErrors {
  try {
    schema.validateSync(values, { abortEarly: false });
    return {};
  } catch (err) {
    const e = err as Yup.ValidationError;
    return e.inner.reduce((result, e) => {
      if (!e.path) return result;
      // Only show the first error for a field.
      if (Lodash.get(result, e.path)) return result;
      Lodash.set(result, e.path, e.message);
      return result;
    }, {});
  }
}
