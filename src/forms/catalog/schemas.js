import * as z from 'zod';

export const catalogSchema = z.object({
  name: z.string().max(40, { message: 'Catalog Name must be at most 40 characters' }).min(1, 'Name is required'),
  description: z.string().min(1, { message: 'Description is required' }).max(140, { message: 'Description must be at most 140 characters' }),
});

export const controlSchema = z.object({
  name: z.string().max(40, { message: 'Control name must be at most 40 characters' }).min(1, 'Name is required'),
  description: z.string().min(1, { message: 'Description is required' }).max(140, { message: 'Description must be at most 140 characters' }),
  period: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUALLY']),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  mashupId: z.string().max(32, 'Mashup ID must be 32 characters or less').min(1, 'Mashup ID is required'),
  params: z.any().optional(),
  catalogId: z.string().min(1, 'Catalog ID is required'),
});
