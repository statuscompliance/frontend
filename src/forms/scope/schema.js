import { z } from 'zod';

export const scopeSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z_]+$/, 'Name must be lowercase with underscores'),
  description: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean']),
  default: z.string().min(1),
});
