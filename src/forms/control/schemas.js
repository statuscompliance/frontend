import * as z from 'zod';

export const controlSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Control name is required'),
  description: z.string().min(1, 'Description is required'),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'], {
    required_error: 'Please select a valid period',
  }),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  mashupId: z.string().min(1, 'Mashup ID is required'),
  params: z.record(z.any()).optional(),
});
