"use client";
import { useId, type ComponentProps } from "react";
import { Field } from "./business-ui";
import { LocalDateTimeField } from "./record-ui";

// Retained tab drafts and repeated evidence cards need distinct label targets,
// while server validation continues to name the canonical command field.
export function EqField(props: ComponentProps<typeof Field>) {
  const id = useId();
  return (
    <Field
      {...props}
      name={`${id}-${props.name}`}
      validationField={props.validationField ?? props.name}
    />
  );
}
export function EqDateTimeField(
  props: ComponentProps<typeof LocalDateTimeField>,
) {
  const id = useId();
  return (
    <LocalDateTimeField
      {...props}
      name={`${id}-${props.name}`}
      validationField={props.validationField ?? props.name}
    />
  );
}
