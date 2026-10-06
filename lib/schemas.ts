import { z } from 'zod';

export const demoSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50),
  email: z.string().email('Enter a valid email address'),
});

export type DemoInput = z.infer<typeof demoSchema>;
