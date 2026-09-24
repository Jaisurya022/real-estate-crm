import { useCallback, useState } from 'react';

/**
 * Minimal form state for dialogs:
 *  - `field(name)` returns { value, onChange } for inputs, selects and textareas
 *  - `submit(handler)` wraps an async handler with try/catch and maps API
 *    validation errors onto fields (or a form-level message).
 */
export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setValue = useCallback((name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  }, []);

  const field = (name) => ({
    value: values[name],
    onChange: (eventOrValue) => setValue(name, eventOrValue?.target ? eventOrValue.target.value : eventOrValue),
  });

  const reset = useCallback((next) => {
    setValues(next);
    setErrors({});
    setFormError('');
  }, []);

  const submit = (handler) => async (event) => {
    event?.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError('');
    try {
      await handler(values);
    } catch (error) {
      const fieldErrors = error.fieldErrors ?? {};
      const shownOnFields = Object.keys(fieldErrors).some((name) => name in values);
      setErrors(fieldErrors);
      if (!shownOnFields) setFormError(error.message || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return { values, errors, formError, submitting, field, setValue, reset, submit };
}
