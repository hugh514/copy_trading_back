import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { RobotKeyGuard } from './guards/robot-key.guard';
import { RobotSyncDto } from './ea.schema';

@ApiTags('Gateway do Robô (EA)')
@Controller('ea')
export class RobotController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('sync')
  @UseGuards(RobotKeyGuard)
  @ApiHeader({
    name: 'x-access-key',
    description: 'Chave de Acesso do Robô',
    required: true,
  })
  @ApiOperation({
    summary:
      'Sincroniza dados do robô e retorna as configurações de risco atuais',
  })
  @ApiResponse({
    status: 200,
    description:
      'Sincronização realizada com sucesso, retorna configurações de risco',
  })
  async sync(@Request() req, @Body() data: RobotSyncDto) {
    const userId = req.user.id;


    const [updatedAccount, , , riskSettings] = await this.prisma.$transaction([

      this.prisma.tradeAccount.update({
        where: { userId },
        data: {
          balance: data.balance,
          equity: data.equity,
          dailyProfit: data.dailyProfit,
          winRate: data.winRate,
        },
      }),

      this.prisma.openPosition.deleteMany({ where: { userId } }),
      this.prisma.openPosition.createMany({
        data: data.orders.map((order) => ({
          userId,
          ticket: order.ticket,
          symbol: order.symbol,
          type: order.type,
          volume: order.volume,
          openPrice: order.openPrice,
          currentProfit: order.currentProfit,
        })),
      }),

      this.prisma.riskSettings.findUnique({
        where: { userId },
      }),
    ]);

    const finalRisk =
      riskSettings ||
      (await this.prisma.riskSettings.create({ data: { userId } }));

    return {
      status: 'ok',
      riskConfig: {
        multiplier: finalRisk.multiplier,
        dailyLossLimit: finalRisk.dailyLossLimit,
        isActive: finalRisk.isActive,
      },
    };
  }
}
