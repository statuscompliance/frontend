import * as z from 'zod';

export const controlSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().nullable().optional(),
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
  catalogId: z.preprocess(
    (val) => {
      // Convierte el valor a número si es un string no vacío, de lo contrario, déjalo como está.
      // Esto maneja tanto strings de input como posibles 'null' o 'undefined' iniciales.
      if (typeof val === 'string' && val.trim() !== '') {
        return Number(val);
      }
      return val;
    },
    z.number().int().positive({ message: 'Catalog ID must be a positive integer' }) // Asume que es un entero positivo
  )
});
