import * as z from 'zod';

export const dashboardFormSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required').max(40, { message: 'Dashboard name must be at most 40 characters' }),
  folderId: z.string().min(1, 'Folder is required'),
  startDate: z.date({
    required_error: 'Start date is required',
    invalid_type_error: "That's not a valid date!",
  }),
  endDate: z.date().optional(),
});
