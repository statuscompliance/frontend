import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .transform((val) => val.trim()),
  password: z
    .string({ required_error: 'Password is required' })
    .transform((val) => val.trim()),
});

export const verify2FASchema = z.object({
  totpToken: z
    .string({ required_error: '2FA token is required' })
    .length(6, '2FA token must be 6 digits')
    .regex(/^\d{6}$/, 'Token must be numeric'),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required' })
    .transform((val) => val.trim()),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .transform((val) => val.trim()),
  confirmPassword: z
    .string({ required_error: 'You must confirm your new password' })
    .transform((val) => val.trim()),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const disable2FASchema = z.object({
  totpToken: z.string().regex(/^\d{6}$/, '2FA token must be 6 digits'),
  password: z.string().min(1, 'Password is required'),
});
