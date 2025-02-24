import * as z from 'zod';

export const catalogSchema = z.object({
  name: z.string().max(100, 'Name must be 100 characters or less').min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
});

export const controlSchema = z.object({
  name: z.string().max(100, 'Name must be 100 characters or less').min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  period: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUALLY']),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  mashupId: z.string().max(32, 'Mashup ID must be 32 characters or less').min(1, 'Mashup ID is required'),
  params: z.any().optional(),
  catalogId: z.string().min(1, 'Catalog ID is required'),
});
