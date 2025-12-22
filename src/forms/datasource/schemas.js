import { z } from 'zod';

export const datasourceFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  definitionId: z.string().min(1, 'Datasource type is required'),
  environment: z.enum(['dev', 'staging', 'production']).default('dev'),
  config: z.object({
    baseUrl: z.url('Base URL must be a valid URL'),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    timeout: z.number().default(30000),
  }).passthrough(), // Allow additional fields not defined in schema
});
