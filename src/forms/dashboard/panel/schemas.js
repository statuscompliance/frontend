import * as z from 'zod';

export const panelSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  type: z.enum(['graph', 'gauge', 'table', 'stat', 'timeseries', 'bar', 'pie', 'geomap'], { 
    message: 'Panel type must be selected' 
  }),
  description: z.string().optional(),
  table: z.string().min(1, { message: 'Table is required' }),
  sqlQuery: z.object({
    model: z.string().min(1, { message: 'Model is required' }),
    operation: z.string().min(1, { message: 'Operation is required' }),
    options: z.object({
      attributes: z.array(z.string().min(1)).min(1, { message: 'At least one field must be selected' }),
      where: z.array(z.object({
        key: z.string().min(1),
        operator: z.enum(['=', '>', '<', '>=', '<=', '<>', 'LIKE', 'IN', 'NOT IN']),
        value: z.string().min(1)
      })).optional(),
      whereLogic: z.enum(['AND', 'OR']).optional()
    })
  }),
  showLegend: z.boolean().default(true).optional(),
  unit: z.string().optional(),
  decimals: z.number().int().min(0).max(10).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  thresholds: z.array(z.object({
    value: z.number(),
    color: z.string()
  })).optional(),
  controlId: z.string().optional().transform(val => val === 'none' ? '' : val) // Transformar "none" a string vacía
});
