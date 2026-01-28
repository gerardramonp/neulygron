"use client";

import * as React from "react";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type StyledInputProps = {
  label: string;
  value: string;
  name?: string;
  placeholder?: string;
  type?: string;
  id?: string;
  error?: string;
  fieldClassName?: string;
  className?: string;
  required?: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
};

const StyledInput = React.forwardRef<HTMLInputElement, StyledInputProps>(
  (
    {
      id,
      name,
      label,
      placeholder,
      type = "text",
      value,
      onChange,
      error,
      className,
      fieldClassName,
      required,
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? `${name ?? "input"}-${generatedId}`;
    const hasError = Boolean(error);

    return (
      <Field data-invalid={hasError} className={fieldClassName}>
        <FieldLabel htmlFor={inputId} className="text-sm font-medium">
          {label}
        </FieldLabel>
        <FieldContent>
          <Input
            id={inputId}
            name={name}
            placeholder={placeholder}
            type={type}
            value={value}
            onChange={onChange}
            aria-invalid={hasError}
            ref={ref}
            required={required}
            className={cn(
              hasError && "border-destructive focus-visible:ring-destructive",
              className,
            )}
          />
          {hasError ? (
            <FieldDescription className="text-destructive">
              {error}
            </FieldDescription>
          ) : null}
        </FieldContent>
      </Field>
    );
  },
);

StyledInput.displayName = "StyledInput";

export { StyledInput };
