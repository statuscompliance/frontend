import * as z from 'zod';

export const controlSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }).max(40, { message: 'Control name must be at most 40 characters' }),
  description: z.string().min(1, { message: 'Description is required' }).max(140, { message: 'Control description must be at most 140 characters' }),
  period: z.string().min(1, { message: 'Period is required' }),
  startDate: z.string().min(1, { message: 'Start date is required' }),
  endDate: z.string().min(1, { message: 'End date is required' }),
  mashupId: z.string().optional(),
});
