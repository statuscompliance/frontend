import * as z from 'zod';

export const scopeSetSchema = z.object({
  controlId: z.string().min(1),
  scopes: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      value: z.string().min(1),
    })
  ),
});
