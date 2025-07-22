import * as z from 'zod';

export const controlSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }).max(40, { message: 'Name must be at most 40 characters' }),
  description: z.string().max(140, { message: 'Description must be at most 140 characters' }).nullable().optional(),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'], { 
    message: 'Period must be selected' 
  }),
  startDate: z.string().min(1, { message: 'Start date is required' }),
  endDate: z.string().nullable().optional(),
  mashupId: z.string().min(1, { message: 'A mashup must be selected' }),
  params: z.record(z.string()).refine(params => Object.keys(params).length > 0, {
    message: 'At least one parameter is required'
  }),
  scopes: z.record(z.string()).optional(),
  catalogId: z.string().min(1, { message: 'Catalog ID is required' })
}).refine(
  (data) => {
    if (!data.endDate || !data.startDate) return true;
    // Comparar fechas en formato YYYY-MM-DD
    return new Date(data.endDate) >= new Date(data.startDate);
  },
  {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  }
);
