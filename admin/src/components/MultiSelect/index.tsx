import React, { useMemo } from 'react';
import { Field, Flex } from '@strapi/design-system';
import { useField } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';

const MultiSelect = ({
  hint,
  label,
  name,
  intlLabel,
  required,
  attribute,
  description,
  disabled,
}: {
  hint: string;
  label: string;
  name: string;
  intlLabel: any;
  required: boolean;
  attribute: any;
  description: any;
  disabled: boolean;
}) => {
  const { formatMessage } = useIntl();
  const { onChange, value, error } = useField(name);

  const possibleOptions = useMemo(() => {
    return (attribute['options'] || [])
      .map((option: string) => {
        const [label, value] = [...option.split(/:(.*)/s), option];
        if (!label || !value) return null;
        return { label, value };
      })
      .filter(Boolean);
  }, [attribute]);

  const sanitizedValue = useMemo(() => {
    let parsedValue;
    try {
      parsedValue = typeof value !== 'string' ? value || [] : JSON.parse(value || '[]');
    } catch (e) {
      parsedValue = [];
    }
    return Array.isArray(parsedValue)
      ? parsedValue
          .map((val) =>
            possibleOptions.find((option: { label: string; value: string }) => option.value === val)
          )
          .filter((option) => !!option)
      : [];
  }, [value, possibleOptions]);

  const fieldError = useMemo(() => {
    if (error) return error;

    const { min, max } = attribute;
    const hasNoOptions = required && !possibleOptions.length;
    const belowMin = sanitizedValue.length < min && (required || sanitizedValue.length > 0);
    const aboveMax = sanitizedValue.length > max;

    if (hasNoOptions) {
      return 'No options, but field is required';
    }

    if (belowMin) {
      return `Select at least ${min} options`;
    }

    if (aboveMax) {
      return `Select at most ${max} options`;
    }

    return null;
  }, [required, error, possibleOptions, sanitizedValue, attribute]);

  const handleCheckboxChange = (value: string) => {
    const newValue = sanitizedValue.some((item) => item.value === value)
      ? sanitizedValue.filter((item) => item.value !== value) // Remove if checked
      : [...sanitizedValue, possibleOptions.find((item) => item.value === value)]; // Add if unchecked

    onChange({
      target: {
        name,
        value: newValue.length ? JSON.stringify(newValue.map((v) => v.value)) : null,
        type: attribute.type,
      },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <Field.Root hint={description?.id ? formatMessage(description) : hint} error={fieldError} name={name} required={required}>
      <Flex direction="column" alignItems="stretch" gap={1}>
        <Field.Label>{intlLabel?.id ? formatMessage(intlLabel) : label}</Field.Label>

        {/* Checkboxes Instead of React-Select */}
        <div>
          {possibleOptions.map((option) => (
            <label key={option.value} style={{ display: 'block', marginBottom: '8px' }}>
              <input
                type="checkbox"
                value={option.value}
                checked={sanitizedValue.some((item) => item.value === option.value)}
                onChange={() => handleCheckboxChange(option.value)}
                disabled={disabled}
              />{' '}
              {formatMessage({ id: option.label, defaultMessage: option.label })}
            </label>
          ))}
          {/* Hidden inputs for form submission */}
          {sanitizedValue.map((option) => (
            <input key={option.value} type="hidden" name={name} value={option.value} />
          ))}
        </div>

        <Field.Hint />
        <Field.Error />
      </Flex>
    </Field.Root>
  );
};

export default MultiSelect;
