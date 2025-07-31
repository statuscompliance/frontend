import * as z from 'zod';

export const controlSchema = z.object({
  name: z.string().min(1, { message: 'Control name is required' }).max(40, { message: 'Control name must be at most 40 characters' }),
  description: z.string().max(140, { message: 'Description must be at most 140 characters' }).nullable().optional(),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'], {
    message: 'Period must be selected'
  }),
  startDate: z.date({
    required_error: 'Start date is required',
    invalid_type_error: 'Start date must be a valid date'
  }),
  endDate: z.date({
    invalid_type_error: 'End date must be a valid date'
  }).nullable().optional(),
  mashupId: z.string().min(1, { message: 'A mashup must be selected' }),
  params: z.record(z.string()).refine(params => Object.keys(params).length > 0, {
    message: 'At least one parameter is required'
  }),
  scopes: z.record(z.string()).optional(),
  catalogId: z.number({
    required_error: 'Catalog ID is required',
    invalid_type_error: 'Catalog ID must be a number'
  })
});
