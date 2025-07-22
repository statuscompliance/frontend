import * as z from 'zod';

export const folderFormSchema = z.object({
  title: z.string()
    .min(1, 'Folder name is required')
    .max(40, { message: 'Folder name must be at most 40 characters' }),
  parentUid: z.string().optional()
});
