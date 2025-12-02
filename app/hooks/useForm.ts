import { useState, useCallback, ChangeEvent, FormEvent } from "react";
import { isValidEmail, isValidPhone, validatePassword } from "@/lib/utils";

type ValidationRules<T> = {
  [K in keyof T]?: (value: T[K]) => string | null;
};

interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: ValidationRules<T>;
  onSubmit: (values: T) => void | Promise<void>;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const { name, value, type } = e.target;

      setValues((prev) => ({
        ...prev,
        [name]:
          type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }));

      // Limpiar error al cambiar
      if (errors[name as keyof T]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }
    },
    [errors]
  );

  const setFieldValue = useCallback(
    <K extends keyof T>(name: K, value: T[K]) => {
      setValues((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const validateField = useCallback(
    <K extends keyof T>(name: K, value: T[K]): string | null => {
      const rule = validationRules[name];
      if (rule) {
        return rule(value);
      }
      return null;
    },
    [validationRules]
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(values).forEach((key) => {
      const error = validateField(key as keyof T, values[key as keyof T]);
      if (error) {
        newErrors[key as keyof T] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setSubmitting(false);
      }
    },
    [values, validateForm, onSubmit]
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  // Reglas de validación predefinidas
  const predefinedRules = {
    email: (value: string) => {
      if (!value) return "El email es requerido";
      if (!isValidEmail(value)) return "Email inválido";
      return null;
    },
    phone: (value: string) => {
      if (value && !isValidPhone(value)) return "Teléfono inválido";
      return null;
    },
    password: (value: string) => {
      const { isValid, errors } = validatePassword(value);
      if (!isValid) return errors[0];
      return null;
    },
    required: (value: any) => {
      if (!value && value !== 0) return "Este campo es requerido";
      return null;
    },
  };

  return {
    values,
    errors,
    submitting,
    handleChange,
    handleSubmit,
    setFieldValue,
    resetForm,
    validateForm,
    predefinedRules,
  };
}
