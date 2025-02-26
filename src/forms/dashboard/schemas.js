import * as z from 'zod';

export const dashboardFormSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required').max(100, 'Dashboard name must be 100 characters or less'),
  folderId: z.string().min(1, 'Folder is required'),
  startDate: z.date({
    required_error: 'Start date is required',
    invalid_type_error: "That's not a valid date!",
  }),
  endDate: z.date().optional(),
});
