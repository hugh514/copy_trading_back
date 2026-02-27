import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const OrderSchema = z.object({
  ticket: z.number().int(),
  symbol: z.string(),
  type: z.string(),
  volume: z.number(),
  openPrice: z.number(),
  currentProfit: z.number(),
});

export const RobotSyncSchema = z.object({
  balance: z.number(),
  equity: z.number(),
  dailyProfit: z.number(),
  winRate: z.number(),
  orders: z.array(OrderSchema),
});

export class RobotSyncDto extends createZodDto(RobotSyncSchema) {}
