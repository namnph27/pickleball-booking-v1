import { useI18n } from 'vue-i18n';
import * as yup from 'yup';

export function useValidation() {
  const { t } = useI18n();

  // Common validation schemas
  const email = yup.string()
    .required(t('auth.requiredField'))
    .email(t('auth.invalidEmail'));

  const password = yup.string()
    .required(t('auth.requiredField'))
    .min(8, t('auth.passwordRequirements'));

  const confirmPassword = (passwordField: string) => yup.string()
    .required(t('auth.requiredField'))
    .oneOf([yup.ref(passwordField)], t('auth.passwordsDoNotMatch'));

  const name = yup.string()
    .required(t('auth.requiredField'))
    .min(2, t('validation.minLength', { min: 2 }));

  const phone = yup.string()
    .required(t('auth.requiredField'))
    .matches(/^[0-9+\-\s()]{8,15}$/, t('auth.invalidPhone'));

  // Schema builders
  const loginSchema = yup.object({
    email: email,
    password: yup.string().required(t('auth.requiredField'))
  });

  const registerSchema = yup.object({
    name: name,
    email: email,
    password: password,
    password_confirmation: confirmPassword('password'),
    phone: phone,
    role: yup.string().required(t('auth.requiredField'))
  });

  const profileSchema = yup.object({
    name: name,
    email: email,
    phone: phone
  });

  const changePasswordSchema = yup.object({
    current_password: yup.string().required(t('auth.requiredField')),
    new_password: password,
    confirm_new_password: confirmPassword('new_password')
  });

  const courtSchema = yup.object({
    name: yup.string().required(t('courtOwner.courtNameRequired')),
    location: yup.string().required(t('courtOwner.courtLocationRequired')),
    hourly_rate: yup.number()
      .required(t('courtOwner.hourlyRateRequired'))
      .positive(t('validation.mustBePositive')),
    description: yup.string(),
    skill_level: yup.string().required(t('courtOwner.skillLevelRequired'))
  });

  const bookingSchema = yup.object({
    date: yup.date().required(t('booking.dateRequired')),
    start_time: yup.string().required(t('booking.startTimeRequired')),
    duration: yup.number()
      .required(t('booking.durationRequired'))
      .positive(t('validation.mustBePositive'))
  });

  // Forgot password schema
  const forgotPasswordSchema = yup.object({
    email: email
  });

  // Reset password schema
  const resetPasswordSchema = yup.object({
    password: password,
    password_confirmation: confirmPassword('password'),
    token: yup.string().required()
  });

  return {
    // Basic validators
    email,
    password,
    confirmPassword,
    name,
    phone,

    // Schema builders
    loginSchema,
    registerSchema,
    profileSchema,
    changePasswordSchema,
    courtSchema,
    bookingSchema,
    forgotPasswordSchema,
    resetPasswordSchema
  };
}
