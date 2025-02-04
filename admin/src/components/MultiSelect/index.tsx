import React, { useMemo } from 'react';
import { Field, Flex, Checkbox } from '@strapi/design-system';
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
  placeholder,
  disabled,
}) => {
  const { formatMessage } = useIntl();
  const { onChange, value, error } = useField(name);

  const possibleOptions = useMemo(() => {
    return (attribute['options'] || [])
      .map((option) => {
        const [optionLabel, optionValue] = [...option.split(/:(.*)/s), option];
        if (!optionLabel || !optionValue) return null;
        return { label: optionLabel, value: optionValue };
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
            possibleOptions.find((option) => option.value === val)
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

  const renderCheckboxes = () => {
    return possibleOptions.map(({ label: optLabel, value: optValue }) => {
      const isChecked = sanitizedValue.some((sel) => sel.value === optValue);
      const maxReached = sanitizedValue.length >= attribute['max'];
      const disabledOption = disabled || (maxReached && !isChecked);

      const handleCheckboxChange = () => {
        let newValue;
        if (isChecked) {
          newValue = sanitizedValue.filter((sel) => sel.value !== optValue);
        } else {
          newValue = [...sanitizedValue, { label: optLabel, value: optValue }];
        }

        onChange({
          target: {
            name,
            value: newValue.length
              ? JSON.stringify(newValue.map((v) => v.value))
              : null,
            type: attribute.type,
          },
        });
      };

      return (
        <Checkbox
          key={optValue}
          name={name}
          value={optValue}
          checked={isChecked}
          disabled={disabledOption}
          onChange={handleCheckboxChange}
        >
          {formatMessage({ id: optLabel, defaultMessage: optLabel })}
        </Checkbox>
      );
    });
  };

  return (
    <Field.Root
      hint={description?.id ? formatMessage(description) : hint}
      error={fieldError}
      name={name}
      required={required}
    >
      <Flex direction="column" alignItems="stretch" gap={1}>
        <Field.Label>
          {intlLabel?.id ? formatMessage(intlLabel) : label}
        </Field.Label>
        <Flex direction="column" alignItems="stretch" gap={2}>
          {renderCheckboxes()}
        </Flex>
        <Field.Hint />
        <Field.Error />
      </Flex>
    </Field.Root>
  );
};

export default MultiSelect;
