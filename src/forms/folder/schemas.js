import * as z from 'zod';

export const folderFormSchema = z.object({
  title: z.string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name cannot exceed 100 characters'),
  parentUid: z.string().optional()
});
