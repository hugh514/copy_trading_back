import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';
export const UpdateRiskSettingsSchema = z.object({
  multiplier: z.number().min(0.01).max(100).default(1.0),
  dailyLossLimit: z.number().min(0).default(150.0),
  isActive: z.boolean().default(true),
});

export class UpdateRiskSettingsDto extends createZodDto(
  UpdateRiskSettingsSchema,
) {
  @ApiProperty({
    example: 1.5,
    description: 'Multiplicador de volume das operações',
  })
  multiplier: number;

  @ApiProperty({
    example: 150.0,
    description: 'Limite diário de perda permitido',
  })
  dailyLossLimit: number;

  @ApiProperty({
    example: true,
    description: 'Define se o robô deve processar novas operações',
  })
  isActive: boolean;
}
