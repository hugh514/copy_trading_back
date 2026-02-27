import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const UpdateRiskSettingsSchema = z.object({
  multiplier: z.number().min(0.01).max(100).default(1.0),
  dailyLossLimit: z.number().min(0).default(150.0),
  isActive: z.boolean().default(true),
});

export class UpdateRiskSettingsDto extends createZodDto(
  UpdateRiskSettingsSchema,
) {}
