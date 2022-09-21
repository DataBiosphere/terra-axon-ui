import { ValidationErrors } from "final-form";
import { ReactNode } from "react";
import { Form } from "react-final-form";
import * as Yup from "yup";
import { validateFields } from "../components/fieldValidation";
import nop from "../components/nop";

export function testFormValidate(
  schema: Yup.Schema,
  onValidate?: (values: unknown) => ValidationErrors | Promise<ValidationErrors>
) {
  return (values: unknown) => {
    const res = validateFields(schema, values);
    if (onValidate) onValidate(res);
    return res;
  };
}

export interface TestFormProps {
  children: ReactNode;
  validate?: (values: unknown) => ValidationErrors | Promise<ValidationErrors>;
}

export function TestForm({ children, validate }: TestFormProps) {
  return (
    <Form
      onSubmit={nop}
      validate={validate}
      render={({ handleSubmit }) => (
        <form noValidate onSubmit={handleSubmit}>
          {children}
        </form>
      )}
    />
  );
}
