import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';

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

export class RobotSyncDto extends createZodDto(RobotSyncSchema) {
  @ApiProperty({
    example: 10500.5,
    description: 'Balanço atual da conta MT4/MT5',
  })
  balance: number;

  @ApiProperty({ example: 10450.2, description: 'Equidade atual da conta' })
  equity: number;

  @ApiProperty({ example: 15.5, description: 'Lucro do dia atual' })
  dailyProfit: number;

  @ApiProperty({
    example: 65.5,
    description: 'Taxa de acerto (Win Rate) atual',
  })
  winRate: number;

  @ApiProperty({
    example: [
      {
        ticket: 123456,
        symbol: 'EURUSD',
        type: 'BUY',
        volume: 0.1,
        openPrice: 1.085,
        currentProfit: 5.2,
      },
    ],
    description: 'Lista de ordens abertas no terminal',
  })
  orders: any[];
}
