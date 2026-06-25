import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

interface FormErrors {
  [key: string]: string;
}

interface UseFormValidationReturn {
  errors: FormErrors;
  validate: (fieldName: string, value: any, rules: ValidationRule) => boolean;
  validateAll: (formData: Record<string, any>, schema: Record<string, ValidationRule>) => boolean;
  clearErrors: () => void;
  clearFieldError: (fieldName: string) => void;
}

export function useFormValidation(): UseFormValidationReturn {
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = useCallback((fieldName: string, value: any, rules: ValidationRule): boolean => {
    let error = '';

    if (rules.required && (!value || value.toString().trim() === '')) {
      error = `${fieldName} est requis`;
      setErrors(prev => ({ ...prev, [fieldName]: error }));
      return false;
    }

    if (rules.minLength && value && value.toString().length < rules.minLength) {
      error = `${fieldName} doit contenir au moins ${rules.minLength} caractères`;
      setErrors(prev => ({ ...prev, [fieldName]: error }));
      return false;
    }

    if (rules.maxLength && value && value.toString().length > rules.maxLength) {
      error = `${fieldName} ne peut pas dépasser ${rules.maxLength} caractères`;
      setErrors(prev => ({ ...prev, [fieldName]: error }));
      return false;
    }

    if (rules.pattern && value && !rules.pattern.test(value.toString())) {
      error = `${fieldName} a un format invalide`;
      setErrors(prev => ({ ...prev, [fieldName]: error }));
      return false;
    }

    if (rules.custom && value) {
      const result = rules.custom(value);
      if (result !== true) {
        error = typeof result === 'string' ? result : `${fieldName} est invalide`;
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        return false;
      }
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    return true;
  }, []);

  const validateAll = useCallback((formData: Record<string, any>, schema: Record<string, ValidationRule>): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.entries(schema).forEach(([fieldName, rules]) => {
      const value = formData[fieldName];
      
      if (rules.required && (!value || value.toString().trim() === '')) {
        newErrors[fieldName] = `${fieldName} est requis`;
        isValid = false;
        return;
      }

      if (rules.minLength && value && value.toString().length < rules.minLength) {
        newErrors[fieldName] = `${fieldName} doit contenir au moins ${rules.minLength} caractères`;
        isValid = false;
        return;
      }

      if (rules.maxLength && value && value.toString().length > rules.maxLength) {
        newErrors[fieldName] = `${fieldName} ne peut pas dépasser ${rules.maxLength} caractères`;
        isValid = false;
        return;
      }

      if (rules.pattern && value && !rules.pattern.test(value.toString())) {
        newErrors[fieldName] = `${fieldName} a un format invalide`;
        isValid = false;
        return;
      }

      if (rules.custom && value) {
        const result = rules.custom(value);
        if (result !== true) {
          newErrors[fieldName] = typeof result === 'string' ? result : `${fieldName} est invalide`;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validate,
    validateAll,
    clearErrors,
    clearFieldError,
  };
}
