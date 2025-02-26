import * as z from 'zod';

export const folderFormSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100, 'Folder name must be 100 characters or less'),
});
